import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceNotes } from "@/components/workspace-notes";
import { auth } from "@/lib/auth";

export default async function WorkspacePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const profileLabel =
    session.user.name?.trim() || session.user.email.split("@")[0] || "Profile";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 border border-white/10 bg-black/15 md:grid-cols-[260px_1fr]">
        <WorkspaceNotes
          profileLabel={profileLabel}
          profileImage={session.user.image ?? null}
        />
      </div>
    </main>
  );
}
