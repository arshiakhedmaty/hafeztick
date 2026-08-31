"use client";

import { faNum, faPercent } from "@/lib/utils/number";
import { faDuration } from "@/lib/utils/duration";
import { weekdayIndex } from "@/lib/date/day";
import type { DayScore } from "@/lib/domain/scoring";
import { Icon } from "@/components/ui/Icon";
import { DayFlower } from "@/components/week/DayFlower";
import { ActivityRings, type RingDatum } from "./ActivityRings";

export interface RingTotals {
  minutes: number;
  goalMinutes: number;
}

function message(score: DayScore, successMinutes: number): string {
  if (score.goalMinutes === 0) return "برای این روز هدف ساعتی تعیین نشده است.";
  if (score.minutes === 0) return "هنوز زمانی برای امروز ثبت نکرده‌ای.";

  const over = score.minutes - score.goalMinutes;
  if (over > 0) {
    return `${faDuration(over, { short: true })} بیشتر از هدف امروز — دور دوم شروع شده.`;
  }
  if (over === 0) return "هدف ساعتی امروز دقیقاً کامل شد.";

  const toSuccess = successMinutes - score.minutes;
  if (toSuccess <= 0) {
    return `به هدف امروز رسیدی؛ ${faDuration(-over, { short: true })} تا هدف کامل مانده.`;
  }
  return `${faDuration(toSuccess, { short: true })} دیگر تا «روز موفق» مانده.`;
}

/** The day's headline: three rings — today, its week, its thirty days. */
export function DaySummary({
  score,
  successMinutes,
  successful,
  streak,
  weekDelta,
  week,
  month,
}: {
  score: DayScore;
  /** Minutes needed to make this day count as successful. */
  successMinutes: number;
  successful: boolean;
  streak: number;
  /** Difference in average daily minutes against the previous week. */
  weekDelta: number | null;
  week: RingTotals;
  month: RingTotals;
}) {
  const ratio = score.ratio;
  const complete = ratio !== null && ratio >= 1;
  const remaining = Math.max(0, score.goalMinutes - score.minutes);

  const rings: RingDatum[] = [
    {
      label: "امروز",
      minutes: score.minutes,
      goalMinutes: score.goalMinutes,
      size: 152,
      // One mark per hour the day asks for — countable at this scale.
      ticks: Math.round(score.goalMinutes / 60),
    },
    // Each step in leaves a clear 8px of paper between the tracks.
    { label: "این هفته", ...week, size: 112 },
    { label: "۳۰ روز", ...month, size: 72 },
  ];

  return (
    <section
      className={`mb-6 rounded-card border border-line bg-surface p-5 sm:p-6 ${
        complete ? "hz-glow" : ""
      }`}
    >
      <ActivityRings data={rings} />

      <p className="mt-5 flex items-start justify-between gap-3 border-t border-line pt-4 text-[14px] leading-relaxed text-fg-soft">
        <span className="min-w-0">{message(score, successMinutes)}</span>
        <DayFlower
          weekday={weekdayIndex(score.day)}
          ratio={ratio}
          successful={successful}
          size={40}
          className="-mt-0.5"
        />
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-x-4">
        <div>
          <dt className="hz-eyebrow">پیشرفت امروز</dt>
          <dd className="hz-tnum mt-1 text-[15px] font-semibold text-fg">
            {ratio === null ? "—" : `${faPercent(ratio)}٪`}
            {remaining > 0 && (
              <span className="text-[12px] font-normal text-muted">
                {" "}
                · {faDuration(remaining, { short: true })} مانده
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt className="hz-eyebrow">زنجیره</dt>
          <dd className="hz-tnum mt-1 flex items-center gap-1 text-[15px] font-semibold text-fg">
            <Icon
              name="flame"
              size="0.95em"
              className={streak > 0 ? "text-accent" : "text-muted/50"}
            />
            {faNum(streak)}
            <span className="text-[12px] font-normal text-muted">روز</span>
          </dd>
        </div>

        <div>
          <dt className="hz-eyebrow">میانگین هفته</dt>
          <dd className="hz-tnum mt-1 flex items-center gap-1 text-[15px] font-semibold">
            {weekDelta === null ? (
              <span className="text-muted">—</span>
            ) : (
              <span
                className={
                  weekDelta > 1
                    ? "flex items-center gap-1 text-success"
                    : weekDelta < -1
                      ? "flex items-center gap-1 text-danger"
                      : "flex items-center gap-1 text-muted"
                }
              >
                <Icon
                  name={
                    weekDelta > 1
                      ? "arrow-up"
                      : weekDelta < -1
                        ? "arrow-down"
                        : "minus"
                  }
                  size="0.9em"
                />
                {faDuration(Math.abs(weekDelta), { short: true, zero: "۰" })}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
