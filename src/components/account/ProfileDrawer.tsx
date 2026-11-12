"use client";

import { FormEvent, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { formatDistanceStrict } from "date-fns";
import { accountClient } from "@/lib/account/client";
import { SaveStatus } from "@/lib/account/useWorkspace";
import { Modal } from "../prototype/UI";

const photoTypes = ["image/jpeg", "image/png", "image/webp"];

export function useProfilePhoto(userId?: string) {
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>();
  const path = userId ? `${userId}/profile` : null;

  useEffect(() => {
    if (!path || !accountClient) return;
    const controller = new AbortController();
    void accountClient.storage.from("profile-photos").download(path, {}, { signal: controller.signal })
      .then(({ data }) => {
        if (data && !controller.signal.aborted) setPhoto((current) => current ?? data);
      });
    return () => controller.abort();
  }, [path]);

  useEffect(() => {
    if (!photo) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  async function upload(file: File) {
    if (!accountClient || !path) throw new Error("Sign in to upload a profile photo.");
    if (!photoTypes.includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      throw new Error("Choose a JPG, PNG, or WebP image up to 5 MB.");
    }
    const image = await createImageBitmap(file).catch(() => {
      throw new Error("This image could not be opened. Choose another photo.");
    });
    image.close();
    const { error } = await accountClient.storage.from("profile-photos").upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "0",
    });
    if (error) throw new Error(error.message);
    setPhoto(file);
  }

  return { url, upload };
}

export function AvatarContent({ name, photo }: { name: string; photo?: string }) {
  return photo ? <img className="avatar-image" src={photo} alt="" /> : name.slice(0, 1).toUpperCase();
}

export default function ProfileDrawer({
  account, name, photo, onNameChange, onPhotoUpload, saveStatus, timerKey, hasTimer, onClose,
}: {
  account: User;
  name: string;
  photo?: string;
  onNameChange: (name: string) => void;
  onPhotoUpload: (file: File) => Promise<void>;
  saveStatus: SaveStatus;
  timerKey: string;
  hasTimer: boolean;
  onClose: () => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [busy, setBusy] = useState<"photo" | "password" | "signout" | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  const [photoNotice, setPhotoNotice] = useState<{ text: string; error?: boolean }>();
  const [editingPassword, setEditingPassword] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const joined = new Date(account.created_at);
  const now = new Date();
  const validJoinedDate = Number.isFinite(joined.getTime());
  const joinedText = validJoinedDate && (now.getTime() - joined.getTime() < 86_400_000
    ? "Joined today"
    : `Joined ${formatDistanceStrict(joined, now, { addSuffix: true, roundingMethod: "floor" })}`);
  const canSignOut = saveStatus === "saved" && !hasTimer;

  async function run(action: NonNullable<typeof busy>, work: () => Promise<void>) {
    const showNotice = action === "photo" ? setPhotoNotice : setNotice;
    setBusy(action);
    showNotice(undefined);
    try {
      await work();
    } catch (cause) {
      showNotice({ text: cause instanceof Error ? cause.message : "Something went wrong. Please try again.", error: true });
    } finally {
      setBusy(null);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password"));
    if (password !== data.get("confirmation")) {
      setNotice({ text: "The new passwords don’t match.", error: true });
      return;
    }
    await run("password", async () => {
      const auth = accountClient!.auth;
      const { error } = await auth.updateUser({
        password,
        current_password: String(data.get("currentPassword")),
        ...(needsCode && { nonce: String(data.get("code")).trim() }),
      });
      if (error?.code === "reauthentication_needed" && !needsCode) {
        const { error: codeError } = await auth.reauthenticate();
        if (codeError) throw codeError;
        setNeedsCode(true);
        setNotice({ text: "Check your email for a verification code." });
        return;
      }
      if (error) throw error;
      form.reset();
      setNeedsCode(false);
      setEditingPassword(false);
      setNotice({ text: "Password updated." });
    });
  }

  async function signOut() {
    if (!canSignOut) return;
    await run("signout", async () => {
      const { error } = await accountClient!.auth.signOut();
      if (error) throw error;
      try {
        localStorage.removeItem(`todaily-account-v1:${account.id}`);
        localStorage.removeItem(timerKey);
      } catch { /* Authentication has already been cleared. */ }
    });
  }

  return (
    <Modal presentation="drawer" title="Your profile" eyebrow="YOUR SPACE" onClose={() => { if (!busy) onClose(); }}>
      <div className="profile-summary">
        <span className="avatar profile-photo"><AvatarContent name={name} photo={photo} /></span>
        <div>
          <h3>{name}</h3>
          <p className="muted">{account.email}</p>
          {validJoinedDate && <p className="muted"><time dateTime={account.created_at} title={joined.toLocaleDateString()}>{joinedText}</time></p>}
        </div>
      </div>
      <section className="profile-section">
        <h3>Personal details</h3>
        <form className="form" onSubmit={(event) => {
          event.preventDefault();
          if (!draftName.trim()) return;
          onNameChange(draftName.trim());
          setDraftName(draftName.trim());
          setNameSubmitted(true);
        }}>
          <label>Your name<input name="name" value={draftName} onChange={(event) => {
            setDraftName(event.currentTarget.value);
            setNameSubmitted(false);
          }} required maxLength={80} autoComplete="name" /></label>
          <button className="primary-button" disabled={!!busy || !draftName.trim() || draftName.trim() === name}>Save name</button>
          {nameSubmitted && <p className="form-hint" role="status">
            {saveStatus === "saved" ? "Name saved." : saveStatus === "error" ? "Name hasn’t saved yet. Retry from the workspace." : "Saving name…"}
          </p>}
        </form>
        <div className="form profile-photo-form">
          <label>Profile photo (optional)
            <input type="file" accept={photoTypes.join(",")} disabled={!!busy} aria-describedby="profile-photo-hint" onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              void run("photo", async () => {
                await onPhotoUpload(file);
                setPhotoNotice({ text: "Profile photo saved." });
              });
            }} />
          </label>
          <p className="form-hint" id="profile-photo-hint">{busy === "photo" ? "Uploading photo…" : "JPG, PNG, or WebP up to 5 MB."}</p>
          {photoNotice && <p role={photoNotice.error ? "alert" : "status"} className={photoNotice.error ? "account-error" : "form-hint"}>{photoNotice.text}</p>}
        </div>
      </section>
      <section className="profile-section">
        <h3>Security</h3>
        {editingPassword ? (
          <form className="form" onSubmit={changePassword}>
            <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
            <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
            <label>Confirm new password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
            {needsCode && <label>Email verification code<input name="code" autoComplete="one-time-code" inputMode="numeric" required /></label>}
            <div className="profile-actions">
              <button className="primary-button" disabled={!!busy}>{busy === "password" ? "Updating…" : "Update password"}</button>
              <button className="secondary-button" type="button" disabled={!!busy} onClick={() => {
                setEditingPassword(false);
                setNeedsCode(false);
                setNotice(undefined);
              }}>Cancel</button>
            </div>
          </form>
        ) : <button className="secondary-button" disabled={!!busy} onClick={() => {
          setNotice(undefined);
          setEditingPassword(true);
        }}>Change password</button>}
      </section>
      {notice && <p role={notice.error ? "alert" : "status"} className={notice.error ? "account-error" : "form-hint"}>{notice.text}</p>}
      <section className="profile-section">
        <button className="secondary-button" disabled={!canSignOut || !!busy} onClick={signOut}>
          {busy === "signout" ? "Signing out…" : "Sign out"}
        </button>
        {!canSignOut && <p className="form-hint">Finish or discard your timer and wait for your changes to save before signing out.</p>}
      </section>
    </Modal>
  );
}
