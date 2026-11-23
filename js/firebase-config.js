/**
 * ================= CẤU HÌNH LƯU TRỮ LOCAL OFFLINE 100% (VER 17) =================
 * Đã gỡ bỏ hoàn toàn phụ thuộc Firebase Realtime Database.
 * Toàn bộ dữ liệu quán, bảng xếp hạng, giftcode và phòng PvP vận hành 100% trên localStorage.
 */

const LOCAL_STORAGE_KEY = "banh_trang_tron_saigon_v6_master_save";
const LOCAL_SHOPS_REGISTRY_KEY = "banh_trang_tron_saigon_v16_multi_shops_vault";
const DEFAULT_FIREBASE_DB_URL = "";
let FIREBASE_DB_URL = "";

window.FIREBASE_CONFIG = {
  databaseURL: "",
  offlineOnly: true
};

function getFirebaseDbUrl() {
  return "";
}

function setFirebaseDbUrl() {
  return "";
}

function isFirebaseConfigured() {
  return false;
}
