import type { NextConfig } from "next";

/**
 * The app is entirely client-side, so it can also be published as a static
 * bundle. Those two settings are switched on only by the GitHub Pages
 * workflow — local development and any Node host keep the default behaviour.
 */
const staticExport = process.env.STATIC_EXPORT === "true";

export const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  basePath: basePath || undefined,
  trailingSlash: staticExport,
  images: { unoptimized: staticExport },
};

export default nextConfig;
