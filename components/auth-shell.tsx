import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <section className="hidden min-h-0 border-r border-border py-6 pr-10 lg:flex lg:flex-col">
          <Link href="/" className="min-w-0">
            <BrandMark subtitle="Minimal workspace" />
          </Link>

          <div className="mt-auto max-w-xl pb-10">
            <p className="text-sm text-muted-foreground">Workspace account</p>
            <h2 className="mt-4 text-5xl font-semibold leading-tight">
              Return to the same calm surface every time.
            </h2>
            <div className="mt-8 border border-border bg-sidebar">
              <div className="border-b border-sidebar-border px-4 py-3 text-sm text-muted-foreground">
                Today
              </div>
              <div className="space-y-3 p-4 text-sm">
                <div className="rounded-md bg-background px-3 py-2">
                  Draft weekly notes
                </div>
                <div className="rounded-md bg-background px-3 py-2">
                  Review calendar reminders
                </div>
                <div className="rounded-md bg-background px-3 py-2 text-muted-foreground">
                  Archive finished pages
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-dvh items-center justify-center py-6 lg:min-h-0 lg:pl-10">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground lg:hidden"
            >
              <BrandMark size="sm" />
            </Link>

            <section className="border border-border bg-card">
              <header className="border-b border-border px-5 py-5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Account
                </p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </header>

              <div className="px-5 py-5">{children}</div>

              <footer className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                {footer}
              </footer>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
