import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { note } from "@/database/notes-schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await db
    .select()
    .from(note)
    .where(eq(note.userId, session.user.id))
    .orderBy(desc(note.updatedAt));

  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    content?: string;
  };

  const title = body.title?.trim() ? body.title.trim() : "Untitled";
  const content = body.content ?? "";

  const [createdNote] = await db
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
