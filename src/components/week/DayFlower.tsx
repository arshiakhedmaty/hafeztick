"use client";

import { cn } from "@/lib/utils/cn";
import { faPercent } from "@/lib/utils/number";
import { faDuration, faGoal } from "@/lib/utils/duration";
import { progressStep } from "@/lib/utils/progress";
import { WEEKDAY_NAMES } from "@/lib/date/jalali";

/**
 * Each weekday has its own flower, and it opens as the day's hours fill in.
 *
 * The shape is fixed per weekday — a different petal count and tilt for each —
 * so a glance at the week board reads as seven distinct places rather than
 * seven identical gauges. What changes is how far it has opened: petals appear
 * one step at a time, and the flower only takes the celebratory gold once the
 * day has actually cleared its success threshold.
 */

/** Petals, and the tilt that keeps neighbours from looking like twins. */
const SHAPES: { petals: number; rotate: number }[] = [
  { petals: 6, rotate: 0 }, // شنبه
  { petals: 5, rotate: 18 }, // یک‌شنبه
  { petals: 8, rotate: 12 }, // دوشنبه
  { petals: 6, rotate: 30 }, // سه‌شنبه
  { petals: 7, rotate: 8 }, // چهارشنبه
  { petals: 5, rotate: 36 }, // پنج‌شنبه
  { petals: 8, rotate: 22 }, // جمعه
];

export function DayFlower({
  weekday,
  ratio,
  successful,
  size = 34,
  className,
  label,
}: {
  weekday: number;
  /** Minutes logged ÷ that day's hour goal, or null when the day is unscored. */
  ratio: number | null;
  successful: boolean;
  size?: number;
  className?: string;
  label?: string;
}) {
  const shape = SHAPES[weekday] ?? SHAPES[0];
  const step = progressStep(ratio);
  // Step 0..5 maps onto "no petals" .. "every petal".
  const open = step === null ? 0 : step / 5;
  const litPetals = Math.round(shape.petals * open);

  const tone = successful ? "var(--accent)" : "var(--primary)";
  const dormant = step === null;

  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      className={cn("shrink-0 overflow-visible", className)}
      role="img"
      aria-label={
        label ??
        `${WEEKDAY_NAMES[weekday]} — ${
          ratio === null ? "بدون هدف" : `${faPercent(Math.min(1, ratio))}٪ از هدف`
        }`
      }
    >
      <g transform={`rotate(${shape.rotate})`}>
        {Array.from({ length: shape.petals }, (_, index) => {
          const lit = index < litPetals;
          const angle = (360 / shape.petals) * index;
          return (
            <ellipse
              key={index}
              cx="0"
              cy="-27"
              rx="11"
              ry="19"
              transform={`rotate(${angle})`}
              fill={lit ? tone : "var(--surface-2)"}
              stroke={lit ? "transparent" : "var(--line)"}
              strokeWidth="2"
              opacity={lit ? (successful ? 1 : 0.9) : dormant ? 0.5 : 0.85}
              style={{
                transition:
                  "fill 420ms cubic-bezier(.22,1,.36,1), opacity 420ms ease",
              }}
            />
          );
        })}
      </g>

      <circle
        cx="0"
        cy="0"
        r="12"
        fill={litPetals > 0 ? tone : "var(--surface-2)"}
        stroke={litPetals > 0 ? "transparent" : "var(--line-strong)"}
        strokeWidth="2"
        style={{ transition: "fill 420ms cubic-bezier(.22,1,.36,1)" }}
      />

      {successful && (
        <circle
          cx="0"
          cy="0"
          r="5"
          fill="var(--surface)"
          opacity="0.85"
          className="hz-fade"
        />
      )}
    </svg>
  );
}

/** The sentence under a flower: hours done against the day's goal. */
export function flowerHint(minutes: number, goalMinutes: number): string {
  if (goalMinutes === 0) return "بدون هدف";
  return `${faDuration(minutes, { short: true, zero: "۰" })} از ${faGoal(goalMinutes)}`;
}
