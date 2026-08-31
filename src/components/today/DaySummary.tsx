"use client";

import { faNum, faPercent } from "@/lib/utils/number";
import { faClock, faDuration, faGoal } from "@/lib/utils/duration";
import type { DayKey } from "@/lib/date/day";
import type { DayScore } from "@/lib/domain/scoring";
import type { Settings } from "@/lib/domain/types";
import { Icon } from "@/components/ui/Icon";
import { DayDial } from "./DayDial";
import { WeekStrip } from "./WeekStrip";

function message(score: DayScore, successMinutes: number): string {
  if (score.goalMinutes === 0) return "برای این روز هدف ساعتی تعیین نشده است.";
  if (score.minutes === 0) return "هنوز زمانی برای امروز ثبت نکرده‌ای.";

  const over = score.minutes - score.goalMinutes;
  if (over > 0) {
    return `${faDuration(over, { short: true })} بیشتر از هدف امروز.`;
  }
  if (over === 0) return "هدف ساعتی امروز دقیقاً کامل شد.";

  const toSuccess = successMinutes - score.minutes;
  if (toSuccess <= 0) {
    return `به هدف امروز رسیدی؛ ${faDuration(-over, { short: true })} تا هدف کامل مانده.`;
  }
  return `${faDuration(toSuccess, { short: true })} دیگر تا «روز موفق» مانده.`;
}

/**
 * The day's headline.
 *
 * One dial, because there is only one question here: how many of today's hours
 * are done. The week arrives as a row of rosettes rather than a second ring —
 * a week's shape is read faster than a figure that would mostly be today's
 * again, which is what made three nested rings say the same thing three times.
 */
export function DaySummary({
  score,
  successMinutes,
  streak,
  weekDelta,
  weekScores,
  weekMinutes,
  day,
  today,
  settings,
}: {
  score: DayScore;
  /** Minutes needed to make this day count as successful. */
  successMinutes: number;
  streak: number;
  /** Difference in average daily minutes against the previous week. */
  weekDelta: number | null;
  /** Saturday through Friday of the viewed day's week. */
  weekScores: DayScore[];
  /** Minutes logged in that week up to and including the viewed day. */
  weekMinutes: number;
  day: DayKey;
  today: DayKey;
  settings: Pick<Settings, "successThreshold">;
}) {
  const ratio = score.ratio;
  const complete = ratio !== null && ratio >= 1;
  const remaining = Math.max(0, score.goalMinutes - score.minutes);

  return (
    <section
      className={`mb-6 rounded-card border border-line bg-surface p-5 sm:p-6 ${
        complete ? "hz-glow" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
        <DayDial minutes={score.minutes} goalMinutes={score.goalMinutes}>
          <div>
            <span
              className="hz-display hz-tnum block text-[34px] leading-none text-fg"
              title={faDuration(score.minutes, { zero: "بدون زمان" })}
            >
              {faClock(score.minutes)}
            </span>
            <span className="mt-1.5 block text-[10.5px] text-muted">
              {score.goalMinutes === 0 ? "بدون هدف" : `از ${faGoal(score.goalMinutes)}`}
            </span>
          </div>
        </DayDial>

        <div className="min-w-0 flex-1 text-center sm:text-start">
          <p className="text-[14.5px] leading-relaxed text-fg-soft">
            {message(score, successMinutes)}
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-x-4">
            <div>
              <dt className="hz-eyebrow">پیشرفت</dt>
              <dd className="hz-tnum mt-1 text-[16px] font-semibold text-fg">
                {ratio === null ? "—" : `${faPercent(ratio)}٪`}
              </dd>
              <dd className="hz-tnum mt-0.5 text-[11px] text-muted">
                {remaining > 0
                  ? `${faDuration(remaining, { short: true })} مانده`
                  : "‌"}
              </dd>
            </div>

            <div>
              <dt className="hz-eyebrow">زنجیره</dt>
              <dd className="hz-tnum mt-1 flex items-center gap-1 text-[16px] font-semibold text-fg">
                <Icon
                  name="flame"
                  size="0.9em"
                  className={streak > 0 ? "text-accent" : "text-muted/50"}
                />
                {faNum(streak)}
              </dd>
              <dd className="hz-tnum mt-0.5 text-[11px] text-muted">روز پیاپی</dd>
            </div>

            <div>
              <dt className="hz-eyebrow">این هفته</dt>
              <dd className="hz-tnum mt-1 text-[16px] font-semibold text-fg">
                {faDuration(weekMinutes, { short: true, zero: "۰" })}
              </dd>
              <dd className="hz-tnum mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                {weekDelta === null ? (
                  "—"
                ) : (
                  <>
                    <Icon
                      name={
                        weekDelta > 1
                          ? "arrow-up"
                          : weekDelta < -1
                            ? "arrow-down"
                            : "minus"
                      }
                      size="0.95em"
                      className={
                        weekDelta > 1
                          ? "text-success"
                          : weekDelta < -1
                            ? "text-danger"
                            : "text-muted"
                      }
                    />
                    {faDuration(Math.abs(weekDelta), { short: true, zero: "۰" })} در
                    روز
                  </>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-3">
        <WeekStrip
          scores={weekScores}
          day={day}
          today={today}
          settings={settings}
        />
      </div>
    </section>
  );
}
