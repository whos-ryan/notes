import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { note } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

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

  const { noteId } = await context.params;
  const body = (await request.json()) as {
    title?: string;
    content?: string;
  };

  const updateData: {
    title?: string;
    content?: string;
  } = {};

  if (typeof body.title === "string") {
    updateData.title = body.title.trim() || "Untitled";
  }

  if (typeof body.content === "string") {
    updateData.content = body.content;
  }

  const [updatedNote] = await getDb()
    .update(note)
    .set(updateData)
    .where(and(eq(note.id, noteId), eq(note.userId, session.user.id)))
    .returning();

  if (!updatedNote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ note: updatedNote });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await context.params;

  const [deletedNote] = await getDb()
    .delete(note)
    .where(and(eq(note.id, noteId), eq(note.userId, session.user.id)))
    .returning();

  if (!deletedNote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
