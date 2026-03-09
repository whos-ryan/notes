import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceNotes } from "@/components/workspace-notes";
import { getAuth } from "@/lib/auth";

export default async function WorkspacePage() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const profileLabel =
    session.user.name?.trim() || session.user.email.split("@")[0] || "Profile";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <WorkspaceNotes
        profileLabel={profileLabel}
        profileImage={session.user.image ?? null}
      />
    </main>
  );
}
