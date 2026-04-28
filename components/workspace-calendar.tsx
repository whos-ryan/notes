"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Menu,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
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
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside
        style={{
          width: isSidebarCollapsed ? 0 : sidebarWidth,
        }}
        className={`relative hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex ${
          isSidebarCollapsed ? "overflow-hidden border-r-0" : ""
        }`}
      >
        <div className="flex h-11 items-center gap-2 border-b border-sidebar-border px-3">
          <BrandMark size="sm" />
        </div>

        <div className="border-b border-sidebar-border p-2">
          <div className="space-y-0.5">
            <Link
              href="/workspace"
              className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent"
            >
              <FileText className="size-3.5 text-muted-foreground" />
              Notes
            </Link>
            <Link
              href="/workspace/calendar"
              className="flex w-full items-center gap-2 rounded-sm bg-sidebar-accent px-1.5 py-1 text-sm text-sidebar-foreground"
            >
              <CalendarDays className="size-3.5 text-muted-foreground" />
              Calendar
            </Link>
            <button
              type="button"
              onClick={() => openCreateEditor(selectedDate)}
              className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent"
            >
              <Plus className="size-3.5 text-muted-foreground" />
              New event
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Calendar
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Track meetings, deadlines, and reminders beside your pages.
          </p>
        </div>

        <div className="border-t border-sidebar-border p-2">
          <Link
            href="/"
            className="flex w-full items-center rounded-sm px-1.5 py-1 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
          >
            Home
          </Link>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <Menu className="size-4" />
          </button>
          <p className="truncate text-sm text-muted-foreground">
            Workspace / Calendar
          </p>

          <div className="ml-auto flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  (month) =>
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                )
              }
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="min-w-28 text-center text-sm font-medium text-foreground sm:min-w-40">
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
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <LandingProfileMenu
            profileLabel={profileLabel}
            image={profileImage}
          />
        </header>

        {error ? (
          <div className="border-b border-border px-6 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 overflow-hidden border-b border-border bg-background lg:border-r lg:border-b-0">
            {isLoadingEvents ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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

          <aside className="flex min-h-0 max-h-[42vh] flex-col bg-sidebar p-4 lg:max-h-none">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Selected date
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {formatSelectedDateLabel(selectedDate)}
            </h2>

            <button
              type="button"
              onClick={() => openCreateEditor(selectedDate)}
              className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="size-4" />
              New event
            </button>

            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
                  No items for this day.
                </p>
              ) : (
                selectedDateEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEditEditor(event.id)}
                    className="w-full rounded-md border border-border bg-background p-3 text-left transition hover:bg-accent"
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatEventTimeLabel(event.startsAt, event.allDay)} ·{" "}
                      {getCalendarEventStatusLabel(event.status)}
                    </p>
                    {event.location ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {event.location}
                      </p>
                    ) : null}
                    {event.noteId ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[calc(100dvh-32px)] w-full max-w-2xl overflow-y-auto border border-border bg-popover p-5 text-popover-foreground shadow-xl">
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
