"use client";

import { faNum, faPercent } from "@/lib/utils/number";
import { faDuration } from "@/lib/utils/duration";
import { categoryVar } from "@/lib/utils/colors";
import type { CategoryStat } from "@/lib/domain/stats";

/**
 * Where the hours actually went.
 *
 * The number beside each category is time — «پروژه: ۲ ساعت» — and the bar is
 * that category's share of everything studied in the window. A completion
 * percentage would answer a question nobody asked: what matters is where the
 * evening disappeared to.
 */
export function CategoryBars({ stats }: { stats: CategoryStat[] }) {
  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted">
        هنوز برای هیچ دسته‌ای زمانی ثبت نشده است.
      </p>
    );
  }

  const total = stats.reduce((sum, stat) => sum + stat.minutes, 0);

  return (
    <>
      <ul className="space-y-3.5">
        {stats.map((stat) => {
          const color = categoryVar(stat.color);
          return (
            <li key={stat.categoryId ?? "none"}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-[13px] text-fg-soft">
                    {stat.name}
                  </span>
                </span>
                <span className="hz-tnum shrink-0 text-[12px] text-muted">
                  <span className="text-[13px] font-semibold text-fg-soft">
                    {faDuration(stat.minutes, { short: true })}
                  </span>
                  <span className="mx-1.5 text-line-strong">·</span>
                  {faPercent(stat.share)}٪
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${stat.share * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="hz-tnum mt-4 border-t border-line pt-3 text-[12px] text-muted">
        مجموع:{" "}
        <span className="font-semibold text-fg-soft">
          {faDuration(total, { short: true })}
        </span>{" "}
        در {faNum(stats.length)} دسته
      </p>
    </>
  );
}
