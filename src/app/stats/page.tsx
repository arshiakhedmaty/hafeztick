"use client";

import { useMemo, useState } from "react";
import { faNum, faPercent } from "@/lib/utils/number";
import { faClock, faDuration, faGoal } from "@/lib/utils/duration";
import { barValue } from "@/lib/utils/progress";
import { buildStatsOverview, type PeriodComparison } from "@/lib/domain/stats";
import { useApp } from "@/lib/store/AppStore";
import { Card, CardHeader, PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/ProgressRing";
import { ScreenSkeleton } from "@/components/ui/Skeleton";
import { Heatmap } from "@/components/charts/Heatmap";
import { TrendChart } from "@/components/charts/TrendChart";
import { WeekdayChart } from "@/components/charts/WeekdayChart";
import { CategoryBars } from "@/components/charts/CategoryBars";

type Range = "30" | "90" | "180";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "30", label: "۳۰ روز" },
  { value: "90", label: "۹۰ روز" },
  { value: "180", label: "۶ ماه" },
];

function Stat({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: "flame" | "target" | "check" | "calendar" | "clock";
  tone?: "accent" | "primary";
}) {
  return (
    <div className="px-1 py-3 sm:px-4">
      <p className="hz-eyebrow flex items-center gap-1.5">
        {icon && (
          <Icon
            name={icon}
            size="1em"
            className={tone === "accent" ? "text-accent" : "text-primary"}
          />
        )}
        {label}
      </p>
      <p className="hz-tnum mt-2 text-[22px] font-bold leading-none text-fg">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

/** Both sides are average minutes per scored day, so the delta is in minutes. */
function Comparison({ label, data }: { label: string; data: PeriodComparison }) {
  const { current, previous, delta } = data;
  // Five minutes is the noise floor: below it, "unchanged" is the honest word.
  const up = delta !== null && delta > 5;
  const down = delta !== null && delta < -5;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-2/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="hz-tnum mt-1 text-[15px] font-semibold text-fg">
          {current === null
            ? "—"
            : faDuration(Math.round(current), { short: true, zero: "۰" })}
          {previous !== null && (
            <span className="mr-2 text-[12px] font-normal text-muted">
              قبلاً{" "}
              {faDuration(Math.round(previous), { short: true, zero: "۰" })}
            </span>
          )}
        </p>
      </div>

      <span
        className={`hz-tnum flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
          up
            ? "bg-success/12 text-success"
            : down
              ? "bg-danger-soft text-danger"
              : "bg-surface-2 text-muted"
        }`}
      >
        <Icon
          name={up ? "arrow-up" : down ? "arrow-down" : "minus"}
          size="0.9em"
        />
        {delta === null
          ? "—"
          : faDuration(Math.abs(Math.round(delta)), { short: true, zero: "۰" })}
      </span>
    </div>
  );
}

export default function StatsPage() {
  const { data, today, ready } = useApp();
  const [range, setRange] = useState<Range>("30");

  const overview = useMemo(
    () => buildStatsOverview(data, today, Number(range)),
    [data, today, range],
  );

  if (!ready) return <ScreenSkeleton rows={3} />;

  // The screen has something to say once any time at all has been logged.
  const hasData = overview.totals.minutes > 0 || overview.totals.activeDays > 0;

  return (
    <>
      <PageHeader
        title="آمار"
        subtitle="ساعت‌های مطالعه‌ات، در گذر زمان."
        action={
          <Segmented
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
            className="w-full sm:w-64"
          />
        }
      />

      {!hasData ? (
        <EmptyState
          icon="chart"
          title="هنوز آماری برای نمایش نیست"
          description="به‌محض اینکه چند روز برنامه بچینی و زمان مطالعه‌ات را ثبت کنی، روند، نقشه‌ی پایبندی و مقایسه‌ها اینجا ساخته می‌شوند."
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-line border-y border-line lg:grid-cols-4">
            <Stat
              label="زنجیره‌ی فعلی"
              value={`${faNum(overview.streaks.current)} روز`}
              hint={`بهترین: ${faNum(overview.streaks.best)} روز`}
              icon="flame"
              tone="accent"
            />
            <Stat
              label="مجموع مطالعه"
              value={faDuration(overview.totals.minutes, {
                short: true,
                zero: "۰",
              })}
              hint={`از ${faGoal(overview.totals.goalMinutes)} هدف این بازه`}
              icon="clock"
            />
            <Stat
              label="میانگین روزانه"
              value={
                overview.totals.averageMinutes === null
                  ? "—"
                  : faDuration(Math.round(overview.totals.averageMinutes), {
                      short: true,
                      zero: "۰",
                    })
              }
              hint={
                overview.totals.averageRatio === null
                  ? `در ${faNum(overview.totals.activeDays)} روز فعال`
                  : `${faPercent(overview.totals.averageRatio)}٪ از هدف · ${faNum(
                      overview.totals.activeDays,
                    )} روز فعال`
              }
              icon="target"
            />
            <Stat
              label="روزهای موفق"
              value={faNum(overview.totals.successfulDays)}
              hint={`قانون: ${faPercent(data.settings.successThreshold)}٪ از هدف هر روز`}
              icon="check"
            />
          </div>

          <Card>
            <CardHeader
              title="بهتر شده‌ای یا نه؟"
              icon="chart"
              subtitle="مقایسه‌ی میانگین ساعت مطالعه‌ی روزانه با دوره‌ی قبل."
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Comparison label="۷ روز اخیر" data={overview.weekOverWeek} />
              <Comparison label="۳۰ روز اخیر" data={overview.monthOverMonth} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="نقشه‌ی پایبندی"
              icon="calendar"
              subtitle="هر خانه یک روز است؛ پررنگ‌تر یعنی سهم بیشتری از هدف ساعتی آن روز انجام شده."
            />
            <Heatmap scores={overview.scores} today={today} weeks={14} />
          </Card>

          <Card>
            <CardHeader
              title="روند"
              icon="chart"
              subtitle="میله‌ها سهم هر روز از هدف ساعتی خودش، و خط میانگین هفت‌روزه است."
            />
            <TrendChart
              points={overview.trend.slice(-45)}
              threshold={data.settings.successThreshold}
            />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="روزهای هفته"
                icon="calendar"
                subtitle="کدام روزها معمولاً بهتر پیش می‌روند، بر اساس هدف ساعتی خودشان."
              />
              <WeekdayChart
                stats={overview.weekdays}
                threshold={data.settings.successThreshold}
              />
            </Card>

            <Card>
              <CardHeader
                title="دسته‌ها"
                icon="target"
                subtitle="ساعت مطالعه‌ی هر دسته و سهمش از کل زمان."
              />
              <CategoryBars stats={overview.categories} />
            </Card>
          </div>

          {overview.routines.length > 0 && (
            <Card>
              <CardHeader
                title="پایبندی روتین‌ها"
                icon="repeat"
                subtitle="ساعت‌های هر روتین در ۳۰ روز گذشته و اینکه چند روز از روزهای برنامه‌ریزی‌شده‌اش انجام شده."
              />
              <ul className="space-y-3.5">
                {overview.routines.map((routine) => (
                  <li key={routine.routineId}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13px] text-fg-soft">
                        {routine.title}
                      </span>
                      <span className="hz-tnum shrink-0 text-[12px] text-muted">
                        {routine.currentStreak > 1 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-accent">
                            <Icon name="flame" size="0.85em" />
                            {faNum(routine.currentStreak)}
                          </span>
                        )}
                        <span className="text-[13px] font-semibold text-fg-soft">
                          {faDuration(routine.minutes, {
                            short: true,
                            zero: "۰",
                          })}
                        </span>
                        {routine.averageMinutes !== null && (
                          <>
                            <span className="mx-1.5 text-line-strong">·</span>
                            هر بار {faClock(Math.round(routine.averageMinutes))}
                          </>
                        )}
                        <span className="mx-1.5 text-line-strong">·</span>
                        {faNum(routine.done)} از {faNum(routine.planned)} روز
                      </span>
                    </div>
                    <ProgressBar value={barValue(routine.ratio)} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
