import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { note, noteFolder } from "@/database/notes-schema";
import { sanitizeNoteHtml } from "@/lib/content-safety";
import { decryptRequiredField } from "@/lib/security";

export type NoteRecord = InferSelectModel<typeof note>;
export type NoteFolderRecord = InferSelectModel<typeof noteFolder>;

export type NoteMutationInput = Partial<
  Pick<
    InferInsertModel<typeof note>,
    "title" | "content" | "folderId" | "icon" | "isFavorite" | "isArchived"
  >
>;

export type NoteFolderMutationInput = Partial<
  Pick<InferInsertModel<typeof noteFolder>, "name">
>;

export type NotesListResponse = {
  folders: NoteFolderRecord[];
  notes: NoteRecord[];
};

export type NoteResponse = {
  note: NoteRecord;
};

export type NoteFolderResponse = {
  folder: NoteFolderRecord;
};

export function serializeNoteRecord(record: NoteRecord): NoteRecord {
  const content = decryptRequiredField(record.content);

  return {
    ...record,
    title: decryptRequiredField(record.title),
    content: sanitizeNoteHtml(content),
  };
}

export function serializeNoteFolderRecord(
  record: NoteFolderRecord,
): NoteFolderRecord {
  return {
    ...record,
    name: decryptRequiredField(record.name),
  };
}

export function parseNoteMutationInput(value: unknown): NoteMutationInput {
  if (!value || typeof value !== "object") {
    return {};
  }

  const input = value as Record<string, unknown>;
  const output: NoteMutationInput = {};

  if (typeof input.title === "string") {
    output.title = input.title;
  }

  if (typeof input.content === "string") {
    output.content = input.content;
  }

  if (typeof input.folderId === "string" || input.folderId === null) {
    output.folderId = input.folderId;
  }

  if (typeof input.icon === "string" || input.icon === null) {
    output.icon = input.icon;
  }

  if (typeof input.isFavorite === "boolean") {
    output.isFavorite = input.isFavorite;
  }

  if (typeof input.isArchived === "boolean") {
    output.isArchived = input.isArchived;
  }

  return output;
}

export function parseNoteFolderMutationInput(
  value: unknown,
): NoteFolderMutationInput {
  if (!value || typeof value !== "object") {
    return {};
  }

  const input = value as Record<string, unknown>;
  const output: NoteFolderMutationInput = {};

  if (typeof input.name === "string") {
    output.name = input.name;
  }

  return output;
}
