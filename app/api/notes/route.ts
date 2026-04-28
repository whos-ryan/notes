import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { note, noteFolder } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import {
  noteContentMaxLength,
  noteTitleMaxLength,
  sanitizeNoteHtml,
} from "@/lib/content-safety";
import { withUserDb } from "@/lib/db";
import {
  parseNoteMutationInput,
  serializeNoteFolderRecord,
  serializeNoteRecord,
} from "@/lib/notes-contracts";
import {
  clampText,
  encryptField,
  getClientKey,
  rateLimit,
  readJsonBody,
} from "@/lib/security";

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [folders, notes] = await withUserDb(session.user.id, async (db) =>
    Promise.all([
      db
        .select()
        .from(noteFolder)
        .where(eq(noteFolder.userId, session.user.id))
        .orderBy(noteFolder.name),
      db
        .select()
        .from(note)
        .where(eq(note.userId, session.user.id))
        .orderBy(desc(note.updatedAt)),
    ]),
  );

  return NextResponse.json({
    folders: folders
      .map(serializeNoteFolderRecord)
      .sort((left, right) => left.name.localeCompare(right.name)),
    notes: notes.map(serializeNoteRecord),
  });
}

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit({
    key: `notes:create:${getClientKey(request, session.user.id)}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const json = await readJsonBody(request);

  if (json.error) {
    return NextResponse.json({ error: json.error }, { status: 400 });
  }

  const body = parseNoteMutationInput(json.value);

  const title = body.title?.trim()
    ? clampText(body.title.trim(), noteTitleMaxLength)
    : "Untitled";
  const content = sanitizeNoteHtml(
    clampText(body.content ?? "", noteContentMaxLength),
  );
  const folderId = body.folderId ?? null;
  const createdNote = await withUserDb(session.user.id, async (db) => {
    if (folderId) {
      const [folder] = await db
        .select({ id: noteFolder.id })
        .from(noteFolder)
        .where(
          and(
            eq(noteFolder.id, folderId),
            eq(noteFolder.userId, session.user.id),
          ),
        )
        .limit(1);

      if (!folder) {
        return null;
      }
    }

    const [nextNote] = await db
      .insert(note)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        folderId,
        title: encryptField(title),
        content: encryptField(content),
      })
      .returning();

    return nextNote;
  });

  if (!createdNote) {
    return NextResponse.json({ error: "Folder not found" }, { status: 400 });
  }

  return NextResponse.json(
    { note: serializeNoteRecord(createdNote) },
    { status: 201 },
  );
}
