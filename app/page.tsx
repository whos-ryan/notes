import { ArrowRight, CalendarDays, FileText, Search } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
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
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex min-h-14 items-center justify-between border-b border-border">
          <Link href="/" className="min-w-0">
            <BrandMark subtitle="Minimal workspace" />
          </Link>
          <nav className="flex items-center gap-2">
            {isLoggedIn ? (
              <LandingProfileMenu
                profileLabel={profileLabel}
                image={session?.user.image ?? null}
              />
            ) : (
              <Link
                href="/login"
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                Login
              </Link>
            )}
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm text-muted-foreground">
              Notes, calendar, snippets, and structure in one quiet workspace.
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
              A workspace that stays out of the way.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Write pages, organize folders, keep favorite ideas close, and
              track dates without leaving the same focused environment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={workspaceHref}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Open Workspace
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={isLoggedIn ? "/workspace" : "/login?mode=signup"}
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {isLoggedIn ? "Account" : "Create account"}
              </Link>
            </div>
          </div>

          <div className="min-w-0 border border-border bg-sidebar">
            <div className="flex h-11 items-center gap-2 border-b border-sidebar-border px-3">
              <span className="size-3 rounded-full bg-destructive/70" />
              <span className="size-3 rounded-full bg-chart-3/70" />
              <span className="size-3 rounded-full bg-chart-2/70" />
              <span className="ml-2 text-xs text-muted-foreground">
                Workspace preview
              </span>
            </div>
            <div className="grid min-h-[430px] grid-cols-[150px_1fr] sm:grid-cols-[210px_1fr]">
              <aside className="border-r border-sidebar-border p-3">
                <div className="mb-4 h-8 rounded-md bg-sidebar-accent" />
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 rounded-sm bg-sidebar-accent px-2 py-1 text-foreground">
                    <FileText className="size-3.5" />
                    Roadmap
                  </div>
                  <div className="flex items-center gap-2 rounded-sm px-2 py-1">
                    <CalendarDays className="size-3.5" />
                    Calendar
                  </div>
                  <div className="flex items-center gap-2 rounded-sm px-2 py-1">
                    <Search className="size-3.5" />
                    Search
                  </div>
                </div>
              </aside>
              <article className="min-w-0 bg-background p-5 sm:p-8">
                <span className="mb-5 grid size-10 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
                  <FileText className="size-5" />
                </span>
                <h2 className="max-w-md text-3xl font-semibold leading-tight">
                  Product thoughts
                </h2>
                <div className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
                  <p className="text-foreground">
                    Keep rough thinking, final notes, snippets, and dates in the
                    same place.
                  </p>
                  <div className="h-px bg-border" />
                  <p>Today</p>
                  <p className="rounded-md bg-muted px-3 py-2">
                    Draft launch notes and link calendar reminders.
                  </p>
                  <p className="rounded-md bg-muted px-3 py-2">
                    Favorite the core project page for quick access.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>

        <footer className="grid gap-3 border-t border-border py-5 text-sm text-muted-foreground md:grid-cols-3">
          <p>
            <span className="font-medium text-foreground">Fast editor.</span>{" "}
            Keyboard-first writing with low visual noise.
          </p>
          <p>
            <span className="font-medium text-foreground">Page system.</span>{" "}
            Folders, favorites, icons, and command search.
          </p>
          <p>
            <span className="font-medium text-foreground">Calendar.</span>{" "}
            Events and deadlines beside your notes.
          </p>
        </footer>
      </section>
    </main>
  );
}
