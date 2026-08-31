"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { STORAGE_KEY } from "@/lib/storage/repository";

/**
 * The screen a render failure lands on.
 *
 * Everything this app knows lives in one browser's local storage, so a crash
 * that leaves a blank page also leaves the user unable to reach their own
 * history. The first thing offered here is therefore a backup — taken
 * straight from storage rather than through the store, which is exactly the
 * layer that may have failed — and only then a retry.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("HafezTick crashed:", error);
  }, [error]);

  const download = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const url = URL.createObjectURL(
        new Blob([raw], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `hafeztick-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Nothing more to offer: the retry below is the remaining path.
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
        <Icon name="close" size="1.5em" />
      </span>

      <h1 className="hz-display text-[24px] text-fg">چیزی درست پیش نرفت</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        اطلاعاتت پاک نشده و روی همین دستگاه است. اول یک نسخه‌ی پشتیبان بگیر،
        بعد دوباره تلاش کن.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="outline" icon="download" onClick={download}>
          گرفتن پشتیبان
        </Button>
        <Button variant="primary" onClick={reset}>
          تلاش دوباره
        </Button>
      </div>

      {error.digest && (
        <p className="hz-tnum mt-6 text-[11px] text-muted/70">
          کد خطا: {error.digest}
        </p>
      )}
    </div>
  );
}
