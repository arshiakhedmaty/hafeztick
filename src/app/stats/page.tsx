"use client";

import { useMemo, useState } from "react";
import { faNum, faPercent } from "@/lib/utils/number";
import { buildStatsOverview, type PeriodComparison } from "@/lib/domain/stats";
import { useApp } from "@/lib/store/AppStore";
import { Card, CardHeader } from "@/components/ui/Card";
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
  icon?: "flame" | "target" | "check" | "calendar";
  tone?: "accent" | "primary";
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
        {icon && (
          <Icon
            name={icon}
            size="1em"
            className={tone === "accent" ? "text-accent" : "text-primary"}
          />
        )}
        {label}
      </p>
      <p className="hz-tnum mt-1.5 text-xl font-bold leading-none text-fg">{value}</p>
      {hint && <p className="mt-1.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

function Comparison({ label, data }: { label: string; data: PeriodComparison }) {
  const { current, previous, delta } = data;
  const up = delta !== null && delta > 0.005;
  const down = delta !== null && delta < -0.005;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-2/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="hz-tnum mt-1 text-[15px] font-semibold text-fg">
          {current === null ? "—" : `${faPercent(current)}٪`}
          {previous !== null && (
            <span className="mr-2 text-[12px] font-normal text-muted">
              قبلاً {faPercent(previous)}٪
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
        {delta === null ? "—" : `${faPercent(Math.abs(delta))}٪`}
      </span>
    </div>
  );
}

export default function StatsPage() {
  const { data, today, ready } = useApp();
  const [range, setRange] = useState<Range>("90");

  const overview = useMemo(
    () => buildStatsOverview(data, today, Number(range)),
    [data, today, range],
  );

  if (!ready) return <ScreenSkeleton rows={3} />;

  const hasData = overview.totals.plannedEntries > 0;

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-fg sm:text-2xl">آمار</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            پایبندی‌ات به برنامه، در گذر زمان.
          </p>
        </div>
        <Segmented
          value={range}
          options={RANGE_OPTIONS}
          onChange={setRange}
          className="w-full sm:w-64"
        />
      </header>

      {!hasData ? (
        <EmptyState
          icon="chart"
          title="هنوز آماری برای نمایش نیست"
          description="به‌محض اینکه چند روز برنامه بچینی و تیک بزنی، روند، نقشه‌ی پایبندی و مقایسه‌ها اینجا ساخته می‌شوند."
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="زنجیره‌ی فعلی"
              value={`${faNum(overview.streaks.current)} روز`}
              hint={`بهترین: ${faNum(overview.streaks.best)} روز`}
              icon="flame"
              tone="accent"
            />
            <Stat
              label="میانگین پایبندی"
              value={
                overview.totals.averageRatio === null
                  ? "—"
                  : `${faPercent(overview.totals.averageRatio)}٪`
              }
              hint={`در ${faNum(overview.totals.activeDays)} روز فعال`}
              icon="target"
            />
            <Stat
              label="روزهای موفق"
              value={faNum(overview.totals.successfulDays)}
              hint={`هدف روزانه: ${faPercent(data.settings.dailyGoal)}٪`}
              icon="check"
            />
            <Stat
              label="کارهای انجام‌شده"
              value={faNum(overview.totals.doneEntries)}
              hint={`از ${faNum(overview.totals.plannedEntries)} کار برنامه‌ریزی‌شده`}
              icon="calendar"
            />
          </div>

          <Card>
            <CardHeader
              title="بهتر شده‌ای یا نه؟"
              icon="chart"
              subtitle="مقایسه‌ی میانگین پایبندی با دوره‌ی قبل."
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
              subtitle="هر خانه یک روز است؛ پررنگ‌تر یعنی بیشتر به برنامه پایبند بوده‌ای."
            />
            <Heatmap scores={overview.scores} today={today} weeks={14} />
          </Card>

          <Card>
            <CardHeader
              title="روند"
              icon="chart"
              subtitle="میله‌ها نمره‌ی هر روز و خط، میانگین هفت‌روزه است."
            />
            <TrendChart
              points={overview.trend.slice(-45)}
              goal={data.settings.dailyGoal}
            />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="روزهای هفته"
                icon="calendar"
                subtitle="کدام روزها معمولاً بهتر پیش می‌روند."
              />
              <WeekdayChart stats={overview.weekdays} />
            </Card>

            <Card>
              <CardHeader
                title="دسته‌ها"
                icon="target"
                subtitle="سهم هر دسته از کارها و میزان تکمیل آن."
              />
              <CategoryBars stats={overview.categories} />
            </Card>
          </div>

          {overview.routines.length > 0 && (
            <Card>
              <CardHeader
                title="پایبندی روتین‌ها"
                icon="repeat"
                subtitle="عملکرد هر روتین در ۳۰ روز گذشته."
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
                        {faNum(routine.done)} از {faNum(routine.planned)}
                        <span className="mx-1.5 text-line-strong">·</span>
                        <span className="text-fg-soft">
                          {faPercent(routine.ratio ?? 0)}٪
                        </span>
                      </span>
                    </div>
                    <ProgressBar value={routine.ratio ?? 0} />
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
