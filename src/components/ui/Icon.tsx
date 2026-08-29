import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "check"
  | "plus"
  | "sun"
  | "calendar"
  | "repeat"
  | "chart"
  | "settings"
  | "chevron-start"
  | "chevron-end"
  | "close"
  | "trash"
  | "pencil"
  | "flame"
  | "target"
  | "more"
  | "inbox"
  | "archive"
  | "download"
  | "upload"
  | "sparkle"
  | "moon"
  | "monitor"
  | "arrow-up"
  | "arrow-down"
  | "minus"
  | "skip"
  | "clock";

/** Single-stroke icon set, sized in em so it follows the text around it. */
const PATHS: Record<IconName, ReactNode> = {
  check: <path d="M4.5 12.5 9 17 19.5 6.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  repeat: (
    <>
      <path d="M17 3.5 20.5 7 17 10.5" />
      <path d="M20.5 7H7.5A4 4 0 0 0 3.5 11v1" />
      <path d="M7 20.5 3.5 17 7 13.5" />
      <path d="M3.5 17h13a4 4 0 0 0 4-4v-1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20V11M12 20V5M17 20v-6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4H21a1.6 1.6 0 0 0-1.5 1Z" />
    </>
  ),
  "chevron-start": <path d="M15 5l-7 7 7 7" />,
  "chevron-end": <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  trash: (
    <>
      <path d="M4 7h16M10 4h4M9 7v12M15 7v12" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L20 8a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M15 6l3 3" />
    </>
  ),
  flame: (
    <path d="M12 22c3.9 0 7-2.9 7-6.7 0-4.6-4.3-6.6-4.3-10.3 0 0-2.4 1.3-2.4 4.4 0 2 1.1 2.7 1.1 4a1.9 1.9 0 0 1-1.9 2c-1.4 0-2.2-1.2-2.2-2.8 0-.9.2-1.6.2-1.6S5 12.4 5 15.3C5 19.1 8.1 22 12 22Z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="5.5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="18.5" r="1.4" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13h4l1.5 3h6l1.5-3h4" />
      <path d="M5.4 5h13.2l1.9 8v4a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-4Z" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="4" width="18" height="4.5" rx="1.5" />
      <path d="M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5M10 12.5h4" />
    </>
  ),
  download: <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 20h16" />,
  upload: <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 20h16" />,
  sparkle: (
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
  ),
  "arrow-up": <path d="M12 20V5m0 0-6 6m6-6 6 6" />,
  "arrow-down": <path d="M12 4v15m0 0 6-6m-6 6-6-6" />,
  minus: <path d="M5 12h14" />,
  skip: <path d="M6 6l7 6-7 6V6ZM18 5v14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number | string;
}

export function Icon({ name, size = "1.25em", className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
