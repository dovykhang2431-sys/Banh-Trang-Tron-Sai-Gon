/**
 * Service Worker Chuẩn PWA - Vua Bánh Tráng Sài Gòn (Ver 17.9.2 Offline 100%)
 * - Pre-cache toàn bộ tài nguyên tĩnh (HTML, CSS, JS modules, Icons) để chơi hoàn toàn Offline sau lần tải đầu.
 * - Khi có mạng: ưu tiên tải bản mới nhất cho HTML/JS/CSS rồi cập nhật cache; khi mất mạng: phục vụ 100% từ cache.
 */
const CACHE_NAME = "vua-banh-trang-saigon-pwa-v17.9.2";
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

  const url = new URL(req.url);
  const isCodeOrDoc =
    req.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".json");

  if (isCodeOrDoc) {
    // Network-First để luôn nhận bản vá mới khi online, rơi về cache ngay khi offline
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(req).then((c) => c || (req.mode === "navigate" ? caches.match("./index.html") : undefined)))
    );
    return;
  }

  // Ảnh/Icon: Cache-First
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
