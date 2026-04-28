"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import {
  authErrorClassName,
  authInputClassName,
} from "@/components/auth-styles";
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
    <AuthShell
      title="Set new password"
      description="Choose a new password to restore access to your workspace."
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
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setError(null);
            }}
            className={authInputClassName}
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError(null);
            }}
            className={authInputClassName}
          />
        </label>

        {error ? <p className={authErrorClassName}>{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || !passwordsMatch}
          className="h-10 w-full rounded-md border border-border bg-primary px-3 text-sm font-medium text-primary-foreground transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Please wait..." : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
