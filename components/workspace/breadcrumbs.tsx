"use client";

import { ChevronRight } from "lucide-react";
import type { NoteFolderRecord, NoteRecord } from "@/lib/notes-contracts";

type BreadcrumbsProps = {
  note: NoteRecord | null;
  folders: NoteFolderRecord[];
  onSelectFolder?: (folderId: string | null) => void;
};

export function Breadcrumbs({
  note,
  folders,
  onSelectFolder,
}: BreadcrumbsProps) {
  if (!note) {
    return <div className="h-4" />;
  }

  const folder = folders.find((f) => f.id === note.folderId);
  const icon = parseIcon(note.icon);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-h-4 items-center gap-1 text-sm text-muted-foreground"
    >
      {folder ? (
        <>
          <button
            type="button"
            onClick={() => onSelectFolder?.(folder.id)}
            className="rounded px-1 py-0.5 transition hover:bg-sidebar-accent hover:text-foreground"
          >
            {folder.name}
          </button>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
        </>
      ) : null}
      <span className="flex items-center gap-1.5 truncate text-foreground/80">
        {icon ? <span className="text-base leading-none">{icon}</span> : null}
        <span className="truncate">{note.title || "Untitled"}</span>
      </span>
    </nav>
  );
}

function parseIcon(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { type?: string; value?: string };
    if (parsed?.type === "emoji" && typeof parsed.value === "string") {
      return parsed.value;
    }
  } catch {
    // raw legacy emoji
    return raw;
  }
  return null;
}
