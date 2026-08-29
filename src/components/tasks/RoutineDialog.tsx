"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { faNum } from "@/lib/utils/number";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@/lib/date/jalali";
import type { Priority, RepeatRule } from "@/lib/domain/types";
import { PRIORITY_LABEL } from "@/lib/domain/types";
import { routineById } from "@/lib/domain/selectors";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Label,
  SelectField,
  Segmented,
  TextArea,
  TextField,
} from "@/components/ui/Field";

type RepeatKind = RepeatRule["kind"];

const PRIORITY_OPTIONS = (["low", "normal", "high"] as Priority[]).map((value) => ({
  value,
  label: PRIORITY_LABEL[value],
}));

const REPEAT_OPTIONS: { value: RepeatKind; label: string }[] = [
  { value: "daily", label: "هر روز" },
  { value: "weekdays", label: "روزهای معیّن" },
  { value: "flexible", label: "چند بار در هفته" },
];

export function RoutineDialog({
  open,
  onClose,
  routineId = null,
}: {
  open: boolean;
  onClose: () => void;
  routineId?: string | null;
}) {
  if (!open) return null;
  return (
    <RoutineForm key={routineId ?? "new"} routineId={routineId} onClose={onClose} />
  );
}

function RoutineForm({
  routineId,
  onClose,
}: {
  routineId: string | null;
  onClose: () => void;
}) {
  const { data, actions } = useApp();
  const toast = useToast();
  const existing = routineId ? routineById(data, routineId) : null;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    existing?.categoryId ?? null,
  );
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? "normal");
  const [kind, setKind] = useState<RepeatKind>(existing?.repeat.kind ?? "daily");
  const [days, setDays] = useState<number[]>(
    existing?.repeat.kind === "weekdays" ? existing.repeat.days : [0, 1, 2, 3, 4],
  );
  const [timesPerWeek, setTimesPerWeek] = useState(
    existing?.repeat.kind === "flexible" ? existing.repeat.timesPerWeek : 3,
  );

  const buildRepeat = (): RepeatRule => {
    if (kind === "weekdays") {
      return { kind: "weekdays", days: days.length ? [...days].sort() : [0] };
    }
    if (kind === "flexible") {
      return {
        kind: "flexible",
        timesPerWeek: Math.min(7, Math.max(1, timesPerWeek)),
      };
    }
    return { kind: "daily" };
  };

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (existing) {
      actions.updateRoutine(existing.id, {
        title: trimmed,
        note,
        categoryId,
        priority,
        repeat: buildRepeat(),
      });
      toast({ message: "روتین ذخیره شد", icon: "check" });
    } else {
      actions.addRoutine({
        title: trimmed,
        note,
        categoryId,
        priority,
        repeat: buildRepeat(),
      });
      toast({ message: "روتین ساخته شد", icon: "repeat" });
    }
    onClose();
  };

  const toggleDay = (index: number) => {
    setDays((current) =>
      current.includes(index)
        ? current.filter((day) => day !== index)
        : [...current, index],
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? "ویرایش روتین" : "روتین جدید"}
      description="روتین کاری است که تکرار می‌شود و پایبندی‌ات به آن در آمار دیده می‌شود."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" onClick={save} disabled={!title.trim()}>
            {existing ? "ذخیره" : "افزودن"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="عنوان"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="مثلاً: مطالعه‌ی روزانه"
        />

        <TextArea
          label="توضیح (اختیاری)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="دسته"
            value={categoryId ?? ""}
            onChange={(event) => setCategoryId(event.target.value || null)}
          >
            <option value="">بدون دسته</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>

          <Segmented
            label="اهمیت"
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={setPriority}
          />
        </div>

        <Segmented
          label="تکرار"
          value={kind}
          options={REPEAT_OPTIONS}
          onChange={setKind}
        />

        {kind === "weekdays" && (
          <div className="hz-rise">
            <Label hint="روزهایی که این کار باید انجام شود">روزهای هفته</Label>
            <div className="flex gap-1.5">
              {WEEKDAY_SHORT.map((short, index) => {
                const active = days.includes(index);
                return (
                  <button
                    key={short}
                    type="button"
                    aria-label={WEEKDAY_NAMES[index]}
                    aria-pressed={active}
                    onClick={() => toggleDay(index)}
                    className={cn(
                      "flex-1 rounded-lg border py-2 text-[13px] transition-colors",
                      active
                        ? "border-transparent bg-primary text-primary-contrast"
                        : "border-line text-muted hover:text-fg-soft",
                    )}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {kind === "flexible" && (
          <div className="hz-rise">
            <Label hint="خودت انتخاب می‌کنی کدام روزها">چند بار در هفته</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={timesPerWeek === count}
                  onClick={() => setTimesPerWeek(count)}
                  className={cn(
                    "hz-tnum flex-1 rounded-lg border py-2 text-[13px] transition-colors",
                    timesPerWeek === count
                      ? "border-transparent bg-primary text-primary-contrast"
                      : "border-line text-muted hover:text-fg-soft",
                  )}
                >
                  {faNum(count)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              این روتین هر روز در فهرست دیده می‌شود اما نمره‌ی روز را پایین
              نمی‌آورد؛ فقط سهم هفته‌اش باید تکمیل شود.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
