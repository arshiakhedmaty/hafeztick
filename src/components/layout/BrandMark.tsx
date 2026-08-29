/** The HafezTick mark: a tick resting inside a rounded, gradient tile. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="hz-brand" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#hz-brand)" />
      <path
        d="M11.5 20.8 17.4 26.5 28.5 13.5"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
