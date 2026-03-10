import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { note, noteFolder } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseNoteMutationInput } from "@/lib/notes-contracts";

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [folders, notes] = await Promise.all([
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
  ]);

  return NextResponse.json({ folders, notes });
}

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = parseNoteMutationInput(await request.json());

  const title = body.title?.trim() ? body.title.trim() : "Untitled";
  const content = body.content ?? "";
  const folderId = body.folderId ?? null;

  const [createdNote] = await getDb()
    .insert(note)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      folderId,
      title,
      content,
    })
    .returning();

  return NextResponse.json({ note: createdNote }, { status: 201 });
}
