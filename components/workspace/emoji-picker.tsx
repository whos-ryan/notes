"use client";

import { Smile, X } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_GROUPS: Array<{ label: string; emojis: string[] }> = [
  {
    label: "Recent",
    emojis: ["📝", "📄", "📚", "💡", "✨", "🔥", "⭐", "✅", "❤️", "🚀"],
  },
  {
    label: "Objects",
    emojis: [
      "📝",
      "📄",
      "📃",
      "📑",
      "📊",
      "📈",
      "📉",
      "📌",
      "📍",
      "📎",
      "📚",
      "📖",
      "📓",
      "📔",
      "📒",
      "📕",
      "📗",
      "📘",
      "📙",
      "💼",
      "📁",
      "📂",
      "🗂️",
      "🗃️",
      "🗄️",
      "📥",
      "📤",
      "✏️",
      "🖊️",
      "🖋️",
      "🖌️",
      "🖍️",
      "🔍",
      "🔎",
      "🔒",
      "🔓",
    ],
  },
  {
    label: "Smileys",
    emojis: [
      "😀",
      "😁",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "🤩",
      "🤔",
      "🤨",
      "😐",
      "😑",
      "😶",
      "🙄",
      "😏",
      "😒",
      "🙃",
      "😜",
    ],
  },
  {
    label: "Symbols",
    emojis: [
      "✨",
      "💡",
      "🔥",
      "⭐",
      "🌟",
      "⚡",
      "💥",
      "💫",
      "🎯",
      "🎉",
      "✅",
      "❌",
      "❓",
      "❗",
      "💯",
      "💢",
      "💬",
      "💭",
      "🗯️",
      "💤",
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
    ],
  },
  {
    label: "Activity",
    emojis: [
      "🚀",
      "🎨",
      "🎭",
      "🎮",
      "🎲",
      "🎸",
      "🎺",
      "🎻",
      "🎤",
      "🎧",
      "🏆",
      "🥇",
      "🏅",
      "🎽",
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🎾",
      "🏐",
    ],
  },
];

type IconValue = { type: "emoji"; value: string } | null;

type EmojiPickerProps = {
  value: IconValue;
  onChange: (next: IconValue) => void;
  size?: "sm" | "md" | "lg";
  align?: "start" | "center" | "end";
};

export function EmojiPicker({
  value,
  onChange,
  size = "md",
  align = "start",
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const sizeClass =
    size === "lg"
      ? "size-12 text-3xl"
      : size === "sm"
        ? "size-6 text-base"
        : "size-8 text-xl";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label="Pick page icon"
        className={`inline-flex shrink-0 items-center justify-center rounded-md leading-none transition hover:bg-sidebar-accent ${sizeClass}`}
      >
        {value?.value ? (
          <span>{value.value}</span>
        ) : (
          <Smile className="size-4 text-muted-foreground" />
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72 max-h-80 overflow-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Page icon
          </span>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <X className="size-3" /> Remove
            </button>
          ) : null}
        </div>
        <div className="space-y-3">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onChange({ type: "emoji", value: emoji });
                      setOpen(false);
                    }}
                    className="flex size-7 items-center justify-center rounded text-lg transition hover:bg-sidebar-accent"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function parseIconValue(raw: string | null): IconValue {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { type?: string; value?: string };
    if (parsed?.type === "emoji" && typeof parsed.value === "string") {
      return { type: "emoji", value: parsed.value };
    }
  } catch {
    return { type: "emoji", value: raw };
  }
  return null;
}

export function serializeIconValue(value: IconValue): string | null {
  if (!value) return null;
  return JSON.stringify(value);
}
