import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStoreProvider } from "@/lib/store/AppStore";
import { ThemeSync } from "@/components/layout/ThemeSync";
import { OfflineReady } from "@/components/layout/OfflineReady";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { STORAGE_KEY } from "@/lib/storage/repository";

const basePath = process.env.PAGES_BASE_PATH ?? "";

/**
 * Where the app is published, base path included.
 *
 * Link previews — Telegram, WhatsApp and the rest — fetch the page once and
 * only follow an absolute image URL, so a relative one would silently produce
 * a bare link. The deploy workflow passes the real address in.
 */
const siteUrl = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const title = "حافظ‌تیک | دفترِ ساعت‌های مطالعه";
const description =
  "برای هر کاری که انجام می‌دهی زمانش را ثبت کن و ببین ساعت‌های مطالعه‌ات در گذر هفته‌ها چطور جمع می‌شوند.";

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title,
  description,
  applicationName: "HafezTick",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${basePath}/icon.svg`, type: "image/svg+xml" },
      { url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
    // iOS ignores SVG and the manifest for home-screen icons; it wants this.
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "حافظ‌تیک", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: `${siteUrl}/`,
    title,
    description,
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "حافظ‌تیک — دفترِ ساعت‌های مطالعه",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/og.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ece0" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1214" },
  ],
};

/**
 * Resolves the theme before first paint so the app never flashes the wrong
 * one. It reads the same storage blob the app uses, and fails silently.
 */
const themeBootstrap = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var pref = raw ? (JSON.parse(raw).settings || {}).theme : "system";
    var dark =
      pref === "dark" ||
      ((pref === "system" || !pref) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          Loaded at runtime rather than through next/font so the build never
          depends on reaching Google Fonts. If the stylesheet cannot load, the
          fallback stack in globals.css renders Persian correctly — the display
          face degrades to the body face, which costs personality, not meaning.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@400;500;600;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <AppStoreProvider>
          <ThemeSync />
          <OfflineReady />
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AppStoreProvider>
      </body>
    </html>
  );
}
