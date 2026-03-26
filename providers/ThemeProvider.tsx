"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "finance-app-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(t: Theme) {
      const resolved = t === "system" ? (prefersDark.matches ? "dark" : "light") : t;
      setResolvedTheme(resolved);
      root.classList.toggle("dark", resolved === "dark");
    }

    applyTheme(theme);

    if (theme === "system") {
      prefersDark.addEventListener("change", () => applyTheme("system"));
      return () => prefersDark.removeEventListener("change", () => applyTheme("system"));
    }
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
