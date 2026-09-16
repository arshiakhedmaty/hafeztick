"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./Button";

export interface MenuItem {
  label: string;
  icon?: IconName;
  onClick: () => void;
  danger?: boolean;
}

const MENU_WIDTH = 184;
const GAP = 6;
const EDGE = 8;

interface Position {
  top: number;
  left: number;
  /** Set when the menu had to open upwards, so it can animate from below. */
  flipped: boolean;
}

/**
 * Small contextual menu; closes on outside click, Escape, or selection.
 *
 * The panel is rendered in a portal on `document.body` rather than next to its
 * button. It has to be: every list row carries a filling `hz-rise` animation,
 * which makes each row its own stacking context, and a panel painted inside one
 * of them can never rise above the rows that come after it — it opened *under*
 * the next task and its items could not be clicked. Being outside the list
 * entirely also means no ancestor's `overflow` can ever clip it.
 *
 * Because it is detached, the position is computed from the button's box and
 * kept glued to it while the page scrolls, flipping above the button when there
 * is no room below and clamping to the viewport on narrow phones.
 */
export function Menu({
  items,
  label = "گزینه‌های بیشتر",
  size = "sm",
}: {
  items: MenuItem[];
  label?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return;

    // Estimated before the panel exists, then corrected by the layout effect
    // below once it can be measured.
    const height = panelRef.current?.offsetHeight ?? items.length * 37 + 8;
    const rtl = getComputedStyle(document.documentElement).direction === "rtl";

    const below = trigger.bottom + GAP;
    const flipped = below + height > window.innerHeight - EDGE;
    const top = flipped
      ? Math.max(EDGE, trigger.top - height - GAP)
      : Math.min(below, window.innerHeight - height - EDGE);

    // Hang from the button's inline-end edge, then keep the whole panel on screen.
    const preferred = rtl ? trigger.left : trigger.right - MENU_WIDTH;
    const left = Math.max(
      EDGE,
      Math.min(preferred, window.innerWidth - MENU_WIDTH - EDGE),
    );

    setPosition({ top, left, flipped });
  }, [items.length]);

  // Measure the real panel once it is mounted, so a menu with unusually long
  // labels still flips and clamps correctly. Runs before paint: no flicker.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const reposition = () => place();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, place]);

  const toggle = () => {
    if (!open) place();
    setOpen((value) => !value);
  };

  return (
    <div ref={triggerRef} className="shrink-0">
      <IconButton
        icon="more"
        label={label}
        size={size}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      />

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              width: MENU_WIDTH,
            }}
            className={cn(
              "fixed z-[70] max-h-[70vh] overflow-y-auto overscroll-contain rounded-xl",
              "border border-line bg-surface p-1 shadow-float",
              position?.flipped ? "hz-sheet-up" : "hz-sheet",
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
                {item.icon && (
                  <Icon name={item.icon} size="1.05em" className="shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
