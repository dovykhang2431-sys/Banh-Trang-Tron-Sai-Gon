/**
 * ================= CẤU HÌNH KẾT NỐI FIREBASE REALTIME DATABASE =================
 * Hướng dẫn nhanh:
 * 1. Vào https://console.firebase.google.com/ -> Tạo Project -> Chọn "Realtime Database" -> Bấm "Create Database".
 * 2. Copy đường dẫn URL của Realtime Database (ví dụ: "https://vua-banh-trang-default-rtdb.asia-southeast1.firebasedatabase.app")
 * 3. Dán vào hằng số DEFAULT_FIREBASE_DB_URL bên dưới HOẶC bấm nút "☁️ Kết Nối Firebase" ngay trong giao diện Game!
 */

const FIREBASE_URL_STORAGE_KEY = "btt_saigon_custom_firebase_url_v16";
const LOCAL_STORAGE_KEY = "banh_trang_tron_saigon_v6_master_save";
const LOCAL_SHOPS_REGISTRY_KEY = "banh_trang_tron_saigon_v16_multi_shops_vault";

// 👉 DÁN URL FIREBASE REALTIME DATABASE CỦA BẠN VÀO ĐÂY (Không có dấu / ở cuối):
const DEFAULT_FIREBASE_DB_URL = "";

window.FIREBASE_CONFIG = {
  databaseURL: DEFAULT_FIREBASE_DB_URL,
  autoSyncIntervalMs: 15000,
  requestTimeoutMs: 5500
};

function normalizeFirebaseDbUrl(rawUrl) {
  let u = String(rawUrl || "").trim();
  if (!u) return "";
  u = u.replace(/\/+$/, "");
  if (u.endsWith(".json")) {
    u = u.replace(/\/[^/]*\.json$/i, "");
  }
  if (!/^https:\/\/[a-z0-9-]+.*\.(firebasedatabase\.app|firebaseio\.com)$/i.test(u) && !u.startsWith("https://")) {
    return "";
  }
  return u;
}

function getFirebaseDbUrl() {
  try {
    const savedUrl = localStorage.getItem(FIREBASE_URL_STORAGE_KEY);
    if (savedUrl && normalizeFirebaseDbUrl(savedUrl)) {
      return normalizeFirebaseDbUrl(savedUrl);
    }
  } catch (e) {}
  return normalizeFirebaseDbUrl(window.FIREBASE_CONFIG?.databaseURL || DEFAULT_FIREBASE_DB_URL);
}

function setFirebaseDbUrl(newUrl) {
  const clean = normalizeFirebaseDbUrl(newUrl);
  try {
    if (clean) {
      localStorage.setItem(FIREBASE_URL_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(FIREBASE_URL_STORAGE_KEY);
    }
  } catch (e) {}
  if (window.FIREBASE_CONFIG) {
    window.FIREBASE_CONFIG.databaseURL = clean;
  }
  FIREBASE_DB_URL = clean;
  return clean;
}

function isFirebaseConfigured() {
  return Boolean(getFirebaseDbUrl());
}

// Biến toàn cục tương thích với toàn bộ các hàm Cloud trong game
let FIREBASE_DB_URL = getFirebaseDbUrl();
