/**
 * ================= ĐIỂM KHỞI CHẠY CHÍNH (BOOTSTRAP), PWA & AUTO-SYNC =================
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

// Tự động đồng bộ khi người chơi quay lại tab hoặc khi mạng Internet kết nối lại
window.addEventListener("focus", () => {
  checkExistingLocalSaveForLoginScreen();
  syncAdminLiveOpsAndMail(false);
  fetchCloudLeaderboard(false);
});

window.addEventListener("online", () => {
  if (isFirebaseConfigured() && state && state.shopName) {
    syncShopToFirebaseCloud(false);
    fetchCloudLeaderboard(false);
  }
});

window.addEventListener("storage", (ev) => {
  if (ev.key === LOCAL_STORAGE_KEY && ev.newValue) {
    try {
      const incoming = JSON.parse(ev.newValue);
      if (incoming && incoming.shopKey && incoming.shopKey === state.shopKey) {
        if (Number(incoming.adminOverrideAt || 0) > Number(state.adminOverrideAt || 0) || Boolean(incoming.isBankrupt) !== Boolean(state.isBankrupt)) {
          mergeLoadedState(incoming);
          updateAllUI();
          if (state.isBankrupt) {
            declareTrueBankruptcy(true);
          } else {
            const bkModal = document.getElementById("modal-bankruptcy");
            if (bkModal) bkModal.classList.add("hidden");
          }
          showToast("⚡ Đã đồng bộ tức thì thay đổi từ Trang Quản Trị!");
        }
      }
    } catch (e) {}
  }
});

// Tự động lưu an toàn mỗi 15 giây
setInterval(() => {
  if (document.visibilityState === "visible" && state && state.shopName) {
    saveToLocalOnly();
    if (isFirebaseConfigured()) {
      syncShopToFirebaseCloud(false);
    }
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
  syncAdminLiveOpsAndMail(false);
  syncRemoteGameConfigV15();
  updateAllUI();
  startDayClock();
});
