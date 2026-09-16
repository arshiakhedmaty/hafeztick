"use client";

import { useState } from "react";
import { faDuration } from "@/lib/utils/duration";
import { formatDay } from "@/lib/date/day";
import type { Entry } from "@/lib/domain/types";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DurationField } from "@/components/ui/DurationField";
import { Checkbox } from "./Checkbox";

/**
 * Logging time from a surface too dense for an inline field — the week board.
 *
 * Same contract as the inline editor on «امروز»: a duration typed here is a
 * session, and it is added to whatever the item already carries. Correcting the
 * running total is the deliberate second option, not the default.
 */
export function LogTimeDialog({
  entry,
  onClose,
}: {
  entry: Entry | null;
  onClose: () => void;
}) {
  if (!entry) return null;
  return <LogTimeForm key={entry.id} entry={entry} onClose={onClose} />;
}

function LogTimeForm({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const { data, actions } = useApp();
  const toast = useToast();

  // Read the live entry, so the tick reflects a toggle made in this dialog.
  const current = data.entries.find((item) => item.id === entry.id) ?? entry;
  const done = current.status === "done";

  const [replacing, setReplacing] = useState(false);
  const [minutes, setMinutes] = useState(0);

  const save = () => {
    if (replacing) {
      actions.logEntry(current, minutes);
      toast({
        message:
          minutes > 0
            ? `مجموع به ${faDuration(minutes, { short: true })} تغییر کرد`
            : "زمان پاک شد",
        icon: minutes > 0 ? "clock" : "close",
      });
    } else if (minutes > 0) {
      actions.addTime(current, minutes);
      toast({
        message: `${faDuration(minutes, { short: true })} اضافه شد — مجموع ${faDuration(
          current.minutes + minutes,
          { short: true },
        )}`,
        icon: "clock",
      });
    }
    onClose();
  };

  const startReplacing = () => {
    setMinutes(current.minutes);
    setReplacing(true);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={entry.title}
      description={`${formatDay(entry.day, { withWeekday: true })} — چقدر روی این کار وقت گذاشتی؟`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={!replacing && minutes === 0}
          >
            {replacing ? (minutes > 0 ? "ثبت" : "پاک کردن") : "افزودن"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {current.minutes > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2">
            <span className="hz-tnum text-[12.5px] text-fg-soft">
              مجموع فعلی {faDuration(current.minutes, { short: true })}
              {!replacing && minutes > 0 && (
                <span className="text-primary">
                  {" "}
                  ← {faDuration(current.minutes + minutes, { short: true })}
                </span>
              )}
            </span>
            {!replacing && (
              <button
                type="button"
                onClick={startReplacing}
                className="text-[12px] text-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                اصلاح مجموع
              </button>
            )}
          </div>
        )}

        <DurationField
          value={minutes}
          onChange={setMinutes}
          onSubmit={save}
          autoFocus
        />

        <div className="flex items-center gap-2.5 border-t border-line pt-3">
          <Checkbox
            checked={done}
            onToggle={() => actions.toggleEntryDone(current)}
            label={`${entry.title} — تمام شد`}
            size="sm"
          />
          <button
            type="button"
            onClick={() => actions.toggleEntryDone(current)}
            className="text-[13px] text-fg-soft transition-colors hover:text-fg"
          >
            این کار تمام شد
          </button>
        </div>
      </div>
    </Modal>
  );
}
