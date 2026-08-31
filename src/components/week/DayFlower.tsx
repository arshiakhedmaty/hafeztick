"use client";

import { cn } from "@/lib/utils/cn";
import { faPercent } from "@/lib/utils/number";
import { faDuration, faGoal } from "@/lib/utils/duration";
import { progressStep } from "@/lib/utils/progress";
import { WEEKDAY_NAMES } from "@/lib/date/jalali";

/**
 * The week, growing one leaf at a time.
 *
 * Saturday carries a single leaf and each day adds one, so Friday closes the
 * week with seven. The leaves fan out from the top at a fixed 360/7 spacing
 * rather than dividing a circle evenly, which means the shape genuinely grows
 * — a sprout on Saturday, a near-complete شمسه by Friday — instead of seven
 * arrangements that merely differ. A day is identifiable by its silhouette
 * alone, and the week reads as a sequence.
 *
 * How far the flower has opened is the day's hours against its own goal.
 * Leaves light in order, the one at the frontier takes a half tint so a
 * single-leaf Saturday still shows more than on-or-off, and only a day that
 * cleared its success threshold takes the gold of تذهیب.
 */

/** One seventh of a turn: Saturday's leaf and Friday's outermost pair agree. */
const LEAF_SPACING = 360 / 7;

/** The pointed almond of Persian illumination. */
const LEAF = "M 0 -12 C 7 -20, 8.5 -31, 0 -42 C -8.5 -31, -7 -20, 0 -12 Z";

export function DayFlower({
  weekday,
  ratio,
  successful,
  size = 34,
  className,
  label,
}: {
  /** 0 = Saturday … 6 = Friday. Also the number of leaves, plus one. */
  weekday: number;
  /** Minutes logged ÷ that day's hour goal, or null when the day is unscored. */
  ratio: number | null;
  successful: boolean;
  size?: number;
  className?: string;
  label?: string;
}) {
  const leaves = Math.min(7, Math.max(1, weekday + 1));
  const step = progressStep(ratio);
  const open = step === null ? 0 : step / 5;

  // Leaves light in order; the frontier one is half-tinted, which is what
  // keeps a one-leaf day from being merely on or off.
  const grown = leaves * open;
  const full = Math.floor(grown);
  const frontier = grown - full;

  const tone = successful ? "var(--accent)" : "var(--primary)";
  const dormant = step === null;
  const started = grown > 0;

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
      {Array.from({ length: leaves }, (_, index) => {
        const lit = index < full;
        const half = index === full && frontier > 0.15;
        // Fanned symmetrically about the top, so the shape opens outward.
        const angle = (index - (leaves - 1) / 2) * LEAF_SPACING;

        return (
          <path
            key={index}
            d={LEAF}
            transform={`rotate(${angle})`}
            fill={lit || half ? tone : "var(--surface-2)"}
            stroke={lit || half ? "transparent" : "var(--line)"}
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity={lit ? 1 : half ? 0.45 : dormant ? 0.4 : 0.75}
            style={{
              transition:
                "fill 460ms cubic-bezier(.22,1,.36,1), opacity 460ms ease",
            }}
          />
        );
      })}

      {/* The بند that binds the leaves to the centre. */}
      <circle
        cx="0"
        cy="0"
        r="12.5"
        fill="none"
        stroke={started ? tone : "var(--line)"}
        strokeWidth="2"
        opacity={started ? 0.4 : 0.7}
        style={{ transition: "stroke 460ms cubic-bezier(.22,1,.36,1)" }}
      />

      <circle
        cx="0"
        cy="0"
        r="8.5"
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

/** The sentence under a flower: hours done against the day's goal. */
export function flowerHint(minutes: number, goalMinutes: number): string {
  if (goalMinutes === 0) return "بدون هدف";
  return `${faDuration(minutes, { short: true, zero: "۰" })} از ${faGoal(goalMinutes)}`;
}
