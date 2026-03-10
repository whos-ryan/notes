import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { note, noteFolder } from "@/database/notes-schema";

export type NoteRecord = InferSelectModel<typeof note>;
export type NoteFolderRecord = InferSelectModel<typeof noteFolder>;

export type NoteMutationInput = Partial<
  Pick<InferInsertModel<typeof note>, "title" | "content" | "folderId">
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
