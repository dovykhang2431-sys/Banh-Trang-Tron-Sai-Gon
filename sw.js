const CACHE_NAME = "vua-banh-trang-saigon-v6-2-cache";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json?v=2",
  "./icon-512.png?v=2"
];

// 1. Cài đặt Service Worker & kích hoạt ngay lập tức
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

// 2. Xóa toàn bộ các bộ nhớ đệm cũ (V1 -> V5) khi lên V6
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Chiến lược xử lý mạng thông minh:
// - Không bao giờ lưu cache cho Firebase Realtime Database
// - Dùng Network-First cho file HTML để luôn nhận bản cập nhật mới nhất khi có mạng
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bỏ qua các lệnh PUT/POST hoặc các kết nối tới Firebase Cloud
  if (
    req.method !== "GET" ||
    url.hostname.includes("firebasedatabase.app") ||
    url.hostname.includes("firebaseio.com")
  ) {
    return;
  }

  // Đối với trang HTML chính: Ưu tiên tải bản mới từ mạng, mất mạng mới dùng bản lưu trong máy
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return networkRes;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Đối với Icon, Font, Tailwind CSS: Dùng bản lưu sẵn cho nhanh và âm thầm cập nhật ở nền
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(() => cachedRes);
      return cachedRes || fetchPromise;
    })
  );
});