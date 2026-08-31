"use client";

import { useMemo, useState } from "react";
import {
  type DayKey,
  addDays,
  compareDays,
  formatDay,
  formatMonth,
  startOfWeek,
  weekDays,
} from "@/lib/date/day";
import { faNum, faPercent } from "@/lib/utils/number";
import { faDuration, faGoal } from "@/lib/utils/duration";
import { barValue, progressTone } from "@/lib/utils/progress";
import { computeDayScores } from "@/lib/domain/stats";
import { flexibleProgressForWeek, scoreWeek } from "@/lib/domain/scoring";
import { backlogTasks } from "@/lib/domain/selectors";
import type { Entry } from "@/lib/domain/types";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, CardHeader, PageHeader, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressRing";
import { ScreenSkeleton } from "@/components/ui/Skeleton";
import { Menu } from "@/components/ui/Menu";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { LogTimeDialog } from "@/components/tasks/LogTimeDialog";
import { DayColumn } from "@/components/week/DayColumn";

export default function WeekPage() {
  const { data, actions, today, ready } = useApp();
  const toast = useToast();

  // Null anchors the board to the current week, so it follows the clock.
  const [selectedAnchor, setSelectedAnchor] = useState<DayKey | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    taskId: string | null;
    day: DayKey | null;
  }>({ open: false, taskId: null, day: null });
  const [logging, setLogging] = useState<Entry | null>(null);

  const anchor = selectedAnchor ?? today;
  const days = useMemo(() => weekDays(anchor), [anchor]);
  const setAnchor = (next: DayKey) =>
    setSelectedAnchor(startOfWeek(next) === startOfWeek(today) ? null : next);

  const summary = useMemo(() => {
    // The headline is the hours studied so far this week, not a percentage:
    // «۱۰ ساعت تا امروز» is the number a student actually keeps in their head.
    // Days still ahead are excluded from it, so a Saturday morning does not
    // read as a failed week.
    const scores = computeDayScores(data.entries, days, data.settings);
    const week = scoreWeek(scores, data.settings);

    const elapsed = scores.filter(
      (score) => compareDays(score.day, today) <= 0,
    );
    const toDate = scoreWeek(elapsed, data.settings);

    const previousDays = weekDays(addDays(days[0], -7));
    const previous = scoreWeek(
      computeDayScores(data.entries, previousDays, data.settings),
      data.settings,
    );

    return {
      week,
      toDate,
      flexible: flexibleProgressForWeek(data.routines, data.entries, days),
      delta: toDate.minutes - previous.minutes,
      previousMinutes: previous.minutes,
    };
  }, [data, days, today]);

  const backlog = useMemo(() => backlogTasks(data), [data]);
  const isCurrentWeek = startOfWeek(today) === days[0];

  if (!ready) return <ScreenSkeleton rows={4} />;

  const { week, toDate, delta, flexible } = summary;
  // Before today arrives in this week, the "so far" figure is the whole week.
  const elapsed = isCurrentWeek ? toDate : week;

  return (
    <>
      <PageHeader
        title={isCurrentWeek ? "این هفته" : "هفته"}
        subtitle={`${formatDay(days[0])} تا ${formatDay(days[6])} · ${formatMonth(days[6])}`}
        action={
          <div className="flex shrink-0 items-center gap-1">
            {!isCurrentWeek && (
              <Button size="sm" variant="soft" onClick={() => setAnchor(today)}>
                این هفته
              </Button>
            )}
            <IconButton
              icon="chevron-end"
              label="هفته‌ی قبل"
              size="sm"
              variant="outline"
              onClick={() => setAnchor(addDays(days[0], -7))}
            />
            <IconButton
              icon="chevron-start"
              label="هفته‌ی بعد"
              size="sm"
              variant="outline"
              onClick={() => setAnchor(addDays(days[0], 7))}
            />
          </div>
        }
      />

      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div>
            <p className="text-[11px] text-muted">
              {isCurrentWeek ? "ساعت مطالعه هفته تا امروز" : "ساعت مطالعه هفته"}
            </p>
            <p className="hz-tnum mt-1 text-3xl font-bold leading-none text-fg">
              {faDuration(elapsed.minutes, { short: true, zero: "۰ ساعت" })}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted">هدف هفته</p>
            <p className="hz-tnum mt-1 text-lg font-semibold text-fg">
              {faGoal(week.goalMinutes)}
              {week.ratio !== null && (
                <span className="text-[12px] font-normal text-muted">
                  {" "}
                  · {faPercent(week.ratio)}٪
                </span>
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted">روزهای موفق</p>
            <p className="hz-tnum mt-1 text-lg font-semibold text-fg">
              {faNum(week.successfulDays)}
              <span className="text-[12px] font-normal text-muted">
                {" "}
                از {faNum(week.plannedDays)}
              </span>
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted">نسبت به هفته‌ی قبل</p>
            <p className="hz-tnum mt-1 flex items-center gap-1 text-lg font-semibold">
              <span
                className={
                  delta > 5
                    ? "flex items-center gap-1 text-success"
                    : delta < -5
                      ? "flex items-center gap-1 text-danger"
                      : "flex items-center gap-1 text-muted"
                }
              >
                <Icon
                  name={
                    delta > 5 ? "arrow-up" : delta < -5 ? "arrow-down" : "minus"
                  }
                  size="0.85em"
                />
                {faDuration(Math.abs(delta), { short: true, zero: "۰" })}
              </span>
            </p>
          </div>
        </div>

        <ProgressBar
          value={barValue(week.ratio)}
          className="mt-4"
          tone={progressTone(week.ratio)}
        />

        {flexible.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3">
            <span className="text-[11px] text-muted">سهم‌های هفتگی:</span>
            {flexible.map((item) => {
              const complete = item.done >= item.target;
              return (
                <span
                  key={item.routineId}
                  className="flex items-center gap-2 text-[12px] text-fg-soft"
                >
                  {item.title}
                  <span className="hz-tnum text-muted">
                    {faNum(item.done)}/{faNum(item.target)} ·{" "}
                    {faDuration(item.minutes, { short: true, zero: "۰" })}
                  </span>
                  <span className="flex gap-1" aria-hidden="true">
                    {Array.from({ length: item.target }, (_, index) => (
                      <span
                        key={index}
                        className={`size-1.5 rounded-full ${
                          index < item.done
                            ? complete
                              ? "bg-accent"
                              : "bg-primary"
                            : "bg-line-strong"
                        }`}
                      />
                    ))}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </Card>

      <SectionTitle>روزهای هفته</SectionTitle>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => (
          <DayColumn
            key={day}
            day={day}
            today={today}
            onAdd={(target) => setDialog({ open: true, taskId: null, day: target })}
            onLog={setLogging}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          title="سبد کارها"
          icon="inbox"
          subtitle="کارهایی که هنوز تاریخ ندارند. هر وقت خواستی به یک روز بسپارشان."
        />

        <QuickAdd day={null} placeholder="کاری که فعلاً تاریخ ندارد…" />

        {backlog.length === 0 ? (
          <EmptyState
            compact
            icon="inbox"
            title="سبد خالی است"
            description="ایده‌ها و کارهای بی‌تاریخ اینجا جمع می‌شوند."
          />
        ) : (
          <ul className="mt-3 space-y-1">
            {backlog.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-2 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-line hover:bg-surface-2/60"
              >
                <button
                  type="button"
                  onClick={() =>
                    setDialog({ open: true, taskId: task.id, day: null })
                  }
                  className="min-w-0 flex-1 truncate text-start text-[13.5px] text-fg-soft transition-colors hover:text-fg"
                >
                  {task.title}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    actions.moveTask(task.id, today);
                    toast({ message: "به امروز اضافه شد", icon: "calendar" });
                  }}
                >
                  امروز
                </Button>
                <Menu
                  items={[
                    {
                      label: "فردا",
                      icon: "calendar",
                      onClick: () => {
                        actions.moveTask(task.id, addDays(today, 1));
                        toast({ message: "به فردا منتقل شد", icon: "calendar" });
                      },
                    },
                    {
                      label: "ویرایش",
                      icon: "pencil",
                      onClick: () =>
                        setDialog({ open: true, taskId: task.id, day: null }),
                    },
                    {
                      label: "حذف",
                      icon: "trash",
                      danger: true,
                      onClick: () => {
                        actions.deleteTask(task.id);
                        toast({
                          message: "کار حذف شد",
                          icon: "trash",
                          action: {
                            label: "برگرداندن",
                            onClick: () => actions.undo(),
                          },
                        });
                      },
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <TaskDialog
        open={dialog.open}
        taskId={dialog.taskId}
        defaultDay={dialog.day}
        onClose={() => setDialog({ open: false, taskId: null, day: null })}
      />

      <LogTimeDialog entry={logging} onClose={() => setLogging(null)} />
    </>
  );
}
