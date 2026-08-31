"use client";

import { cn } from "@/lib/utils/cn";
import { faPercent } from "@/lib/utils/number";
import { faDuration, faGoal } from "@/lib/utils/duration";

/**
 * Three concentric rings: today, this week, this month.
 *
 * Every ring answers the same question at a different zoom — hours logged
 * against hours asked for — so the reading needs no legend to decode: the
 * outer ring moves fast, the inner one barely moves, and a good week is
 * visible before you read a single number.
 *
 * Going past a goal is not hidden. The ring wraps: the first lap fills, turns
 * gold when it completes, and the overflow starts a second lap in فیروزه
 * riding over the gold. Eight hours against a six-hour goal looks different
 * from six, which was the whole point of measuring time instead of ticks.
 *
 * The outer ring keeps its hour marks — one tick per hour the day asks for —
 * because at the day scale the goal is small enough to count. Week and month
 * are continuous arcs; sixty ticks would be noise.
 */

export interface RingDatum {
  /** «امروز» — what this ring measures. */
  label: string;
  minutes: number;
  goalMinutes: number;
  /** Outer diameter in px. */
  size: number;
  /** Hour marks to divide the track into. 0 draws a continuous arc. */
  ticks?: number;
}

const STROKE = 12;

/**
 * Every ring is drawn on an SVG the size of the whole stack, with only its
 * radius differing. Centring is then free — no per-ring offset to get wrong,
 * which is exactly the mistake that makes RTL layouts drift.
 */
function Ring({
  datum,
  stackSize,
  index,
}: {
  datum: RingDatum;
  stackSize: number;
  index: number;
}) {
  const { goalMinutes, minutes } = datum;
  const radius = (datum.size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const centre = stackSize / 2;

  const ratio = goalMinutes > 0 ? minutes / goalMinutes : 0;
  const lap1 = Math.max(0, Math.min(1, ratio));
  const lap2 = Math.max(0, Math.min(1, ratio - 1));
  const complete = ratio >= 1;

  // Segment the track into hour marks where the scale allows counting.
  const ticks = datum.ticks && datum.ticks > 0 && datum.ticks <= 10 ? datum.ticks : 0;
  const gap = ticks ? Math.min(7, circumference / (ticks * 5)) : 0;
  const segment = ticks ? circumference / ticks : 0;

  const ease = (extra = 0) =>
    `stroke-dasharray 700ms cubic-bezier(.22,1,.36,1) ${index * 90 + extra}ms, stroke 500ms ease`;

  return (
    <svg
      width={stackSize}
      height={stackSize}
      viewBox={`0 0 ${stackSize} ${stackSize}`}
      className="absolute inset-0 -rotate-90"
      aria-hidden="true"
    >
      {ticks ? (
        Array.from({ length: ticks }, (_, i) => {
          const length = Math.max(0, segment - gap);
          const filled = Math.max(0, Math.min(1, lap1 * ticks - i));
          return (
            <g key={i}>
              <circle
                cx={centre}
                cy={centre}
                r={radius}
                fill="none"
                stroke="var(--surface-2)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-i * segment}
              />
              {filled > 0 && (
                <circle
                  cx={centre}
                  cy={centre}
                  r={radius}
                  fill="none"
                  stroke={complete ? "var(--accent)" : "var(--primary)"}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${length * filled} ${circumference - length * filled}`}
                  strokeDashoffset={-i * segment}
                  style={{ transition: ease() }}
                />
              )}
            </g>
          );
        })
      ) : (
        <>
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={STROKE}
          />
          {/* A zero-length dash with a round cap still paints its cap — an
              empty ring would show a stray dot at twelve o'clock. */}
          {lap1 > 0 && (
            <circle
              cx={centre}
              cy={centre}
              r={radius}
              fill="none"
              stroke={complete ? "var(--accent)" : "var(--primary)"}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${circumference * lap1} ${circumference}`}
              style={{ transition: ease() }}
            />
          )}
        </>
      )}

      {/* The overflow lap, riding over a ring that already filled. */}
      {lap2 > 0 && (
        <circle
          cx={centre}
          cy={centre}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={STROKE - 5}
          strokeLinecap="round"
          strokeDasharray={`${circumference * lap2} ${circumference}`}
          style={{ transition: ease(260) }}
        />
      )}
    </svg>
  );
}

function Legend({ data }: { data: RingDatum[] }) {
  return (
    <dl className="grid w-full min-w-0 grid-cols-3 gap-x-3 sm:flex sm:flex-1 sm:flex-col sm:justify-center sm:gap-4">
      {data.map((datum) => {
        const ratio = datum.goalMinutes > 0 ? datum.minutes / datum.goalMinutes : null;
        const complete = ratio !== null && ratio >= 1;

        return (
          <div key={datum.label} className="min-w-0">
            <dt className="hz-eyebrow flex items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  complete ? "bg-accent" : "bg-primary",
                )}
                aria-hidden="true"
              />
              {datum.label}
            </dt>
            <dd
              className={cn(
                "hz-tnum mt-1 truncate text-[17px] font-semibold leading-none",
                complete ? "text-accent" : "text-fg",
              )}
            >
              {faDuration(datum.minutes, { short: true, zero: "۰" })}
            </dd>
            <dd className="hz-tnum mt-1 truncate text-[11.5px] text-muted">
              از {faGoal(datum.goalMinutes)}
              {ratio !== null && ` · ${faPercent(ratio)}٪`}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function ActivityRings({
  data,
  className,
}: {
  /** Outermost first. */
  data: RingDatum[];
  className?: string;
}) {
  const stackSize = data[0]?.size ?? 0;

  return (
    <div
      className={cn(
        // Side by side once there is room; stacked below that, where the rings
        // would otherwise squeeze the figures into a column of wrapped lines.
        "flex flex-col items-center gap-5 sm:flex-row sm:gap-7",
        className,
      )}
    >
      <div
        className="relative shrink-0"
        style={{ width: stackSize, height: stackSize }}
        role="img"
        aria-label={data
          .map(
            (d) =>
              `${d.label}: ${faDuration(d.minutes, { short: true, zero: "۰" })} از ${faGoal(d.goalMinutes)}`,
          )
          .join("، ")}
      >
        {data.map((datum, index) => (
          <Ring
            key={datum.label}
            datum={datum}
            stackSize={stackSize}
            index={index}
          />
        ))}
      </div>

      <Legend data={data} />
    </div>
  );
}
