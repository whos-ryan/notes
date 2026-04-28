"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { useEffect, useMemo, useRef } from "react";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { EditorSlashMenu } from "./editor-slash-menu";

const lowlight = createLowlight(common);

type NoteEditorProps = {
  noteId: string | null;
  initialContent: string;
  onChange: (content: string) => void;
  editable?: boolean;
};

export function NoteEditor({
  noteId,
  initialContent,
  onChange,
  editable = true,
}: NoteEditorProps) {
  const initial = useMemo(() => parseContent(initialContent), [initialContent]);
  const onChangeRef = useRef(onChange);
  const noteIdRef = useRef<string | null>(null);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return "Heading";
          return "Press '/' for commands";
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      Highlight.configure({ multicolor: false }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "rounded-lg my-3 max-w-full" },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class:
            "rounded-md bg-muted px-3 py-2 font-mono text-[13px] leading-6 my-3",
        },
      }),
    ],
    content: initial,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-tiptap min-h-[60vh] w-full max-w-none focus:outline-none text-[16px] leading-[1.65] text-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      onChangeRef.current(json);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (noteIdRef.current === noteId) return;
    noteIdRef.current = noteId;
    const next = parseContent(initialContent);
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, initialContent, noteId]);

  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  if (!editor) {
    return (
      <div className="min-h-[60vh] text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="relative">
      <EditorBubbleMenu editor={editor} />
      <EditorSlashMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function parseContent(raw: string): string | object {
  if (!raw || !raw.trim()) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as object;
    } catch {
      // fall through to HTML
    }
  }
  return raw;
}
