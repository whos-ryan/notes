import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { note, noteFolder } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import {
  noteContentMaxLength,
  noteIconMaxLength,
  noteTitleMaxLength,
  sanitizeNoteHtml,
} from "@/lib/content-safety";
import { withUserDb } from "@/lib/db";
import {
  type NoteMutationInput,
  parseNoteMutationInput,
  serializeNoteRecord,
} from "@/lib/notes-contracts";
import {
  clampText,
  encryptField,
  getClientKey,
  rateLimit,
  readJsonBody,
} from "@/lib/security";

type RouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit({
    key: `notes:update:${getClientKey(request, session.user.id)}`,
    limit: 120,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const { noteId } = await context.params;
  const json = await readJsonBody(request);

  if (json.error) {
    return NextResponse.json({ error: json.error }, { status: 400 });
  }

  const body = parseNoteMutationInput(json.value);
  const updateData: NoteMutationInput = {};

  if (typeof body.title === "string") {
    updateData.title = encryptField(
      clampText(body.title.trim(), noteTitleMaxLength) || "Untitled",
    );
  }

  if (typeof body.content === "string") {
    updateData.content = encryptField(
      sanitizeNoteHtml(clampText(body.content, noteContentMaxLength)),
    );
  }

  if (typeof body.folderId === "string" || body.folderId === null) {
    updateData.folderId = body.folderId;
  }

  if (typeof body.icon === "string" || body.icon === null) {
    updateData.icon =
      typeof body.icon === "string"
        ? clampText(body.icon, noteIconMaxLength)
        : body.icon;
  }

  if (typeof body.isFavorite === "boolean") {
    updateData.isFavorite = body.isFavorite;
  }

  if (typeof body.isArchived === "boolean") {
    updateData.isArchived = body.isArchived;
  }

  const updatedNote = await withUserDb(session.user.id, async (db) => {
    if (typeof updateData.folderId === "string" && updateData.folderId) {
      const [folder] = await db
        .select({ id: noteFolder.id })
        .from(noteFolder)
        .where(
          and(
            eq(noteFolder.id, updateData.folderId),
            eq(noteFolder.userId, session.user.id),
          ),
        )
        .limit(1);

      if (!folder) {
        return "folder-not-found" as const;
      }
    }

    const [nextNote] = await db
      .update(note)
      .set(updateData)
      .where(and(eq(note.id, noteId), eq(note.userId, session.user.id)))
      .returning();

    return nextNote ?? null;
  });

  if (updatedNote === "folder-not-found") {
    return NextResponse.json({ error: "Folder not found" }, { status: 400 });
  }

  if (!updatedNote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ note: serializeNoteRecord(updatedNote) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit({
    key: `notes:delete:${getClientKey(request, session.user.id)}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const { noteId } = await context.params;

  const [deletedNote] = await withUserDb(session.user.id, async (db) =>
    db
      .delete(note)
      .where(and(eq(note.id, noteId), eq(note.userId, session.user.id)))
      .returning(),
  );

  if (!deletedNote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
