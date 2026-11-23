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

// Làm mới dữ liệu local khi quay lại tab
window.addEventListener("focus", () => {
  checkExistingLocalSaveForLoginScreen();
  fetchCloudLeaderboard(false);
});

function isActiveGameSessionOpen() {
  const loginEl = document.getElementById("login-screen");
  const isLoginHidden = Boolean(loginEl && loginEl.classList.contains("hidden"));
  return Boolean(isLoginHidden && state && state.shopName);
}

// Lưu tức thì khi người chơi rời tab hoặc tải lại trang (CHỈ khi đang trong phiên chơi, không ở màn hình đăng nhập)
window.addEventListener("beforeunload", () => {
  if (isActiveGameSessionOpen()) saveToLocalOnly("beforeunload");
});
window.addEventListener("pagehide", () => {
  if (isActiveGameSessionOpen()) saveToLocalOnly("pagehide");
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && isActiveGameSessionOpen()) {
    saveToLocalOnly("visibilitychange");
  }
});

// Tự động lưu local an toàn mỗi 15 giây (CHỈ khi đang trong phiên chơi)
setInterval(() => {
  if (document.visibilityState === "visible" && isActiveGameSessionOpen()) {
    saveToLocalOnly("interval_15s");
  }
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
