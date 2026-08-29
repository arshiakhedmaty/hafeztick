/** Neutral placeholder shown until local data is read on the client. */
export function ScreenSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="h-6 w-28 rounded-lg bg-surface-2" />
          <div className="mt-2 h-3.5 w-40 rounded-md bg-surface-2" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-surface-2" />
      </div>
      <div className="mb-5 h-40 rounded-card bg-surface-2" />
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="h-12 rounded-xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
