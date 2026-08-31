"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum, faPercent } from "@/lib/utils/number";
import { faClock, faDuration } from "@/lib/utils/duration";
import { barValue } from "@/lib/utils/progress";
import { lastDays } from "@/lib/date/day";
import { categoryVar } from "@/lib/utils/colors";
import { repeatLabel } from "@/lib/domain/labels";
import { activeRoutines, archivedRoutines, categoryById } from "@/lib/domain/selectors";
import { routineConsistency } from "@/lib/domain/stats";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { ProgressBar } from "@/components/ui/ProgressRing";
import { ScreenSkeleton } from "@/components/ui/Skeleton";
import { RoutineDialog } from "@/components/tasks/RoutineDialog";

export default function RoutinesPage() {
  const { data, actions, today, ready } = useApp();
  const toast = useToast();

  const [dialog, setDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [showArchived, setShowArchived] = useState(false);

  const active = useMemo(() => activeRoutines(data), [data]);
  const archived = useMemo(() => archivedRoutines(data), [data]);
  const consistency = useMemo(
    () => routineConsistency(data, lastDays(today, 30)),
    [data, today],
  );
  const statsById = useMemo(
    () => new Map(consistency.map((stat) => [stat.routineId, stat])),
    [consistency],
  );

  if (!ready) return <ScreenSkeleton rows={4} />;

  return (
    <>
      <PageHeader
        title="روتین‌ها"
        subtitle="کارهای تکرارشونده‌ای که ساعت‌های مطالعه‌ات را می‌سازند."
        action={
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setDialog({ open: true, id: null })}
          >
            روتین جدید
          </Button>
        }
      />

      {active.length === 0 ? (
        <EmptyState
          icon="repeat"
          title="هنوز روتینی نساخته‌ای"
          description="روتین‌ها ستون فقرات برنامه‌اند: کاری که تکرار می‌شود، عادت می‌سازد و در آمار دیده می‌شود."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="primary"
                icon="plus"
                onClick={() => setDialog({ open: true, id: null })}
              >
                ساخت اولین روتین
              </Button>
              <Button
                variant="outline"
                icon="sparkle"
                onClick={() => {
                  actions.loadSamplePlan();
                  toast({ message: "روتین‌های نمونه اضافه شد", icon: "sparkle" });
                }}
              >
                برنامه‌ی نمونه
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-2">
          {active.map((routine) => {
            const category = categoryById(data, routine.categoryId);
            const stat = statsById.get(routine.id);
            const color = categoryVar(category?.color);

            return (
              <Card key={routine.id} padded={false} className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-[14.5px] font-medium text-fg">
                        {routine.title}
                      </h2>
                      {routine.priority === "high" && (
                        <Icon name="flame" size="0.9em" className="text-accent" />
                      )}
                    </div>

                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
                      <span>{repeatLabel(routine.repeat)}</span>
                      {category && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{category.name}</span>
                        </>
                      )}
                      {stat && stat.currentStreak > 1 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-accent">
                            <Icon name="flame" size="0.85em" />
                            {faNum(stat.currentStreak)} روز پیاپی
                          </span>
                        </>
                      )}
                    </p>

                    {routine.note && (
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted">
                        {routine.note}
                      </p>
                    )}

                    {stat && (stat.planned > 0 || stat.minutes > 0) && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <ProgressBar
                          value={barValue(stat.ratio)}
                          className="max-w-56 flex-1"
                        />
                        <span className="hz-tnum shrink-0 text-[11px] text-muted">
                          {faDuration(stat.minutes, { short: true, zero: "۰" })} در
                          ۳۰ روز اخیر
                          {stat.averageMinutes !== null && (
                            <> · هر بار {faClock(Math.round(stat.averageMinutes))}</>
                          )}
                          {stat.ratio !== null && (
                            <> · {faPercent(stat.ratio)}٪ از روزها</>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <Menu
                    items={[
                      {
                        label: "ویرایش",
                        icon: "pencil",
                        onClick: () => setDialog({ open: true, id: routine.id }),
                      },
                      {
                        label: "آرشیو",
                        icon: "archive",
                        onClick: () => {
                          actions.archiveRoutine(routine.id, true);
                          toast({ message: "به آرشیو رفت", icon: "archive" });
                        },
                      },
                      {
                        label: "حذف",
                        icon: "trash",
                        danger: true,
                        onClick: () => {
                          actions.deleteRoutine(routine.id);
                          toast({
                            message: "روتین حذف شد؛ سابقه‌ی گذشته باقی می‌ماند",
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
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <section className="mt-8">
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            className="mb-2 flex items-center gap-2 px-1 text-[13px] font-medium text-muted transition-colors hover:text-fg-soft"
          >
            <Icon name={showArchived ? "chevron-start" : "chevron-end"} size="1em" />
            آرشیو
            <span className="hz-tnum rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px]">
              {faNum(archived.length)}
            </span>
          </button>

          {showArchived && (
            <div className="space-y-2">
              {archived.map((routine) => (
                <div
                  key={routine.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-fg-soft">
                      {routine.title}
                    </span>
                    <span className="block text-[11.5px] text-muted">
                      {repeatLabel(routine.repeat)}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => actions.archiveRoutine(routine.id, false)}
                  >
                    بازگردانی
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <RoutineDialog
        open={dialog.open}
        routineId={dialog.id}
        onClose={() => setDialog({ open: false, id: null })}
      />
    </>
  );
}
