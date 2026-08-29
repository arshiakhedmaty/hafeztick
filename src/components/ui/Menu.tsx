"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./Button";

export interface MenuItem {
  label: string;
  icon?: IconName;
  onClick: () => void;
  danger?: boolean;
}

/** Small contextual menu; closes on outside click, Escape, or selection. */
export function Menu({
  items,
  label = "گزینه‌های بیشتر",
  align = "end",
}: {
  items: MenuItem[];
  label?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        icon="more"
        label={label}
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      />
      {open && (
        <div
          role="menu"
          className={cn(
            "hz-sheet absolute top-full z-50 mt-1 min-w-44 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-float",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[13px] transition-colors",
                item.danger
                  ? "text-danger hover:bg-danger-soft"
                  : "text-fg-soft hover:bg-surface-2",
              )}
            >
              {item.icon && <Icon name={item.icon} size="1.05em" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
