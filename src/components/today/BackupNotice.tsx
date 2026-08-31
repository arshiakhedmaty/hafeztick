"use client";

import { faNum } from "@/lib/utils/number";
import { backupPrompt } from "@/lib/domain/backup";
import { exportData } from "@/lib/storage/repository";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * The one thing this app cannot recover from is the browser losing its
 * storage, so once there is a month of real history it asks for a backup —
 * and then leaves the user alone for a week if they say not now.
 */
export function BackupNotice() {
  const { data, actions } = useApp();
  const toast = useToast();
  const prompt = backupPrompt(data);

  if (!prompt.due) return null;

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([exportData(data)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `hafeztick-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    actions.markExported();
    toast({ message: "فایل پشتیبان ساخته شد", icon: "download" });
  };

  return (
    <section className="hz-rise mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/35 bg-accent-soft/50 px-4 py-3">
      <p className="flex min-w-0 items-start gap-2 text-[13px] leading-relaxed text-fg-soft">
        <Icon name="archive" size="1.1em" className="mt-0.5 shrink-0 text-accent" />
        <span>
          {prompt.daysSinceExport === null
            ? `${faNum(prompt.loggedDays)} روز مطالعه ثبت کرده‌ای و هنوز پشتیبانی نگرفته‌ای.`
            : `${faNum(prompt.daysSinceExport)} روز از آخرین پشتیبان گذشته است.`}{" "}
          <span className="text-muted">
            همه‌چیز فقط روی همین مرورگر است؛ پاک شدنش برگشتی ندارد.
          </span>
        </span>
      </p>

      <div className="flex shrink-0 gap-1.5">
        <Button size="sm" variant="ghost" onClick={actions.snoozeBackupReminder}>
          بعداً
        </Button>
        <Button size="sm" variant="outline" icon="download" onClick={download}>
          گرفتن پشتیبان
        </Button>
      </div>
    </section>
  );
}
