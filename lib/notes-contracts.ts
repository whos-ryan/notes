import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { note } from "@/database/notes-schema";

export type NoteRecord = InferSelectModel<typeof note>;

export type NoteMutationInput = Partial<
  Pick<InferInsertModel<typeof note>, "title" | "content">
>;

export type NotesListResponse = {
  notes: NoteRecord[];
};

export type NoteResponse = {
  note: NoteRecord;
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

  return output;
}
