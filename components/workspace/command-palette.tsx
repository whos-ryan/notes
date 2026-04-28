"use client";

import {
  CalendarDays,
  FilePlus2,
  FileText,
  FolderPlus,
  Moon,
  Star,
  Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { NoteRecord } from "@/lib/notes-contracts";
import { parseIconValue } from "./emoji-picker";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: NoteRecord[];
  onSelectNote: (noteId: string, folderId: string | null) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  notes,
  onSelectNote,
  onCreateNote,
  onCreateFolder,
}: CommandPaletteProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const recentNotes = notes.slice(0, 12);
  const favorites = notes.filter((n) => n.isFavorite).slice(0, 8);

  const close = () => onOpenChange(false);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Jump to a page or run a command"
    >
      <CommandInput placeholder="Search pages, run commands…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              close();
              onCreateNote();
            }}
          >
            <FilePlus2 className="size-4" />
            <span>New page</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              close();
              onCreateFolder();
            }}
          >
            <FolderPlus className="size-4" />
            <span>New folder</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              close();
              router.push("/workspace/calendar");
            }}
          >
            <CalendarDays className="size-4" />
            <span>Open calendar</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              close();
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span>
              Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme
            </span>
          </CommandItem>
        </CommandGroup>

        {favorites.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Favorites">
              {favorites.map((n) => (
                <NoteCommandItem
                  key={n.id}
                  note={n}
                  onSelect={() => {
                    close();
                    onSelectNote(n.id, n.folderId);
                  }}
                />
              ))}
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Recent">
          {recentNotes.map((n) => (
            <NoteCommandItem
              key={n.id}
              note={n}
              onSelect={() => {
                close();
                onSelectNote(n.id, n.folderId);
              }}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function NoteCommandItem({
  note,
  onSelect,
}: {
  note: NoteRecord;
  onSelect: () => void;
}) {
  const icon = parseIconValue(note.icon);
  return (
    <CommandItem onSelect={onSelect} value={`${note.title} ${note.id}`}>
      {icon ? (
        <span className="text-base leading-none">{icon.value}</span>
      ) : (
        <FileText className="size-4 text-muted-foreground" />
      )}
      <span className="truncate">{note.title || "Untitled"}</span>
      {note.isFavorite ? (
        <Star className="ml-auto size-3.5 fill-current text-amber-400" />
      ) : null}
    </CommandItem>
  );
}
