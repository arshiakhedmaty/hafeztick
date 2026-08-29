"use client";

import { cn } from "@/lib/utils/cn";
import { faNum, faPercent } from "@/lib/utils/number";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@/lib/date/jalali";
import type { WeekdayStat } from "@/lib/domain/stats";

/** Which days of the week actually work for this person. */
export function WeekdayChart({ stats }: { stats: WeekdayStat[] }) {
  const rated = stats.filter((stat) => stat.ratio !== null);
  if (rated.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted">
        هنوز داده‌ای برای مقایسه‌ی روزهای هفته نیست.
      </p>
    );
  }

  const best = rated.reduce((a, b) => ((b.ratio ?? 0) > (a.ratio ?? 0) ? b : a));

  return (
    <div>
      <div className="flex h-32 items-end gap-2">
        {stats.map((stat) => {
          const ratio = stat.ratio ?? 0;
          const isBest = stat.weekday === best.weekday && stat.ratio !== null;
          return (
            <div
              key={stat.weekday}
              className="flex flex-1 flex-col items-center gap-1.5"
              title={`${WEEKDAY_NAMES[stat.weekday]} — ${
                stat.ratio === null
                  ? "بدون داده"
                  : `${faPercent(stat.ratio)}٪ در ${faNum(stat.sampleSize)} روز`
              }`}
            >
              <span className="hz-tnum text-[10px] text-muted">
                {stat.ratio === null ? "—" : faPercent(stat.ratio)}
              </span>
              <div className="flex h-full w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-md transition-[height] duration-500 ease-out",
                    isBest ? "bg-primary" : "bg-primary/35",
                  )}
                  style={{ height: `${Math.max(ratio * 100, 2)}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[11px]",
                  isBest ? "font-semibold text-primary" : "text-muted",
                )}
              >
                {WEEKDAY_SHORT[stat.weekday]}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-muted">
        بهترین روزت <span className="text-fg-soft">{WEEKDAY_NAMES[best.weekday]}</span>{" "}
        است با {faPercent(best.ratio ?? 0)}٪ پایبندی.
      </p>
    </div>
  );
}
