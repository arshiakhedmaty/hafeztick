"use client";

import { useMemo, useState } from "react";
import { compareDays, formatDay, lastDays, weekDays } from "@/lib/date/day";
import { faNum } from "@/lib/utils/number";
import type { DayKey } from "@/lib/date/day";
import type { Entry } from "@/lib/domain/types";
import { entriesForDay, overdueEntries } from "@/lib/domain/selectors";
import { isSuccessfulDay, scoreDay } from "@/lib/domain/scoring";
import { successMinutesFor } from "@/lib/domain/goals";
import { computeDayScores, comparePeriods, computeStreaks } from "@/lib/domain/stats";
import { totalMinutes } from "@/lib/domain/scoring";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ScreenSkeleton } from "@/components/ui/Skeleton";
import { EntryRow } from "@/components/tasks/EntryRow";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { RoutineDialog } from "@/components/tasks/RoutineDialog";
import { DayHeader } from "@/components/today/DayHeader";
import { DaySummary } from "@/components/today/DaySummary";
import { FlexibleSection } from "@/components/today/FlexibleSection";

export default function TodayPage() {
  const { data, actions, today, ready } = useApp();
  const toast = useToast();

  // Null means "whatever today is", so the view follows the clock over midnight
  // without an effect keeping two pieces of state in sync.
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const day = selectedDay ?? today;
  const setDay = (next: DayKey) => setSelectedDay(next === today ? null : next);

  const view = useMemo(() => {
    const entries = entriesForDay(data, day, today);
    // "Open" now means "no time logged yet" — a ticked box is no longer the
    // thing that moves an item out of the working list.
    const open = entries.filter(
      (entry) => entry.status !== "skipped" && entry.minutes === 0,
    );
    const score = scoreDay(day, entries, data.settings);
    return {
      entries,
      routines: open.filter((entry) => entry.sourceType === "routine"),
      tasks: open.filter((entry) => entry.sourceType === "task"),
      settled: entries.filter(
        (entry) => entry.status === "skipped" || entry.minutes > 0,
      ),
      score,
      successful: isSuccessfulDay(score, data.settings),
      successMinutes: successMinutesFor(data.settings, day),
    };
  }, [data, day, today]);

  const insight = useMemo(() => {
    const scores = computeDayScores(
      data.entries,
      lastDays(today, 180),
      data.settings,
    );
    return {
      streak: computeStreaks(scores, data.settings, today).current,
      weekDelta: comparePeriods(data.entries, today, 7, data.settings).delta,
    };
  }, [data.entries, data.settings, today]);

  // The week around the viewed day: its seven scores for the rosette strip,
  // and the minutes logged in it so far. Days still ahead are left out of the
  // total, so a Saturday morning does not read as a failed week.
  const week = useMemo(() => {
    const days = weekDays(day);
    const scores = computeDayScores(data.entries, days, data.settings);
    const elapsed = scores.filter(
      (score) => compareDays(score.day, day) <= 0,
    );
    return { scores, minutes: totalMinutes(elapsed) };
  }, [data.entries, data.settings, day]);

  const overdue = useMemo(
    () => (day === today ? overdueEntries(data, today) : []),
    [data, day, today],
  );

  if (!ready) return <ScreenSkeleton />;

  const isPast = compareDays(day, today) < 0;
  const isEmpty = view.entries.length === 0;
  const hasNothingAtAll =
    data.routines.length === 0 && data.tasks.length === 0 && isEmpty;

  return (
    <>
      <DayHeader day={day} today={today} onChange={setDay} />

      <DaySummary
        score={view.score}
        successMinutes={view.successMinutes}
        streak={insight.streak}
        weekDelta={insight.weekDelta}
        weekScores={week.scores}
        weekMinutes={week.minutes}
        day={day}
        today={today}
        settings={data.settings}
      />

      {overdue.length > 0 && (
        <div className="hz-rise mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/35 bg-accent-soft/60 px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] text-fg-soft">
            <Icon name="clock" size="1.1em" className="text-accent" />
            {faNum(overdue.length)} کار از روزهای گذشته باز مانده است.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              actions.moveTasks(
                overdue.map((entry) => entry.sourceId),
                today,
              );
              toast({
                message: `${faNum(overdue.length)} کار به امروز منتقل شد`,
                icon: "calendar",
                action: { label: "برگرداندن", onClick: () => actions.undo() },
              });
            }}
          >
            انتقال همه به امروز
          </Button>
        </div>
      )}

      <FlexibleSection day={day} />

      {!isPast && (
        <div className="mb-5">
          <QuickAdd day={day} />
        </div>
      )}

      {hasNothingAtAll ? (
        <EmptyState
          icon="sparkle"
          title="حافظ‌تیک آماده است"
          description="با چند روتین ساده شروع کن، یا اولین کار امروزت را بالا بنویس. برای هر کار زمانی که صرفش کرده‌ای را ثبت می‌کنی و آمار از همین ساعت‌ها ساخته می‌شود."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="primary"
                icon="sparkle"
                onClick={() => {
                  actions.loadSamplePlan();
                  toast({ message: "روتین‌های نمونه اضافه شد", icon: "sparkle" });
                }}
              >
                شروع با برنامه‌ی نمونه
              </Button>
              <Button
                variant="outline"
                icon="plus"
                onClick={() => setRoutineDialogOpen(true)}
              >
                ساخت روتین
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          {view.routines.length > 0 && (
            <section>
              <SectionTitle count={view.routines.length}>
                روتین‌های امروز
              </SectionTitle>
              <ul className="hz-stagger">
                {view.routines.map((entry, index) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    index={index}
                    editable={!isPast}
                  />
                ))}
              </ul>
            </section>
          )}

          {view.tasks.length > 0 && (
            <section>
              <SectionTitle count={view.tasks.length}>کارهای این روز</SectionTitle>
              <ul className="hz-stagger">
                {view.tasks.map((entry, index) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    index={index}
                    editable={!isPast}
                    onEdit={(item: Entry) => setEditingTaskId(item.sourceId)}
                  />
                ))}
              </ul>
            </section>
          )}

          {view.routines.length === 0 && view.tasks.length === 0 && !isEmpty && (
            <EmptyState
              compact
              icon="check"
              title="برای همه‌ی کارهای این روز زمان ثبت شد"
              description="چیزی بدون زمان باقی نمانده."
            />
          )}

          {isEmpty && !hasNothingAtAll && (
            <EmptyState
              compact
              icon="calendar"
              title="برای این روز برنامه‌ای نیست"
              description={`${formatDay(day, { withWeekday: true })} خالی است.`}
            />
          )}

          {view.settled.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowDone((value) => !value)}
                className="mb-2 flex w-full items-center gap-2 px-1 text-[13px] font-medium text-muted transition-colors hover:text-fg-soft"
              >
                <Icon
                  name={showDone ? "chevron-start" : "chevron-end"}
                  size="1em"
                />
                ثبت‌شده‌ها
                <span className="hz-tnum rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px]">
                  {faNum(view.settled.length)}
                </span>
              </button>
              {showDone && (
                <ul className="hz-stagger">
                  {view.settled.map((entry, index) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      index={index}
                      editable={!isPast}
                      onEdit={(item: Entry) => setEditingTaskId(item.sourceId)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      <TaskDialog
        open={editingTaskId !== null}
        taskId={editingTaskId}
        onClose={() => setEditingTaskId(null)}
      />
      <RoutineDialog
        open={routineDialogOpen}
        onClose={() => setRoutineDialogOpen(false)}
      />
    </>
  );
}
