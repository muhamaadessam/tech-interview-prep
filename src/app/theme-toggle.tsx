"use client";

import { useEffect, useState } from "react";
import { themeKey } from "./site-config";
import { messages, type Locale } from "../i18n";

type Theme = "light" | "dark";

export function ThemeToggle({ locale = "ar" }: { locale?: Locale }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(themeKey);
    } catch {
      // Continue with the system preference when storage is unavailable.
    }
    const next: Theme = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(themeKey, next);
    } catch {
      // The current session still follows the selected theme.
    }
    setTheme(next);
  }

  const copy = messages[locale];
  return (
    <button className="theme-toggle icon-control" type="button" onClick={toggleTheme} aria-label={copy.theme} title={copy.theme} aria-pressed={theme === "dark"}>
      {theme === "dark" ? <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.5 15.3A8.5 8.5 0 0 1 8.7 3.5 8.5 8.5 0 1 0 20.5 15.3Z" /></svg>}
      <span className="sr-only">{theme === "dark" ? copy.light : copy.dark}</span>
    </button>
  );
}
