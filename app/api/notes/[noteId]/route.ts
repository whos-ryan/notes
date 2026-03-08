import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { note } from "@/database/notes-schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({
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

  const [updatedNote] = await db
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
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await context.params;

  const [deletedNote] = await db
    .delete(note)
    .where(and(eq(note.id, noteId), eq(note.userId, session.user.id)))
    .returning();

  if (!deletedNote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
