"use client";

import { cn } from "@/lib/utils/cn";
import { faDuration, faGoal } from "@/lib/utils/duration";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@/lib/date/jalali";
import { compareDays, weekdayIndex } from "@/lib/date/day";
import type { DayKey } from "@/lib/date/day";
import type { DayScore } from "@/lib/domain/scoring";
import { isSuccessfulDay } from "@/lib/domain/scoring";
import type { Settings } from "@/lib/domain/types";
import { DayFlower } from "@/components/week/DayFlower";

/**
 * The week around today, as seven rosettes.
 *
 * This is the context the day needs, and it needs no numbers to give it: how
 * the week has gone is a shape, and a row of rosettes is read faster than a
 * second ring carrying a figure that is mostly today's again. Days still ahead
 * stay closed, because they have not happened yet.
 */
export function WeekStrip({
  scores,
  day,
  today,
  settings,
}: {
  /** Saturday through Friday of the week containing `day`. */
  scores: DayScore[];
  day: DayKey;
  today: DayKey;
  settings: Pick<Settings, "successThreshold">;
}) {
  return (
    <ol className="flex items-end justify-between gap-1">
      {scores.map((score) => {
        const future = compareDays(score.day, today) > 0;
        const isViewed = score.day === day;
        const weekday = weekdayIndex(score.day);
        const successful = !future && isSuccessfulDay(score, settings);

        return (
          <li
            key={score.day}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition-colors",
              isViewed && "bg-surface-2",
            )}
            title={`${WEEKDAY_NAMES[weekday]} — ${
              future
                ? "هنوز نرسیده"
                : `${faDuration(score.minutes, { short: true, zero: "۰" })} از ${faGoal(score.goalMinutes)}`
            }`}
          >
            <DayFlower
              weekday={weekday}
              ratio={future ? null : score.ratio}
              successful={successful}
              size={26}
              label={WEEKDAY_NAMES[weekday]}
            />
            <span
              className={cn(
                "text-[10.5px] leading-none",
                isViewed ? "font-semibold text-fg-soft" : "text-muted",
              )}
            >
              {WEEKDAY_SHORT[weekday]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
