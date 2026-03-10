"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = newPassword === confirmPassword;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
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
              Set new password
            </h1>
            <p className="mt-2 text-sm text-muted">
              Enter your new password to continue.
            </p>
          </header>

          <form
            className="space-y-4 px-6 py-6"
            onSubmit={(event) => {
              event.preventDefault();

              if (!passwordsMatch) {
                setError("Passwords must match.");
                return;
              }

              if (!token) {
                setError("Invalid or missing reset token.");
                return;
              }

              void (async () => {
                setError(null);
                setIsSubmitting(true);
                const { error: resetError } = await authClient.resetPassword({
                  token,
                  newPassword,
                });

                if (resetError) {
                  setError(resetError.message ?? "Failed to reset password.");
                  setIsSubmitting(false);
                  return;
                }

                router.push("/login");
              })();
            }}
          >
            <label className="block space-y-2 text-sm">
              <span className="text-muted">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-white/15 bg-background/70 px-3 py-2 text-foreground outline-none placeholder:text-muted focus:border-white/30"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="text-muted">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-white/15 bg-background/70 px-3 py-2 text-foreground outline-none placeholder:text-muted focus:border-white/30"
              />
            </label>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting || !passwordsMatch}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Please wait..." : "Update password"}
            </button>
          </form>

          <footer className="border-t border-white/10 px-6 py-4 text-sm text-muted">
            <Link href="/login" className="text-foreground hover:text-accent">
              Back to login
            </Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
