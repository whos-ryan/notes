"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen place-items-center bg-black/15 p-4">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/65 shadow-2xl shadow-black/30">
          <header className="border-b border-white/10 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              notes.os
            </p>
            <h1 className="mt-2 font-sans text-3xl font-semibold">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-muted">
              Enter your email to receive a reset link.
            </p>
          </header>

          <form
            className="space-y-4 px-6 py-6"
            onSubmit={(event) => {
              event.preventDefault();
              void (async () => {
                setError(null);
                setMessage(null);
                setIsSubmitting(true);
                const { error: requestError } =
                  await authClient.requestPasswordReset({
                    email,
                    redirectTo: `${window.location.origin}/reset-password`,
                  });

                if (requestError) {
                  setError(
                    requestError.message ?? "Failed to send reset email.",
                  );
                  setIsSubmitting(false);
                  return;
                }

                setMessage("If the email exists, a reset link has been sent.");
                setIsSubmitting(false);
              })();
            }}
          >
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

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? (
              <p className="text-sm text-green-400">{message}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Please wait..." : "Send reset link"}
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
