"use client";

import { faNum, faPercent } from "@/lib/utils/number";
import type { DayScore } from "@/lib/domain/scoring";
import { Icon } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";

function message(ratio: number | null, goal: number, remaining: number): string {
  if (ratio === null) return "برای این روز هنوز برنامه‌ای نداری.";
  if (ratio >= 1) return "تمام برنامه‌ی امروز انجام شد.";
  if (ratio >= goal) return "به هدف امروز رسیدی؛ باقی‌اش امتیاز اضافه است.";
  if (ratio === 0) return "اولین تیک سخت‌ترین تیک است.";
  return `${faNum(remaining)} کار تا پایان برنامه‌ی امروز مانده.`;
}

/** The day's headline: one ring, three numbers, one sentence. */
export function DaySummary({
  score,
  goal,
  streak,
  weekDelta,
}: {
  score: DayScore;
  goal: number;
  streak: number;
  weekDelta: number | null;
}) {
  const ratio = score.ratio;
  const complete = ratio !== null && ratio >= 1;
  const remaining = score.totalCount - score.doneCount;

  return (
    <section
      className={`mb-5 flex items-center gap-5 rounded-card border border-line bg-surface p-5 shadow-card ${
        complete ? "hz-glow" : ""
      }`}
    >
      <ProgressRing
        value={ratio}
        size={112}
        stroke={9}
        tone={complete ? "accent" : "primary"}
      >
        <div>
          <span className="hz-tnum block text-2xl font-bold leading-none text-fg">
            {ratio === null ? "—" : faPercent(ratio)}
          </span>
          <span className="mt-1 block text-[11px] text-muted">درصد روز</span>
        </div>
      </ProgressRing>

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-relaxed text-fg-soft">
          {message(ratio, goal, remaining)}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <dt className="text-[11px] text-muted">انجام‌شده</dt>
            <dd className="hz-tnum mt-0.5 text-[15px] font-semibold text-fg">
              {faNum(score.doneCount)}
              <span className="text-[12px] font-normal text-muted">
                {" "}
                از {faNum(score.totalCount)}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-[11px] text-muted">زنجیره</dt>
            <dd className="hz-tnum mt-0.5 flex items-center gap-1 text-[15px] font-semibold text-fg">
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
            <dt className="text-[11px] text-muted">نسبت به هفته‌ی قبل</dt>
            <dd className="hz-tnum mt-0.5 flex items-center gap-1 text-[15px] font-semibold">
              {weekDelta === null ? (
                <span className="text-muted">—</span>
              ) : (
                <span
                  className={
                    weekDelta > 0.005
                      ? "flex items-center gap-1 text-success"
                      : weekDelta < -0.005
                        ? "flex items-center gap-1 text-danger"
                        : "flex items-center gap-1 text-muted"
                  }
                >
                  <Icon
                    name={
                      weekDelta > 0.005
                        ? "arrow-up"
                        : weekDelta < -0.005
                          ? "arrow-down"
                          : "minus"
                    }
                    size="0.9em"
                  />
                  {faPercent(Math.abs(weekDelta))}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
