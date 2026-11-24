/**
 * ================= ĐIỂM KHỞI CHẠY CHÍNH (BOOTSTRAP) & PWA OFFLINE 100% (VER 17) =================
 */

let deferredPwaPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
});

window.addEventListener("appinstalled", () => {
  deferredPwaPrompt = null;
  showToast("🎉 Đã cài Vua Bánh Tráng Sài Gòn ra màn hình chính!");
});

function openPwaInstallModal() {
  playSFX("snip");
  const feedback = document.getElementById("pwa-install-feedback");
  if (feedback) feedback.classList.add("hidden");
  const modal = document.getElementById("modal-pwa-install");
  if (modal) modal.classList.remove("hidden");
}

function closePwaInstallModal() {
  const modal = document.getElementById("modal-pwa-install");
  if (modal) modal.classList.add("hidden");
}

async function triggerPwaInstallNow() {
  playSFX("cash");
  const feedback = document.getElementById("pwa-install-feedback");
  if (deferredPwaPrompt) {
    try {
      deferredPwaPrompt["prompt"]();
      const { outcome } = await deferredPwaPrompt.userChoice;
      if (outcome === "accepted") {
        showToast("🎉 Đang cài game ra màn hình chính!");
      }
      deferredPwaPrompt = null;
      return;
    } catch (err) {}
  }
  if (feedback) {
    feedback.classList.remove("hidden");
    feedback.innerHTML = "💡 Hãy làm theo 3 bước hướng dẫn cho <b>Android</b> hoặc <b>iPhone</b> ngay bên dưới để thêm biểu tượng game ra màn hình chính nhé!";
  }
}

const ACTIVE_TAB_LOCK_KEY = "btt_active_tab_leader_v177";
const CURRENT_TAB_ID = "tab_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

function claimActiveTabLeadership() {
  try {
    const prevHolder = localStorage.getItem(ACTIVE_TAB_LOCK_KEY);
    localStorage.setItem(ACTIVE_TAB_LOCK_KEY, CURRENT_TAB_ID);
    if (prevHolder && prevHolder !== CURRENT_TAB_ID && isActiveGameSessionOpen()) {
      const curKey = state.shopKey || (typeof sanitizeShopKey === "function" ? sanitizeShopKey(state.shopName) : "");
      const mRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const mObj = mRaw ? JSON.parse(mRaw) : null;
      const mKey = mObj ? (mObj.shopKey || (typeof sanitizeShopKey === "function" ? sanitizeShopKey(mObj.shopName || "") : "")) : "";
      if (curKey && mKey && mKey !== curKey) {
        saveToLocalOnly("reclaim_pointer");
      }
    }
  } catch (e) {}
}

function isCurrentTabLeader() {
  try {
    const holder = localStorage.getItem(ACTIVE_TAB_LOCK_KEY);
    return !holder || holder === CURRENT_TAB_ID;
  } catch (e) {
    return true;
  }
}

claimActiveTabLeadership();

// Làm mới dữ liệu local & nhận quyền tab đang dùng khi quay lại tab
window.addEventListener("focus", () => {
  claimActiveTabLeadership();
  checkExistingLocalSaveForLoginScreen();
  fetchCloudLeaderboard(false);
});
window.addEventListener("pointerdown", claimActiveTabLeadership, { passive: true });
window.addEventListener("keydown", claimActiveTabLeadership, { passive: true });

function isActiveGameSessionOpen() {
  const loginEl = document.getElementById("login-screen");
  const isLoginHidden = Boolean(loginEl && loginEl.classList.contains("hidden"));
  return Boolean(isLoginHidden && state && state.shopName);
}

function tryBackgroundGuardedSave(sourceLabel, requireVisibleFocus = false) {
  if (!isActiveGameSessionOpen()) return false;
  const isVisible = document.visibilityState === "visible";
  const hasFocus = typeof document.hasFocus === "function" ? document.hasFocus() : true;
  const isLeader = isCurrentTabLeader();
  const allowed = requireVisibleFocus ? (isVisible && hasFocus && isLeader) : isLeader;
  if (!allowed) {
    if (typeof recordSaveWriteDiag === "function") {
      recordSaveWriteDiag(sourceLabel, state, "SKIP:background", `vis=${isVisible} focus=${hasFocus} leader=${isLeader}`);
    }
    return false;
  }
  return saveToLocalOnly(sourceLabel);
}

// Lưu tức thì khi người chơi rời tab hoặc tải lại trang (CHỈ khi tab này là tab đang dùng)
window.addEventListener("beforeunload", () => {
  tryBackgroundGuardedSave("beforeunload", false);
});
window.addEventListener("pagehide", () => {
  tryBackgroundGuardedSave("pagehide", false);
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    claimActiveTabLeadership();
  } else if (document.visibilityState === "hidden") {
    tryBackgroundGuardedSave("visibilitychange", false);
  }
});

// Tự động lưu local an toàn mỗi 15 giây (CHỈ khi tab đang hiển thị, có focus và là tab đang dùng)
setInterval(() => {
  tryBackgroundGuardedSave("interval_15s", true);
}, 15000);

// Đăng ký Service Worker PWA
window.addEventListener("load", () => {
  try {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  } catch (e) {}
});

// Khởi chạy duy nhất (Unified DOMContentLoaded)
window.addEventListener("DOMContentLoaded", () => {
  loadDailyPlaytimeTracker();
  ensureV15State(state);
  currentUpgradeSubTab = "marketing";
  renderLoginAvatarGrid();
  checkExistingLocalSaveForLoginScreen();
  renderMorningForecastBriefing();
  syncStep3VesselChibiAndLabel();
  renderCompactStreetControlStrip();
  fetchCloudLeaderboard(false);
  updateAllUI();
  startDayClock();
});
