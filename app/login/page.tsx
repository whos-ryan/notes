"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [nextPath, setNextPath] = useState("/workspace");
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    if (next) {
      setNextPath(next);
    }
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen place-items-center bg-black/15 p-4">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/65 shadow-2xl shadow-black/30">
          <header className="border-b border-white/10 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              notes.os
            </p>
            <h1 className="mt-2 font-sans text-3xl font-semibold">
              {isSignUp ? "Sign up" : "Login"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {isSignUp
                ? "Create your workspace account."
                : "Continue to your workspace."}
            </p>
          </header>

          <form
            className="space-y-4 px-6 py-6"
            onSubmit={(event) => {
              event.preventDefault();

              if (isSignUp && !passwordsMatch) {
                setShowPasswordError(true);
                return;
              }

              void (async () => {
                setAuthError(null);
                setIsSubmitting(true);

                if (isSignUp) {
                  const { error } = await authClient.signUp.email({
                    email,
                    password,
                    name: username,
                    callbackURL: nextPath,
                  });

                  if (error) {
                    setAuthError(error.message ?? "Unable to create account.");
                    setIsSubmitting(false);
                    return;
                  }

                  window.location.assign(nextPath);
                  return;
                }

                const { error } = await authClient.signIn.email({
                  email,
                  password,
                  callbackURL: nextPath,
                });

                if (error) {
                  setAuthError(error.message ?? "Login failed.");
                  setIsSubmitting(false);
                  return;
                }

                window.location.assign(nextPath);
              })();
            }}
          >
            {isSignUp ? (
              <label className="block space-y-2 text-sm">
                <span className="text-muted">Username</span>
                <input
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-background/70 px-3 py-2 text-foreground outline-none placeholder:text-muted focus:border-white/30"
                />
              </label>
            ) : null}

            <label className="block space-y-2 text-sm">
              <span className="text-muted">Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-background/70 px-3 py-2 text-foreground outline-none placeholder:text-muted focus:border-white/30"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="text-muted">Password</span>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setShowPasswordError(false);
                }}
                className="w-full rounded-xl border border-white/15 bg-background/70 px-3 py-2 text-foreground outline-none placeholder:text-muted focus:border-white/30"
              />
            </label>

            {isSignUp ? (
              <label className="block space-y-2 text-sm">
                <span className="text-muted">Confirm password</span>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setShowPasswordError(false);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-background/70 px-3 py-2 text-foreground outline-none placeholder:text-muted focus:border-white/30"
                />
              </label>
            ) : null}

            {isSignUp && showPasswordError && !passwordsMatch ? (
              <p className="text-sm text-red-400">
                Password and confirm password must match.
              </p>
            ) : null}

            {authError ? (
              <p className="text-sm text-red-400">{authError}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || (isSignUp && !passwordsMatch)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Login"}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsSignUp((current) => !current);
                setShowPasswordError(false);
                setAuthError(null);
                setPassword("");
                setConfirmPassword("");
              }}
              className="w-full rounded-xl border border-white/15 px-3 py-2 text-sm text-muted transition enabled:hover:bg-white/5 enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSignUp ? "Back to login" : "Sign up"}
            </button>

            {!isSignUp ? (
              <Link
                href="/forgot-password"
                className="block text-center text-sm text-muted hover:text-foreground"
              >
                Forgot password?
              </Link>
            ) : null}
          </form>

          <footer className="border-t border-white/10 px-6 py-4 text-sm text-muted">
            Need an account?{" "}
            <Link href="/" className="text-foreground hover:text-accent">
              Back to landing
            </Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
