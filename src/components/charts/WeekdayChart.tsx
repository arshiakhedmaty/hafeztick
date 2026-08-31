"use client";

import { cn } from "@/lib/utils/cn";
import { faNum, faPercent } from "@/lib/utils/number";
import { faClock, faDuration, faGoal } from "@/lib/utils/duration";
import { barValue } from "@/lib/utils/progress";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@/lib/date/jalali";
import type { WeekdayStat } from "@/lib/domain/stats";
import { DayFlower } from "@/components/week/DayFlower";

/**
 * Which days of the week actually work for this person.
 *
 * Bar height is the share of that weekday's own goal that usually gets
 * reached, and the number above it is the average hours behind that share —
 * a five-hour Saturday and a two-hour Thursday are compared fairly.
 */
export function WeekdayChart({
  stats,
  threshold,
}: {
  stats: WeekdayStat[];
  threshold: number;
}) {
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
      <div className="flex h-36 items-end gap-2">
        {stats.map((stat) => {
          const isBest = stat.weekday === best.weekday && stat.ratio !== null;
          const successful = (stat.ratio ?? 0) >= threshold;

          return (
            <div
              key={stat.weekday}
              className="flex h-full flex-1 flex-col items-center gap-1.5"
              title={`${WEEKDAY_NAMES[stat.weekday]} — ${
                stat.ratio === null
                  ? "بدون داده"
                  : `میانگین ${faDuration(Math.round(stat.minutes ?? 0), {
                      short: true,
                      zero: "۰",
                    })} از ${faGoal(stat.goalMinutes)} در ${faNum(
                      stat.sampleSize,
                    )} روز`
              }`}
            >
              <span className="hz-tnum text-[10px] text-muted">
                {stat.minutes === null ? "—" : faClock(Math.round(stat.minutes))}
              </span>

              <div className="flex w-full min-h-0 flex-1 items-end">
                <div
                  className={cn(
                    "w-full rounded-t-md transition-[height] duration-500 ease-out",
                    successful
                      ? "bg-accent"
                      : isBest
                        ? "bg-primary"
                        : "bg-primary/35",
                  )}
                  style={{
                    height: `${Math.max(barValue(stat.ratio) * 100, 2)}%`,
                  }}
                />
              </div>

              <DayFlower
                weekday={stat.weekday}
                ratio={stat.ratio}
                successful={successful}
                size={22}
                label={`${WEEKDAY_NAMES[stat.weekday]}`}
              />

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
        است: به‌طور میانگین{" "}
        {faDuration(Math.round(best.minutes ?? 0), { short: true, zero: "۰" })}{" "}
        مطالعه، یعنی {faPercent(best.ratio ?? 0)}٪ از هدف آن روز.
      </p>
    </div>
  );
}
