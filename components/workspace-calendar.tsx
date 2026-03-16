"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarEventForm,
  type CalendarEventFormValues,
} from "@/components/calendar-event-form";
import { CalendarMonthGrid } from "@/components/calendar-month-grid";
import { LandingProfileMenu } from "@/components/landing-profile-menu";
import type {
  CalendarEventDto,
  CalendarEventResponse,
  CalendarEventsListResponse,
} from "@/lib/calendar-contracts";
import {
  formatEventTimeLabel,
  formatMonthLabel,
  formatSelectedDateLabel,
  getCalendarEventKindClass,
  getCalendarEventKindLabel,
  getCalendarEventStatusLabel,
  getMonthGridRange,
  toCalendarDayKey,
  toDateTimeInputValue,
} from "@/lib/calendar-utils";
import type { NotesListResponse } from "@/lib/notes-contracts";

type WorkspaceCalendarProps = {
  profileLabel: string;
  profileImage: string | null;
};

type NoteOption = {
  id: string;
  title: string;
};

function buildNewEventFormValues(baseDate: Date): CalendarEventFormValues {
  const startAt = new Date(baseDate);
  startAt.setHours(9, 0, 0, 0);

  const endAt = new Date(baseDate);
  endAt.setHours(10, 0, 0, 0);

  return {
    title: "",
    description: "",
    kind: "event",
    status: "todo",
    startsAt: toDateTimeInputValue(startAt),
    endsAt: toDateTimeInputValue(endAt),
    allDay: false,
    location: "",
    noteId: "",
  };
}

function toAllDayInput(value: string): string {
  if (!value) {
    return "";
  }

  return value.includes("T") ? value.slice(0, 10) : value;
}

function toTimedInput(value: string, fallbackTime: string): string {
  if (!value) {
    return "";
  }

  return value.includes("T") ? value : `${value}T${fallbackTime}`;
}

