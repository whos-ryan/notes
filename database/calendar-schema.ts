import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/database/auth-schema";
import { note } from "@/database/notes-schema";

export const calendarEvent = pgTable(
  "calendar_event",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    noteId: text("note_id").references(() => note.id, { onDelete: "set null" }),
    title: text("title").notNull().default("Untitled"),
    description: text("description").notNull().default(""),
    kind: text("kind").notNull().default("event"),
    status: text("status").notNull().default("todo"),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    allDay: boolean("all_day").notNull().default(false),
    location: text("location"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("calendar_event_user_id_idx").on(table.userId),
    index("calendar_event_note_id_idx").on(table.noteId),
    index("calendar_event_starts_at_idx").on(table.startsAt),
    index("calendar_event_kind_idx").on(table.kind),
    index("calendar_event_status_idx").on(table.status),
  ],
);

export const calendarEventRelations = relations(calendarEvent, ({ one }) => ({
  user: one(user, {
    fields: [calendarEvent.userId],
    references: [user.id],
  }),
  note: one(note, {
    fields: [calendarEvent.noteId],
    references: [note.id],
  }),
}));
