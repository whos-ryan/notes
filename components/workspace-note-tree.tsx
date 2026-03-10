import { useEffect, useRef, useState } from "react";
import type { NoteFolderRecord, NoteRecord } from "@/lib/notes-contracts";

type WorkspaceNoteTreeProps = {
  activeNoteId: string | null;
  activeFolderId: string | null;
  deletingFolderId: string | null;
  deletingNoteId: string | null;
  expandedFolderIds: string[];
  folders: NoteFolderRecord[];
  notes: NoteRecord[];
  onCreateNote: (folderId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameFolder: (folderId: string, nextName: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onSelectNote: (noteId: string, folderId: string | null) => void;
  onToggleFolder: (folderId: string) => void;
};

export function WorkspaceNoteTree({
  activeNoteId,
  activeFolderId,
  deletingFolderId,
  deletingNoteId,
  expandedFolderIds,
  folders,
  notes,
  onCreateNote,
  onDeleteFolder,
  onDeleteNote,
  onRenameFolder,
  onSelectFolder,
  onSelectNote,
  onToggleFolder,
}: WorkspaceNoteTreeProps) {
  const rootNotes = notes.filter((item) => !item.folderId);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingFolderId) {
      return;
    }

    const currentFolder = folders.find(
      (folder) => folder.id === editingFolderId,
    );

    if (!currentFolder) {
      setEditingFolderId(null);
      setFolderNameInput("");
    }
  }, [editingFolderId, folders]);

  useEffect(() => {
    if (!editingFolderId) {
      return;
    }

    folderInputRef.current?.focus();
    folderInputRef.current?.select();
  }, [editingFolderId]);

  const startEditingFolder = (folder: NoteFolderRecord) => {
    setEditingFolderId(folder.id);
    setFolderNameInput(folder.name);
  };

  const stopEditingFolder = () => {
    setEditingFolderId(null);
    setFolderNameInput("");
  };

  const submitFolderRename = (folderId: string) => {
    const nextName = folderNameInput.trim();

    if (!nextName) {
      stopEditingFolder();
      return;
    }

    onRenameFolder(folderId, nextName);
    stopEditingFolder();
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onSelectFolder(null)}
        className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition ${
          activeFolderId === null
            ? "bg-white/10 text-foreground"
            : "text-muted hover:bg-white/5 hover:text-foreground"
        }`}
      >
        <span className="text-xs text-muted">root</span>
      </button>

      {rootNotes.map((item) => (
        <div
          key={item.id}
          className="group relative ml-3 border-l border-white/10 pl-3"
        >
          <button
            type="button"
            onClick={() => onSelectNote(item.id, null)}
            className={`w-full rounded-xl px-2 py-1.5 pr-12 text-left text-sm transition ${
              item.id === activeNoteId
                ? "bg-white/10 text-foreground"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <p className="truncate font-medium">{item.title || "Untitled"}</p>
          </button>
          <button
            type="button"
            disabled={deletingNoteId === item.id}
            onClick={() => onDeleteNote(item.id)}
            className="pointer-events-none invisible absolute right-1 top-1/2 -translate-y-1/2 rounded-lg border border-white/15 px-2 py-1 text-xs text-red-300 opacity-0 transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 hover:bg-red-500/10 disabled:pointer-events-auto disabled:visible disabled:opacity-100"
          >
            {deletingNoteId === item.id ? "..." : "Del"}
          </button>
        </div>
      ))}

      {folders.map((folder) => {
        const isExpanded = expandedFolderIds.includes(folder.id);
        const folderNotes = notes.filter((item) => item.folderId === folder.id);

        return (
          <div key={folder.id} className="space-y-1">
            <div
              className={`group flex items-center gap-1 rounded-xl px-2 py-1.5 transition ${
                activeFolderId === folder.id
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleFolder(folder.id)}
                className="w-4 shrink-0 text-xs text-muted hover:text-foreground"
                aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
              >
                {isExpanded ? "v" : ">"}
              </button>
              {editingFolderId === folder.id ? (
                <input
                  ref={folderInputRef}
                  type="text"
                  value={folderNameInput}
                  onBlur={() => submitFolderRename(folder.id)}
                  onChange={(event) => setFolderNameInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      submitFolderRename(folder.id);
                    }

                    if (event.key === "Escape") {
                      stopEditingFolder();
                    }
                  }}
                  className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm text-foreground outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectFolder(folder.id)}
                  className={`min-w-0 flex-1 truncate text-left text-sm font-medium transition ${
                    activeFolderId === folder.id
                      ? "text-foreground"
                      : "text-muted group-hover:text-foreground"
                  }`}
                >
                  {folder.name}
                </button>
              )}
              <button
                type="button"
                onClick={() => startEditingFolder(folder)}
                className="rounded-md px-1.5 py-0.5 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-foreground"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={deletingFolderId === folder.id}
                onClick={() => onDeleteFolder(folder.id)}
                className="rounded-md px-1.5 py-0.5 text-xs text-red-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 disabled:opacity-100"
              >
                {deletingFolderId === folder.id ? "..." : "Del"}
              </button>
              <button
                type="button"
                onClick={() => onCreateNote(folder.id)}
                className="rounded-md px-1.5 py-0.5 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-foreground"
              >
                +
              </button>
            </div>

            {isExpanded ? (
              <div className="ml-3 space-y-1 border-l border-white/10 pl-3">
                {folderNotes.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted">No notes yet</p>
                ) : null}
                {folderNotes.map((item) => (
                  <div key={item.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelectNote(item.id, folder.id)}
                      className={`w-full rounded-xl px-2 py-1.5 pr-12 text-left text-sm transition ${
                        item.id === activeNoteId
                          ? "bg-white/10 text-foreground"
                          : "text-muted hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <p className="truncate font-medium">
                        {item.title || "Untitled"}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={deletingNoteId === item.id}
                      onClick={() => onDeleteNote(item.id)}
                      className="pointer-events-none invisible absolute right-1 top-1/2 -translate-y-1/2 rounded-lg border border-white/15 px-2 py-1 text-xs text-red-300 opacity-0 transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 hover:bg-red-500/10 disabled:pointer-events-auto disabled:visible disabled:opacity-100"
                    >
                      {deletingNoteId === item.id ? "..." : "Del"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