function toIsoStringFromFormInput(
  value: string,
  allDay: boolean,
  isEnd: boolean,
): string | null {
  if (!value) {
    return null;
  }

  if (allDay) {
    const timeValue = isEnd ? "23:59:59" : "00:00:00";
    const date = new Date(`${value}T${timeValue}`);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function mapEventToFormValues(
  event: CalendarEventDto,
): CalendarEventFormValues {
  return {
    title: event.title,
    description: event.description,
    kind: event.kind,
    status: event.status,
    startsAt: event.allDay
      ? event.startsAt.slice(0, 10)
      : toDateTimeInputValue(new Date(event.startsAt)),
    endsAt: event.endsAt
      ? event.allDay
        ? event.endsAt.slice(0, 10)
        : toDateTimeInputValue(new Date(event.endsAt))
      : "",
    allDay: event.allDay,
    location: event.location ?? "",
    noteId: event.noteId ?? "",
  };
}

export function WorkspaceCalendar({
  profileLabel,
  profileImage,
}: WorkspaceCalendarProps) {
  const sidebarWidth = 260;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [noteOptions, setNoteOptions] = useState<NoteOption[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CalendarEventFormValues>(
    buildNewEventFormValues(new Date()),
  );
  const [error, setError] = useState<string | null>(null);

  const selectedDateKey = toCalendarDayKey(selectedDate);

  const notesById = useMemo(
    () =>
      new Map(
        noteOptions.map((note) => [note.id, note.title || "Untitled"] as const),
      ),
    [noteOptions],
  );

  const selectedDateEvents = useMemo(() => {
    return events
      .filter(
        (event) =>
          toCalendarDayKey(new Date(event.startsAt)) === selectedDateKey,
      )
      .sort(
        (left, right) =>
          new Date(left.startsAt).getTime() -
          new Date(right.startsAt).getTime(),
      );
  }, [events, selectedDateKey]);

  const monthLabel = useMemo(
    () => formatMonthLabel(currentMonth),
    [currentMonth],
  );

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);

    const range = getMonthGridRange(currentMonth);
    const query = new URLSearchParams({
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    });

    const response = await fetch(`/api/calendar?${query.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      setError("Unable to load calendar events.");
      setIsLoadingEvents(false);
      return;
    }

    const data = (await response.json()) as CalendarEventsListResponse;
    setEvents(data.events);
    setIsLoadingEvents(false);
  }, [currentMonth]);

  useEffect(() => {
    setError(null);
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/notes", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as NotesListResponse;
      const nextOptions = data.notes
        .map((note) => ({
          id: note.id,
          title: note.title,
        }))
        .sort((left, right) => left.title.localeCompare(right.title));

      setNoteOptions(nextOptions);
    })();
  }, []);

  const openCreateEditor = useCallback((forDate: Date) => {
    setEditingEventId(null);
    setFormValues(buildNewEventFormValues(forDate));
    setIsEditorOpen(true);
    setError(null);
  }, []);

  const openEditEditor = useCallback(
    (eventId: string) => {
      const target = events.find((event) => event.id === eventId);

      if (!target) {
        return;
      }

      setEditingEventId(eventId);
      setFormValues(mapEventToFormValues(target));
      setIsEditorOpen(true);
      setError(null);
    },
    [events],
  );

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingEventId(null);
    setIsSavingEvent(false);
    setIsDeletingEvent(false);
  }, []);

  const onFormValuesChange = useCallback(
    (nextValues: CalendarEventFormValues) => {
      if (nextValues.allDay === formValues.allDay) {
        setFormValues(nextValues);
        return;
      }

      if (nextValues.allDay) {
        setFormValues({
          ...nextValues,
          startsAt: toAllDayInput(nextValues.startsAt || formValues.startsAt),
          endsAt: toAllDayInput(nextValues.endsAt),
        });
        return;
      }

      setFormValues({
        ...nextValues,
        startsAt: toTimedInput(
          nextValues.startsAt || formValues.startsAt,
          "09:00",
        ),
        endsAt: toTimedInput(nextValues.endsAt, "10:00"),
      });
    },
    [formValues],
  );

  const saveEvent = useCallback(async () => {
    setError(null);

    const startsAtIso = toIsoStringFromFormInput(
      formValues.startsAt,
      formValues.allDay,
      false,
    );

    if (!startsAtIso) {
      setError("Start date is required.");
      return;
    }

    const endsAtIso = formValues.endsAt
      ? toIsoStringFromFormInput(formValues.endsAt, formValues.allDay, true)
      : null;

    if (formValues.endsAt && !endsAtIso) {
      setError("End date is invalid.");
      return;
    }

    if (
      endsAtIso &&
      new Date(endsAtIso).getTime() < new Date(startsAtIso).getTime()
    ) {
      setError("End date cannot be before start date.");
      return;
    }

    setIsSavingEvent(true);

    const payload = {
      title: formValues.title,
      description: formValues.description,
      kind: formValues.kind,
      status: formValues.status,
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      allDay: formValues.allDay,
      location: formValues.location.trim() ? formValues.location.trim() : null,
      noteId: formValues.noteId || null,
    };

    const endpoint = editingEventId
      ? `/api/calendar/${editingEventId}`
      : "/api/calendar";

    const method = editingEventId ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setError(body?.error ?? "Unable to save calendar event.");
      setIsSavingEvent(false);
      return;
    }

    const data = (await response.json()) as CalendarEventResponse;

    setEvents((current) => {
      if (editingEventId) {
        return current.map((event) =>
          event.id === editingEventId ? data.event : event,
        );
      }

      return [...current, data.event].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() -
          new Date(right.startsAt).getTime(),
      );
    });

    setIsSavingEvent(false);
    closeEditor();
  }, [editingEventId, formValues, closeEditor]);

  const deleteEvent = useCallback(async () => {
    if (!editingEventId) {
      return;
    }

    setError(null);
    setIsDeletingEvent(true);

    const response = await fetch(`/api/calendar/${editingEventId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setError(body?.error ?? "Unable to delete calendar event.");
      setIsDeletingEvent(false);
      return;
    }

    setEvents((current) =>
      current.filter((event) => event.id !== editingEventId),
    );

    setIsDeletingEvent(false);
    closeEditor();
  }, [editingEventId, closeEditor]);

  return (
    <div className="flex min-h-screen w-full bg-black/15">
      <aside
        style={{
          width: isSidebarCollapsed ? 0 : sidebarWidth,
        }}
        className={`relative m-3 mr-0 flex h-[calc(100vh-24px)] shrink-0 flex-col rounded-3xl border border-white/10 bg-surface/70 transition-[width] duration-200 ${
          isSidebarCollapsed ? "overflow-hidden border-r-0" : ""
        }`}
      >
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Workspace
          </p>
          <h1 className="mt-1 font-sans text-[30px] font-semibold leading-none text-foreground">
            notes.os
          </h1>
        </div>

        <div className="border-b border-white/10 p-3">
          <div className="flex flex-col gap-2">
            <Link
              href="/workspace"
              className="block w-full rounded-xl border border-white/15 px-3 py-2 text-center text-sm text-muted transition hover:bg-white/10 hover:text-foreground"
            >
              Open notes
            </Link>
            <Link
              href="/workspace/calendar"
              className="block w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center text-sm text-foreground"
            >
              Open calendar
            </Link>
            <button
              type="button"
              onClick={() => openCreateEditor(selectedDate)}
              className="w-full rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-muted transition hover:bg-white/10 hover:text-foreground"
            >
              New calendar event
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Calendar
          </p>
          <p className="mt-2 text-sm text-muted">
            Track meetings, deadlines, events, and reminders.
          </p>
        </div>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="block w-full rounded-xl border border-white/10 px-3 py-2 text-center text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
          >
            Back to landing
          </Link>
        </div>
      </aside>

      <section className="m-3 ml-0 flex min-w-0 flex-1 flex-col rounded-3xl border border-white/10 bg-background/90">
        <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            className="rounded-xl border border-white/15 p-2 text-muted transition hover:bg-white/5 hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <span className="sr-only">Toggle sidebar</span>
            <span className="flex flex-col gap-1">
              <span className="h-px w-3 bg-current" />
              <span className="h-px w-3 bg-current" />
              <span className="h-px w-3 bg-current" />
            </span>
          </button>
          <p className="truncate whitespace-nowrap text-sm text-muted">
            Workspace / Calendar
          </p>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  (month) =>
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                )
              }
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
            >
              Prev
            </button>
            <p className="min-w-40 text-center text-sm font-medium text-foreground">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  (month) =>
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                )
              }
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
            >
              Next
            </button>
          </div>

          <LandingProfileMenu
            profileLabel={profileLabel}
            image={profileImage}
          />
        </header>

        {error ? (
          <div className="border-b border-white/10 px-6 py-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-[68vh] rounded-2xl border border-white/10 bg-surface/60">
            {isLoadingEvents ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                Loading calendar...
              </div>
            ) : (
              <CalendarMonthGrid
                month={currentMonth}
                selectedDate={selectedDate}
                events={events}
                onSelectDate={setSelectedDate}
                onSelectEvent={openEditEditor}
              />
            )}
          </div>

          <aside className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-surface/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Selected date
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {formatSelectedDateLabel(selectedDate)}
            </h2>

            <button
              type="button"
              onClick={() => openCreateEditor(selectedDate)}
              className="mt-4 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-foreground transition hover:bg-white/20"
            >
              New event
            </button>

            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 px-3 py-3 text-sm text-muted">
                  No items for this day.
                </p>
              ) : (
                selectedDateEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEditEditor(event.id)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] ${getCalendarEventKindClass(
                          event.kind,
                        )}`}
                      >
                        {getCalendarEventKindLabel(event.kind)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {formatEventTimeLabel(event.startsAt, event.allDay)} ·{" "}
                      {getCalendarEventStatusLabel(event.status)}
                    </p>
                    {event.location ? (
                      <p className="mt-1 truncate text-xs text-muted">
                        {event.location}
                      </p>
                    ) : null}
                    {event.noteId ? (
                      <p className="mt-1 truncate text-xs text-muted">
                        Note: {notesById.get(event.noteId) ?? "Linked note"}
                      </p>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      </section>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-surface p-6">
            <CalendarEventForm
              mode={editingEventId ? "edit" : "create"}
              values={formValues}
              notes={noteOptions}
              isSaving={isSavingEvent}
              isDeleting={isDeletingEvent}
              onChange={onFormValuesChange}
              onCancel={closeEditor}
              onSubmit={() => {
                void saveEvent();
              }}
              onDelete={
                editingEventId
                  ? () => {
                      void deleteEvent();
                    }
                  : null
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
