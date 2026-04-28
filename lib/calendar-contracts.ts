import type { InferSelectModel } from "drizzle-orm";
import type { calendarEvent } from "@/database/calendar-schema";
import { decryptField } from "@/lib/security";

export const calendarEventKinds = [
  "meeting",
  "deadline",
  "event",
  "reminder",
] as const;

export const calendarEventStatuses = [
  "todo",
  "in_progress",
  "done",
  "canceled",
] as const;

export type CalendarEventKind = (typeof calendarEventKinds)[number];
export type CalendarEventStatus = (typeof calendarEventStatuses)[number];

export type CalendarEventRecord = InferSelectModel<typeof calendarEvent>;

export type CalendarEventDto = Omit<
  CalendarEventRecord,
  "kind" | "status" | "startsAt" | "endsAt" | "createdAt" | "updatedAt"
> & {
  kind: CalendarEventKind;
  status: CalendarEventStatus;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventMutationInput = {
  title?: string;
  description?: string;
  kind?: string;
  status?: string;
  startsAt?: string;
  endsAt?: string | null;
  allDay?: boolean;
  location?: string | null;
  noteId?: string | null;
};

export type CalendarEventsListResponse = {
  events: CalendarEventDto[];
};

export type CalendarEventResponse = {
  event: CalendarEventDto;
};

export function isCalendarEventKind(value: string): value is CalendarEventKind {
  return (calendarEventKinds as readonly string[]).includes(value);
}

export function isCalendarEventStatus(
  value: string,
): value is CalendarEventStatus {
  return (calendarEventStatuses as readonly string[]).includes(value);
}

export function parseCalendarEventMutationInput(
  value: unknown,
): CalendarEventMutationInput {
  if (!value || typeof value !== "object") {
    return {};
  }

  const input = value as Record<string, unknown>;
  const output: CalendarEventMutationInput = {};

  if (typeof input.title === "string") {
    output.title = input.title;
  }

  if (typeof input.description === "string") {
    output.description = input.description;
  }

  if (typeof input.kind === "string") {
    output.kind = input.kind;
  }

  if (typeof input.status === "string") {
    output.status = input.status;
  }

  if (typeof input.startsAt === "string") {
    output.startsAt = input.startsAt;
  }

  if (typeof input.endsAt === "string" || input.endsAt === null) {
    output.endsAt = input.endsAt;
  }

  if (typeof input.allDay === "boolean") {
    output.allDay = input.allDay;
  }

  if (typeof input.location === "string" || input.location === null) {
    output.location = input.location;
  }

  if (typeof input.noteId === "string" || input.noteId === null) {
    output.noteId = input.noteId;
  }

  return output;
}

export function serializeCalendarEvent(
  event: CalendarEventRecord,
): CalendarEventDto {
  return {
    ...event,
    title: decryptField(event.title) ?? event.title,
    description: decryptField(event.description) ?? event.description,
    location: decryptField(event.location),
    kind: isCalendarEventKind(event.kind) ? event.kind : "event",
    status: isCalendarEventStatus(event.status) ? event.status : "todo",
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt ? event.endsAt.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
