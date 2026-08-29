"use client";

import { useId } from "react";
import { faPercent } from "@/lib/utils/number";
import { formatDay } from "@/lib/date/day";
import type { TrendPoint } from "@/lib/domain/stats";

const WIDTH = 320;
const HEIGHT = 108;
const PADDING_Y = 8;

/**
 * Daily ratio as faint bars with the 7-day average drawn over them, so a bad
 * day reads as a dip in a trend rather than a verdict. Time flows right to
 * left, matching the reading direction.
 */
export function TrendChart({
  points,
  goal,
}: {
  points: TrendPoint[];
  goal: number;
}) {
  const gradientId = useId();
  const usable = points.length > 1 ? points : [];

  if (usable.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-muted">
        هنوز داده‌ی کافی برای نمودار روند نیست.
      </p>
    );
  }

  const stepX = WIDTH / (usable.length - 1);
  const toX = (index: number) => WIDTH - index * stepX;
  const toY = (value: number) =>
    HEIGHT - PADDING_Y - value * (HEIGHT - PADDING_Y * 2);

  const averagePoints = usable
    .map((point, index) =>
      point.average === null ? null : `${toX(index)},${toY(point.average)}`,
    )
    .filter((value): value is string => value !== null);

  const linePath = averagePoints.length ? `M ${averagePoints.join(" L ")}` : "";
  const areaPath = averagePoints.length
    ? `${linePath} L ${toX(usable.length - 1)},${HEIGHT} L ${toX(0)},${HEIGHT} Z`
    : "";

  const barWidth = Math.max(1.5, Math.min(6, stepX * 0.55));

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-28 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="روند پایبندی روزانه"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((value) => (
          <line
            key={value}
            x1="0"
            x2={WIDTH}
            y1={toY(value)}
            y2={toY(value)}
            stroke="var(--line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <line
          x1="0"
          x2={WIDTH}
          y1={toY(goal)}
          y2={toY(goal)}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
          opacity="0.75"
        />

        {usable.map((point, index) =>
          point.ratio === null ? null : (
            <rect
              key={point.day}
              x={toX(index) - barWidth / 2}
              y={toY(point.ratio)}
              width={barWidth}
              height={Math.max(1, HEIGHT - PADDING_Y - toY(point.ratio))}
              rx="1"
              fill="var(--primary)"
              opacity="0.16"
            />
          ),
        )}

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[10.5px] text-muted">
        <span>{formatDay(usable[0].day)}</span>
        <span className="text-accent">هدف روزانه: {faPercent(goal)}٪</span>
        <span>{formatDay(usable[usable.length - 1].day)}</span>
      </div>
    </div>
  );
}
