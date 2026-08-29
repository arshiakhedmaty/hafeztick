import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The day's headline number. The arc animates its stroke offset rather than
 * re-rendering, so ticking an item feels like the ring filling up.
 */
export function ProgressRing({
  value,
  size = 132,
  stroke = 10,
  children,
  className,
  tone = "primary",
}: {
  /** 0..1, or null when nothing is planned. */
  value: number | null;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
  tone?: "primary" | "accent";
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = value === null ? 0 : Math.max(0, Math.min(1, value));
  const offset = circumference * (1 - ratio);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone === "accent" ? "var(--accent)" : "var(--primary)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 620ms cubic-bezier(.22,1,.36,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}

/** Slim horizontal bar used inside cards and list rows. */
export function ProgressBar({
  value,
  className,
  tone = "primary",
}: {
  value: number;
  className?: string;
  tone?: "primary" | "accent" | "muted";
}) {
  const color =
    tone === "accent"
      ? "var(--accent)"
      : tone === "muted"
        ? "var(--line-strong)"
        : "var(--primary)";

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-surface-2",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
