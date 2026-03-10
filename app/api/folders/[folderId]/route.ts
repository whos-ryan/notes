import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { noteFolder } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  type NoteFolderMutationInput,
  type NoteFolderResponse,
  parseNoteFolderMutationInput,
} from "@/lib/notes-contracts";

type RouteContext = {
  params: Promise<{
    folderId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folderId } = await context.params;
  const body = parseNoteFolderMutationInput(await request.json());
  const updateData: NoteFolderMutationInput = {};

  if (typeof body.name === "string") {
    updateData.name = body.name.trim() || "New folder";
  }

  const [folder] = await getDb()
    .update(noteFolder)
    .set(updateData)
    .where(
      and(eq(noteFolder.id, folderId), eq(noteFolder.userId, session.user.id)),
    )
    .returning();

  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json<NoteFolderResponse>({ folder });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folderId } = await context.params;

  const [folder] = await getDb()
    .delete(noteFolder)
    .where(
      and(eq(noteFolder.id, folderId), eq(noteFolder.userId, session.user.id)),
    )
    .returning();

  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
