"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  FilePlus,
  FolderPlus,
  Search,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NoteFolderRecord, NoteRecord } from "@/lib/notes-contracts";
import { parseIconValue } from "./emoji-picker";
import { PageTree } from "./page-tree";
import { ThemeToggle } from "./theme-toggle";

type WorkspaceSidebarProps = {
  profileLabel: string;
  profileImage: string | null;
  width: number;
  onCollapse: () => void;
  onResizeStart: (event: React.MouseEvent) => void;
  onOpenCommandPalette: () => void;
  onOpenSettings?: () => void;
  // tree props
  activeNoteId: string | null;
  activeFolderId: string | null;
  expandedFolderIds: string[];
  folders: NoteFolderRecord[];
  notes: NoteRecord[];
  deletingFolderId: string | null;
  deletingNoteId: string | null;
  isCreating: boolean;
  isCreatingFolder: boolean;
  onCreateNote: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameFolder: (folderId: string, nextName: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onSelectNote: (noteId: string, folderId: string | null) => void;
  onToggleFolder: (folderId: string) => void;
  onToggleFavorite: (noteId: string, next: boolean) => void;
};

export function WorkspaceSidebar(props: WorkspaceSidebarProps) {
  const {
    profileLabel,
    profileImage,
    width,
    onCollapse,
    onResizeStart,
    onOpenCommandPalette,
    onOpenSettings,
    notes,
    isCreating,
    isCreatingFolder,
    onCreateNote,
    onCreateFolder,
    onSelectNote,
  } = props;

  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [privateOpen, setPrivateOpen] = useState(true);

  const favorites = notes.filter((n) => n.isFavorite && !n.isArchived);
  const initials = profileLabel.slice(0, 2).toUpperCase();

  return (
    <aside
      style={{ width }}
      className="relative flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar className="size-6 rounded-md">
          {profileImage ? (
            <AvatarImage src={profileImage} alt={profileLabel} />
          ) : null}
          <AvatarFallback className="rounded-md bg-sidebar-primary text-[10px] font-medium text-sidebar-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {profileLabel}'s notes
        </span>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger
            aria-label="Collapse sidebar"
            onClick={onCollapse}
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
          >
            <ChevronsLeft className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Collapse sidebar</TooltipContent>
        </Tooltip>
      </div>

      {/* Quick actions */}
      <div className="px-2 pb-2 space-y-0.5">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent"
        >
          <Search className="size-3.5 text-muted-foreground" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border border-sidebar-border bg-background/50 px-1 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => onCreateNote(null)}
          disabled={isCreating}
          className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent disabled:opacity-50"
        >
          <FilePlus className="size-3.5 text-muted-foreground" />
          <span className="flex-1 text-left">
            {isCreating ? "Creating…" : "New page"}
          </span>
        </button>
        <Link
          href="/workspace/calendar"
          className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent"
        >
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <span className="flex-1">Calendar</span>
        </Link>
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent"
          >
            <Settings className="size-3.5 text-muted-foreground" />
            <span className="flex-1 text-left">Settings</span>
          </button>
        ) : null}
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1 px-2 pb-3">
        {favorites.length > 0 ? (
          <Collapsible
            open={favoritesOpen}
            onOpenChange={setFavoritesOpen}
            className="mb-1"
          >
            <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded-sm px-1.5 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground transition hover:bg-sidebar-accent">
              {favoritesOpen ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              <span>Favorites</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 pt-0.5">
              {favorites.map((n) => (
                <FavoriteRow
                  key={n.id}
                  note={n}
                  active={props.activeNoteId === n.id}
                  onSelect={() => onSelectNote(n.id, n.folderId)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        <Collapsible open={privateOpen} onOpenChange={setPrivateOpen}>
          <div className="group flex items-center gap-1 px-1.5 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CollapsibleTrigger className="flex flex-1 items-center gap-1 rounded-sm transition hover:text-foreground">
              {privateOpen ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              <span>Private</span>
            </CollapsibleTrigger>
            <Tooltip>
              <TooltipTrigger
                aria-label="New folder"
                onClick={onCreateFolder}
                disabled={isCreatingFolder}
                className="grid size-5 place-items-center rounded text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-sidebar-accent hover:text-foreground disabled:opacity-50"
              >
                <FolderPlus className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">New folder</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                aria-label="New page"
                onClick={() => onCreateNote(null)}
                disabled={isCreating}
                className="grid size-5 place-items-center rounded text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-sidebar-accent hover:text-foreground disabled:opacity-50"
              >
                <FilePlus className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">New page</TooltipContent>
            </Tooltip>
          </div>
          <CollapsibleContent className="pt-0.5">
            <PageTree {...props} />
          </CollapsibleContent>
        </Collapsible>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-1.5">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-sm text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-foreground"
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
          <span className="flex-1 text-left">Trash</span>
        </button>
      </div>

      {/* Resize handle */}
      <button
        type="button"
        aria-label="Resize sidebar"
        onMouseDown={onResizeStart}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent transition hover:bg-sidebar-primary/30"
      />
    </aside>
  );
}

function FavoriteRow({
  note,
  active,
  onSelect,
}: {
  note: NoteRecord;
  active: boolean;
  onSelect: () => void;
}) {
  const icon = parseIconValue(note.icon);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left text-sm transition ${
        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
      }`}
    >
      {icon ? (
        <span className="text-sm leading-none">{icon.value}</span>
      ) : (
        <Star className="size-3.5 fill-amber-400 text-amber-400" />
      )}
      <span className="truncate text-sidebar-foreground/85">
        {note.title || "Untitled"}
      </span>
    </button>
  );
}
