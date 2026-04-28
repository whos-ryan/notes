"use client";

import type { Editor } from "@tiptap/react";
import {
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SlashCommand = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords: string[];
  run: (editor: Editor) => void;
};

const COMMANDS: SlashCommand[] = [
  {
    id: "text",
    label: "Text",
    hint: "Plain paragraph",
    icon: <Type className="size-4" />,
    keywords: ["text", "paragraph", "p"],
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: "h1",
    label: "Heading 1",
    hint: "Large section heading",
    icon: <Heading1 className="size-4" />,
    keywords: ["heading", "h1", "title"],
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    label: "Heading 2",
    hint: "Medium section heading",
    icon: <Heading2 className="size-4" />,
    keywords: ["heading", "h2", "subtitle"],
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "Heading 3",
    hint: "Small section heading",
    icon: <Heading3 className="size-4" />,
    keywords: ["heading", "h3"],
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    label: "Bulleted list",
    hint: "Simple bulleted list",
    icon: <List className="size-4" />,
    keywords: ["list", "bullet", "ul"],
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "ordered",
    label: "Numbered list",
    hint: "List with numbers",
    icon: <ListOrdered className="size-4" />,
    keywords: ["list", "numbered", "ordered", "ol"],
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "task",
    label: "To-do list",
    hint: "Track tasks with a checklist",
    icon: <CheckSquare className="size-4" />,
    keywords: ["task", "todo", "checkbox", "checklist"],
    run: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: "quote",
    label: "Quote",
    hint: "Block quote",
    icon: <Quote className="size-4" />,
    keywords: ["quote", "blockquote"],
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code",
    label: "Code block",
    hint: "Syntax-highlighted code",
    icon: <Code2 className="size-4" />,
    keywords: ["code", "snippet", "pre"],
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    hint: "Visual separator",
    icon: <Minus className="size-4" />,
    keywords: ["divider", "separator", "horizontal", "rule", "hr"],
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "image",
    label: "Image",
    hint: "Upload from device",
    icon: <ImageIcon className="size-4" />,
    keywords: ["image", "picture", "photo", "img"],
    run: (e) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") return;
          e.chain().focus().setImage({ src: result }).run();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
  },
];

type SlashMenuProps = {
  editor: Editor | null;
};

export function EditorSlashMenu({ editor }: SlashMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerPosRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.includes(q)),
    );
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setPosition(null);
    setActiveIndex(0);
    triggerPosRef.current = null;
  }, []);

  const runCommand = useCallback(
    (cmd: SlashCommand) => {
      if (!editor) return;
      const triggerPos = triggerPosRef.current;
      if (triggerPos !== null) {
        const to = editor.state.selection.from;
        editor.chain().focus().deleteRange({ from: triggerPos, to }).run();
      }
      cmd.run(editor);
      close();
    },
    [close, editor],
  );

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      const sel = editor.state.selection;
      const view = editor.view;
      const coords = view.coordsAtPos(sel.from);
      setPosition({ top: coords.bottom + 4, left: coords.left });
    };

    const onSelectionUpdate = () => {
      if (!open) return;
      const sel = editor.state.selection;
      if (triggerPosRef.current === null) return;
      const text = editor.state.doc.textBetween(
        triggerPosRef.current,
        sel.from,
        " ",
      );
      if (!text.startsWith("/")) {
        close();
        return;
      }
      setQuery(text.slice(1));
      updatePosition();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !open) {
        const sel = editor.state.selection;
        const before = editor.state.doc.textBetween(
          Math.max(0, sel.from - 1),
          sel.from,
          " ",
        );
        if (before === "" || /\s/.test(before)) {
          requestAnimationFrame(() => {
            triggerPosRef.current = editor.state.selection.from;
            setOpen(true);
            setActiveIndex(0);
            updatePosition();
          });
        }
        return;
      }

      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        const cmd = filtered[activeIndex];
        if (cmd) {
          event.preventDefault();
          runCommand(cmd);
        }
        return;
      }
    };

    const dom = editor.view.dom as HTMLElement;
    dom.addEventListener("keydown", onKeyDown);
    editor.on("selectionUpdate", onSelectionUpdate);
    editor.on("update", onSelectionUpdate);

    return () => {
      dom.removeEventListener("keydown", onKeyDown);
      editor.off("selectionUpdate", onSelectionUpdate);
      editor.off("update", onSelectionUpdate);
    };
  }, [activeIndex, close, editor, filtered, open, runCommand]);

  useEffect(() => {
    void filtered.length;
    setActiveIndex(0);
  }, [filtered]);

  if (!open || !position) return null;

  return (
    <div
      ref={containerRef}
      role="listbox"
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 max-h-72 w-72 overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/5"
    >
      {filtered.length === 0 ? (
        <div className="px-2 py-2 text-sm text-muted-foreground">
          No matches
        </div>
      ) : (
        filtered.map((cmd, idx) => (
          <button
            key={cmd.id}
            type="button"
            role="option"
            aria-selected={idx === activeIndex}
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseDown={(e) => {
              e.preventDefault();
              runCommand(cmd);
            }}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition ${
              idx === activeIndex
                ? "bg-accent text-foreground"
                : "text-foreground/90 hover:bg-accent"
            }`}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded border border-border bg-background text-muted-foreground">
              {cmd.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{cmd.label}</span>
              {cmd.hint ? (
                <span className="truncate text-xs text-muted-foreground">
                  {cmd.hint}
                </span>
              ) : null}
            </span>
          </button>
        ))
      )}
    </div>
  );
}
