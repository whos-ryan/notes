"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
      >
        {mounted ? (
          isDark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )
        ) : (
          <Sun className="size-4 opacity-0" />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? "Light theme" : "Dark theme"}
      </TooltipContent>
    </Tooltip>
  );
}
