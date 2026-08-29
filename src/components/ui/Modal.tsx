"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./Button";

/**
 * A centred dialog on desktop, a bottom sheet on phones — one component so the
 * two never drift apart. Closes on Escape and on backdrop click.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button",
    );
    focusable?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="hz-fade absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={cn(
          "hz-sheet relative flex max-h-[90dvh] w-full flex-col overflow-hidden border border-line bg-surface shadow-modal",
          "rounded-t-3xl sm:rounded-card",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
            {description && (
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton icon="close" label="بستن" size="sm" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
