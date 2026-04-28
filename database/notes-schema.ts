import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/database/auth-schema";

export const noteFolder = pgTable(
  "note_folder",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("note_folder_user_id_idx").on(table.userId),
    index("note_folder_updated_at_idx").on(table.updatedAt),
  ],
);

export const note = pgTable(
  "note",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => noteFolder.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull().default("Untitled"),
    content: text("content").notNull().default(""),
    icon: text("icon"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("note_folder_id_idx").on(table.folderId),
    index("note_user_id_idx").on(table.userId),
    index("note_updated_at_idx").on(table.updatedAt),
    index("note_is_favorite_idx").on(table.isFavorite),
    index("note_is_archived_idx").on(table.isArchived),
  ],
);

export const noteFolderRelations = relations(noteFolder, ({ many, one }) => ({
  notes: many(note),
  user: one(user, {
    fields: [noteFolder.userId],
    references: [user.id],
  }),
}));

export const noteRelations = relations(note, ({ one }) => ({
  folder: one(noteFolder, {
    fields: [note.folderId],
    references: [noteFolder.id],
  }),
  user: one(user, {
    fields: [note.userId],
    references: [user.id],
  }),
}));
