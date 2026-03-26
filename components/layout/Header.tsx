"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon, Monitor, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MobileNav } from "./MobileNav";

export const Header = () => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const cycle: Record<string, "light" | "dark" | "system"> = {
      light: "dark",
      dark: "system",
      system: "light",
    };
    setTheme(cycle[theme]);
  };

  const ThemeIcon =
    theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 lg:px-6">
      {/* Mobile nav trigger */}
      <MobileNav />

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleTheme}
          aria-label="Toggle theme"
          className="h-8 w-8 p-0"
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Notifications"
          className="h-8 w-8 p-0"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};
