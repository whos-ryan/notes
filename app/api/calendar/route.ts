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
import {
  calendarDescriptionMaxLength,
  calendarLocationMaxLength,
  calendarTitleMaxLength,
} from "@/lib/content-safety";
import { withUserDb } from "@/lib/db";
import {
  clampText,
  encryptField,
  getClientKey,
  rateLimit,
  readJsonBody,
} from "@/lib/security";

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

  if (
    startAt &&
    endAt &&
    endAt.getTime() - startAt.getTime() > 400 * 24 * 60 * 60 * 1000
  ) {
    return NextResponse.json(
      { error: "Date range is too large" },
      { status: 400 },
    );
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

  const events = await withUserDb(session.user.id, async (db) =>
    db
      .select()
      .from(calendarEvent)
      .where(whereClause)
      .orderBy(asc(calendarEvent.startsAt), asc(calendarEvent.createdAt)),
  );

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

  const limited = rateLimit({
    key: `calendar:create:${getClientKey(request, session.user.id)}`,
    limit: 40,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const json = await readJsonBody(request);

  if (json.error) {
    return NextResponse.json({ error: json.error }, { status: 400 });
  }

  const body = parseCalendarEventMutationInput(json.value);

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
      const linkedNote = await withUserDb(session.user.id, async (db) =>
        db
          .select({ id: note.id })
          .from(note)
          .where(and(eq(note.id, nextNoteId), eq(note.userId, session.user.id)))
          .limit(1),
      );

      if (!linkedNote[0]) {
        return NextResponse.json(
          { error: "Linked note was not found" },
          { status: 400 },
        );
      }

      noteId = nextNoteId;
    }
  }

  const [createdEvent] = await withUserDb(session.user.id, async (db) =>
    db
      .insert(calendarEvent)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        noteId,
        title: encryptField(
          clampText(body.title?.trim() || "Untitled", calendarTitleMaxLength),
        ),
        description: encryptField(
          clampText(body.description ?? "", calendarDescriptionMaxLength),
        ),
        kind: body.kind ?? "event",
        status: body.status ?? "todo",
        startsAt,
        endsAt,
        allDay: body.allDay ?? false,
        location: body.location?.trim()
          ? encryptField(
              clampText(body.location.trim(), calendarLocationMaxLength),
            )
          : null,
      })
      .returning(),
  );

  return NextResponse.json(
    { event: serializeCalendarEvent(createdEvent) },
    { status: 201 },
  );
}
