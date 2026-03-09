import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { note } from "@/database/notes-schema";
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

  const notes = await getDb()
    .select()
    .from(note)
    .where(eq(note.userId, session.user.id))
    .orderBy(desc(note.updatedAt));

  return NextResponse.json({ notes });
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

  const [createdNote] = await getDb()
    .insert(note)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      title,
      content,
    })
    .returning();

  return NextResponse.json({ note: createdNote }, { status: 201 });
}
