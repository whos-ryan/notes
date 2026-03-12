import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { calendarEvent } from "@/database/calendar-schema";
import { note } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import {
  type CalendarEventKind,
  type CalendarEventStatus,
  isCalendarEventKind,
  isCalendarEventStatus,
  parseCalendarEventMutationInput,
  serializeCalendarEvent,
} from "@/lib/calendar-contracts";
import { getDb } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

type CalendarEventUpdateInput = {
  title?: string;
  description?: string;
  kind?: CalendarEventKind;
  status?: CalendarEventStatus;
  startsAt?: Date;
  endsAt?: Date | null;
  allDay?: boolean;
  location?: string | null;
  noteId?: string | null;
};

function toDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await context.params;

  const [existingEvent] = await getDb()
    .select()
    .from(calendarEvent)
    .where(
      and(
        eq(calendarEvent.id, eventId),
        eq(calendarEvent.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!existingEvent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = parseCalendarEventMutationInput(await request.json());
  const updateData: CalendarEventUpdateInput = {};

  if (typeof body.title === "string") {
    updateData.title = body.title.trim() || "Untitled";
  }

  if (typeof body.description === "string") {
    updateData.description = body.description;
  }

  if (typeof body.kind === "string") {
    if (!isCalendarEventKind(body.kind)) {
      return NextResponse.json(
        { error: "Invalid event kind" },
        { status: 400 },
      );
    }

    updateData.kind = body.kind;
  }

  if (typeof body.status === "string") {
    if (!isCalendarEventStatus(body.status)) {
      return NextResponse.json(
        { error: "Invalid event status" },
        { status: 400 },
      );
    }

    updateData.status = body.status;
  }

  if (typeof body.startsAt === "string") {
    const startsAt = toDate(body.startsAt);

    if (!startsAt) {
      return NextResponse.json(
        { error: "Invalid start date" },
        { status: 400 },
      );
    }

    updateData.startsAt = startsAt;
  }

  if (typeof body.endsAt === "string" || body.endsAt === null) {
    if (body.endsAt === null) {
      updateData.endsAt = null;
    } else {
      const endsAt = toDate(body.endsAt);

      if (!endsAt) {
        return NextResponse.json(
          { error: "Invalid end date" },
          { status: 400 },
        );
      }

      updateData.endsAt = endsAt;
    }
  }

  if (typeof body.allDay === "boolean") {
    updateData.allDay = body.allDay;
  }

  if (typeof body.location === "string" || body.location === null) {
    updateData.location = body.location?.trim() ? body.location.trim() : null;
  }

  if (typeof body.noteId === "string" || body.noteId === null) {
    if (body.noteId === null || !body.noteId.trim()) {
      updateData.noteId = null;
    } else {
      const nextNoteId = body.noteId.trim();

      const linkedNote = await getDb()
        .select({ id: note.id })
        .from(note)
        .where(and(eq(note.id, nextNoteId), eq(note.userId, session.user.id)))
        .limit(1);

      if (!linkedNote[0]) {
        return NextResponse.json(
          { error: "Linked note was not found" },
          { status: 400 },
        );
      }

      updateData.noteId = nextNoteId;
    }
  }

  const nextStart = updateData.startsAt ?? existingEvent.startsAt;
  const nextEnd =
    updateData.endsAt !== undefined ? updateData.endsAt : existingEvent.endsAt;

  if (nextEnd && nextEnd.getTime() < nextStart.getTime()) {
    return NextResponse.json(
      { error: "End date cannot be before start date" },
      { status: 400 },
    );
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ event: serializeCalendarEvent(existingEvent) });
  }

  const [updatedEvent] = await getDb()
    .update(calendarEvent)
    .set(updateData)
    .where(
      and(
        eq(calendarEvent.id, eventId),
        eq(calendarEvent.userId, session.user.id),
      ),
    )
    .returning();

  if (!updatedEvent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ event: serializeCalendarEvent(updatedEvent) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await context.params;

  const [deletedEvent] = await getDb()
    .delete(calendarEvent)
    .where(
      and(
        eq(calendarEvent.id, eventId),
        eq(calendarEvent.userId, session.user.id),
      ),
    )
    .returning();

  if (!deletedEvent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
