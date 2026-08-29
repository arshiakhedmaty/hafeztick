"use client";

import { faNum, faPercent } from "@/lib/utils/number";
import { categoryVar } from "@/lib/utils/colors";
import type { CategoryStat } from "@/lib/domain/stats";

/** Where the effort actually went, and how much of it landed. */
export function CategoryBars({ stats }: { stats: CategoryStat[] }) {
  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted">
        هنوز کاری در هیچ دسته‌ای ثبت نشده است.
      </p>
    );
  }

  return (
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
                {faNum(stat.done)} از {faNum(stat.total)}
                <span className="mx-1.5 text-line-strong">·</span>
                <span className="text-fg-soft">{faPercent(stat.ratio ?? 0)}٪</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${(stat.ratio ?? 0) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
