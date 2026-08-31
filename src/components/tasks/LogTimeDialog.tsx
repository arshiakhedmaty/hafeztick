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

/**
 * Logging time from a surface too dense for an inline field — the week board.
 *
 * Same contract as the inline editor on «امروز»: enter a duration, confirm it,
 * and the minutes are what the app stores. Zero minutes clears the item.
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
  const { actions } = useApp();
  const toast = useToast();
  const [minutes, setMinutes] = useState(entry.minutes);

  const save = () => {
    actions.logEntry(entry, minutes);
    onClose();
    toast({
      message:
        minutes > 0
          ? `${entry.title}: ${faDuration(minutes, { short: true })} ثبت شد`
          : "زمان پاک شد",
      icon: minutes > 0 ? "check" : "close",
    });
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
          <Button variant="primary" onClick={save}>
            {minutes > 0 ? "ثبت" : "پاک کردن"}
          </Button>
        </>
      }
    >
      <DurationField
        value={minutes}
        onChange={setMinutes}
        onSubmit={save}
        autoFocus
      />
    </Modal>
  );
}
