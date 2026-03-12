import { and, asc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { calendarEvent } from "@/database/calendar-schema";
import { note } from "@/database/notes-schema";
import { getAuth } from "@/lib/auth";
import {
  isCalendarEventKind,
  isCalendarEventStatus,
  parseCalendarEventMutationInput,
  serializeCalendarEvent,
} from "@/lib/calendar-contracts";
import { getDb } from "@/lib/db";

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

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");

  const startAt = startParam ? toDate(startParam) : null;
  const endAt = endParam ? toDate(endParam) : null;

  if ((startParam && !startAt) || (endParam && !endAt)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const whereParts = [eq(calendarEvent.userId, session.user.id)];

  if (startAt) {
    whereParts.push(gte(calendarEvent.startsAt, startAt));
  }

  if (endAt) {
    whereParts.push(lte(calendarEvent.startsAt, endAt));
  }

  const whereClause =
    whereParts.length > 1 ? and(...whereParts) : whereParts[0];

  const events = await getDb()
    .select()
    .from(calendarEvent)
    .where(whereClause)
    .orderBy(asc(calendarEvent.startsAt), asc(calendarEvent.createdAt));

  return NextResponse.json({
    events: events.map(serializeCalendarEvent),
  });
}

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = parseCalendarEventMutationInput(await request.json());

  if (!body.startsAt) {
    return NextResponse.json(
      { error: "Start date is required" },
      { status: 400 },
    );
  }

  const startsAt = toDate(body.startsAt);

  if (!startsAt) {
    return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
  }

  const endsAt = body.endsAt ? toDate(body.endsAt) : null;

  if (body.endsAt && !endsAt) {
    return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
  }

  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    return NextResponse.json(
      { error: "End date cannot be before start date" },
      { status: 400 },
    );
  }

  if (body.kind && !isCalendarEventKind(body.kind)) {
    return NextResponse.json({ error: "Invalid event kind" }, { status: 400 });
  }

  if (body.status && !isCalendarEventStatus(body.status)) {
    return NextResponse.json(
      { error: "Invalid event status" },
      { status: 400 },
    );
  }

  let noteId: string | null = null;

  if (typeof body.noteId === "string") {
    const nextNoteId = body.noteId.trim();

    if (nextNoteId) {
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

      noteId = nextNoteId;
    }
  }

  const [createdEvent] = await getDb()
    .insert(calendarEvent)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      noteId,
      title: body.title?.trim() || "Untitled",
      description: body.description ?? "",
      kind: body.kind ?? "event",
      status: body.status ?? "todo",
      startsAt,
      endsAt,
      allDay: body.allDay ?? false,
      location: body.location?.trim() ? body.location.trim() : null,
    })
    .returning();

  return NextResponse.json(
    { event: serializeCalendarEvent(createdEvent) },
    { status: 201 },
  );
}
