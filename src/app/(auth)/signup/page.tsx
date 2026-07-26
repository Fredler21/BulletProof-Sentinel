"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { GoogleSignInButton } from "@/app/(auth)/_components/GoogleSignInButton";

export default function SignupPage(): React.ReactElement {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken, signup: true }),
      });
      if (!res.ok) {
        throw new Error("Failed to start session");
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="surface p-8 shadow-card">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Create account
        </h1>
        <p className="mt-1 text-sm text-sentinel-muted">
          Provision your Sentinel workspace.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-sentinel-muted">
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-sentinel-border bg-sentinel-bg px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-sentinel-faint focus:border-sentinel-accent/70 focus:ring-2 focus:ring-sentinel-accent/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-sentinel-muted">
              Email
            </span>
            <input
              type="email"
              value={email}
              required
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-sentinel-border bg-sentinel-bg px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-sentinel-faint focus:border-sentinel-accent/70 focus:ring-2 focus:ring-sentinel-accent/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-sentinel-muted">
              Password
            </span>
            <input
              type="password"
              value={password}
              required
              minLength={8}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-sentinel-border bg-sentinel-bg px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-sentinel-faint focus:border-sentinel-accent/70 focus:ring-2 focus:ring-sentinel-accent/20"
            />
          </label>
          {error && (
            <p className="rounded-md border border-sentinel-danger/40 bg-sentinel-danger/10 px-3 py-2 text-xs text-sentinel-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sentinel-accent px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-sentinel-faint">
          <span className="h-px flex-1 bg-sentinel-border" />
          or
          <span className="h-px flex-1 bg-sentinel-border" />
        </div>
        <GoogleSignInButton signup />
        <p className="mt-6 text-center text-xs text-sentinel-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-sentinel-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
