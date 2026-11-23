/**
 * Service Worker Chuẩn PWA - Vua Bánh Tráng Sài Gòn (Ver 17 Offline 100%)
 * - Pre-cache toàn bộ tài nguyên tĩnh (HTML, CSS, JS modules, Icons) để chơi hoàn toàn Offline sau lần tải đầu.
 */
const CACHE_NAME = "vua-banh-trang-saigon-pwa-v17";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./css/styles.css",
  "./js/firebase-config.js",
  "./js/assets.js",
  "./js/seed-shops.js",
  "./js/audio-fx.js",
  "./js/catalog-data.js",
  "./js/state-economy.js",
  "./js/firebase-cloud.js",
  "./js/leaderboard-social.js",
  "./js/gameplay-prep.js",
  "./js/gameplay-street.js",
  "./js/main.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Không thể pre-cache một số file tĩnh:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 1. Điều hướng trang chính: Cache-First có cập nhật nền & Fallback ./index.html
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match(req).then((cached) => {
        const net = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, clone));
            }
            return res;
          })
          .catch(() => cached || caches.match("./index.html"));
        return cached || net;
      })
    );
    return;
  }

  // 2. Tài nguyên tĩnh: Cache-First / Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cachedRes);
      return cachedRes || fetchPromise;
    })
  );
});
