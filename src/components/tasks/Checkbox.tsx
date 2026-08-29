"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The tick itself.
 *
 * The check is *drawn* rather than faded in — a 260ms stroke animation with a
 * small scale pop — which is what makes completing something feel like an
 * event. Both only fire on a real interaction, never on mount, so opening a
 * day that is already full of finished items stays calm.
 */
export function Checkbox({
  checked,
  onToggle,
  label,
  size = "md",
  tone = "primary",
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  size?: "sm" | "md";
  tone?: "primary" | "accent";
}) {
  const [animating, setAnimating] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const handleClick = () => {
    if (!checked) {
      setAnimating(true);
      navigator.vibrate?.(12);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setAnimating(false), 400);
    } else {
      setAnimating(false);
    }
    onToggle();
  };

  const accent = tone === "accent";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={handleClick}
      className={cn(
        "grid shrink-0 place-items-center rounded-[10px] border-2 transition-[background-color,border-color] duration-200",
        size === "sm" ? "size-5" : "size-6",
        checked
          ? accent
            ? "border-accent bg-accent text-white"
            : "border-primary bg-primary text-primary-contrast"
          : "border-line-strong bg-transparent text-transparent hover:border-primary",
        animating && "hz-pop",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[78%]" aria-hidden="true">
        <path
          className="hz-tick-path"
          data-checked={animating ? "true" : "false"}
          d="M5.5 12.5 10 17 18.5 7"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={checked ? { strokeDashoffset: 0 } : undefined}
        />
      </svg>
    </button>
  );
}
