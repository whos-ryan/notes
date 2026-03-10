import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { noteFolder } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  type NoteFolderResponse,
  parseNoteFolderMutationInput,
} from "@/lib/notes-contracts";

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = parseNoteFolderMutationInput(await request.json());
  const name = body.name?.trim() ? body.name.trim() : "New folder";

  const [folder] = await getDb()
    .insert(noteFolder)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
    })
    .returning();

  return NextResponse.json<NoteFolderResponse>({ folder }, { status: 201 });
}

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folders = await getDb()
    .select()
    .from(noteFolder)
    .where(eq(noteFolder.userId, session.user.id))
    .orderBy(noteFolder.name);

  return NextResponse.json({ folders });
}
