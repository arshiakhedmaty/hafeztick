/**
 * One stepped colour scale, shared by every surface that shows progress.
 *
 * The input is always the same thing: minutes logged ÷ minutes targeted for
 * that day. Steps rather than a continuous gradient, because the point is to
 * read a pattern at a glance — «نزدیک هدف» and «نصف هدف» must look different
 * from across the room, and two adjacent days must not blend into each other.
 */

/** 0 = nothing logged … 5 = goal reached or passed. `null` = no goal at all. */
export type ProgressStep = 0 | 1 | 2 | 3 | 4 | 5;

const THRESHOLDS = [0.25, 0.5, 0.75, 1] as const;

export function progressStep(ratio: number | null): ProgressStep | null {
  if (ratio === null) return null;
  if (ratio <= 0) return 0;
  for (let i = 0; i < THRESHOLDS.length; i += 1) {
    if (ratio < THRESHOLDS[i]) return (i + 1) as ProgressStep;
  }
  return 5;
}

/** Mix strength of each step against the surface behind it. */
const STEP_MIX = [8, 26, 46, 66, 84, 100] as const;

/**
 * A CSS colour for a step. The full step uses `--accent` so that "hit today's
 * hours" reads as celebration, exactly like a completed streak elsewhere.
 */
export function progressColor(ratio: number | null): string {
  const step = progressStep(ratio);
  if (step === null) return "var(--surface-2)";
  if (step === 5) return "var(--accent)";
  return `color-mix(in oklab, var(--primary) ${STEP_MIX[step]}%, var(--surface-2))`;
}

/** Which of the two brand tones a bar, ring or flower should use. */
export function progressTone(ratio: number | null): "primary" | "accent" {
  return ratio !== null && ratio >= 1 ? "accent" : "primary";
}

/** Ratios cross into the visible part of a bar; 0 would render as nothing. */
export function barValue(ratio: number | null): number {
  if (ratio === null) return 0;
  return Math.max(0, Math.min(1, ratio));
}
