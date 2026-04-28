import { neon } from "@neondatabase/serverless";
import {
  calendarDescriptionMaxLength,
  calendarLocationMaxLength,
  calendarTitleMaxLength,
  folderNameMaxLength,
  noteContentMaxLength,
  noteTitleMaxLength,
  sanitizeNoteHtml,
} from "@/lib/content-safety";
import { clampText, encryptField } from "@/lib/security";

type NoteRow = {
  id: string;
  title: string;
  content: string;
};

type FolderRow = {
  id: string;
  name: string;
};

type CalendarRow = {
  id: string;
  title: string;
  description: string;
  location: string | null;
};

const databaseUrl = process.env.DATABASE_URL;
const encryptionKey = process.env.NOTES_VAULT_ENCRYPTION_KEY;
const shouldWrite = process.argv.includes("--write");

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

if (!encryptionKey) {
  throw new Error("Missing NOTES_VAULT_ENCRYPTION_KEY");
}

const sql = neon(databaseUrl);

function shouldEncrypt(value: string | null) {
  return Boolean(value && !value.startsWith("nv1:"));
}

const notes = (await sql`
  select id, title, content
  from note
  where (title <> '' and title not like 'nv1:%')
     or (content <> '' and content not like 'nv1:%')
`) as NoteRow[];

const folders = (await sql`
  select id, name
  from note_folder
  where name <> '' and name not like 'nv1:%'
`) as FolderRow[];

const events = (await sql`
  select id, title, description, location
  from calendar_event
  where (title <> '' and title not like 'nv1:%')
     or (description <> '' and description not like 'nv1:%')
     or (location is not null and location <> '' and location not like 'nv1:%')
`) as CalendarRow[];

let updates = 0;

for (const row of notes) {
  const nextTitle = shouldEncrypt(row.title)
    ? encryptField(clampText(row.title, noteTitleMaxLength))
    : row.title;
  const nextContent = shouldEncrypt(row.content)
    ? encryptField(
        sanitizeNoteHtml(clampText(row.content, noteContentMaxLength)),
      )
    : row.content;

  if (nextTitle === row.title && nextContent === row.content) {
    continue;
  }

  updates += 1;

  if (shouldWrite) {
    await sql`
      update note
      set title = ${nextTitle}, content = ${nextContent}
      where id = ${row.id}
    `;
  }
}

for (const row of folders) {
  const nextName = shouldEncrypt(row.name)
    ? encryptField(clampText(row.name, folderNameMaxLength))
    : row.name;

  if (nextName === row.name) {
    continue;
  }

  updates += 1;

  if (shouldWrite) {
    await sql`
      update note_folder
      set name = ${nextName}
      where id = ${row.id}
    `;
  }
}

for (const row of events) {
  const nextTitle = shouldEncrypt(row.title)
    ? encryptField(clampText(row.title, calendarTitleMaxLength))
    : row.title;
  const nextDescription = shouldEncrypt(row.description)
    ? encryptField(clampText(row.description, calendarDescriptionMaxLength))
    : row.description;
  const nextLocation = shouldEncrypt(row.location)
    ? encryptField(clampText(row.location as string, calendarLocationMaxLength))
    : row.location;

  if (
    nextTitle === row.title &&
    nextDescription === row.description &&
    nextLocation === row.location
  ) {
    continue;
  }

  updates += 1;

  if (shouldWrite) {
    await sql`
      update calendar_event
      set title = ${nextTitle},
          description = ${nextDescription},
          location = ${nextLocation}
      where id = ${row.id}
    `;
  }
}

console.log(
  JSON.stringify(
    {
      mode: shouldWrite ? "write" : "dry-run",
      noteRows: notes.length,
      folderRows: folders.length,
      calendarRows: events.length,
      rowsToUpdate: updates,
    },
    null,
    2,
  ),
);
