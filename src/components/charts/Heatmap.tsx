"use client";

import { useMemo } from "react";
import { faPercent } from "@/lib/utils/number";
import {
  type DayKey,
  addDays,
  compareDays,
  formatDay,
  startOfWeek,
} from "@/lib/date/day";
import { WEEKDAY_SHORT } from "@/lib/date/jalali";
import type { DayScore } from "@/lib/domain/scoring";

/** Five steps is enough to read a pattern without turning into a gradient. */
function cellColor(ratio: number | null): string {
  if (ratio === null) return "var(--surface-2)";
  if (ratio <= 0) return "color-mix(in oklab, var(--primary) 8%, var(--surface-2))";
  if (ratio < 0.34) return "color-mix(in oklab, var(--primary) 28%, var(--surface-2))";
  if (ratio < 0.67) return "color-mix(in oklab, var(--primary) 52%, var(--surface-2))";
  if (ratio < 1) return "color-mix(in oklab, var(--primary) 76%, var(--surface-2))";
  return "var(--primary)";
}

/**
 * Consistency at a glance: one square per day, weeks running right to left so
 * the newest week sits where a Persian reader starts.
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
    const byDay = new Map(scores.map((score) => [score.day, score.ratio]));
    const start = startOfWeek(addDays(today, -(weeks * 7 - 1)));

    return Array.from({ length: weeks }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const day = addDays(start, weekIndex * 7 + dayIndex);
        return {
          day,
          ratio: byDay.get(day) ?? null,
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
                            ? "بدون برنامه"
                            : `${faPercent(cell.ratio)}٪`
                        }`
                  }
                  className="size-[13px] rounded-[3px] transition-colors duration-300"
                  style={{
                    backgroundColor: cell.future
                      ? "transparent"
                      : cellColor(cell.ratio),
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
        {[null, 0.2, 0.5, 0.8, 1].map((step, index) => (
          <span
            key={index}
            className="size-[11px] rounded-[3px]"
            style={{ backgroundColor: cellColor(step) }}
          />
        ))}
        <span>بیشتر</span>
      </div>
    </div>
  );
}
