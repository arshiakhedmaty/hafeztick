"use client";

import { useMemo } from "react";
import { faPercent } from "@/lib/utils/number";
import { faDuration } from "@/lib/utils/duration";
import { progressColor } from "@/lib/utils/progress";
import {
  type DayKey,
  addDays,
  compareDays,
  formatDay,
  startOfWeek,
} from "@/lib/date/day";
import { WEEKDAY_SHORT } from "@/lib/date/jalali";
import type { DayScore } from "@/lib/domain/scoring";

/**
 * Consistency at a glance: one square per day, weeks running right to left so
 * the newest week sits where a Persian reader starts.
 *
 * The shade is the day's share of *its own* hour goal, stepped rather than
 * continuous, so a six-hour Saturday and a two-hour Thursday can both be a
 * full square when each hit what it was asked for.
 */
export function Heatmap({
  scores,
  today,
  weeks = 14,
}: {
  scores: DayScore[];
  today: DayKey;
  weeks?: number;
}) {
  const columns = useMemo(() => {
    const byDay = new Map(scores.map((score) => [score.day, score]));
    const start = startOfWeek(addDays(today, -(weeks * 7 - 1)));

    return Array.from({ length: weeks }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const day = addDays(start, weekIndex * 7 + dayIndex);
        const score = byDay.get(day);
        return {
          day,
          ratio: score?.ratio ?? null,
          minutes: score?.minutes ?? 0,
          future: compareDays(day, today) > 0,
        };
      }),
    );
  }, [scores, today, weeks]);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex shrink-0 flex-col gap-[3px] pt-[1px]">
          {WEEKDAY_SHORT.map((name, index) => (
            <span
              key={name}
              className="grid h-[13px] w-4 place-items-center text-[9px] leading-none text-muted"
            >
              {index % 2 === 0 ? name : ""}
            </span>
          ))}
        </div>

        <div className="flex flex-row-reverse gap-[3px]">
          {columns.map((column, index) => (
            <div key={index} className="flex flex-col gap-[3px]">
              {column.map((cell) => (
                <span
                  key={cell.day}
                  title={
                    cell.future
                      ? formatDay(cell.day)
                      : `${formatDay(cell.day)} — ${
                          cell.ratio === null
                            ? "بدون هدف"
                            : `${faDuration(cell.minutes, {
                                short: true,
                                zero: "۰",
                              })} · ${faPercent(cell.ratio)}٪ از هدف`
                        }`
                  }
                  className="size-[13px] rounded-[3px] transition-colors duration-300"
                  style={{
                    backgroundColor: cell.future
                      ? "transparent"
                      : progressColor(cell.ratio),
                    border: cell.future ? "1px dashed var(--line)" : undefined,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10.5px] text-muted">
        <span>کمتر</span>
        {[null, 0, 0.35, 0.6, 0.85, 1].map((step, index) => (
          <span
            key={index}
            className="size-[11px] rounded-[3px]"
            style={{ backgroundColor: progressColor(step) }}
          />
        ))}
        <span>بیشتر</span>
      </div>
    </div>
  );
}
