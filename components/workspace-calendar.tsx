"use client";

import { ChevronLeft, ChevronRight, Menu, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarEventForm,
  type CalendarEventFormValues,
} from "@/components/calendar-event-form";
import { CalendarMonthGrid } from "@/components/calendar-month-grid";
import { LandingProfileMenu } from "@/components/landing-profile-menu";
import { CommandPalette } from "@/components/workspace/command-palette";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
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
import type {
  NoteFolderRecord,
  NoteFolderResponse,
  NoteRecord,
  NoteResponse,
  NotesListResponse,
} from "@/lib/notes-contracts";

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
  const minSidebarWidth = 220;
  const maxSidebarWidth = 400;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [folders, setFolders] = useState<NoteFolderRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [noteOptions, setNoteOptions] = useState<NoteOption[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CalendarEventFormValues>(
    buildNewEventFormValues(new Date()),
  );
  const [error, setError] = useState<string | null>(null);
  const resizeStateRef = useRef<{
    startX: number;
    startWidth: number;
  } | null>(null);

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

  const navigateToNote = useCallback((noteId: string) => {
    window.location.href = `/workspace?noteId=${encodeURIComponent(noteId)}`;
  }, []);

  const createNote = useCallback(
    async (options?: { folderId?: string | null; navigate?: boolean }) => {
      setError(null);
      setIsCreating(true);

      const response = await fetch("/api/notes", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: options?.folderId ?? activeFolderId,
          title: "Untitled",
          content: "",
        }),
      });

      if (!response.ok) {
        setError("Unable to create note.");
        setIsCreating(false);
        return null;
      }

      const data = (await response.json()) as NoteResponse;
      setNotes((current) => [data.note, ...current]);
      setActiveNoteId(data.note.id);
      setActiveFolderId(data.note.folderId ?? null);

      if (data.note.folderId) {
        setExpandedFolderIds((current) =>
          current.includes(data.note.folderId as string)
            ? current
            : [...current, data.note.folderId as string],
        );
      }

      setIsCreating(false);

      if (options?.navigate !== false) {
        navigateToNote(data.note.id);
      }

      return data.note;
    },
    [activeFolderId, navigateToNote],
  );

  const createFolder = useCallback(async () => {
    setError(null);
    setIsCreatingFolder(true);

    const response = await fetch("/api/folders", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Folder ${folders.length + 1}`,
      }),
    });

    if (!response.ok) {
      setError("Unable to create folder.");
      setIsCreatingFolder(false);
      return null;
    }

    const data = (await response.json()) as NoteFolderResponse;
    setFolders((current) => [...current, data.folder]);
    setActiveFolderId(data.folder.id);
    setExpandedFolderIds((current) => [...current, data.folder.id]);
    setIsCreatingFolder(false);
    return data.folder;
  }, [folders.length]);

  const renameFolder = useCallback(
    async (folderId: string, nextName: string) => {
      setError(null);

      const response = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nextName,
        }),
      });

      if (!response.ok) {
        setError("Unable to rename folder.");
        return;
      }

      const data = (await response.json()) as NoteFolderResponse;
      setFolders((current) =>
        current.map((folder) =>
          folder.id === folderId ? data.folder : folder,
        ),
      );
    },
    [],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      setError(null);
      setDeletingFolderId(folderId);

      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        setError("Unable to delete folder.");
        setDeletingFolderId(null);
        return;
      }

      setFolders((current) =>
        current.filter((folder) => folder.id !== folderId),
      );
      setExpandedFolderIds((current) =>
        current.filter((expandedId) => expandedId !== folderId),
      );
      setNotes((current) =>
        current.map((item) =>
          item.folderId === folderId ? { ...item, folderId: null } : item,
        ),
      );

      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }

      setDeletingFolderId(null);
    },
    [activeFolderId],
  );

  const patchNote = useCallback(
    async (
      noteId: string,
      input: Partial<Pick<NoteRecord, "isFavorite" | "isArchived">>,
    ) => {
      setNotes((current) =>
        current.map((item) =>
          item.id === noteId ? { ...item, ...input } : item,
        ),
      );

      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        setError("Unable to update note.");
      }
    },
    [],
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      setError(null);
      setDeletingNoteId(noteId);

      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        setError("Unable to delete note.");
        setDeletingNoteId(null);
        return;
      }

      setNotes((current) => {
        const filtered = current.filter((item) => item.id !== noteId);

        if (activeNoteId === noteId) {
          const nextNote = filtered[0] ?? null;
          setActiveNoteId(nextNote?.id ?? null);
          setActiveFolderId(nextNote?.folderId ?? null);
        }

        return filtered;
      });

      setDeletingNoteId(null);
    },
    [activeNoteId],
  );

  const onToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((current) => !current);
  }, []);

  const onToggleFolder = useCallback((folderId: string) => {
    setExpandedFolderIds((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId],
    );
  }, []);

  const onSidebarResizeStart = useCallback(
    (clientX: number) => {
      if (isSidebarCollapsed) {
        return;
      }

      resizeStateRef.current = {
        startX: clientX,
        startWidth: sidebarWidth,
      };
    },
    [isSidebarCollapsed, sidebarWidth],
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
      setFolders(data.folders);
      setNotes(data.notes);
      setExpandedFolderIds(data.folders.map((folder) => folder.id));

      if (data.notes.length > 0) {
        setActiveNoteId(data.notes[0].id);
        setActiveFolderId(data.notes[0].folderId ?? null);
      }

      const nextOptions = data.notes
        .map((note) => ({
          id: note.id,
          title: note.title,
        }))
        .sort((left, right) => left.title.localeCompare(right.title));

      setNoteOptions(nextOptions);
    })();
  }, []);

  useEffect(() => {
    if (!resizeStateRef.current || isSidebarCollapsed) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) {
        return;
      }

      const nextWidth =
        resizeStateRef.current.startWidth +
        event.clientX -
        resizeStateRef.current.startX;

      if (nextWidth < minSidebarWidth) {
        setSidebarWidth(minSidebarWidth);
        return;
      }

      if (nextWidth > maxSidebarWidth) {
        setSidebarWidth(maxSidebarWidth);
        return;
      }

      setSidebarWidth(nextWidth);
    };

    const onMouseUp = () => {
      resizeStateRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isSidebarCollapsed]);

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
      {!isSidebarCollapsed ? (
        <WorkspaceSidebar
          profileLabel={profileLabel}
          profileImage={profileImage}
          width={sidebarWidth}
          onCollapse={onToggleSidebar}
          onResizeStart={(event) => onSidebarResizeStart(event.clientX)}
          onOpenCommandPalette={() => setIsCommandOpen(true)}
          activeNoteId={activeNoteId}
          activeFolderId={activeFolderId}
          expandedFolderIds={expandedFolderIds}
          folders={folders}
          notes={notes}
          deletingFolderId={deletingFolderId}
          deletingNoteId={deletingNoteId}
          isCreating={isCreating}
          isCreatingFolder={isCreatingFolder}
          onCreateNote={(folderId) => void createNote({ folderId })}
          onCreateFolder={() => void createFolder()}
          onDeleteFolder={(folderId) => void deleteFolder(folderId)}
          onDeleteNote={(noteId) => void deleteNote(noteId)}
          onRenameFolder={(folderId, nextName) =>
            void renameFolder(folderId, nextName)
          }
          onSelectFolder={setActiveFolderId}
          onSelectNote={(noteId, folderId) => {
            setActiveNoteId(noteId);
            setActiveFolderId(folderId);
            navigateToNote(noteId);
          }}
          onToggleFolder={onToggleFolder}
          onToggleFavorite={(noteId, next) =>
            void patchNote(noteId, { isFavorite: next })
          }
        />
      ) : null}

      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        notes={notes}
        onSelectNote={(noteId, folderId) => {
          setActiveNoteId(noteId);
          setActiveFolderId(folderId);
          navigateToNote(noteId);
        }}
        onCreateNote={() => void createNote()}
        onCreateFolder={() => void createFolder()}
      />

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
          {isSidebarCollapsed ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Open sidebar"
            >
              <Menu className="size-4" />
            </button>
          ) : null}
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
