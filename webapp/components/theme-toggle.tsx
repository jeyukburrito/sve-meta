"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const label = theme === "light" ? "라이트" : theme === "dark" ? "다크" : "시스템";
  const icon = theme === "light" ? "light_mode" : theme === "dark" ? "dark_mode" : "desktop_windows";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="flex size-10 items-center justify-center rounded-full bg-surface text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
      aria-label={`테마: ${label}`}
      title={`테마: ${label}`}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
