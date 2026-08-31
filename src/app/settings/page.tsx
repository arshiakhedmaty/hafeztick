"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum, faPercent } from "@/lib/utils/number";
import { faClock, faDuration, faGoal } from "@/lib/utils/duration";
import { CATEGORY_COLORS, type CategoryColor } from "@/lib/domain/types";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@/lib/date/jalali";
import { CATEGORY_COLOR_LABEL, categoryVar } from "@/lib/utils/colors";
import { exportData } from "@/lib/storage/repository";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, CardHeader, PageHeader } from "@/components/ui/Card";
import { DurationField } from "@/components/ui/DurationField";
import { Label, TextField, Toggle } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ScreenSkeleton } from "@/components/ui/Skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/** Common daily study targets, in minutes. */
const GOAL_PRESETS = [120, 180, 240, 300, 360, 480];

/** Share of the day's hour goal that makes it a successful day. */
const THRESHOLDS = [0.5, 0.6, 0.7, 0.8, 1];

/**
 * Picking one colour out of nine.
 *
 * It is a radio group, not nine unrelated buttons: that is what it means, and
 * it is what lets one arrow key move through the row. Each swatch clears the
 * WCAG 2.2 target minimum of 24×24 with the dot drawn inside a larger hit
 * area, so the row stays visually light without being unusable on a phone.
 */
