"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import {
  authErrorClassName,
  authInputClassName,
} from "@/components/auth-styles";
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

    if (params.get("mode") === "signup") {
      setIsSignUp(true);
    }
  }, []);

  return (
    <AuthShell
      title={isSignUp ? "Create account" : "Log in"}
      description={
        isSignUp
          ? "Set up your workspace and start organizing notes."
          : "Continue to your notes, calendar, and saved pages."
      }
      footer={
        <span>
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
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
            className="font-medium text-foreground transition hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </span>
      }
    >
      <form
        className="space-y-4"
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
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Username</span>
            <input
              type="text"
              autoComplete="name"
              placeholder="yourname"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={authInputClassName}
            />
          </label>
        ) : null}

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

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Password</span>
          <input
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="Enter password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setShowPasswordError(false);
            }}
            className={authInputClassName}
          />
        </label>

        {isSignUp ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">
              Confirm password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setShowPasswordError(false);
              }}
              className={authInputClassName}
            />
          </label>
        ) : null}

        {isSignUp && showPasswordError && !passwordsMatch ? (
          <p className={authErrorClassName}>
            Password and confirm password must match.
          </p>
        ) : null}

        {authError ? <p className={authErrorClassName}>{authError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || (isSignUp && !passwordsMatch)}
          className="h-10 w-full rounded-md border border-border bg-primary px-3 text-sm font-medium text-primary-foreground transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Please wait..."
            : isSignUp
              ? "Create account"
              : "Log in"}
        </button>

        {!isSignUp ? (
          <Link
            href="/forgot-password"
            className="block text-center text-sm text-muted-foreground transition hover:text-foreground"
          >
            Forgot password?
          </Link>
        ) : null}
      </form>
    </AuthShell>
  );
}
