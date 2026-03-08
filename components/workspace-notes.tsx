"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LandingProfileMenu } from "@/components/landing-profile-menu";

type NoteRecord = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceNotesProps = {
  profileLabel: string;
  profileImage: string | null;
};

export function WorkspaceNotes({
  profileLabel,
  profileImage,
}: WorkspaceNotesProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const data = (await response.json()) as { note: NoteRecord };
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

      const data = (await response.json()) as { notes: NoteRecord[] };
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

  return (
    <>
      <aside
        className={`flex flex-col border-r border-white/10 bg-surface/70 ${
          isSidebarCollapsed ? "hidden md:hidden" : ""
        }`}
      >
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Workspace
          </p>
          <h1 className="mt-1 font-sans text-base font-semibold">notes.os</h1>
        </div>

        <div className="border-b border-white/10 p-3">
          <button
            type="button"
            disabled={isCreating}
            onClick={() => void createNote({ silent: false })}
            className="w-full border border-white/15 px-3 py-2 text-sm text-foreground transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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
              {notes.map((item) =>
                (() => {
                  const firstLine =
                    item.content.split(/\r?\n/)[0]?.trim() || "Empty note";

                  return (
                    <div key={item.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => setActiveNoteId(item.id)}
                        className={`w-full border px-3 py-2 pr-12 text-left text-sm transition ${
                          item.id === activeNoteId
                            ? "border-white/30 bg-white/10 text-foreground"
                            : "border-white/10 text-muted hover:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        <p className="truncate font-medium">
                          {item.title || "Untitled"}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {firstLine}
                        </p>
                      </button>
                      <button
                        type="button"
                        disabled={deletingNoteId === item.id}
                        onClick={() => void deleteNote(item.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 border border-white/15 px-2 py-1 text-xs text-red-300 opacity-0 transition hover:bg-red-500/10 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
                      >
                        {deletingNoteId === item.id ? "..." : "Del"}
                      </button>
                    </div>
                  );
                })(),
              )}
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
      </aside>

      <section
        className={`flex min-w-0 flex-col bg-background/90 ${
          isSidebarCollapsed ? "md:col-span-2" : ""
        }`}
      >
        <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            className="border border-white/15 px-2 py-1 text-xs text-muted transition hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <p className="text-sm text-muted">
            Workspace / {activeNote?.title || "Untitled"}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <LandingProfileMenu
              profileLabel={profileLabel}
              image={profileImage}
            />
          </div>
        </header>

        <article className="w-full flex-1 px-4 py-6 md:px-6 md:py-8">
          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

          <input
            aria-label="Note title"
            placeholder="Untitled"
            value={activeNote?.title ?? ""}
            onChange={(event) =>
              updateActiveNote({ title: event.target.value })
            }
            disabled={!activeNote}
            className="mb-6 w-full bg-transparent font-sans text-4xl font-semibold text-foreground outline-none placeholder:text-foreground/35 disabled:opacity-50"
          />
          <textarea
            aria-label="Note content"
            placeholder="Start typing your notes..."
            value={activeNote?.content ?? ""}
            onChange={(event) =>
              updateActiveNote({ content: event.target.value })
            }
            disabled={!activeNote}
            className="min-h-[62vh] w-full resize-none bg-transparent text-base leading-8 text-foreground/95 outline-none placeholder:text-muted disabled:opacity-50"
          />
        </article>
      </section>
    </>
  );
}
