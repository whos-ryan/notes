"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LandingProfileMenu } from "@/components/landing-profile-menu";
import { WorkspaceNoteListItem } from "@/components/workspace-note-list-item";
import type {
  NoteRecord,
  NoteResponse,
  NotesListResponse,
} from "@/lib/notes-contracts";

type WorkspaceNotesProps = {
  profileLabel: string;
  profileImage: string | null;
};

export function WorkspaceNotes({
  profileLabel,
  profileImage,
}: WorkspaceNotesProps) {
  const minSidebarWidth = 240;
  const maxSidebarWidth = 320;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resizeStateRef = useRef<{
    startX: number;
    startWidth: number;
  } | null>(null);

  const activeNote = useMemo(
    () => notes.find((item) => item.id === activeNoteId) ?? null,
    [activeNoteId, notes],
  );

  const createNote = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsCreating(true);
    }
    setError(null);

    const response = await fetch("/api/notes", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Untitled",
        content: "",
      }),
    });

    if (!response.ok) {
      setError("Unable to create note.");
      if (!silent) {
        setIsCreating(false);
      }
      return null;
    }

    const data = (await response.json()) as NoteResponse;
    setNotes((current) => [data.note, ...current]);
    setActiveNoteId(data.note.id);

    if (!silent) {
      setIsCreating(false);
    }

    return data.note;
  }, []);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/notes", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setError("Unable to load notes.");
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as NotesListResponse;
      setNotes(data.notes);

      if (data.notes.length > 0) {
        setActiveNoteId(data.notes[0].id);
      } else {
        await createNote({ silent: true });
      }

      setIsLoading(false);
    })();
  }, [createNote]);

  useEffect(() => {
    if (!activeNote) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetch(`/api/notes/${activeNote.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: activeNote.title,
          content: activeNote.content,
        }),
      });
    }, 700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeNote]);

  const updateActiveNote = (
    input: Partial<Pick<NoteRecord, "title" | "content">>,
  ) => {
    if (!activeNoteId) {
      return;
    }

    setNotes((current) =>
      current.map((item) =>
        item.id === activeNoteId
          ? {
              ...item,
              ...input,
            }
          : item,
      ),
    );
  };

  const deleteNote = async (noteId: string) => {
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
        setActiveNoteId(filtered[0]?.id ?? null);
      }

      return filtered;
    });

    setDeletingNoteId(null);
  };

  const onSidebarResizeStart = (clientX: number) => {
    resizeStateRef.current = {
      startX: clientX,
      startWidth: sidebarWidth,
    };
  };

  const onToggleSidebar = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current || isSidebarCollapsed) {
        return;
      }

      const nextWidth =
        resizeStateRef.current.startWidth +
        (event.clientX - resizeStateRef.current.startX);

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

  return (
    <div className="flex min-h-screen w-full border border-white/10 bg-black/15">
      <aside
        style={{
          width: isSidebarCollapsed ? 0 : sidebarWidth,
        }}
        className={`relative flex h-screen shrink-0 flex-col border-r border-white/10 bg-surface/70 transition-[width] duration-200 ${
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
          <button
            type="button"
            disabled={isCreating}
            onClick={() => void createNote({ silent: false })}
            className="w-full border border-white/15 px-3 py-2 text-sm font-medium text-foreground transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "New note"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <p className="text-sm text-muted">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((item) => {
                return (
                  <WorkspaceNoteListItem
                    key={item.id}
                    item={item}
                    isActive={item.id === activeNoteId}
                    isDeleting={deletingNoteId === item.id}
                    onSelect={setActiveNoteId}
                    onDelete={(noteId) => void deleteNote(noteId)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="block w-full border border-white/10 px-3 py-2 text-center text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
          >
            Back to landing
          </Link>
        </div>

        {!isSidebarCollapsed ? (
          <button
            type="button"
            onMouseDown={(event) => onSidebarResizeStart(event.clientX)}
            className="absolute right-0 top-0 h-full w-[6px] translate-x-1/2 cursor-col-resize bg-transparent"
            aria-label="Resize sidebar"
          />
        ) : null}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-background/90">
        <header className="flex h-[62px] items-center gap-3 border-b border-white/10 px-6">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="border border-white/15 p-2 text-muted transition hover:text-foreground"
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
            Workspace / {activeNote?.title || "Untitled"}
          </p>
          <div className="ml-auto">
            <LandingProfileMenu
              profileLabel={profileLabel}
              image={profileImage}
            />
          </div>
        </header>

        <article className="w-full flex-1 px-6 py-8">
          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

          <input
            aria-label="Note title"
            placeholder="Untitled"
            value={activeNote?.title ?? ""}
            onChange={(event) =>
              updateActiveNote({ title: event.target.value })
            }
            disabled={!activeNote}
            className="mb-8 w-full bg-transparent font-sans text-6xl font-semibold leading-tight text-foreground outline-none placeholder:text-foreground/35 disabled:opacity-50"
          />

          <textarea
            aria-label="Note content"
            placeholder="Start typing your notes..."
            value={activeNote?.content ?? ""}
            onChange={(event) =>
              updateActiveNote({ content: event.target.value })
            }
            disabled={!activeNote}
            className="min-h-[62vh] w-full resize-none bg-transparent text-[32px] leading-[1.5] text-foreground/95 outline-none placeholder:text-muted disabled:opacity-50"
          />
        </article>
      </section>
    </div>
  );
}
