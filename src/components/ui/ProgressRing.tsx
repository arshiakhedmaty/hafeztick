import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The day's headline, drawn as an hour dial.
 *
 * The ring is divided into one tick per hour the day asks for, so the goal is
 * countable at a glance rather than a percentage to be decoded: six ticks
 * means six hours, and you can see how many are filled without reading a
 * number. Partial hours fill their tick proportionally. Above about ten hours
 * the ticks would crowd, so the dial falls back to a continuous arc — the
 * honest read at that scale.
 */
export function ProgressRing({
  value,
  size = 132,
  stroke = 10,
  ticks = 0,
  children,
  className,
  tone = "primary",
}: {
  /** 0..1, or null when the day carries no goal. Values above 1 are clamped. */
  value: number | null;
  size?: number;
  stroke?: number;
  /** How many hour marks to divide the dial into. 0 draws a plain arc. */
  ticks?: number;
  children?: ReactNode;
  className?: string;
  tone?: "primary" | "accent";
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = value === null ? 0 : Math.max(0, Math.min(1, value));
  const color = tone === "accent" ? "var(--accent)" : "var(--primary)";

  const useTicks = ticks > 0 && ticks <= 10;
  // A gap wide enough to read as separate marks at every size we render.
  const gap = useTicks ? Math.min(7, circumference / (ticks * 5)) : 0;
  const segment = useTicks ? circumference / ticks : 0;

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
        {useTicks ? (
          Array.from({ length: ticks }, (_, index) => {
            // How much of this particular hour has been filled.
            const filled = Math.max(0, Math.min(1, ratio * ticks - index));
            const length = Math.max(0, segment - gap);
            return (
              <g key={index}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="var(--surface-2)"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-index * segment}
                />
                {filled > 0 && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${length * filled} ${circumference - length * filled}`}
                    strokeDashoffset={-index * segment}
                    style={{
                      transition:
                        "stroke-dasharray 620ms cubic-bezier(.22,1,.36,1)",
                    }}
                  />
                )}
              </g>
            );
          })
        ) : (
          <>
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
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              style={{
                transition: "stroke-dashoffset 620ms cubic-bezier(.22,1,.36,1)",
              }}
            />
          </>
        )}
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
