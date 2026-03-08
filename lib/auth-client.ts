import { createAuthClient } from "better-auth/react";

const baseURL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000")
    : window.location.origin;

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
});
