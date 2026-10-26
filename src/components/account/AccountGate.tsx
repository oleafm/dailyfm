"use client";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Sprout } from "lucide-react";
import { accountClient } from "@/lib/account/client";

export default function AccountGate({ children }: { children: (user: User | null) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!accountClient);
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!accountClient) return;
    let alive = true;
    const { data: { subscription } } = accountClient.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser((current) => current?.id === session?.user.id ? current : session?.user || null);
      setLoading(false);
    });
    accountClient.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setError(error.message);
      setUser((current) => current?.id === data.session?.user.id ? current : data.session?.user || null);
      setLoading(false);
    }).catch(() => { if (alive) { setError("Cannot check your account. Please reload and try again."); setLoading(false); } });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountClient) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(""); setMessage("");
    try {
      const credentials = { email: String(form.get("email")).trim(), password: String(form.get("password")) };
      const result = signup
        ? await accountClient.auth.signUp({ ...credentials, options: { data: { name: String(form.get("name")).trim() } } })
        : await accountClient.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (signup && !result.data.session) setMessage("Check your email to confirm your account, then sign in here.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sign in. Please try again."); }
    finally { setBusy(false); }
  }
  if (!accountClient) {
    if (process.env.NODE_ENV === "production") return (
      <main className="account-screen"><section className="account-card">
        <h1>Your space is temporarily unavailable.</h1>
        <p className="muted">Please try again later.</p>
      </section></main>
    );
    return <>{children(null)}</>;
  }
  if (loading) return <div className="loading-screen"><Sprout size={32} /><span>Opening your space…</span></div>;
  if (user) return <>{children(user)}</>;
  return (
    <main className="account-screen">
      <section className="account-card">
        <div className="account-brand"><span className="brand-mark"><Sprout size={25} /></span><strong>do.daily<small>Grow every day</small></strong></div>
        <p className="eyebrow">YOUR TIME, KEPT SAFE</p>
        <h1>{signup ? "Make room for you." : "Welcome back."}</h1>
        <p className="muted">Sign in to keep your tasks and time logs in your account, across devices.</p>
        <form className="form" onSubmit={submit}>
          {signup && <label>Your name<input name="name" required maxLength={80} autoComplete="name" /></label>}
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" minLength={8} required autoComplete={signup ? "new-password" : "current-password"} /></label>
          {error && <p role="alert" className="account-error">{error}</p>}
          {message && <p role="status" className="muted">{message}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "One moment…" : signup ? "Create account" : "Sign in"}</button>
        </form>
        <button className="text-button" disabled={busy} onClick={() => { setSignup(!signup); setError(""); setMessage(""); }}>{signup ? "Already have an account? Sign in" : "New here? Create an account"}</button>
      </section>
    </main>
  );
}
