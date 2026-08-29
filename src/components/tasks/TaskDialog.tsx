"use client";

import { useState } from "react";
import type { DayKey } from "@/lib/date/day";
import type { Priority } from "@/lib/domain/types";
import { PRIORITY_LABEL } from "@/lib/domain/types";
import { taskById } from "@/lib/domain/selectors";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DayPicker } from "@/components/ui/DayPicker";
import {
  Label,
  SelectField,
  Segmented,
  TextArea,
  TextField,
} from "@/components/ui/Field";

const PRIORITY_OPTIONS = (["low", "normal", "high"] as Priority[]).map((value) => ({
  value,
  label: PRIORITY_LABEL[value],
}));

/**
 * Create or edit a one-off task; quick capture lives in QuickAdd.
 *
 * The form is a separate component mounted per task, so its initial values
 * come from `useState` initialisers rather than an effect that re-seeds state.
 */
export function TaskDialog({
  open,
  onClose,
  taskId = null,
  defaultDay = null,
}: {
  open: boolean;
  onClose: () => void;
  taskId?: string | null;
  defaultDay?: DayKey | null;
}) {
  if (!open) return null;
  return (
    <TaskForm
      key={taskId ?? `new:${defaultDay ?? "none"}`}
      taskId={taskId}
      defaultDay={defaultDay}
      onClose={onClose}
    />
  );
}

function TaskForm({
  taskId,
  defaultDay,
  onClose,
}: {
  taskId: string | null;
  defaultDay: DayKey | null;
  onClose: () => void;
}) {
  const { data, actions } = useApp();
  const toast = useToast();
  const existing = taskId ? taskById(data, taskId) : null;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    existing?.categoryId ?? null,
  );
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? "normal");
  const [day, setDay] = useState<DayKey | null>(
    existing ? existing.day : defaultDay,
  );

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (existing) {
      actions.updateTask(existing.id, { title: trimmed, note, categoryId, priority });
      if (existing.day !== day) actions.moveTask(existing.id, day);
      toast({ message: "ذخیره شد", icon: "check" });
    } else {
      actions.addTask({ title: trimmed, note, categoryId, priority, day });
      toast({ message: "کار اضافه شد", icon: "plus" });
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? "ویرایش کار" : "کار جدید"}
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
          placeholder="مثلاً: تمرین فصل سوم"
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />

        <TextArea
          label="توضیح (اختیاری)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="جزئیات، یادداشت یا لینک"
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

        <div>
          <Label>تاریخ</Label>
          <DayPicker value={day} onChange={setDay} allowNone />
        </div>
      </div>
    </Modal>
  );
}
