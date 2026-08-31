import type { CategoryColor } from "../domain/types";

/** Category colours live as CSS variables so they follow the theme. */
export function categoryVar(color: CategoryColor | undefined | null): string {
  return `var(--cat-${color ?? "slate"})`;
}

export const CATEGORY_COLOR_LABEL: Record<CategoryColor, string> = {
  teal: "فیروزه‌ای",
  violet: "بنفش",
  amber: "کهربایی",
  rose: "صورتی",
  sky: "آبی",
  lime: "سبز",
  coral: "مرجانی",
  plum: "ارغوانی",
  slate: "خاکستری",
};
