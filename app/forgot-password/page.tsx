"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import {
  authErrorClassName,
  authInputClassName,
} from "@/components/auth-styles";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthShell
      title="Reset password"
      description="Enter your email and we will send a link to recover your workspace."
      footer={
        <Link
          href="/login"
          className="font-medium text-foreground transition hover:text-muted-foreground"
        >
          Back to login
        </Link>
      }
    >
      <form
        className="space-y-4"
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
              setError(requestError.message ?? "Failed to send reset email.");
              setIsSubmitting(false);
              return;
            }

            setMessage("If the email exists, a reset link has been sent.");
            setIsSubmitting(false);
          })();
        }}
      >
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authInputClassName}
          />
        </label>

        {error ? <p className={authErrorClassName}>{error}</p> : null}
        {message ? (
          <p className="rounded-md border border-chart-2/30 bg-chart-2/10 px-3 py-2 text-sm text-foreground">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full rounded-md border border-border bg-primary px-3 text-sm font-medium text-primary-foreground transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Please wait..." : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
