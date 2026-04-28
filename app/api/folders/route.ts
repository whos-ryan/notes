import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { noteFolder } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import { folderNameMaxLength } from "@/lib/content-safety";
import { withUserDb } from "@/lib/db";
import {
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

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit({
    key: `folders:create:${getClientKey(request, session.user.id)}`,
    limit: 20,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const json = await readJsonBody(request);

  if (json.error) {
    return NextResponse.json({ error: json.error }, { status: 400 });
  }

  const body = parseNoteFolderMutationInput(json.value);
  const name = body.name?.trim()
    ? clampText(body.name.trim(), folderNameMaxLength)
    : "New folder";

  const [folder] = await withUserDb(session.user.id, async (db) =>
    db
      .insert(noteFolder)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        name: encryptField(name),
      })
      .returning(),
  );

  return NextResponse.json<NoteFolderResponse>(
    { folder: serializeNoteFolderRecord(folder) },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folders = await withUserDb(session.user.id, async (db) =>
    db
      .select()
      .from(noteFolder)
      .where(eq(noteFolder.userId, session.user.id))
      .orderBy(noteFolder.name),
  );

  return NextResponse.json({
    folders: folders
      .map(serializeNoteFolderRecord)
      .sort((left, right) => left.name.localeCompare(right.name)),
  });
}