function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-0.5">
      {CATEGORY_COLORS.map((color) => {
        const active = value === color;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={CATEGORY_COLOR_LABEL[color]}
            title={CATEGORY_COLOR_LABEL[color]}
            onClick={() => onChange(color)}
            className="grid size-7 place-items-center rounded-full transition-colors hover:bg-surface-2"
          >
            <span
              className={cn(
                "size-4 rounded-full border-2 transition-transform",
                active
                  ? "scale-110 border-fg/40"
                  : "border-transparent opacity-50",
              )}
              style={{ backgroundColor: categoryVar(color) }}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { data, actions, ready } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [newCategory, setNewCategory] = useState("");
  const [newColor, setNewColor] = useState<CategoryColor>("teal");
  const [confirmReset, setConfirmReset] = useState(false);

  if (!ready) return <ScreenSkeleton rows={3} />;

  const { settings, categories } = data;
  const loggedMinutes = data.entries.reduce(
    (sum, entry) => sum + (entry.minutes ?? 0),
    0,
  );

  const download = () => {
    const blob = new Blob([exportData(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hafeztick-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ message: "فایل پشتیبان ساخته شد", icon: "download" });
  };

  const upload = async (file: File) => {
    const text = await file.text();
    if (actions.replaceAll(text)) {
      toast({ message: "اطلاعات بازیابی شد", icon: "check" });
    } else {
      toast({ message: "فایل معتبر نبود", icon: "close" });
    }
  };

  const toggleRestDay = (index: number) => {
    const current = settings.restDays;
    actions.updateSettings({
      restDays: current.includes(index)
        ? current.filter((day) => day !== index)
        : [...current, index].sort(),
    });
  };

  /** `null` hands the weekday back to the default goal. */
  const setWeekdayGoal = (index: number, minutes: number | null) => {
    const next = [...settings.weekdayGoalMinutes];
    next[index] = minutes;
    actions.updateSettings({ weekdayGoalMinutes: next });
  };

  // Saturday is the first day of the Persian week, so it makes the clearest
  // worked example of what the success rule actually costs in hours.
  const saturdayGoal = settings.weekdayGoalMinutes[0] ?? settings.dailyGoalMinutes;
  const saturdaySuccess = Math.round(saturdayGoal * settings.successThreshold);

  return (
    <>
      <PageHeader
        title="تنظیمات"
        subtitle="حافظ‌تیک را با روش کار خودت هماهنگ کن."
      />

      <div className="space-y-5">
        <Card>
          <CardHeader title="نمایش" icon="sun" />
          <div className="space-y-4">
            <div>
              <Label>حالت رنگی</Label>
              <ThemeToggle />
            </div>

            <TextField
              label="نام تو (اختیاری)"
              value={settings.displayName}
              placeholder="مثلاً: آرشیا"
              onChange={(event) =>
                actions.updateSettings({ displayName: event.target.value })
              }
            />

            <Toggle
              label="کاهش انیمیشن‌ها"
              description="اگر حرکت اذیتت می‌کند، همه‌ی انیمیشن‌ها خاموش می‌شوند."
              checked={settings.reduceMotion}
              onChange={(value) => actions.updateSettings({ reduceMotion: value })}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="هدف مطالعه"
            icon="clock"
            subtitle="پیشرفت هر روز از روی ساعت مطالعه‌ی ثبت‌شده نسبت به هدف همان روز حساب می‌شود."
          />

          <div className="space-y-5">
            <div>
              <Label hint={faGoal(settings.dailyGoalMinutes)}>
                هدف روزانه (پیش‌فرض)
              </Label>
              <DurationField
                name="هدف روزانه"
                value={settings.dailyGoalMinutes}
                onChange={(minutes) =>
                  actions.updateSettings({ dailyGoalMinutes: minutes })
                }
                presets={false}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GOAL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      actions.updateSettings({ dailyGoalMinutes: preset })
                    }
                    className={cn(
                      "hz-tnum rounded-full border px-3 py-1 text-[12px] transition-colors",
                      settings.dailyGoalMinutes === preset
                        ? "border-transparent bg-primary text-primary-contrast"
                        : "border-line text-muted hover:text-fg-soft",
                    )}
                  >
                    {faGoal(preset)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                هر روزی که هدف اختصاصی نداشته باشد، از این عدد استفاده می‌کند.
              </p>
            </div>

            <div className="border-t border-line pt-4">
              <Label hint="هر روز مستقل از بقیه">هدف هر روز هفته</Label>
              <ul className="space-y-1.5">
                {WEEKDAY_NAMES.map((name, index) => {
                  const own = settings.weekdayGoalMinutes[index] ?? null;
                  const effective = own ?? settings.dailyGoalMinutes;
                  const successMinutes = Math.round(
                    effective * settings.successThreshold,
                  );

                  return (
                    <li
                      key={name}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line px-3 py-2"
                    >
                      <span className="w-16 shrink-0 text-[13px] text-fg-soft">
                        {name}
                      </span>

                      <div className="min-w-44 flex-1">
                        <DurationField
                          name={`هدف ${name}`}
                          value={effective}
                          onChange={(minutes) => setWeekdayGoal(index, minutes)}
                          presets={false}
                          compact
                        />
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          aria-pressed={own === null}
                          onClick={() => setWeekdayGoal(index, null)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                            own === null
                              ? "border-transparent bg-surface-2 text-fg-soft"
                              : "border-line text-muted hover:text-fg-soft",
                          )}
                        >
                          پیش‌فرض
                        </button>
                        <span
                          className="hz-tnum w-20 shrink-0 text-[11px] text-muted"
                          title={
                            effective === 0
                              ? "این روز نمره‌گذاری نمی‌شود"
                              : `برای موفق بودن این روز ${faDuration(
                                  successMinutes,
                                )} لازم است`
                          }
                        >
                          {effective === 0
                            ? "بدون هدف"
                            : `موفق: ${faClock(successMinutes)}`}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                هدف صفر یعنی آن روز اصلاً نمره‌گذاری نمی‌شود؛ نه موفق حساب
                می‌شود و نه زنجیره را می‌شکند.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="روز موفق و زنجیره"
            icon="target"
            subtitle="روزی که به این نسبت از هدف ساعتی خودش برسد، «روز موفق» است و زنجیره را ادامه می‌دهد."
          />

          <div className="space-y-4">
            <div>
              <Label hint={`${faPercent(settings.successThreshold)}٪ از هدف روز`}>
                قانون روز موفق
              </Label>
              <div className="flex gap-1.5">
                {THRESHOLDS.map((threshold) => (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() =>
                      actions.updateSettings({ successThreshold: threshold })
                    }
                    className={cn(
                      "hz-tnum flex-1 rounded-lg border py-2 text-[13px] transition-colors",
                      settings.successThreshold === threshold
                        ? "border-transparent bg-primary text-primary-contrast"
                        : "border-line text-muted hover:text-fg-soft",
                    )}
                  >
                    {faPercent(threshold)}٪
                  </button>
                ))}
              </div>
              <p className="hz-tnum mt-2 text-[12px] leading-relaxed text-muted">
                مثلاً {WEEKDAY_NAMES[0]} با هدف{" "}
                {faGoal(saturdayGoal)} یعنی حداقل{" "}
                {faDuration(saturdaySuccess)} مطالعه تا آن روز موفق حساب شود.
              </p>
            </div>

            <div>
              <Label hint="این روزها زنجیره را نمی‌شکنند">روزهای استراحت</Label>
              <div className="flex gap-1.5">
                {WEEKDAY_SHORT.map((short, index) => {
                  const active = settings.restDays.includes(index);
                  return (
                    <button
                      key={short}
                      type="button"
                      aria-label={WEEKDAY_NAMES[index]}
                      aria-pressed={active}
                      onClick={() => toggleRestDay(index)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-[13px] transition-colors",
                        active
                          ? "border-transparent bg-accent/15 text-accent"
                          : "border-line text-muted hover:text-fg-soft",
                      )}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="دسته‌ها"
            icon="target"
            subtitle="دسته‌ها به آمار معنا می‌دهند: می‌بینی ساعت‌هایت کجا رفته است."
          />

          <ul className="mb-4 space-y-1.5">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-line px-3 py-2"
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryVar(category.color) }}
                />
                <input
                  value={category.name}
                  onChange={(event) =>
                    actions.updateCategory(category.id, { name: event.target.value })
                  }
                  aria-label={`نام دسته‌ی ${category.name}`}
                  className="w-32 min-w-0 flex-1 bg-transparent py-1 text-[13.5px] text-fg outline-none"
                />
                {/* Nine swatches need ~250px; below that they take their own
                    line rather than squeezing the name field to nothing. */}
                <ColorPicker
                  label={`رنگ دسته‌ی ${category.name}`}
                  value={category.color}
                  onChange={(color) =>
                    actions.updateCategory(category.id, { color })
                  }
                />
                <IconButton
                  icon="trash"
                  label={`حذف دسته‌ی ${category.name}`}
                  size="sm"
                  onClick={() => {
                    actions.deleteCategory(category.id);
                    toast({ message: "دسته حذف شد", icon: "trash" });
                  }}
                />
              </li>
            ))}
          </ul>

          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newCategory.trim()) return;
              actions.addCategory(newCategory, newColor);
              setNewCategory("");
              toast({ message: "دسته اضافه شد", icon: "plus" });
            }}
          >
            <ColorPicker
              label="رنگ دسته‌ی جدید"
              value={newColor}
              onChange={setNewColor}
            />
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="دسته‌ی جدید…"
              aria-label="نام دسته‌ی جدید"
              className="min-w-40 flex-1 rounded-field border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button type="submit" variant="soft" icon="plus">
              افزودن
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="داده‌ها"
            icon="archive"
            subtitle="همه‌چیز روی همین دستگاه ذخیره می‌شود. برای انتقال یا پشتیبان‌گیری از فایل خروجی استفاده کن."
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon="download" onClick={download}>
              گرفتن پشتیبان
            </Button>
            <Button
              variant="outline"
              icon="upload"
              onClick={() => fileRef.current?.click()}
            >
              بازیابی از فایل
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              }}
            />
            <Button
              variant="danger"
              icon="trash"
              onClick={() => setConfirmReset(true)}
            >
              پاک کردن همه‌چیز
            </Button>
          </div>

          <p className="hz-tnum mt-4 text-[12px] text-muted">
            {faNum(data.routines.length)} روتین · {faNum(data.tasks.length)} کار ·{" "}
            {faNum(data.entries.length)} رکورد ·{" "}
            {faDuration(loggedMinutes, { short: true, zero: "۰" })} مطالعه‌ی
            ثبت‌شده
          </p>
        </Card>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="پاک کردن همه‌ی داده‌ها"
        description="این کار برگشت‌پذیر نیست. اگر پشتیبان نگرفته‌ای، اول خروجی بگیر."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              انصراف
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                actions.resetAll();
                setConfirmReset(false);
                toast({ message: "همه‌چیز پاک شد", icon: "trash" });
              }}
            >
              بله، پاک کن
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-fg-soft">
          تمام روتین‌ها، کارها، ساعت‌های ثبت‌شده و تنظیمات از این مرورگر حذف
          می‌شوند.
        </p>
      </Modal>
    </>
  );
}
