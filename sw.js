/**
 * Service Worker Chuẩn PWA - Vua Bánh Tráng Sài Gòn (Ver 16 Modular + Firebase Cloud)
 * - Cache-First / Stale-While-Revalidate cho toàn bộ tài nguyên tĩnh (HTML, CSS, JS modules, Icons)
 * - Network-Only cho toàn bộ request tới Firebase Realtime Database (*.firebasedatabase.app / *.firebaseio.com)
 *   để đảm bảo dữ liệu người chơi và Bảng Xếp Hạng luôn tươi mới 100% theo thời gian thực.
 */
const CACHE_NAME = "vua-banh-trang-saigon-pwa-v16.2";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
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
  const url = new URL(req.url);

  // 1. Không bao giờ cache các lệnh gọi API tới Firebase Realtime Database hoặc phương thức PUT/POST/PATCH/DELETE
  if (
    req.method !== "GET" ||
    url.hostname.includes("firebasedatabase.app") ||
    url.hostname.includes("firebaseio.com") ||
    (url.hostname.includes("googleapis.com") && url.pathname.includes("/v1/"))
  ) {
    return;
  }

  // 2. Chiến lược Network-First kèm Fallback Cache cho trang chính (index.html)
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/")) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return networkRes;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // 3. Chiến lược Stale-While-Revalidate cho các module JS, CSS, Fonts và Icons
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
