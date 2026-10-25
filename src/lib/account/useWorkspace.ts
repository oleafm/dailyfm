"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { PrototypeState } from "../prototype/types";
import { createSeed } from "../prototype/seed";
import { loadPrototype, savePrototype } from "../prototype/storage";
import { accountClient } from "./client";
import { AccountRecord, ConflictError, emptyAccount, loadAccount, saveAccount, validState } from "./repository";

export type SaveStatus = "loading" | "saved" | "pending" | "saving" | "error" | "conflict";
type Cache = AccountRecord & { pending: boolean };
export function useWorkspace(user: User | null) {
  const [state, setState] = useState<PrototypeState>(() => user ? emptyAccount(user) : createSeed());
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const record = useRef<AccountRecord | null>(null);
  const saved = useRef("");
  const latest = useRef(state);
  const flight = useRef(false);
  const mounted = useRef(true);
  const key = user ? `todaily-account-v1:${user.id}` : null;
  latest.current = state;

  const cache = useCallback((data: PrototypeState, revision: number, pending: boolean) => {
    if (!key) return true;
    try { localStorage.setItem(key, JSON.stringify({ data, revision, pending })); return true; }
    catch { return false; }
  }, [key]);

  const initialize = useCallback(async (useCloud = false) => {
    if (!user || !accountClient) return;
    setStatus("loading"); setError("");
    try {
      const remote = await loadAccount(accountClient, user);
      let local: Cache | null = null;
      if (!useCloud) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key!) || "null");
          if (parsed && validState(parsed.data, user.id) && Number.isInteger(parsed.revision)) local = parsed;
        } catch { /* The database remains the source of truth. */ }
      }
      if (!mounted.current) return;
      record.current = remote;
      saved.current = JSON.stringify(remote.data);
      if (local?.pending && JSON.stringify(local.data) !== saved.current) {
        setState(local.data); latest.current = local.data;
        setReady(true);
        if (local.revision !== remote.revision) { setStatus("conflict"); setError(new ConflictError().message); return; }
        setStatus("pending");
      } else {
        setState(remote.data); latest.current = remote.data;
        cache(remote.data, remote.revision, false);
        setStatus("saved"); setReady(true);
      }
    } catch (cause) {
      if (!mounted.current) return;
      setStatus("error"); setError(cause instanceof Error ? cause.message : "Cannot reach your account.");
    }
  }, [user, key, cache]);

  useEffect(() => {
    mounted.current = true;
    if (user) void initialize();
    else { setState(loadPrototype()); setReady(true); setStatus("saved"); }
    return () => { mounted.current = false; };
  }, [user, initialize]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      if (!savePrototype(state)) { setStatus("error"); setError("Device storage is unavailable. Your changes are only in this tab."); }
      else { setStatus("saved"); setError(""); }
      return;
    }
    if (!record.current || status === "conflict" || status === "loading") return;
    if (JSON.stringify(state) === saved.current) return;
    const backedUp = cache(state, record.current.revision, true);
    if (!backedUp) setError("Device backup is unavailable. Keep this tab open until your account is saved.");
    if (status !== "error" && !flight.current) setStatus("pending");
  }, [state, ready, user, cache, status]);

  useEffect(() => {
    if (!ready || !user || !accountClient || status !== "pending") return;
    const timeout = setTimeout(async () => {
      if (flight.current || !record.current) return;
      flight.current = true;
      const next = latest.current;
      setStatus("saving");
      try {
        const revision = await saveAccount(accountClient!, user.id, { data: next, revision: record.current.revision });
        if (!mounted.current) return;
        record.current = { data: next, revision };
        saved.current = JSON.stringify(next);
        const pending = JSON.stringify(latest.current) !== saved.current;
        cache(latest.current, revision, pending);
        setError(""); setStatus(pending ? "pending" : "saved");
      } catch (cause) {
        if (!mounted.current) return;
        setStatus(cause instanceof ConflictError ? "conflict" : "error");
        setError(cause instanceof Error ? cause.message : "Could not save your changes.");
      } finally { flight.current = false; }
    }, 350);
    return () => clearTimeout(timeout);
  }, [status, user, ready, cache, attempt]);

  useEffect(() => {
    if (!user || status === "saved") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [user, status]);

  const retry = () => {
    if (!ready) void initialize();
    else { setStatus("pending"); setAttempt((value) => value + 1); }
  };
  return { state, setState, ready, status, error, retry, loadCloud: () => initialize(true) };
}
