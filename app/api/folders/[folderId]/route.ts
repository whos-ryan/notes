import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { noteFolder } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import { folderNameMaxLength } from "@/lib/content-safety";
import { withUserDb } from "@/lib/db";
import {
  type NoteFolderMutationInput,
  type NoteFolderResponse,
  parseNoteFolderMutationInput,
  serializeNoteFolderRecord,
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

  const limited = rateLimit({
    key: `folders:update:${getClientKey(request, session.user.id)}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const { folderId } = await context.params;
  const json = await readJsonBody(request);

  if (json.error) {
    return NextResponse.json({ error: json.error }, { status: 400 });
  }

  const body = parseNoteFolderMutationInput(json.value);
  const updateData: NoteFolderMutationInput = {};

  if (typeof body.name === "string") {
    updateData.name = encryptField(
      clampText(body.name.trim(), folderNameMaxLength) || "New folder",
    );
  }

  const [folder] = await withUserDb(session.user.id, async (db) =>
    db
      .update(noteFolder)
      .set(updateData)
      .where(
        and(
          eq(noteFolder.id, folderId),
          eq(noteFolder.userId, session.user.id),
        ),
      )
      .returning(),
  );

  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json<NoteFolderResponse>({
    folder: serializeNoteFolderRecord(folder),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit({
    key: `folders:delete:${getClientKey(request, session.user.id)}`,
    limit: 40,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const { folderId } = await context.params;

  const [folder] = await withUserDb(session.user.id, async (db) =>
    db
      .delete(noteFolder)
      .where(
        and(
          eq(noteFolder.id, folderId),
          eq(noteFolder.userId, session.user.id),
        ),
      )
      .returning(),
  );

  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
