"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum, faPercent } from "@/lib/utils/number";
import { CATEGORY_COLORS, type CategoryColor } from "@/lib/domain/types";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@/lib/date/jalali";
import { categoryVar } from "@/lib/utils/colors";
import { exportData } from "@/lib/storage/repository";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Label, TextField, Toggle } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ScreenSkeleton } from "@/components/ui/Skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const GOALS = [0.5, 0.6, 0.7, 0.8, 1];

export default function SettingsPage() {
  const { data, actions, ready } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [newCategory, setNewCategory] = useState("");
  const [newColor, setNewColor] = useState<CategoryColor>("teal");
  const [confirmReset, setConfirmReset] = useState(false);

  if (!ready) return <ScreenSkeleton rows={3} />;

  const { settings, categories } = data;

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

  return (
    <>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-fg sm:text-2xl">تنظیمات</h1>
        <p className="mt-0.5 text-[13px] text-muted">
          حافظ‌تیک را با روش کار خودت هماهنگ کن.
        </p>
      </header>

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
            title="هدف و زنجیره"
            icon="target"
            subtitle="روزی که به این درصد برسد، «روز موفق» حساب می‌شود و زنجیره را ادامه می‌دهد."
          />

          <div className="space-y-4">
            <div>
              <Label hint={`${faPercent(settings.dailyGoal)}٪`}>هدف روزانه</Label>
              <div className="flex gap-1.5">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => actions.updateSettings({ dailyGoal: goal })}
                    className={cn(
                      "hz-tnum flex-1 rounded-lg border py-2 text-[13px] transition-colors",
                      settings.dailyGoal === goal
                        ? "border-transparent bg-primary text-primary-contrast"
                        : "border-line text-muted hover:text-fg-soft",
                    )}
                  >
                    {faPercent(goal)}٪
                  </button>
                ))}
              </div>
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
            subtitle="دسته‌ها به آمار معنا می‌دهند: می‌بینی وقتت کجا رفته است."
          />

          <ul className="mb-4 space-y-1.5">
            {categories.map((category) => (
              <li
                key={category.id}
                className="group flex items-center gap-2.5 rounded-xl border border-line px-3 py-2"
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
                  className="min-w-0 flex-1 bg-transparent text-[13.5px] text-fg outline-none"
                />
                <div className="flex shrink-0 gap-1">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={color}
                      onClick={() => actions.updateCategory(category.id, { color })}
                      className={cn(
                        "size-4 rounded-full border-2 transition-transform",
                        category.color === color
                          ? "border-fg/40 scale-110"
                          : "border-transparent opacity-45 hover:opacity-100",
                      )}
                      style={{ backgroundColor: categoryVar(color) }}
                    />
                  ))}
                </div>
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
            <div className="flex gap-1">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => setNewColor(color)}
                  className={cn(
                    "size-5 rounded-full border-2 transition-transform",
                    newColor === color
                      ? "border-fg/40 scale-110"
                      : "border-transparent opacity-45 hover:opacity-100",
                  )}
                  style={{ backgroundColor: categoryVar(color) }}
                />
              ))}
            </div>
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
            {faNum(data.entries.length)} رکورد ثبت‌شده
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
          تمام روتین‌ها، کارها، سابقه‌ی تیک‌ها و تنظیمات از این مرورگر حذف
          می‌شوند.
        </p>
      </Modal>
    </>
  );
}
