"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Code,
  Highlighter,
  Italic,
  Link as LinkIcon,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useCallback } from "react";

type EditorBubbleMenuProps = {
  editor: Editor | null;
};

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 rounded-md border border-border bg-popover px-1 py-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/5"
    >
      <BubbleButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <Bold className="size-3.5" />
      </BubbleButton>
      <BubbleButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <Italic className="size-3.5" />
      </BubbleButton>
      <BubbleButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <UnderlineIcon className="size-3.5" />
      </BubbleButton>
      <BubbleButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="Strike"
      >
        <Strikethrough className="size-3.5" />
      </BubbleButton>
      <BubbleButton
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        label="Highlight"
      >
        <Highlighter className="size-3.5" />
      </BubbleButton>
      <BubbleButton
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        label="Inline code"
      >
        <Code className="size-3.5" />
      </BubbleButton>
      <BubbleButton
        active={editor.isActive("link")}
        onClick={setLink}
        label="Link"
      >
        <LinkIcon className="size-3.5" />
      </BubbleButton>
    </BubbleMenu>
  );
}

function BubbleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded transition ${
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
