"use client";

import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NoteFolderRecord, NoteRecord } from "@/lib/notes-contracts";
import { parseIconValue } from "./emoji-picker";

type PageTreeProps = {
  activeNoteId: string | null;
  activeFolderId: string | null;
  expandedFolderIds: string[];
  folders: NoteFolderRecord[];
  notes: NoteRecord[];
  deletingFolderId: string | null;
  deletingNoteId: string | null;
  onCreateNote: (folderId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameFolder: (folderId: string, nextName: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onSelectNote: (noteId: string, folderId: string | null) => void;
  onToggleFolder: (folderId: string) => void;
  onToggleFavorite: (noteId: string, next: boolean) => void;
};

export function PageTree({
  activeNoteId,
  activeFolderId,
  expandedFolderIds,
  folders,
  notes,
  deletingFolderId,
  deletingNoteId,
  onCreateNote,
  onDeleteFolder,
  onDeleteNote,
  onRenameFolder,
  onSelectFolder,
  onSelectNote,
  onToggleFolder,
  onToggleFavorite,
}: PageTreeProps) {
  const rootNotes = notes.filter((n) => !n.folderId && !n.isArchived);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingFolderId) return;
    folderInputRef.current?.focus();
    folderInputRef.current?.select();
  }, [editingFolderId]);

  const submitFolderRename = (folderId: string) => {
    const next = folderNameInput.trim();
    if (next) onRenameFolder(folderId, next);
    setEditingFolderId(null);
    setFolderNameInput("");
  };

  return (
    <div className="space-y-0.5">
      {rootNotes.map((note) => (
        <NoteRow
          key={note.id}
          note={note}
          active={note.id === activeNoteId}
          deleting={deletingNoteId === note.id}
          onSelect={() => onSelectNote(note.id, null)}
          onDelete={() => onDeleteNote(note.id)}
          onToggleFavorite={() => onToggleFavorite(note.id, !note.isFavorite)}
        />
      ))}

      {folders.map((folder) => {
        const expanded = expandedFolderIds.includes(folder.id);
        const folderNotes = notes.filter(
          (n) => n.folderId === folder.id && !n.isArchived,
        );
        const isEditing = editingFolderId === folder.id;

        return (
          <div key={folder.id}>
            <ContextMenu>
              <ContextMenuTrigger
                className={`group flex items-center gap-1 rounded-sm px-1.5 py-1 transition ${
                  activeFolderId === folder.id
                    ? "bg-sidebar-accent"
                    : "hover:bg-sidebar-accent"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleFolder(folder.id)}
                  aria-label={expanded ? "Collapse" : "Expand"}
                  className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
                >
                  {expanded ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </button>
                <Folder className="size-3.5 shrink-0 text-muted-foreground" />

                {isEditing ? (
                  <input
                    ref={folderInputRef}
                    type="text"
                    value={folderNameInput}
                    onBlur={() => submitFolderRename(folder.id)}
                    onChange={(e) => setFolderNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitFolderRename(folder.id);
                      if (e.key === "Escape") {
                        setEditingFolderId(null);
                        setFolderNameInput("");
                      }
                    }}
                    className="min-w-0 flex-1 rounded border border-border bg-background px-1 py-0.5 text-sm text-foreground outline-none focus:border-ring"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.id)}
                    onDoubleClick={() => {
                      setEditingFolderId(folder.id);
                      setFolderNameInput(folder.name);
                    }}
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium text-sidebar-foreground/80"
                  >
                    {folder.name}
                  </button>
                )}

                <RowActions
                  onAdd={() => onCreateNote(folder.id)}
                  addLabel="Add page inside"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingFolderId(folder.id);
                      setFolderNameInput(folder.name);
                    }}
                  >
                    <Pencil className="size-4" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCreateNote(folder.id)}>
                    <Plus className="size-4" /> Add page
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteFolder(folder.id)}
                    disabled={deletingFolderId === folder.id}
                    variant="destructive"
                  >
                    <Trash2 className="size-4" /> Delete folder
                  </DropdownMenuItem>
                </RowActions>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => {
                    setEditingFolderId(folder.id);
                    setFolderNameInput(folder.name);
                  }}
                >
                  <Pencil className="size-4" /> Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCreateNote(folder.id)}>
                  <Plus className="size-4" /> Add page
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => onDeleteFolder(folder.id)}
                  variant="destructive"
                >
                  <Trash2 className="size-4" /> Delete folder
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {expanded ? (
              <div className="ml-4 border-l border-sidebar-border pl-1.5">
                {folderNotes.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    No pages inside
                  </p>
                ) : (
                  folderNotes.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      active={note.id === activeNoteId}
                      deleting={deletingNoteId === note.id}
                      onSelect={() => onSelectNote(note.id, folder.id)}
                      onDelete={() => onDeleteNote(note.id)}
                      onToggleFavorite={() =>
                        onToggleFavorite(note.id, !note.isFavorite)
                      }
                    />
                  ))
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function NoteRow({
  note,
  active,
  deleting,
  onSelect,
  onDelete,
  onToggleFavorite,
}: {
  note: NoteRecord;
  active: boolean;
  deleting: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}) {
  const icon = parseIconValue(note.icon);
  return (
    <ContextMenu>
      <ContextMenuTrigger
        className={`group flex items-center gap-1 rounded-sm px-1.5 py-1 transition ${
          active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          {icon ? (
            <span className="text-sm leading-none">{icon.value}</span>
          ) : (
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm text-sidebar-foreground/85">
            {note.title || "Untitled"}
          </span>
        </button>

        <RowActions
          onAdd={() => onToggleFavorite()}
          addLabel={note.isFavorite ? "Unfavorite" : "Favorite"}
          addIcon={
            note.isFavorite ? (
              <StarOff className="size-3.5" />
            ) : (
              <Star className="size-3.5" />
            )
          }
        >
          <DropdownMenuItem onClick={onToggleFavorite}>
            {note.isFavorite ? (
              <>
                <StarOff className="size-4" /> Unfavorite
              </>
            ) : (
              <>
                <Star className="size-4" /> Favorite
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(note.title || "Untitled");
            }}
          >
            <Copy className="size-4" /> Copy title
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            disabled={deleting}
            variant="destructive"
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </RowActions>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onToggleFavorite}>
          {note.isFavorite ? (
            <>
              <StarOff className="size-4" /> Unfavorite
            </>
          ) : (
            <>
              <Star className="size-4" /> Favorite
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} variant="destructive">
          <Trash2 className="size-4" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function RowActions({
  onAdd,
  addLabel,
  addIcon,
  children,
}: {
  onAdd: () => void;
  addLabel: string;
  addIcon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More actions"
          onClick={(e) => e.stopPropagation()}
          className="grid size-5 place-items-center rounded text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
        >
          <MoreHorizontal className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="w-48">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          aria-label={addLabel}
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="grid size-5 place-items-center rounded text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
        >
          {addIcon ?? <Plus className="size-3.5" />}
        </TooltipTrigger>
        <TooltipContent side="top">{addLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
}
