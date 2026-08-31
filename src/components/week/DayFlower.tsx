"use client";

import { cn } from "@/lib/utils/cn";
import { faPercent } from "@/lib/utils/number";
import { faDuration, faGoal } from "@/lib/utils/duration";
import { progressStep } from "@/lib/utils/progress";
import { WEEKDAY_NAMES } from "@/lib/date/jalali";

/**
 * شمسه — the rosette that opens an illuminated Persian manuscript, here
 * carrying a day's study hours.
 *
 * Each weekday keeps its own rosette: a fixed petal count and rotation, so the
 * week board reads as seven distinct places rather than seven identical
 * gauges. What changes is how far it has opened. Petals light one step at a
 * time as the hours accumulate, and only a day that actually cleared its
 * success threshold takes the gold of تذهیب — which is why gold means
 * something when you see it.
 */

/** Petals, and the rotation that keeps neighbouring days from looking alike. */
const SHAPES: { petals: number; rotate: number }[] = [
  { petals: 8, rotate: 0 }, // شنبه
  { petals: 6, rotate: 15 }, // یک‌شنبه
  { petals: 12, rotate: 8 }, // دوشنبه
  { petals: 7, rotate: 25 }, // سه‌شنبه
  { petals: 10, rotate: 9 }, // چهارشنبه
  { petals: 5, rotate: 36 }, // پنج‌شنبه
  { petals: 9, rotate: 20 }, // جمعه
];

/** One petal, drawn as the pointed almond of Persian illumination. */
function petalPath(): string {
  return "M 0 -13 C 7 -21, 8.5 -32, 0 -43 C -8.5 -32, -7 -21, 0 -13 Z";
}

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
  const open = step === null ? 0 : step / 5;
  const litPetals = Math.round(shape.petals * open);

  const tone = successful ? "var(--accent)" : "var(--primary)";
  const dormant = step === null;
  const started = litPetals > 0;

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
            <path
              key={index}
              d={petalPath()}
              transform={`rotate(${angle})`}
              fill={lit ? tone : "var(--surface-2)"}
              stroke={lit ? "transparent" : "var(--line)"}
              strokeWidth="1.5"
              strokeLinejoin="round"
              opacity={lit ? 1 : dormant ? 0.45 : 0.8}
              style={{
                transition:
                  "fill 460ms cubic-bezier(.22,1,.36,1), opacity 460ms ease",
              }}
            />
          );
        })}
      </g>

      {/* The بند: the ring that binds the petals to the centre. */}
      <circle
        cx="0"
        cy="0"
        r="13.5"
        fill="none"
        stroke={started ? tone : "var(--line)"}
        strokeWidth="2"
        opacity={started ? 0.4 : 0.7}
        style={{ transition: "stroke 460ms cubic-bezier(.22,1,.36,1)" }}
      />

      <circle
        cx="0"
        cy="0"
        r="9"
        fill={started ? tone : "var(--surface-2)"}
        style={{ transition: "fill 460ms cubic-bezier(.22,1,.36,1)" }}
      />

      {/* A day that met its hours gets the pierced centre of a real شمسه. */}
      {successful && (
        <circle cx="0" cy="0" r="3.5" fill="var(--surface)" className="hz-fade" />
      )}
    </svg>
  );
}

/** The sentence under a rosette: hours done against the day's goal. */
export function flowerHint(minutes: number, goalMinutes: number): string {
  if (goalMinutes === 0) return "بدون هدف";
  return `${faDuration(minutes, { short: true, zero: "۰" })} از ${faGoal(goalMinutes)}`;
}
