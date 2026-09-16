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
  onSelect,
}: {
  /** Saturday through Friday of the week containing `day`. */
  scores: DayScore[];
  day: DayKey;
  today: DayKey;
  settings: Pick<Settings, "successThreshold">;
  /** Jump straight to a day. The strip is a picker, not just a picture. */
  onSelect: (day: DayKey) => void;
}) {
  return (
    <ol className="flex items-end justify-between gap-1">
      {scores.map((score) => {
        const future = compareDays(score.day, today) > 0;
        const isViewed = score.day === day;
        const weekday = weekdayIndex(score.day);
        const successful = !future && isSuccessfulDay(score, settings);

        const summary = future
          ? "هنوز نرسیده"
          : `${faDuration(score.minutes, { short: true, zero: "۰ دقیقه" })} از ${faGoal(score.goalMinutes)}`;

        return (
          <li key={score.day} className="flex-1">
            {/* The rosettes are the fastest way to reach a day: the arrows walk
                one step at a time, and Wednesday is right there on screen. */}
            <button
              type="button"
              onClick={() => onSelect(score.day)}
              aria-current={isViewed ? "date" : undefined}
              aria-label={`${WEEKDAY_NAMES[weekday]} — ${summary}`}
              title={`${WEEKDAY_NAMES[weekday]} — ${summary}`}
              className={cn(
                "flex w-full flex-col items-center gap-1 rounded-lg py-1.5 transition-colors",
                isViewed ? "bg-surface-2" : "hover:bg-surface-2/70",
              )}
            >
              <DayFlower
                weekday={weekday}
                ratio={future ? null : score.ratio}
                successful={successful}
                size={26}
                decorative
              />
              <span
                className={cn(
                  "text-[10.5px] leading-none",
                  isViewed ? "font-semibold text-fg-soft" : "text-muted",
                )}
              >
                {WEEKDAY_SHORT[weekday]}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
