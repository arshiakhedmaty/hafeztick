"use client";

import { useId } from "react";
import { faNum } from "@/lib/utils/number";
import { faDuration } from "@/lib/utils/duration";
import { progressColor } from "@/lib/utils/progress";
import { formatDay } from "@/lib/date/day";
import type { TrendPoint } from "@/lib/domain/stats";

const WIDTH = 320;
const HEIGHT = 108;
const PADDING_Y = 8;

/**
 * Each day's share of its hour goal as bars, with the seven-day average drawn
 * over them, so a bad day reads as a dip in a trend rather than a verdict. Bars
 * carry the same stepped colour as the heatmap, so "how close to the goal" has
 * one visual language across the app. Time flows right to left.
 */
export function TrendChart({
  points,
  threshold,
}: {
  points: TrendPoint[];
  /** Share of the goal that makes a day successful, drawn as a dashed line. */
  threshold: number;
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
  // Over-delivery is real but must not run off the top of the chart.
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const toY = (value: number) =>
    HEIGHT - PADDING_Y - clamp(value) * (HEIGHT - PADDING_Y * 2);

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
        aria-label="روند ساعت مطالعه‌ی روزانه نسبت به هدف هر روز"
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
          y1={toY(threshold)}
          y2={toY(threshold)}
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
              fill={progressColor(point.ratio)}
            >
              <title>{`${formatDay(point.day)} — ${faDuration(point.minutes, {
                short: true,
                zero: "۰",
              })}`}</title>
            </rect>
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
        <span className="text-accent">
          خط «روز موفق»: {faNum(Math.round(threshold * 100))}٪ از هدف روز
        </span>
        <span>{formatDay(usable[usable.length - 1].day)}</span>
      </div>
    </div>
  );
}
