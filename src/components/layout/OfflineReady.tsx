"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, in production only.
 *
 * Development is deliberately excluded: a worker caching a dev build is a long
 * afternoon of wondering why an edit did not appear.
 *
 * The scope is read off the manifest link rather than guessed from the URL,
 * because that link is already rendered with whatever base path the build was
 * given — "/" locally, "/hafeztick/" on Pages — and a worker registered at the
 * wrong scope silently controls nothing.
 */
export function OfflineReady() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const manifest = document
      .querySelector('link[rel="manifest"]')
      ?.getAttribute("href");
    const scope = manifest
      ? new URL(manifest, window.location.href).pathname.replace(
          /manifest\.webmanifest$/,
          "",
        )
      : "/";

    navigator.serviceWorker.register(`${scope}sw.js`, { scope }).catch(() => {
      // Offline support is an enhancement; the app is fine without it.
    });
  }, []);

  return null;
}
