import { headers } from "next/headers";
import Link from "next/link";
import { LandingProfileMenu } from "@/components/landing-profile-menu";
import { getAuth } from "@/lib/auth";

export default async function Home() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  const isLoggedIn = Boolean(session);
  const workspaceHref = isLoggedIn ? "/workspace" : "/login";
  const profileLabel =
    session?.user.name?.trim() ||
    session?.user.email?.split("@")[0] ||
    "Profile";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 border border-white/10 bg-black/15">
        <section className="flex min-w-0 flex-col p-6 md:p-10">
          <header className="mb-20 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                notes.os
              </p>
              <p className="mt-1 text-sm text-muted">
                Minimal workspace for serious writing
              </p>
            </div>
            {isLoggedIn ? (
              <LandingProfileMenu
                profileLabel={profileLabel}
                image={session?.user.image ?? null}
              />
            ) : (
              <Link
                href="/login"
                className="border border-white/15 px-4 py-2 text-sm text-muted transition hover:text-foreground"
              >
                Login
              </Link>
            )}
          </header>

          <div className="max-w-xl space-y-6">
            <p className="inline-flex items-center gap-2 border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted">
              <span className="h-px w-6 bg-accent" />
              Notion-inspired interface
            </p>
            <h1 className="font-sans text-5xl font-semibold leading-tight md:text-6xl">
              Think clearly. Write faster. Keep everything in one place.
            </h1>
            <p className="text-base leading-relaxed text-muted md:text-lg">
              A focused notes app designed for deep work, clean structure, and
              optional AI support when you need it.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={workspaceHref}
                className="border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Open Workspace
              </Link>
            </div>
          </div>

          <div className="mt-auto grid gap-3 pt-14 text-sm text-muted md:grid-cols-3">
            <div className="border border-white/10 p-4">
              <p className="mb-1 font-medium text-foreground">Fast Editor</p>
              <p>Keyboard-first writing surface with zero noise.</p>
            </div>
            <div className="border border-white/10 p-4">
              <p className="mb-1 font-medium text-foreground">Page System</p>
              <p>Simple hierarchy for personal and team knowledge.</p>
            </div>
            <div className="border border-white/10 p-4">
              <p className="mb-1 font-medium text-foreground">AI Layer</p>
              <p>Summaries and rewrite tools, only when requested.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
