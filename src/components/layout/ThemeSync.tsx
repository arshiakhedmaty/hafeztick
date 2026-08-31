"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store/AppStore";

/**
 * Keeps <html> in sync with the chosen theme. The initial value is applied by
 * the inline bootstrap script in the layout, so this only handles changes
 * made while the app is open.
 *
 * Motion is not mirrored here: the app honours the operating system's
 * prefers-reduced-motion, which is where people set that once for everything
 * rather than per site.
 */
export function ThemeSync() {
  const { data, ready } = useApp();
  const { theme } = data.settings;

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

  return null;
}
