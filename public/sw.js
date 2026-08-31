/*
 * حافظ‌تیک — offline support.
 *
 * The app is entirely client-side and its data already lives in this browser,
 * so there is no reason it should need the network to open. This worker makes
 * the shell available offline without ever letting a stale build stick.
 *
 * Two rules, chosen so a bad deploy can never be permanent:
 *
 *   Documents  network first. A fresh build always wins when the network is
 *              there; the cache is the fallback, not the source of truth.
 *   Assets     cache first, but only /_next/static, whose filenames carry a
 *              content hash. A hashed name never changes meaning, so serving
 *              it from cache cannot be wrong.
 *
 * Anything else — cross-origin fonts, anything non-GET — is left alone.
 */

const VERSION = "v1";
const SHELL = `hafeztick-shell-${VERSION}`;
const ASSETS = `hafeztick-assets-${VERSION}`;
const KEEP = [SHELL, ASSETS];

/** The worker is served from the app's own scope, so this is its base path. */
const BASE = new URL("./", self.registration.scope).pathname;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll([BASE, `${BASE}manifest.webmanifest`]))
      // A failed pre-cache must not block activation: the fetch handler will
      // fill the cache on the first successful visit instead.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("hafeztick-") && !KEEP.includes(name))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      // `cache: "reload"` skips the browser's own HTTP cache on the way out.
      // Without it "network first" quietly becomes "HTTP cache first", and a
      // fresh deploy can sit unseen behind a max-age the host chose.
      fetch(request.url, { cache: "reload", credentials: "same-origin" })
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit ?? caches.match(BASE))
            .then((hit) => hit ?? Response.error()),
        ),
    );
    return;
  }

  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
