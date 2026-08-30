"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const themeKey = "tech-interview-prep:theme";

export function ThemeToggle() {
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

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="تغيير المظهر">
      {theme === "dark" ? "☀ الوضع الفاتح" : "◐ الوضع الداكن"}
    </button>
  );
}
