import type { NoteRecord } from "@/lib/notes-contracts";

type WorkspaceNoteListItemProps = {
  item: NoteRecord;
  isActive: boolean;
  isDeleting: boolean;
  onSelect: (noteId: string) => void;
  onDelete: (noteId: string) => void;
};

export function WorkspaceNoteListItem({
  item,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
}: WorkspaceNoteListItemProps) {
  const firstLine = item.content.split(/\r?\n/)[0]?.trim() || "Empty note";

  return (
    <div key={item.id} className="group relative">
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className={`w-full border px-3 py-2 pr-12 text-left text-sm transition ${
          isActive
            ? "border-white/30 bg-white/10 text-foreground"
            : "border-white/10 text-muted hover:bg-white/5 hover:text-foreground"
        }`}
      >
        <p className="truncate font-medium">{item.title || "Untitled"}</p>
        <p className="truncate text-xs text-muted">{firstLine}</p>
      </button>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => onDelete(item.id)}
        className="pointer-events-none invisible absolute right-2 top-1/2 -translate-y-1/2 border border-white/15 px-2 py-1 text-xs text-red-300 opacity-0 transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 hover:bg-red-500/10 disabled:pointer-events-auto disabled:visible disabled:opacity-100"
      >
        {isDeleting ? "..." : "Del"}
      </button>
    </div>
  );
}
