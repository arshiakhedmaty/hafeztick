"use client";

import { cn } from "@/lib/utils/cn";
import { faDuration, faGoal } from "@/lib/utils/duration";

/**
 * The day, as an hour dial.
 *
 * One ring, divided into one mark per hour the day asks for, so the goal is
 * counted rather than decoded: six marks means six hours, and you can see how
 * many are filled without reading a number. Above ten hours the marks would
 * crowd, so it falls back to a single arc — the honest read at that scale.
 *
 * Hours past the goal are not wrapped back over the ring, where they read as
 * breakage rather than achievement. They get their own thin gold arc just
 * outside it: the dial grows instead of doubling back.
 */
export function DayDial({
  minutes,
  goalMinutes,
  size = 168,
  children,
  className,
}: {
  minutes: number;
  goalMinutes: number;
  size?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const stroke = 14;
  const overflowStroke = 5;
  const overflowGap = 5;

  // The overflow arc lives outside the main ring, so the ring itself is inset.
  const radius = (size - stroke) / 2 - overflowStroke - overflowGap;
  const circumference = 2 * Math.PI * radius;
  const overflowRadius = radius + stroke / 2 + overflowGap + overflowStroke / 2;
  const overflowCircumference = 2 * Math.PI * overflowRadius;

  const ratio = goalMinutes > 0 ? minutes / goalMinutes : 0;
  const filled = Math.max(0, Math.min(1, ratio));
  const over = Math.max(0, Math.min(1, ratio - 1));
  const complete = goalMinutes > 0 && ratio >= 1;

  const hours = Math.round(goalMinutes / 60);
  const ticks = hours > 0 && hours <= 10 ? hours : 0;
  const gap = ticks ? Math.min(8, circumference / (ticks * 5)) : 0;
  const segment = ticks ? circumference / ticks : 0;
  const tone = complete ? "var(--accent)" : "var(--primary)";
  const ease = "stroke-dasharray 720ms cubic-bezier(.22,1,.36,1), stroke 400ms ease";

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
        role="img"
        aria-label={`${faDuration(minutes, { short: true, zero: "بدون زمان" })} از ${faGoal(goalMinutes)}`}
      >
        {ticks ? (
          Array.from({ length: ticks }, (_, i) => {
            const length = Math.max(0, segment - gap);
            const part = Math.max(0, Math.min(1, filled * ticks - i));
            return (
              <g key={i}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="var(--surface-2)"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-i * segment}
                />
                {part > 0 && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={tone}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${length * part} ${circumference - length * part}`}
                    strokeDashoffset={-i * segment}
                    style={{ transition: ease }}
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
            {filled > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={tone}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference * filled} ${circumference}`}
                style={{ transition: ease }}
              />
            )}
          </>
        )}

        {/* Gold already means "goal met" on the ring itself, so the extra
            hours take فیروزه on their own outer track — two colours on two
            tracks read as two facts; two golds read as one thick blob. */}
        {over > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={overflowRadius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={overflowStroke}
            strokeLinecap="round"
            strokeDasharray={`${overflowCircumference * over} ${overflowCircumference}`}
            style={{ transition: "stroke-dasharray 720ms cubic-bezier(.22,1,.36,1) 240ms" }}
          />
        )}
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
