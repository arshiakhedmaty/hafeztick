"use client";

import { faNum, faPercent } from "@/lib/utils/number";
import { faClock, faDuration, faGoal } from "@/lib/utils/duration";
import { progressTone } from "@/lib/utils/progress";
import { weekdayIndex } from "@/lib/date/day";
import type { DayScore } from "@/lib/domain/scoring";
import { Icon } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { DayFlower } from "@/components/week/DayFlower";

function message(score: DayScore, successMinutes: number): string {
  if (score.goalMinutes === 0) return "برای این روز هدف ساعتی تعیین نشده است.";
  if (score.minutes === 0) return "هنوز زمانی برای امروز ثبت نکرده‌ای.";

  const remaining = score.goalMinutes - score.minutes;
  if (remaining <= 0) return "هدف ساعتی امروز کامل شد.";

  const toSuccess = successMinutes - score.minutes;
  if (toSuccess <= 0) {
    return `به هدف امروز رسیدی؛ ${faDuration(remaining, { short: true })} تا هدف کامل مانده.`;
  }
  return `${faDuration(toSuccess, { short: true })} دیگر تا «روز موفق» مانده.`;
}

/** The day's headline: hours studied against the hours this day asked for. */
export function DaySummary({
  score,
  successMinutes,
  successful,
  streak,
  weekDelta,
}: {
  score: DayScore;
  /** Minutes needed to make this day count as successful. */
  successMinutes: number;
  successful: boolean;
  streak: number;
  /** Difference in average daily minutes against the previous week. */
  weekDelta: number | null;
}) {
  const ratio = score.ratio;
  const complete = ratio !== null && ratio >= 1;
  const remaining = Math.max(0, score.goalMinutes - score.minutes);
  // One tick per hour asked for; a half hour still earns its own mark.
  const hourTicks = Math.round(score.goalMinutes / 60);

  return (
    <section
      className={`mb-6 rounded-card border border-line bg-surface p-5 sm:p-6 ${
        complete ? "hz-glow" : ""
      }`}
    >
      <div className="flex items-center gap-5 sm:gap-6">
        <ProgressRing
          value={ratio}
          size={124}
          stroke={10}
          ticks={hourTicks}
          tone={progressTone(ratio)}
        >
          <div title={faDuration(score.minutes, { zero: "بدون زمان" })}>
            <span className="hz-display hz-tnum block text-[30px] leading-none text-fg">
              {faClock(score.minutes)}
            </span>
            <span className="mt-1.5 block text-[10.5px] text-muted">
              {score.goalMinutes === 0
                ? "بدون هدف"
                : `از ${faGoal(score.goalMinutes)}`}
            </span>
          </div>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[14px] leading-relaxed text-fg-soft">
              {message(score, successMinutes)}
            </p>
            <DayFlower
              weekday={weekdayIndex(score.day)}
              ratio={ratio}
              successful={successful}
              size={46}
              className="mt-0.5"
            />
          </div>

          <dl className="mt-5 hidden grid-cols-3 gap-x-4 gap-y-1 border-t border-line pt-4 sm:grid">
            <div>
              <dt className="hz-eyebrow">پیشرفت هدف</dt>
              <dd className="hz-tnum mt-1 text-[15px] font-semibold text-fg">
                {ratio === null ? "—" : `${faPercent(ratio)}٪`}
              </dd>
              {remaining > 0 && (
                <dd className="hz-tnum mt-0.5 text-[11px] text-muted">
                  {faDuration(remaining, { short: true })} مانده
                </dd>
              )}
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
        </div>
      </div>

      {/* Below the breakpoint the same figures run the full width of the card,
          where the labels have room to sit on one line. */}
      <dl className="mt-5 grid grid-cols-3 gap-x-4 border-t border-line pt-4 sm:hidden">
        <div>
          <dt className="hz-eyebrow">پیشرفت</dt>
          <dd className="hz-tnum mt-1 text-[15px] font-semibold text-fg">
            {ratio === null ? "—" : `${faPercent(ratio)}٪`}
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
          </dd>
        </div>
        <div>
          <dt className="hz-eyebrow">مانده</dt>
          <dd className="hz-tnum mt-1 text-[15px] font-semibold text-fg">
            {remaining > 0
              ? faDuration(remaining, { short: true })
              : score.goalMinutes === 0
                ? "—"
                : "۰"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
