"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const themeKey = "tech-interview-prep:theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(themeKey);
    const next: Theme = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(themeKey, next);
    setTheme(next);
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="تغيير المظهر">
      {theme === "dark" ? "☀ الوضع الفاتح" : "◐ الوضع الداكن"}
    </button>
  );
}
