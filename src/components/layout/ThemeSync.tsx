"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store/AppStore";

/**
 * Keeps <html> in sync with the user's theme and motion preferences.
 * The initial value is applied by the inline bootstrap script in the layout,
 * so this only handles changes made while the app is open.
 */
export function ThemeSync() {
  const { data, ready } = useApp();
  const { theme, reduceMotion } = data.settings;

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      root.setAttribute("data-theme", dark ? "dark" : "light");
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute(
      "data-motion",
      reduceMotion ? "reduced" : "full",
    );
  }, [reduceMotion, ready]);

  return null;
}
