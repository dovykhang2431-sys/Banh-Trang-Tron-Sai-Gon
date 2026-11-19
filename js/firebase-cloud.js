/**
 * ================= ĐỘNG CƠ ĐỒNG BỘ FIREBASE CLOUD & BẢO MẬT ĐĂNG NHẬP V16 =================
 * - Lưu trữ & Đồng bộ dữ liệu Cloud-First lên Firebase Realtime Database (/shops, /leaderboard, /recoveryCodes, /pvp_rooms)
 * - Tự động fallback & cache xuống localStorage khi mất mạng, đồng bộ lại ngay khi có mạng
 * - Tích hợp bảng Cấu Hình Kết Nối Firebase & Công cụ đẩy 105 quán cũ lên Firebase 1 chạm
 */

let userManuallyChangedLoginAvatar = false;
let cloudSyncDebounceTimer = null;
let lastCloudSyncTimestamp = 0;
let isCloudConnectedLive = false;
let pvpRoomLeaderboardCache = [];

function renderLoginAvatarGrid() {
  const grid = document.getElementById("login-avatar-grid");
  if (grid) {
    grid.innerHTML = AVATAR_PRESETS.map(p => `
      <button type="button" onclick="selectLoginAvatar('${p.id}')" class="soft-btn p-1 rounded-xl flex flex-col items-center justify-center border-2 ${loginSelectedAvatar === p.id ? 'border-orange-600 bg-orange-100 scale-105 shadow' : 'border-amber-200 bg-white'}">
        <img src="${p.src}" alt="${escapeHtml(p.label)}" class="w-9 h-9 rounded-lg object-cover" />
        <span class="text-[8px] font-black text-amber-950 mt-0.5 leading-tight">${escapeHtml(p.label)}</span>
      </button>
    `).join("");
  }
  const badge = document.getElementById("login-selected-avatar-badge");
  if (badge) badge.innerHTML = renderAvatarContent(loginSelectedAvatar, "w-full h-full object-cover rounded-full");

  const nameInputEl = document.getElementById("login-shop-name");
  if (nameInputEl && !nameInputEl.dataset.boundAvatarSync) {
    nameInputEl.dataset.boundAvatarSync = "1";
    nameInputEl.addEventListener("input", () => {
      if (userManuallyChangedLoginAvatar) return;
      const typedKey = sanitizeShopKey(nameInputEl.value);
      const matchInLb = cloudLeaderboardCache.find(item => item.shopKey === typedKey);
      if (matchInLb && matchInLb.avatar) {
        loginSelectedAvatar = matchInLb.avatar;
      } else {
        loginSelectedAvatar = "av_ditu";
      }
      renderLoginAvatarGrid();
    });
  }
}

function selectLoginAvatar(av) {
  loginSelectedAvatar = av;
  userManuallyChangedLoginAvatar = true;
  renderLoginAvatarGrid();
}

function isCloudProgressNewer(cloudState, localState) {
  if (!cloudState) return false;
  if (!localState) return true;
  const cAdmin = Number(cloudState.adminOverrideAt || 0), lAdmin = Number(localState.adminOverrideAt || 0);
  if (cAdmin !== lAdmin) return cAdmin > lAdmin;
  const cReset = Number(cloudState.bankruptcyResetAt || 0), lReset = Number(localState.bankruptcyResetAt || 0);
  if (cReset !== lReset) return cReset > lReset;
  const cBankrupt = Boolean(cloudState.isBankrupt), lBankrupt = Boolean(localState.isBankrupt);
  if (cBankrupt !== lBankrupt) {
    const cTs = Number(cloudState.bankruptcyAt || cloudState.updatedAt || 0);
    const lTs = Number(localState.bankruptcyAt || localState.updatedAt || 0);
    return cTs >= lTs;
  }
  const cTime = Number(cloudState.updatedAt || 0), lTime = Number(localState.updatedAt || 0);
  if (cTime > 0 && lTime > 0 && Math.abs(cTime - lTime) > 2000) {
    return cTime > lTime;
  }
  const cLevel = Number(cloudState.level || 1), lLevel = Number(localState.level || 1);
  if (cLevel !== lLevel) return cLevel > lLevel;
  const cDay = Number(cloudState.day || 1), lDay = Number(localState.day || 1);
  if (cDay !== lDay) return cDay > lDay;
  const cSold = Number(cloudState.totalSold || 0), lSold = Number(localState.totalSold || 0);
  if (cSold !== lSold) return cSold > lSold;
  return cTime >= lTime;
}

function applyAdminOverrideToStateObj(baseState, ovr) {
  if (!ovr || typeof ovr !== "object") return baseState;
  const ovrTs = Number(ovr.adminOverrideAt || 0);
  const baseUpdated = Number(baseState.updatedAt || 0);
  const baseAdmin = Number(baseState.adminOverrideAt || 0);
  if (ovrTs <= 0 || (ovrTs <= baseAdmin && baseUpdated >= ovrTs)) return baseState;
  return {
    ...baseState,
    ...ovr,
    equipLevels: { ...(baseState.equipLevels || {}), ...(ovr.equipLevels || {}) },
    staff: { ...(baseState.staff || {}), ...(ovr.staff || {}) },
    staffStars: { ...(baseState.staffStars || {}), ...(ovr.staffStars || {}) },
    licenses: { ...(baseState.licenses || {}), ...(ovr.licenses || {}) },
    shopScale: ovr.shopScale !== undefined ? Math.min(6, Math.max(0, Number(ovr.shopScale || 0))) : Number(baseState.shopScale || 0),
    workshops: ovr.workshops ? { ...(baseState.workshops || {}), ...ovr.workshops } : (baseState.workshops || {}),
    franchises: ovr.franchises ? { ...(baseState.franchises || {}), ...ovr.franchises } : (baseState.franchises || {}),
    ownedDecors: Array.isArray(ovr.ownedDecors) ? [...ovr.ownedDecors] : (baseState.ownedDecors || []),
    equippedDecors: ovr.equippedDecors ? { ...(baseState.equippedDecors || {}), ...ovr.equippedDecors } : (baseState.equippedDecors || {}),
    stock: ovr.stock ? { ...(baseState.stock || {}), ...ovr.stock } : (baseState.stock || {}),
    stockBatches: ovr.stock ? null : (baseState.stockBatches || null),
    unlockedDishes: Array.isArray(ovr.unlockedDishes) && ovr.unlockedDishes.length > 0 ? ovr.unlockedDishes : (baseState.unlockedDishes || ["tron"]),
    adminOverrideAt: ovrTs,
    lastAppliedAdminOverrideAt: ovrTs,
    updatedAt: Math.max(baseUpdated, ovrTs)
  };
}

function getCombinedShopsVault() {
  const merged = {};
  if (typeof EMBEDDED_SERVER_SHOPS_SNAPSHOT === "object" && EMBEDDED_SERVER_SHOPS_SNAPSHOT) {
    Object.entries(EMBEDDED_SERVER_SHOPS_SNAPSHOT).forEach(([k, v]) => {
      if (v && typeof v === "object" && !k.startsWith("npc_")) {
        merged[k] = v;
      }
    });
  }
  try {
    const raw = localStorage.getItem(LOCAL_SHOPS_REGISTRY_KEY);
    if (raw) {
      const localMap = JSON.parse(raw);
      if (localMap && typeof localMap === "object") {
        Object.entries(localMap).forEach(([k, v]) => {
          if (!v || typeof v !== "object") return;
          const existing = merged[k];
          const existingTs = Number(existing?.updatedAt || existing?.fullState?.updatedAt || 0);
          const localTs = Number(v.updatedAt || v.fullState?.updatedAt || 0);
          if (!existing || localTs >= existingTs) {
            merged[k] = v;
          }
        });
      }
    }
  } catch (e) {}
  return merged;
}

function saveShopToLocalVault(shopState) {
  if (!shopState || !shopState.shopName) return;
  try {
    let localMap = {};
    const raw = localStorage.getItem(LOCAL_SHOPS_REGISTRY_KEY);
    if (raw) localMap = JSON.parse(raw) || {};
    const key = shopState.shopKey || sanitizeShopKey(shopState.shopName);
    if (!key) return;
    localMap[key] = {
      ...shopState,
      shopKey: key,
      updatedAt: Number(shopState.updatedAt || Date.now())
    };
    localStorage.setItem(LOCAL_SHOPS_REGISTRY_KEY, JSON.stringify(localMap));
  } catch (e) {}
}

async function fetchSingleShopFromFirebase(shopKey) {
  const dbUrl = getFirebaseDbUrl();
  if (!dbUrl || !shopKey) return null;
  try {
    const res = await fetchWithTimeout(`${dbUrl}/shops/${encodeURIComponent(shopKey)}.json`, {}, 4500);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object") return null;
    return data;
  } catch (e) {
    return null;
  }
}

async function checkExistingLocalSaveForLoginScreen() {
  try {
    userManuallyChangedLoginAvatar = false;
    updateFirebaseStatusBadgesUI();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem("banh_trang_tron_saigon_v5_master_save");
    if (!raw) {
      renderLoginTop3Preview();
      return;
    }
    let saved = JSON.parse(raw);
    if (!saved || !saved.shopName) {
      renderLoginTop3Preview();
      return;
    }

    const renderQuickBox = (data, isSyncedCloud = false) => {
      const qBox = document.getElementById("quick-resume-box");
      if (!qBox) return;
      if (data.isBankrupt) {
        qBox.classList.remove("hidden");
        const lbl = document.getElementById("quick-resume-label");
        if (lbl) lbl.textContent = "💔 Quán đã Phá Sản:";
        document.getElementById("quick-resume-avatar").innerHTML = renderAvatarContent(data.avatar || "av_ditu", "w-full h-full object-cover rounded-xl grayscale");
        document.getElementById("quick-resume-name").textContent = data.shopName;
        document.getElementById("quick-resume-stats").textContent = `💔 Đã phá sản (Ngày ${data.day || 1}) • Bấm để Khởi nghiệp lại`;
      } else {
        qBox.classList.remove("hidden");
        const lbl = document.getElementById("quick-resume-label");
        if (lbl) lbl.textContent = isSyncedCloud ? "☁️ Đã đồng bộ Firebase Cloud:" : "Quán đang lưu:";
        document.getElementById("quick-resume-avatar").innerHTML = renderAvatarContent(data.avatar || "av_ditu", "w-full h-full object-cover rounded-xl");
        document.getElementById("quick-resume-name").textContent = data.shopName;
        document.getElementById("quick-resume-stats").textContent = `Cấp ${data.level || 1} • ${(data.rating || 5.0).toFixed(1)}⭐ • ${formatShortK(data.money ?? 350000)}`;
      }
      document.getElementById("login-shop-name").value = data.shopName;
      document.getElementById("login-shop-pin").value = (!String(data.pin || "").startsWith("PINH_")) ? (data.pin || "") : "";
      if (!userManuallyChangedLoginAvatar) {
        loginSelectedAvatar = data.avatar || "av_ditu";
        renderLoginAvatarGrid();
      }
    };

    renderQuickBox(saved, false);
    saveShopToLocalVault(saved);
    renderLoginTop3Preview();

    // Nếu đã cấu hình Firebase, kiểm tra bản lưu mới nhất trên Cloud cho quán này
    if (isFirebaseConfigured()) {
      const key = saved.shopKey || sanitizeShopKey(saved.shopName);
      const cloudRecord = await fetchSingleShopFromFirebase(key);
      if (cloudRecord) {
        isCloudConnectedLive = true;
        updateFirebaseStatusBadgesUI();
        const cloudFull = cloudRecord.fullState ? { ...cloudRecord.fullState, ...cloudRecord } : cloudRecord;
        if (isCloudProgressNewer(cloudFull, saved)) {
          saved = { ...saved, ...cloudFull };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saved));
          saveShopToLocalVault(saved);
        }
        renderQuickBox(saved, true);
      }
    }
  } catch (e) {}
}

function prefillLoginShopName(shopName) {
  const inp = document.getElementById("login-shop-name");
  const pinInp = document.getElementById("login-shop-pin");
  if (inp) inp.value = shopName;
  if (pinInp) {
    pinInp.value = "";
    pinInp.focus();
  }
  showLoginMessage(`🔑 Hãy nhập Mã PIN 4 số của quán "${shopName}" rồi bấm Đẩy Xe Ra Nghề!`, "info");
}

async function quickResumeGame() {
  initAudio(); startChillBGM();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem("banh_trang_tron_saigon_v5_master_save");
    if (raw) {
      let localData = JSON.parse(raw);
      const key = localData.shopKey || sanitizeShopKey(localData.shopName);
      if (isFirebaseConfigured() && key) {
        const cloudRecord = await fetchSingleShopFromFirebase(key);
        if (cloudRecord) {
          const cloudFull = cloudRecord.fullState ? { ...cloudRecord.fullState, ...cloudRecord } : cloudRecord;
          if (isCloudProgressNewer(cloudFull, localData)) {
            localData = { ...localData, ...cloudFull };
          }
        }
      }
      state = getInitialDefaultState();
      mergeLoadedState(localData);
      state.offlineMode = !isFirebaseConfigured();
      ensureRecoveryCode();
    }
  } catch (e) {}
  document.getElementById("login-screen").classList.add("hidden");
  updateAllUI();
  if (state.isBankrupt) {
    declareTrueBankruptcy(true);
    showToast(`💔 Quán "${state.shopName}" đã Phá Sản! Hãy Khởi nghiệp lại từ Ngày 1.`);
    return;
  }
  if (state.money < 0 || (state.money < 15000 && (state.stock.banhtrang || 0) < 1)) {
    checkBankruptcyOrRescueLoan();
    return;
  }
  if (state.isStreetSelling) startStreetSellingPhase(true);
  showToast(`🎉 Chào mừng chủ quán "${state.shopName}" (Mã: ${state.recoveryCode}) quay trở lại!`);
  saveGameEverywhere(false);
}

async function handleLoginOrRegister() {
  initAudio(); startChillBGM();
  const nameInput = document.getElementById("login-shop-name").value.trim();
  const pinInput = document.getElementById("login-shop-pin").value.trim();
  const btn = document.getElementById("btn-login-submit");

  if (nameInput.length < 2) { showLoginMessage("⚠️ Tên quán từ 2 ký tự trở lên!", "error"); return; }
  if (!/^\d{4}$/.test(pinInput)) { showLoginMessage("⚠️ Vui lòng nhập Mã PIN gồm đúng 4 chữ số!", "error"); return; }

  const key = sanitizeShopKey(nameInput);
  if (!key) { showLoginMessage("⚠️ Tên quán không hợp lệ!", "error"); return; }

  btn.disabled = true;
  if (isFirebaseConfigured()) {
    showLoginMessage("☁️ Đang đồng bộ hồ sơ quán với máy chủ Firebase...", "info");
  }

  const vault = getCombinedShopsVault();
  let matchedRecord = vault[key] || null;

  // Ưu tiên truy vấn trực tiếp từ Firebase Cloud trước
  if (isFirebaseConfigured()) {
    const cloudRecord = await fetchSingleShopFromFirebase(key);
    if (cloudRecord) {
      isCloudConnectedLive = true;
      const cloudFull = cloudRecord.fullState ? { ...cloudRecord.fullState, ...cloudRecord } : cloudRecord;
      const localFull = matchedRecord ? (matchedRecord.fullState ? { ...matchedRecord.fullState, ...matchedRecord } : matchedRecord) : null;
      if (!localFull || isCloudProgressNewer(cloudFull, localFull)) {
        matchedRecord = cloudRecord;
      }
    }
  }

  let isExistingShop = false;
  let storedPinHash = null;
  let loadedAvatar = null;

  if (matchedRecord) {
    const recordPin = matchedRecord.pin || matchedRecord.fullState?.pin || "";
    if (recordPin && recordPin !== "LOCAL") {
      if (!verifyShopPin(key, pinInput, recordPin)) {
        showLoginMessage("❌ Tên quán đã có chủ! Hãy nhập đúng Mã PIN 4 số hoặc đặt Tên khác.", "error");
        btn.disabled = false;
        return;
      }
      storedPinHash = hashShopPin(key, pinInput);
    } else {
      storedPinHash = hashShopPin(key, pinInput);
    }
    isExistingShop = true;
    const fullSt = matchedRecord.fullState ? { ...matchedRecord.fullState, ...matchedRecord } : matchedRecord;
    loadedAvatar = fullSt.avatar || "av_ditu";
    state = getInitialDefaultState();
    mergeLoadedState(fullSt);
    if (matchedRecord.recoveryCode || fullSt.recoveryCode) {
      state.recoveryCode = matchedRecord.recoveryCode || fullSt.recoveryCode;
    }
  } else {
    state = getInitialDefaultState();
  }

  state.shopKey = key;
  state.shopName = nameInput;
  state.pin = isExistingShop ? (storedPinHash || hashShopPin(key, pinInput)) : hashShopPin(key, pinInput);
  state.offlineMode = !isFirebaseConfigured();
  state.avatar = userManuallyChangedLoginAvatar ? loginSelectedAvatar : (loadedAvatar || state.avatar || "av_ditu");
  loginSelectedAvatar = state.avatar;
  userManuallyChangedLoginAvatar = false;
  state.levelAtStartOfDay = state.level || 1;
  await ensureUniqueRecoveryCodeOnCloud();

  if (state.isBankrupt) {
    document.getElementById("login-screen").classList.add("hidden");
    btn.disabled = false;
    updateAllUI();
    declareTrueBankruptcy(true);
    showToast(`💔 Quán "${state.shopName}" đã Phá Sản! Hãy Khởi nghiệp lại với 350.000đ.`);
    return;
  }

  saveToLocalOnly();
  await saveGameEverywhere(false);

  document.getElementById("login-screen").classList.add("hidden");
  btn.disabled = false;
  updateAllUI();
  if (state.money < 0 || (state.money < 15000 && (state.stock.banhtrang || 0) < 1)) {
    checkBankruptcyOrRescueLoan();
    return;
  }
  if (state.isStreetSelling) {
    startStreetSellingPhase(true);
  } else if (!isExistingShop && !state.seenIntroTutorial && state.day === 1 && state.totalSold === 0) {
    openDiTuTutorialModal(0);
  }
  showToast(isExistingShop
    ? `🎉 Chào mừng quán "${state.shopName}" (Cấp ${state.level} • Mã: ${state.recoveryCode}) trở lại!`
    : `🚀 Khai trương "${state.shopName}"! Mã Khôi Phục: ${state.recoveryCode}`);
}

function showLoginMessage(text, type) {
  const msgEl = document.getElementById("login-status-msg");
  if (!msgEl) return;
  msgEl.classList.remove("hidden", "bg-red-100", "text-red-800", "bg-emerald-100", "text-emerald-800", "bg-amber-100", "text-amber-900");
  msgEl.classList.add(type === "error" ? "bg-red-100" : type === "success" ? "bg-emerald-100" : "bg-amber-100");
  msgEl.classList.add(type === "error" ? "text-red-800" : type === "success" ? "text-emerald-800" : "text-amber-900");
  msgEl.textContent = text;
}

function openLoginModalForSwitch() {
  userManuallyChangedLoginAvatar = false;
  checkExistingLocalSaveForLoginScreen();
  fetchCloudLeaderboard(false);
  document.getElementById("login-screen").classList.remove("hidden");
}

function openProfileEditModal() {
  ensureRecoveryCode();
  saveToLocalOnly();
  profileTempAvatar = state.avatar || "av_ditu";
  document.getElementById("profile-edit-name").value = state.shopName || "";
  const codeEl = document.getElementById("profile-recovery-code");
  if (codeEl) codeEl.textContent = state.recoveryCode;
  const portableEl = document.getElementById("profile-portable-code-preview");
  if (portableEl) portableEl.value = generatePortableSaveCode(state);
  renderProfileAvatarGrid();
  document.getElementById("modal-profile-edit").classList.remove("hidden");
}

function closeProfileEditModal() { document.getElementById("modal-profile-edit").classList.add("hidden"); }

function renderProfileAvatarGrid() {
  document.getElementById("profile-edit-preview").innerHTML = renderAvatarContent(profileTempAvatar, "w-full h-full object-cover rounded-xl");
  document.getElementById("profile-avatar-grid").innerHTML = AVATAR_PRESETS.map(p => `
    <button type="button" onclick="selectProfileAvatar('${p.id}')" class="soft-btn p-1 rounded-xl flex flex-col items-center justify-center border-2 ${profileTempAvatar === p.id ? 'border-orange-600 bg-orange-100 scale-105 shadow' : 'border-amber-200 bg-white'}">
      <img src="${p.src}" alt="${escapeHtml(p.label)}" class="w-9 h-9 rounded-lg object-cover" />
      <span class="text-[8px] font-black text-amber-950 mt-0.5 leading-tight">${escapeHtml(p.label)}</span>
    </button>
  `).join("");
}

function selectProfileAvatar(av) { profileTempAvatar = av; renderProfileAvatarGrid(); }

function saveProfileChanges() {
  const newName = document.getElementById("profile-edit-name").value.trim();
  if (newName.length < 2) { showToast("⚠️ Tên bảng hiệu từ 2 ký tự!"); return; }
  state.shopName = newName; state.avatar = profileTempAvatar; loginSelectedAvatar = profileTempAvatar;
  closeProfileEditModal(); playSFX("cash"); updateAllUI(); saveGameEverywhere(true);
  showToast(`✅ Đã lưu Bảng Hiệu mới! (Mã Khóa Cloud: ${state.recoveryCode})`);
}

// ================= KHÔI PHỤC CLOUD & ĐỒNG BỘ FIREBASE =================
function normalizeRecoveryCodeInput(raw) {
  const cleaned = String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
  if (/^\d{6}$/.test(cleaned)) return `BT-${cleaned}`;
  if (/^BT\d{6}$/.test(cleaned)) return `BT-${cleaned.slice(2)}`;
  return cleaned;
}

function ensureRecoveryCode() {
  if (!state.recoveryCode || !/^BT-\d{6}$/.test(String(state.recoveryCode))) {
    const rand6 = Math.floor(100000 + Math.random() * 900000);
    state.recoveryCode = `BT-${rand6}`;
  }
  return state.recoveryCode;
}

async function ensureUniqueRecoveryCodeOnCloud() {
  const code = ensureRecoveryCode();
  const dbUrl = getFirebaseDbUrl();
  if (!dbUrl) return code;
  try {
    const res = await fetchWithTimeout(`${dbUrl}/recoveryCodes/${encodeURIComponent(code)}.json`, {}, 3000);
    if (res.ok) {
      const existing = await res.json();
      const myKey = state.shopKey || sanitizeShopKey(state.shopName);
      if (existing && existing.shopKey && existing.shopKey !== myKey) {
        state.recoveryCode = `BT-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }
  } catch (e) {}
  return state.recoveryCode;
}

function generatePortableSaveCode(targetState = state) {
  try {
    ensureRecoveryCode();
    const slim = {
      ...targetState,
      localCustomAvatar: null,
      reviews: Array.isArray(targetState.reviews) ? targetState.reviews.slice(0, 10) : [],
      ledgerHistory: Array.isArray(targetState.ledgerHistory) ? targetState.ledgerHistory.slice(0, 7) : []
    };
    const jsonStr = JSON.stringify(slim);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    return `BTT1-${encoded}`;
  } catch (e) {
    return ensureRecoveryCode();
  }
}

function decodePortableSaveCode(rawStr) {
  const trimmed = String(rawStr || "").trim();
  if (!trimmed.startsWith("BTT1-")) return null;
  try {
    const b64 = trimmed.slice(5).trim();
    const jsonStr = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === "object" && parsed.shopName) return parsed;
  } catch (e) {}
  return null;
}

function toggleRecoveryBox() {
  const box = document.getElementById("recovery-code-box");
  if (box) box.classList.toggle("hidden");
}

function copyRecoveryCode() {
  const code = ensureRecoveryCode();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    } else {
      const ta = document.createElement("textarea");
      ta.value = code; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
  } catch (e) {}
  playSFX("cash");
  showToast(`📋 Đã sao chép Mã Khóa: ${code}!`);
}

function copyFullPortableRecoveryCode() {
  saveToLocalOnly();
  const portableCode = generatePortableSaveCode(state);
  const previewEl = document.getElementById("profile-portable-code-preview");
  if (previewEl) previewEl.value = portableCode;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(portableCode);
    } else {
      const ta = document.createElement("textarea");
      ta.value = portableCode; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
  } catch (e) {}
  playSFX("cash");
  showToast("📋 Đã sao chép Mã Sao Lưu Đổi Máy (BTT1-...)!");
}

async function handleRecoverByCode() {
  initAudio(); startChillBGM();
  const rawInput = (document.getElementById("recovery-code-input")?.value || "").trim();
  const pinInput = (document.getElementById("recovery-pin-input")?.value || "").trim();

  if (!rawInput) {
    showLoginMessage("⚠️ Nhập Mã Khóa BT-123456 hoặc dán chuỗi BTT1-...", "error");
    return;
  }

  if (rawInput.startsWith("BTT1-")) {
    const decoded = decodePortableSaveCode(rawInput);
    if (!decoded) {
      showLoginMessage("❌ Chuỗi Mã Sao Lưu BTT1-... không hợp lệ!", "error");
      return;
    }
    state = getInitialDefaultState();
    mergeLoadedState(decoded);
    state.offlineMode = !isFirebaseConfigured();
    ensureRecoveryCode();
    saveToLocalOnly();
    await saveGameEverywhere(false);
    document.getElementById("login-screen").classList.add("hidden");
    updateAllUI();
    if (state.isStreetSelling) startStreetSellingPhase(true);
    playSFX("cash");
    showToast(`🎉 Đã khôi phục quán "${state.shopName}" (Cấp ${state.level})!`);
    return;
  }

  const codeInput = normalizeRecoveryCodeInput(rawInput);
  if (!/^BT-\d{6}$/.test(codeInput)) {
    showLoginMessage("⚠️ Nhập đúng định dạng BT-123456 hoặc BTT1-...", "error");
    return;
  }

  let foundRecord = null;
  const dbUrl = getFirebaseDbUrl();

  // 1. Tìm trên Firebase Cloud trước (/recoveryCodes/{code}.json -> /shops/{shopKey}.json)
  if (dbUrl) {
    showLoginMessage(`☁️ Đang tìm Mã Khóa ${codeInput} trên máy chủ Firebase...`, "info");
    try {
      const resCode = await fetchWithTimeout(`${dbUrl}/recoveryCodes/${encodeURIComponent(codeInput)}.json`, {}, 4000);
      if (resCode.ok) {
        const codeMeta = await resCode.json();
        if (codeMeta && codeMeta.shopKey) {
          const cloudShop = await fetchSingleShopFromFirebase(codeMeta.shopKey);
          if (cloudShop) foundRecord = cloudShop;
        }
      }
      if (!foundRecord) {
        const resAll = await fetchWithTimeout(`${dbUrl}/shops.json`, {}, 5500);
        if (resAll.ok) {
          const allShops = await resAll.json();
          if (allShops && typeof allShops === "object") {
            foundRecord = Object.values(allShops).find(s => s && (s.recoveryCode === codeInput || s.fullState?.recoveryCode === codeInput)) || null;
          }
        }
      }
    } catch (e) {}
  }

  // 2. Fallback tìm trong kho Local & Seed 105 quán
  if (!foundRecord) {
    const vault = getCombinedShopsVault();
    foundRecord = Object.values(vault).find(s => s && (s.recoveryCode === codeInput || s.fullState?.recoveryCode === codeInput)) || null;
  }

  if (!foundRecord) {
    showLoginMessage(`❌ Không tìm thấy quán có Mã ${codeInput} trên Firebase hoặc máy!`, "error");
    return;
  }

  const fullSt = foundRecord.fullState ? { ...foundRecord.fullState, ...foundRecord } : foundRecord;
  const sKey = fullSt.shopKey || sanitizeShopKey(fullSt.shopName || "");
  const savedPin = String(fullSt.pin || "");

  if (savedPin && savedPin !== "LOCAL") {
    if (!/^\d{4}$/.test(pinInput) || !verifyShopPin(sKey, pinInput, savedPin)) {
      showLoginMessage("❌ Vui lòng nhập đúng Mã PIN 4 số của quán để khôi phục!", "error");
      return;
    }
  }

  if (fullSt.isBankrupt) {
    showLoginMessage(`💔 Quán "${fullSt.shopName}" đã Phá Sản! Hãy nhập Tên Quán & PIN để Khởi nghiệp lại từ Ngày 1.`, "error");
    return;
  }

  state = getInitialDefaultState();
  mergeLoadedState(fullSt);
  state.shopKey = sKey;
  state.pin = savedPin || hashShopPin(sKey, pinInput || "0000");
  state.offlineMode = !isFirebaseConfigured();
  ensureRecoveryCode();
  saveToLocalOnly();
  await saveGameEverywhere(false);
  document.getElementById("login-screen").classList.add("hidden");
  updateAllUI();
  if (state.isStreetSelling) startStreetSellingPhase(true);
  playSFX("cash");
  showToast(`🎉 Đã khôi phục quán "${state.shopName}" (Cấp ${state.level})!`);
}

function setCloudSyncIndicator(status) {
  const btn = document.getElementById("cloud-sync-btn");
  const dot = document.getElementById("cloud-sync-dot");
  const txt = document.getElementById("cloud-sync-text");
  if (!btn || !dot) return;
  if (status === "syncing") {
    dot.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
    if (txt) txt.textContent = "Đang đồng bộ...";
  } else if (status === "offline") {
    dot.className = "w-2 h-2 rounded-full bg-orange-400";
    if (txt) txt.textContent = isFirebaseConfigured() ? "Lỗi mạng Cloud" : "Lưu trên máy";
  } else {
    dot.className = isFirebaseConfigured() ? "w-2 h-2 rounded-full bg-emerald-400" : "w-2 h-2 rounded-full bg-sky-400";
    if (txt) txt.textContent = isFirebaseConfigured() ? "Đã lưu Firebase" : "Đã lưu máy";
  }
  updateFirebaseStatusBadgesUI();
}

function updateFirebaseStatusBadgesUI() {
  const hasFb = isFirebaseConfigured();
  const loginModeLbl = document.getElementById("login-network-mode-label");
  if (loginModeLbl) {
    loginModeLbl.textContent = hasFb ? "☁️ Đồng bộ Firebase Cloud (Realtime)" : "💾 Lưu trên máy (Bấm ☁️ để gắn Firebase)";
    loginModeLbl.className = hasFb ? "text-emerald-700 font-black" : "text-amber-700 font-black";
  }
  const lbStatusBadge = document.getElementById("lb-firebase-status-badge");
  if (lbStatusBadge) {
    lbStatusBadge.textContent = hasFb
      ? (isCloudConnectedLive ? "🟢 Firebase Cloud Online" : "☁️ Đã cấu hình Firebase")
      : "🟠 Chưa gắn URL Firebase (Đang hiện 105 quán Seed)";
    lbStatusBadge.className = hasFb
      ? "px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-900 font-black text-[9.5px]"
      : "px-2 py-0.5 rounded-full bg-amber-100 border border-amber-400 text-amber-900 font-black text-[9.5px]";
  }
}

async function forceManualCloudSync() {
  playSFX("cash");
  if (!isFirebaseConfigured()) {
    openFirebaseConfigModal();
    return;
  }
  await saveGameEverywhere(true);
}

async function saveGameEverywhere(isManual = false) {
  ensureRecoveryCode();
  const hasFb = isFirebaseConfigured();
  state.offlineMode = !hasFb;
  const nowTs = Date.now();
  state.updatedAt = nowTs;
  const key = state.shopKey || sanitizeShopKey(state.shopName);
  state.shopKey = key;
  saveToLocalOnly();

  if (!hasFb || !key || !state.shopName) {
    setCloudSyncIndicator("saved");
    if (isManual) showToast(`💾 Đã lưu quán "${state.shopName}" trên máy (Mã: ${state.recoveryCode})!`);
    return true;
  }

  // Nếu không phải bấm đồng bộ thủ công và vừa mới đồng bộ cách đây < 2.2 giây thì debounce để tránh nghẽn mạng khi bấm trộn liên tục
  if (!isManual && (nowTs - lastCloudSyncTimestamp < 2200)) {
    if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
    cloudSyncDebounceTimer = setTimeout(() => {
      syncShopToFirebaseCloud(false);
    }, 2200);
    return true;
  }

  return await syncShopToFirebaseCloud(isManual);
}

async function syncShopToFirebaseCloud(isManual = false) {
  const dbUrl = getFirebaseDbUrl();
  const key = state.shopKey || sanitizeShopKey(state.shopName);
  if (!dbUrl || !key || !state.shopName) return false;

  lastCloudSyncTimestamp = Date.now();
  const nowTs = lastCloudSyncTimestamp;
  setCloudSyncIndicator("syncing");

  const safePublicAvatar = (typeof state.avatar === "string" && state.avatar.startsWith("data:image/"))
    ? "av_ditu"
    : (state.avatar || "av_ditu");
  const safeShopName = sanitizeVietnameseDisplayName(state.shopName);
  const netWorthVal = computeShopNetWorth(state);

  const publicSummary = {
    shopKey: key,
    shopName: safeShopName,
    avatar: safePublicAvatar,
    creditScore: Number(state.creditScore || 520),
    savingsBalance: Number(state.savingsBalance || 0),
    prestigeGen: Number(state.prestigeGen || 0),
    marketSharePct: Number(state.marketSharePct || 28),
    pvpRoomCode: String(state.pvpRoomCode || "SAIGON01"),
    money: Number(state.money || 0),
    rating: Number(state.rating || 5.0),
    level: Number(state.level || 1),
    totalSold: Number(state.totalSold || 0),
    day: Number(state.day || 1),
    shopScale: Number(state.shopScale || 0),
    decorCount: Array.isArray(state.ownedDecors) ? state.ownedDecors.length : 0,
    netWorth: netWorthVal,
    isBankrupt: Boolean(state.isBankrupt),
    bankruptcyResetAt: Number(state.bankruptcyResetAt || 0),
    adminOverrideAt: Number(state.adminOverrideAt || 0),
    updatedAt: nowTs
  };

  const slimState = {
    ...state,
    avatar: safePublicAvatar,
    localCustomAvatar: null,
    reviews: Array.isArray(state.reviews)
      ? state.reviews.slice(0, 15).map(rv => ({
          id: rv.id,
          custId: rv.custId || "",
          custName: rv.custName || "",
          custJob: rv.custJob || "",
          custAvatar: rv.custAvatar || "😋",
          dishName: rv.dishName || "",
          stars: Number(rv.stars || 5),
          likes: Number(rv.likes || 24),
          comment: rv.comment || rv.text || "",
          replied: Boolean(rv.replied),
          replyText: rv.replyText || ""
        }))
      : [],
    ledgerHistory: Array.isArray(state.ledgerHistory) ? state.ledgerHistory.slice(0, MAX_LEDGER_DAYS) : []
  };

  try {
    const [resLb, resShop, resRec] = await Promise.allSettled([
      fetchWithTimeout(`${dbUrl}/leaderboard/${encodeURIComponent(key)}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publicSummary)
      }, 6000),
      fetchWithTimeout(`${dbUrl}/shops/${encodeURIComponent(key)}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...publicSummary,
          recoveryCode: state.recoveryCode,
          pin: state.pin,
          fullState: slimState
        })
      }, 6000),
      fetchWithTimeout(`${dbUrl}/recoveryCodes/${encodeURIComponent(state.recoveryCode)}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopKey: key,
          shopName: state.shopName,
          isBankrupt: Boolean(state.isBankrupt),
          bankruptcyResetAt: Number(state.bankruptcyResetAt || 0),
          updatedAt: nowTs
        })
      }, 6000),
      fetchWithTimeout(`${dbUrl}/shops/npc_admin_registry/fullState/adminRegistry/shopOverrides/${encodeURIComponent(key)}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopKey: key,
          shopName: safeShopName,
          avatar: safePublicAvatar,
          creditScore: Number(state.creditScore || 520),
          savingsBalance: Number(state.savingsBalance || 0),
          bankLoanTier: Number(state.bankLoanTier || 0),
          prestigeGen: Number(state.prestigeGen || 0),
          marketSharePct: Number(state.marketSharePct || 28),
          pvpRoomCode: String(state.pvpRoomCode || "SAIGON01"),
          pin: state.pin,
          recoveryCode: state.recoveryCode,
          money: Number(state.money || 0),
          rating: Number(state.rating || 5.0),
          level: Number(state.level || 1),
          day: Number(state.day || 1),
          totalSold: Number(state.totalSold || 0),
          viralPct: Number(state.viralPct || 15),
          equipLevels: state.equipLevels || {},
          staff: state.staff || {},
          staffStars: state.staffStars || {},
          licenses: state.licenses || {},
          shopScale: Number(state.shopScale || 0),
          workshops: state.workshops || {},
          franchises: state.franchises || {},
          ownedDecors: state.ownedDecors || [],
          unlockedDishes: state.unlockedDishes || ["tron"],
          stock: state.stock || {},
          loanDebt: Number(state.loanDebt || 0),
          rescueLoanCount: Number(state.rescueLoanCount || 0),
          cartDurability: Number(state.cartDurability ?? 100),
          isBankrupt: Boolean(state.isBankrupt),
          bankruptcyResetAt: Number(state.bankruptcyResetAt || 0),
          updatedAt: nowTs
        })
      }, 5000)
    ]);

    const lbOk = resLb.status === "fulfilled" && resLb.value && resLb.value.ok;
    const shopOk = resShop.status === "fulfilled" && resShop.value && resShop.value.ok;

    const idx = cloudLeaderboardCache.findIndex(x => sanitizeShopKey(x.shopKey || x.shopName) === key);
    if (idx >= 0) cloudLeaderboardCache[idx] = { ...cloudLeaderboardCache[idx], ...publicSummary };
    else cloudLeaderboardCache.push(publicSummary);

    if (lbOk || shopOk) {
      isCloudConnectedLive = true;
      setCloudSyncIndicator("saved");
      if (isManual) showToast(`☁️ Đã đồng bộ quán "${state.shopName}" lên Firebase Cloud!`);
      return true;
    } else {
      setCloudSyncIndicator("offline");
      if (isManual) showToast("⚠️ Không thể ghi lên Firebase (Kiểm tra Rules hoặc URL Firebase)!");
      return false;
    }
  } catch (e) {
    setCloudSyncIndicator("offline");
    if (isManual) showToast("⚠️ Mạng yếu, đã lưu an toàn vào bộ nhớ máy!");
    return false;
  }
}

async function fetchCloudLeaderboard(showFeedback = false) {
  const badge = document.getElementById("login-cloud-badge");
  const dbUrl = getFirebaseDbUrl();
  const mergedShopsMap = new Map();

  let delMap = {};
  let banMap = {};
  let ovrMap = {};

  const addOrUpdateShop = (item) => {
    if (!item || (!item.shopName && !item.fullState?.shopName)) return;
    const fs = item.fullState || {};
    const rawName = item.shopName || fs.shopName || "";
    if (String(rawName).startsWith("[DELETED]") || String(rawName).startsWith("[BANNED]")) return;
    const sKey = sanitizeShopKey(item.shopKey || rawName);
    if (!sKey || String(sKey).startsWith("npc_")) return;
    if (delMap[sKey] || (banMap[sKey] && banMap[sKey].isBanned)) return;
    if (item.isBanned || fs.isBanned || item.isDeleted || fs.isDeleted || String(item.pin || "").startsWith("BANNED_")) return;
    const rawOvr = ovrMap[sKey] || {};
    if (rawOvr.isBanned) return;

    const itemUpdatedAt = Math.max(Number(item.updatedAt || 0), Number(fs.updatedAt || 0));
    const ovrTs = Number(rawOvr.adminOverrideAt || 0);
    const ovr = (ovrTs > 0 && ovrTs > itemUpdatedAt) ? rawOvr : {};
    const isShopBankrupt = ovr.isBankrupt !== undefined ? Boolean(ovr.isBankrupt) : Boolean(item.isBankrupt || fs.isBankrupt);
    const isCurrentLocalShop = state && state.shopName && sanitizeShopKey(state.shopName) === sKey;

    const mergedObj = { ...fs, ...item, ...ovr };
    const candidate = {
      shopKey: sKey,
      shopName: isCurrentLocalShop ? state.shopName : (ovr.shopName || item.shopName || fs.shopName),
      avatar: isCurrentLocalShop ? state.avatar : (item.avatar || fs.avatar || "av_ditu"),
      money: isCurrentLocalShop ? Number(state.money || 0) : (ovr.money !== undefined ? Number(ovr.money) : (Number(item.money !== undefined ? item.money : fs.money) || 0)),
      rating: isCurrentLocalShop ? Number(state.rating || 5.0) : (ovr.rating !== undefined ? Number(ovr.rating) : (Number(item.rating !== undefined ? item.rating : fs.rating) || 5.0)),
      level: isCurrentLocalShop ? Number(state.level || 1) : (ovr.level !== undefined ? Number(ovr.level) : (Number(item.level !== undefined ? item.level : fs.level) || 1)),
      totalSold: isCurrentLocalShop ? Number(state.totalSold || 0) : (ovr.totalSold !== undefined ? Number(ovr.totalSold) : (Number(item.totalSold !== undefined ? item.totalSold : fs.totalSold) || 0)),
      day: isCurrentLocalShop ? Number(state.day || 1) : (ovr.day !== undefined ? Number(ovr.day) : (Number(item.day !== undefined ? item.day : fs.day) || 1)),
      shopScale: isCurrentLocalShop ? Number(state.shopScale || 0) : Number(ovr.shopScale ?? item.shopScale ?? fs.shopScale ?? 0),
      decorCount: isCurrentLocalShop ? (state.ownedDecors || []).length : (Array.isArray(mergedObj.ownedDecors) ? mergedObj.ownedDecors.length : Number(item.decorCount || 0)),
      creditScore: isCurrentLocalShop ? Number(state.creditScore || 520) : Number(mergedObj.creditScore || 520),
      savingsBalance: isCurrentLocalShop ? Number(state.savingsBalance || 0) : Number(mergedObj.savingsBalance || 0),
      prestigeGen: isCurrentLocalShop ? Number(state.prestigeGen || 0) : Number(mergedObj.prestigeGen || 0),
      marketSharePct: isCurrentLocalShop ? Number(state.marketSharePct || 28) : Number(mergedObj.marketSharePct || 28),
      franchiseCount: isCurrentLocalShop
        ? Object.values(state.franchises || {}).filter(v => Number(v || 0) > 0).length
        : Object.values(mergedObj.franchises || {}).filter(v => Number(v || 0) > 0).length,
      netWorth: isCurrentLocalShop ? computeShopNetWorth(state) : Math.max(Number(item.netWorth || 0), computeShopNetWorth(mergedObj)),
      isBankrupt: isCurrentLocalShop ? Boolean(state.isBankrupt) : isShopBankrupt,
      bankruptcyResetAt: isCurrentLocalShop ? Number(state.bankruptcyResetAt || 0) : Math.max(Number(ovr.bankruptcyResetAt || 0), Number(item.bankruptcyResetAt || fs.bankruptcyResetAt || 0)),
      adminOverrideAt: Math.max(ovrTs, Number(item.adminOverrideAt || fs.adminOverrideAt || 0)),
      updatedAt: isCurrentLocalShop ? Math.max(Date.now(), itemUpdatedAt) : Math.max(itemUpdatedAt, ovrTs)
    };

    const existing = mergedShopsMap.get(sKey);
    const isNewerReset = existing && (candidate.bankruptcyResetAt || 0) > (existing.bankruptcyResetAt || 0);
    const isOlderReset = existing && (candidate.bankruptcyResetAt || 0) < (existing.bankruptcyResetAt || 0);
    const isNewerTime = existing && !isOlderReset && candidate.updatedAt > (existing.updatedAt || 0);
    const isSameTimeNewer = existing && !isOlderReset && candidate.updatedAt === (existing.updatedAt || 0) && candidate.totalSold > existing.totalSold;
    if (!existing || isNewerReset || isNewerTime || isSameTimeNewer) {
      mergedShopsMap.set(sKey, candidate);
    }
  };

  // Nạp dữ liệu nền từ Local Vault & 105 quán Seed trước để BXH không bao giờ bị trống
  const localVault = getCombinedShopsVault();
  Object.values(localVault).forEach(addOrUpdateShop);

  if (!dbUrl) {
    cloudLeaderboardCache = Array.from(mergedShopsMap.values());
    isCloudConnectedLive = false;
    if (badge) {
      badge.textContent = `📦 Hệ thống (${cloudLeaderboardCache.length} quán)`;
      badge.className = "text-[9px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full";
    }
    updateFirebaseStatusBadgesUI();
    renderLoginTop3Preview();
    if (typeof renderLeaderboardTab === "function") renderLeaderboardTab();
    if (showFeedback) showToast(`🏆 Đã tải ${cloudLeaderboardCache.length} quán trên Bảng Xếp Hạng!`);
    return;
  }

  try {
    const [resLb, resShops] = await Promise.allSettled([
      fetchWithTimeout(`${dbUrl}/leaderboard.json`, {}, 6000),
      fetchWithTimeout(`${dbUrl}/shops.json`, {}, 6000)
    ]);

    let lbData = null, shopsData = null;
    if (resLb.status === "fulfilled" && resLb.value.ok) lbData = await resLb.value.json();
    if (resShops.status === "fulfilled" && resShops.value.ok) shopsData = await resShops.value.json();

    if (resLb.status === "fulfilled" && resLb.value.ok || resShops.status === "fulfilled" && resShops.value.ok) {
      isCloudConnectedLive = true;
    } else {
      throw new Error("Cloud Offline");
    }

    const regObj = (shopsData && shopsData["npc_admin_registry"] && shopsData["npc_admin_registry"].fullState && shopsData["npc_admin_registry"].fullState.adminRegistry)
      ? { ...shopsData["npc_admin_registry"].fullState.adminRegistry }
      : {};
    delete regObj.giftcodes;
    delete regObj.passHash;
    window.cachedAdminRegistry = regObj;
    delMap = regObj.deletedShops || {};
    banMap = regObj.bannedShops || {};
    ovrMap = regObj.shopOverrides || {};

    // Xóa các quán đã bị Admin xóa/khóa khỏi mergedShopsMap
    Object.keys(delMap).forEach(k => { if (delMap[k]) mergedShopsMap.delete(k); });
    Object.keys(banMap).forEach(k => { if (banMap[k] && banMap[k].isBanned) mergedShopsMap.delete(k); });

    if (shopsData && typeof shopsData === "object") Object.values(shopsData).forEach(addOrUpdateShop);
    if (lbData && typeof lbData === "object") Object.values(lbData).forEach(addOrUpdateShop);

    cloudLeaderboardCache = Array.from(mergedShopsMap.values());

    if (badge) {
      badge.textContent = `🟢 Firebase Cloud (${cloudLeaderboardCache.length} quán)`;
      badge.className = "text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full";
    }
    updateFirebaseStatusBadgesUI();
    renderLoginTop3Preview();
    if (typeof renderLeaderboardTab === "function") renderLeaderboardTab();
    if (showFeedback) showToast(`☁️ Đã đồng bộ ${cloudLeaderboardCache.length} quán từ Firebase Cloud!`);
  } catch (e) {
    isCloudConnectedLive = false;
    cloudLeaderboardCache = Array.from(mergedShopsMap.values());
    if (badge) {
      badge.textContent = `🟠 Offline (${cloudLeaderboardCache.length} quán)`;
      badge.className = "text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full";
    }
    updateFirebaseStatusBadgesUI();
    renderLoginTop3Preview();
    if (typeof renderLeaderboardTab === "function") renderLeaderboardTab();
    if (showFeedback) showToast("⚠️ Mạng Firebase đang bận, hiển thị dữ liệu BXH đã lưu!");
  }
}

function renderLoginTop3Preview() {
  const container = document.getElementById("login-top3-list");
  const badge = document.getElementById("login-cloud-badge");
  if (!container) return;
  const vault = getCombinedShopsVault();
  const list = Object.values(vault)
    .filter(x => x && (x.shopName || x.fullState?.shopName))
    .sort((a, b) => {
      const nwA = Number(a.netWorth || a.money || a.fullState?.money || 0);
      const nwB = Number(b.netWorth || b.money || b.fullState?.money || 0);
      return nwB - nwA;
    });
  if (badge && !isFirebaseConfigured()) {
    badge.textContent = `🏪 Hệ thống (${list.length} quán)`;
  }
  if (list.length === 0) {
    container.innerHTML = `<div class="text-center text-amber-700 py-1 text-[11px]">Nhập Tên Bảng Hiệu + PIN 4 số để tạo quán hoặc mở lại quán.</div>`;
    return;
  }
  container.innerHTML = list.slice(0, 30).map((rawItem, idx) => {
    const item = rawItem.fullState ? { ...rawItem.fullState, ...rawItem } : rawItem;
    const sName = item.shopName || rawItem.shopKey;
    const medal = idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : `#${idx + 1} `;
    return `
      <div class="flex items-center justify-between px-2 py-1 rounded-xl bg-amber-50 border border-amber-200 gap-1.5">
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <div class="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-amber-400 bg-white">${renderAvatarContent(item.avatar || "av_ditu", "w-full h-full object-cover")}</div>
          <div class="min-w-0 flex-1 leading-tight">
            <div class="font-black text-amber-950 text-[11px] truncate">${medal}${escapeHtml(sName)}</div>
            <div class="text-[9.5px] font-bold text-amber-800">Cấp ${item.level || 1} • ${formatShortK(item.money || 0)} • Ngày ${item.day || 1}</div>
          </div>
        </div>
        <button type="button" onclick="prefillLoginShopName('${escapeHtml(sName.replace(/'/g, "\\'"))}')" class="soft-btn px-2 py-1 rounded-lg bg-amber-600 text-white font-black text-[10px] shrink-0">
          Chọn Quán
        </button>
      </div>
    `;
  }).join("");
}

// ================= CỔNG GIFTCODE, HỘP THƯ ADMIN & SỰ KIỆN LIVE-OPS FIREBASE =================
window.serverLiveConfig = { enabled: false, title: "", customerMult: 1.0, xpMult: 1.0, tipMult: 1.0, marketDiscountPct: 0, patienceBonusPct: 0 };
window.serverBroadcastData = null;
window.personalAdminMails = [];

function openGiftcodeModal() {
  playSFX("snip");
  const modal = document.getElementById("modal-giftcode");
  if (!modal) return;
  modal.classList.remove("hidden");
  const tag = document.getElementById("giftcode-shop-tag");
  if (tag) tag.textContent = state.shopName ? `Quán: ${state.shopName}` : "Chưa đăng nhập";
  const msg = document.getElementById("giftcode-status-msg");
  if (msg) msg.classList.add("hidden");
  renderGiftcodeModalContent();
  syncAdminLiveOpsAndMail(false);
}

function closeGiftcodeModal() {
  const modal = document.getElementById("modal-giftcode");
  if (modal) modal.classList.add("hidden");
}

function showGiftcodeStatus(text, isSuccess = true) {
  const el = document.getElementById("giftcode-status-msg");
  if (!el) return;
  el.classList.remove("hidden");
  el.className = `text-[11px] font-black p-2 rounded-xl text-center border ${isSuccess ? "bg-emerald-100 text-emerald-900 border-emerald-400" : "bg-red-100 text-red-900 border-red-400"}`;
  el.textContent = text;
}

function renderGiftcodeModalContent() {
  const listEl = document.getElementById("redeemed-codes-list");
  if (listEl) {
    const arr = Array.isArray(state.redeemedGiftcodes) ? state.redeemedGiftcodes : [];
    listEl.textContent = arr.length > 0 ? arr.join(", ") : "Chưa có";
  }

  const cfg = window.serverLiveConfig || { enabled: false };
  const bannerEl = document.getElementById("live-ops-global-banner");
  const bannerTxt = document.getElementById("live-ops-banner-text");
  const statusBadge = document.getElementById("live-ops-modal-status");
  const descEl = document.getElementById("live-ops-modal-desc");

  if (cfg && cfg.enabled) {
    const parts = [];
    if (Number(cfg.customerMult || 1) !== 1) parts.push(`Khách x${cfg.customerMult}`);
    if (Number(cfg.xpMult || 1) > 1) parts.push(`XP x${cfg.xpMult}`);
    if (Number(cfg.tipMult || 1) > 1) parts.push(`Tip x${cfg.tipMult}`);
    if (Number(cfg.marketDiscountPct || 0) > 0) parts.push(`Chợ -${cfg.marketDiscountPct}%`);
    if (Number(cfg.patienceBonusPct || 0) > 0) parts.push(`Kiên nhẫn +${cfg.patienceBonusPct}%`);
    const summaryStr = parts.length > 0 ? parts.join(" • ") : "Sự kiện đặc biệt đang diễn ra";
    const eventTitle = cfg.title || "🎉 Sự Kiện Toàn Server";
    if (bannerEl && bannerTxt) {
      bannerEl.classList.remove("hidden");
      bannerTxt.textContent = `⚡ ${eventTitle}: ${summaryStr}`;
    }
    if (statusBadge) {
      statusBadge.textContent = "Đang diễn ra";
      statusBadge.className = "px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px]";
    }
    if (descEl) {
      descEl.innerHTML = `<div class="font-black text-purple-950">${escapeHtml(eventTitle)}</div><div class="mt-0.5 text-emerald-800">${escapeHtml(summaryStr)}</div>`;
    }
  } else {
    if (bannerEl) bannerEl.classList.add("hidden");
    if (statusBadge) {
      statusBadge.textContent = "Mặc định";
      statusBadge.className = "px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-black text-[9px]";
    }
    if (descEl) {
      descEl.textContent = "Nhịp độ khách, điểm kinh nghiệm và giá chợ đang ở mức chuẩn Sài Gòn.";
    }
  }

  const mailBox = document.getElementById("admin-mail-container");
  const claimedB = new Set(Array.isArray(state.claimedBroadcasts) ? state.claimedBroadcasts : []);
  const claimedM = new Set(Array.isArray(state.claimedMailIds) ? state.claimedMailIds : []);
  const itemsHtml = [];
  let unclaimedCount = 0;

  const bc = window.serverBroadcastData;
  if (bc && bc.id && bc.active !== false) {
    const isClaimed = claimedB.has(bc.id);
    if (!isClaimed) unclaimedCount++;
    const moneyTxt = Number(bc.rewardMoney || 0) > 0 ? `+${formatVND(bc.rewardMoney)}` : "";
    const xpTxt = Number(bc.rewardXp || 0) > 0 ? `+${bc.rewardXp} XP` : "";
    const rewardStr = [moneyTxt, xpTxt].filter(Boolean).join(" & ");
    itemsHtml.push(`
      <div class="p-2.5 rounded-xl border-2 ${isClaimed ? 'bg-amber-50/60 border-amber-200 opacity-75' : 'bg-yellow-50 border-orange-400 shadow-sm'} flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="font-black text-amber-950 flex items-center gap-1">
            <span>📢</span><span class="leading-tight">${escapeHtml(bc.title || "Thông Báo Toàn Server")}</span>
          </div>
          <p class="text-[11px] font-bold text-amber-900 mt-0.5 leading-snug">${escapeHtml(bc.message || "")}</p>
          ${rewardStr ? `<div class="text-[10px] font-black text-emerald-700 mt-0.5">🎁 Quà đính kèm: ${rewardStr}</div>` : ""}
        </div>
        ${isClaimed
          ? `<span class="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 font-black text-[10px] shrink-0">✓ Đã nhận</span>`
          : `<button onclick="claimServerBroadcast('${escapeHtml(bc.id)}')" class="soft-btn btn-game-green px-2.5 py-1.5 rounded-xl font-black text-[10px] shrink-0">🎉 Nhận</button>`
        }
      </div>
    `);
  }

  if (Array.isArray(window.personalAdminMails)) {
    window.personalAdminMails.forEach(mail => {
      if (!mail || !mail.id) return;
      const isClaimed = claimedM.has(mail.id) || Boolean(mail.claimed);
      if (!isClaimed) unclaimedCount++;
      const moneyTxt = Number(mail.rewardMoney || 0) > 0 ? `+${formatVND(mail.rewardMoney)}` : "";
      const xpTxt = Number(mail.rewardXp || 0) > 0 ? `+${mail.rewardXp} XP` : "";
      const rewardStr = [moneyTxt, xpTxt].filter(Boolean).join(" & ");
      itemsHtml.push(`
        <div class="p-2.5 rounded-xl border-2 ${isClaimed ? 'bg-amber-50/60 border-amber-200 opacity-75' : 'bg-emerald-50 border-emerald-400 shadow-sm'} flex items-center justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="font-black text-emerald-950 flex items-center gap-1">
              <span>💌</span><span class="leading-tight">${escapeHtml(mail.title || "Quà Riêng Từ Admin")}</span>
            </div>
            <p class="text-[11px] font-bold text-amber-900 mt-0.5 leading-snug">${escapeHtml(mail.message || "")}</p>
            ${rewardStr ? `<div class="text-[10px] font-black text-emerald-700 mt-0.5">🎁 Quà: ${rewardStr}</div>` : ""}
          </div>
          ${isClaimed
            ? `<span class="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 font-black text-[10px] shrink-0">✓ Đã nhận</span>`
            : `<button onclick="claimPersonalAdminMail('${escapeHtml(mail.id)}')" class="soft-btn btn-game-green px-2.5 py-1.5 rounded-xl font-black text-[10px] shrink-0">🎉 Nhận</button>`
          }
        </div>
      `);
    });
  }

  if (mailBox) {
    mailBox.innerHTML = itemsHtml.length > 0
      ? itemsHtml.join("")
      : `<div class="text-center py-3 text-amber-800 font-bold bg-amber-50/70 rounded-xl border border-amber-200">Chưa có thư hoặc quà đền bù mới.</div>`;
  }

  const dotEl = document.getElementById("header-gift-dot");
  const menuBadge = document.getElementById("menu-gift-badge");
  if (dotEl) dotEl.classList.toggle("hidden", unclaimedCount === 0);
  if (menuBadge) menuBadge.classList.toggle("hidden", unclaimedCount === 0);
}

async function syncAdminLiveOpsAndMail(showFeedback = false) {
  renderGiftcodeModalContent();
  const dbUrl = getFirebaseDbUrl();
  if (!dbUrl) {
    if (showFeedback) showToast("💡 Hãy gắn URL Firebase ở mục ☁️ Kết Nối Firebase để đồng bộ Hộp thư Server!");
    return;
  }
  try {
    const key = state.shopKey || sanitizeShopKey(state.shopName || "");
    const resReg = await fetchWithTimeout(`${dbUrl}/shops/npc_admin_registry.json`, {}, 4500);
    if (resReg.ok) {
      const regShop = await resReg.json();
      const reg = { ...(regShop?.fullState?.adminRegistry || {}) };
      delete reg.giftcodes;
      delete reg.passHash;
      window.cachedAdminRegistry = reg;

      if (reg.liveConfig && typeof reg.liveConfig === "object") {
        window.serverLiveConfig = reg.liveConfig;
      }
      const bc = reg.adminBroadcast;
      window.serverBroadcastData = (bc && bc.id && bc.active !== false) ? bc : null;

      if (key) {
        if (reg.deletedShops && reg.deletedShops[key]) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          localStorage.removeItem("banh_trang_tron_saigon_v5_master_save");
          state = getInitialDefaultState();
          document.getElementById("login-screen").classList.remove("hidden");
          document.getElementById("quick-resume-box").classList.add("hidden");
          showLoginMessage("🗑️ Quán này đã bị Quản Trị Viên xóa khỏi hệ thống!", "error");
          return;
        }
        if ((reg.bannedShops && reg.bannedShops[key]?.isBanned) || (reg.shopOverrides && reg.shopOverrides[key]?.isBanned)) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          state.isBanned = true;
          document.getElementById("login-screen").classList.remove("hidden");
          document.getElementById("quick-resume-box").classList.add("hidden");
          showLoginMessage("🚫 Quán của bạn hiện đang bị Quản Trị Viên tạm khóa!", "error");
          return;
        }
        const ovr = reg.shopOverrides && reg.shopOverrides[key];
        if (ovr) {
          const cAdminTs = Number(ovr.adminOverrideAt || 0);
          const lAdminTs = Math.max(Number(state.adminOverrideAt || 0), Number(state.lastAppliedAdminOverrideAt || 0));
          if (cAdminTs > lAdminTs) {
            const mergedFromAdmin = applyAdminOverrideToStateObj(state, ovr);
            mergeLoadedState({
              ...mergedFromAdmin,
              shopKey: key,
              shopName: ovr.shopName || state.shopName,
              pin: ovr.pin || state.pin,
              adminOverrideAt: cAdminTs,
              lastAppliedAdminOverrideAt: cAdminTs,
              isBanned: false
            });
            saveToLocalOnly();
            await saveGameEverywhere(false);
            updateAllUI();
            fetchCloudLeaderboard(false);
            if (state.isBankrupt) {
              declareTrueBankruptcy(true);
              showToast("💔 Ban Quản Trị vừa cập nhật trạng thái: Quán Phá Sản!");
            } else {
              const bkModal = document.getElementById("modal-bankruptcy");
              if (bkModal && !bkModal.classList.contains("hidden")) bkModal.classList.add("hidden");
              showToast("⚡ Hồ sơ quán vừa được đồng bộ trực tiếp từ Ban Quản Trị!");
            }
          }
          if (ovr.adminInbox && typeof ovr.adminInbox === "object") {
            window.personalAdminMails = Object.values(ovr.adminInbox).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          } else {
            window.personalAdminMails = [];
          }
        }
      }
    }

    renderGiftcodeModalContent();
    updateAllUI();
    if (showFeedback) showToast("☁️ Đã đồng bộ Hộp thư & Sự kiện mới nhất từ Firebase!");
  } catch (e) {
    if (showFeedback) showToast("⚠️ Không thể kết nối máy chủ sự kiện lúc này.");
  }
}

async function claimServerBroadcast(bId) {
  const bc = window.serverBroadcastData;
  if (!bc || bc.id !== bId) return;
  if (!Array.isArray(state.claimedBroadcasts)) state.claimedBroadcasts = [];
  if (state.claimedBroadcasts.includes(bId)) {
    showToast("⚠️ Quán của bạn đã nhận phần quà thông báo này rồi!");
    return;
  }
  state.claimedBroadcasts.push(bId);
  const rewardM = Math.max(0, Number(bc.rewardMoney || 0));
  const rewardX = Math.max(0, Number(bc.rewardXp || 0));
  if (rewardM > 0) {
    state.money += rewardM;
    state.adminGrantedMoney = (state.adminGrantedMoney || 0) + rewardM;
    state.adminOverrideAt = Date.now();
  }
  if (rewardX > 0) addXP(rewardX);
  playSFX("cash");
  renderGiftcodeModalContent();
  updateAllUI();
  await saveGameEverywhere(false);
  showToast(`🎉 Đã nhận quà thông báo: +${formatVND(rewardM)}${rewardX > 0 ? ` & +${rewardX} XP` : ""}!`);
}

async function claimPersonalAdminMail(mailId) {
  const mail = (window.personalAdminMails || []).find(m => m && m.id === mailId);
  if (!mail) return;
  if (!Array.isArray(state.claimedMailIds)) state.claimedMailIds = [];
  if (state.claimedMailIds.includes(mailId) || mail.claimed) {
    showToast("⚠️ Bạn đã nhận thư này rồi!");
    return;
  }
  state.claimedMailIds.push(mailId);
  mail.claimed = true;
  const rewardM = Math.max(0, Number(mail.rewardMoney || 0));
  const rewardX = Math.max(0, Number(mail.rewardXp || 0));
  if (rewardM > 0) {
    state.money += rewardM;
    state.adminGrantedMoney = (state.adminGrantedMoney || 0) + rewardM;
    state.adminOverrideAt = Date.now();
  }
  if (rewardX > 0) addXP(rewardX);
  playSFX("cash");
  renderGiftcodeModalContent();
  updateAllUI();
  const dbUrl = getFirebaseDbUrl();
  if (dbUrl) {
    try {
      const key = state.shopKey || sanitizeShopKey(state.shopName || "");
      if (key) {
        await fetchWithTimeout(`${dbUrl}/shops/${encodeURIComponent(key)}/adminInbox/${encodeURIComponent(mailId)}/claimed.json`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(true)
        }, 2500);
      }
    } catch (e) {}
  }
  await saveGameEverywhere(false);
  showToast(`🎉 Đã nhận quà từ Admin: +${formatVND(rewardM)}${rewardX > 0 ? ` & +${rewardX} XP` : ""}!`);
}

async function handleRedeemGiftcode() {
  const inputEl = document.getElementById("giftcode-input");
  const btn = document.getElementById("btn-redeem-giftcode");
  if (!inputEl) return;
  const rawCode = inputEl.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!rawCode) {
    showGiftcodeStatus("⚠️ Vui lòng nhập mã Giftcode!", false);
    return;
  }
  if (!state.shopName) {
    showGiftcodeStatus("⚠️ Hãy đăng nhập quán trước khi nhập Giftcode!", false);
    return;
  }
  if (!Array.isArray(state.redeemedGiftcodes)) state.redeemedGiftcodes = [];
  if (state.redeemedGiftcodes.includes(rawCode)) {
    showGiftcodeStatus(`⚠️ Quán của bạn đã sử dụng mã "${rawCode}" rồi!`, false);
    return;
  }

  const STARTER_GIFTCODES = {
    "TANTHU50K": { money: 50000, xp: 50, label: "Quà Tân Thủ Khởi Nghiệp" },
    "SAIGON100K": { money: 100000, xp: 80, label: "Quà Đại Lý Sài Gòn" },
    "DITU2026": { money: 50000, xp: 40, label: "Quà Bí Kíp Dì Tư" },
    "FIREBASE2026": { money: 150000, xp: 100, label: "Quà Kết Nối Máy Chủ Cloud" }
  };

  const dbUrl = getFirebaseDbUrl();
  if (dbUrl) {
    if (btn) btn.disabled = true;
    showGiftcodeStatus("⏳ Đang kiểm tra mã Giftcode trên Firebase Cloud...", true);
    try {
      const res = await fetchWithTimeout(`${dbUrl}/shops/npc_admin_registry/fullState/adminRegistry/giftcodes/${encodeURIComponent(rawCode)}.json`, {}, 4500);
      if (res.ok) {
        const gift = await res.json();
        if (gift && gift.code) {
          if (gift.active === false) {
            showGiftcodeStatus(`❌ Mã Giftcode "${rawCode}" hiện đã tạm khóa hoặc hết hạn!`, false);
            if (btn) btn.disabled = false;
            return;
          }
          const key = state.shopKey || sanitizeShopKey(state.shopName);
          const redeemedBy = gift.redeemedBy || {};
          const usedCount = Math.max(Number(gift.usedCount || 0), Object.keys(redeemedBy).length);
          const maxUses = Math.max(1, Number(gift.maxUses || 100));

          if (redeemedBy[key]) {
            if (!state.redeemedGiftcodes.includes(rawCode)) state.redeemedGiftcodes.push(rawCode);
            saveToLocalOnly();
            renderGiftcodeModalContent();
            showGiftcodeStatus(`⚠️ Quán "${state.shopName}" đã nhập mã này trước đó rồi!`, false);
            if (btn) btn.disabled = false;
            return;
          }
          if (usedCount >= maxUses) {
            showGiftcodeStatus(`❌ Mã "${rawCode}" đã hết lượt sử dụng (${usedCount}/${maxUses} lượt)!`, false);
            if (btn) btn.disabled = false;
            return;
          }

          const rewardM = Math.max(0, Number(gift.rewardMoney || 0));
          const rewardX = Math.max(0, Number(gift.rewardXp || 0));
          const unlockDish = gift.unlockDish || "";

          state.money += rewardM;
          state.adminGrantedMoney = (state.adminGrantedMoney || 0) + rewardM;
          if (rewardM > 0) state.adminOverrideAt = Date.now();
          if (rewardX > 0) addXP(rewardX);

          let dishUnlockedMsg = "";
          if (unlockDish && DISH_MENU[unlockDish] && !state.unlockedDishes.includes(unlockDish)) {
            state.unlockedDishes.push(unlockDish);
            dishUnlockedMsg = ` + Mở khóa ${DISH_MENU[unlockDish].name}`;
          }

          state.redeemedGiftcodes.push(rawCode);
          inputEl.value = "";

          const updatedGift = {
            ...gift,
            usedCount: usedCount + 1,
            redeemedBy: {
              ...redeemedBy,
              [key]: { shopName: state.shopName, redeemedAt: Date.now() }
            }
          };

          await fetchWithTimeout(`${dbUrl}/shops/npc_admin_registry/fullState/adminRegistry/giftcodes/${encodeURIComponent(rawCode)}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedGift)
          }, 3500);

          playSFX("cash");
          await saveGameEverywhere(false);
          updateAllUI();
          renderGiftcodeModalContent();

          const customNote = gift.note ? ` (${gift.note})` : "";
          showGiftcodeStatus(`🎉 Nhập mã Cloud "${rawCode}" thành công! Nhận +${formatVND(rewardM)}${rewardX > 0 ? `, +${rewardX} XP` : ""}${dishUnlockedMsg}${customNote}!`, true);
          showToast(`🎁 Nhận Giftcode "${rawCode}": +${formatVND(rewardM)}!`);
          if (btn) btn.disabled = false;
          return;
        }
      }
    } catch (e) {}
    if (btn) btn.disabled = false;
  }

  // Fallback kiểm tra các mã Tân thủ mặc định
  const localGift = STARTER_GIFTCODES[rawCode];
  if (!localGift) {
    showGiftcodeStatus(`❌ Mã "${rawCode}" không tồn tại (Thử: TANTHU50K, SAIGON100K, DITU2026, FIREBASE2026)!`, false);
    return;
  }
  state.redeemedGiftcodes.push(rawCode);
  state.money = (state.money || 0) + localGift.money;
  state.adminGrantedMoney = (state.adminGrantedMoney || 0) + localGift.money;
  addXP(localGift.xp);
  inputEl.value = "";
  await saveGameEverywhere(false);
  renderGiftcodeModalContent();
  updateAllUI();
  playSFX("cash");
  showGiftcodeStatus(`🎉 Nhận thành công ${localGift.label}: +${formatVND(localGift.money)} & +${localGift.xp} XP!`, true);
}

async function persistBankruptcyLockToCloud(retiredCode) {
  const dbUrl = getFirebaseDbUrl();
  if (!dbUrl) return;
  const key = state.shopKey || sanitizeShopKey(state.shopName);
  if (!key) return;
  const nowTs = Date.now();
  try {
    const tasks = [];
    if (retiredCode && /^BT-\d{6}$/.test(retiredCode)) {
      tasks.push(fetchWithTimeout(`${dbUrl}/recoveryCodes/${encodeURIComponent(retiredCode)}.json`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopKey: key,
          shopName: state.shopName,
          isBankrupt: true,
          retiredAt: nowTs,
          updatedAt: nowTs
        })
      }, 4000));
    }
    tasks.push(fetchWithTimeout(`${dbUrl}/shops/npc_admin_registry/fullState/adminRegistry/shopOverrides/${encodeURIComponent(key)}.json`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopKey: key,
        shopName: state.shopName,
        isBankrupt: Boolean(state.isBankrupt),
        bankruptcyAt: Number(state.bankruptcyAt || nowTs),
        bankruptcyResetAt: Number(state.bankruptcyResetAt || 0),
        bankruptcyCount: Number(state.bankruptcyCount || 1),
        bankruptRecoveryCode: retiredCode || state.bankruptRecoveryCode || "",
        recoveryCode: state.recoveryCode,
        money: Number(state.money || 0),
        level: Number(state.level || 1),
        day: Number(state.day || 1),
        totalSold: Number(state.totalSold || 0),
        updatedAt: nowTs
      })
    }, 4000));
    await Promise.allSettled(tasks);
  } catch (e) {}
}

async function joinOrSyncPvpRoom() {
  ensureV15State(state);
  const inp = document.getElementById("pvp-room-code-input");
  if (inp && inp.value.trim()) {
    state.pvpRoomCode = inp.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 12) || "SAIGON01";
  }
  const room = state.pvpRoomCode || "SAIGON01";
  saveToLocalOnly();
  const dbUrl = getFirebaseDbUrl();
  if (!dbUrl) {
    showToast(`⚠️ Hãy kết nối URL Firebase để thi đấu Phòng PvP trực tuyến [${room}]!`);
    if (typeof renderLeaderboardTab === "function") renderLeaderboardTab();
    return;
  }
  try {
    const myKey = state.shopKey || sanitizeShopKey(state.shopName || "quan_moi");
    const payload = {
      shopKey: myKey,
      shopName: sanitizeVietnameseDisplayName(state.shopName || "Bánh Tráng Dì Tư"),
      avatar: (typeof state.avatar === "string" && state.avatar.startsWith("data:image/")) ? "av_ditu" : (state.avatar || "av_ditu"),
      level: Number(state.level || 1),
      rating: Number(state.rating || 5.0),
      todayRevenue: Number(state.todayRevenue || 0),
      todaySold: Number(state.todaySold || 0),
      netWorth: computeShopNetWorth(state),
      creditScore: Number(state.creditScore || 520),
      updatedAt: Date.now()
    };
    await fetchWithTimeout(`${dbUrl}/pvp_rooms/${encodeURIComponent(room)}/${encodeURIComponent(myKey)}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, 4500);
    await fetchPvpRoomLeaderboard(room);
    showToast(`⚔️ Đã đồng bộ doanh thu ca lên Phòng Thách Đấu [${room}]!`);
  } catch (e) {
    showToast("⚠️ Không thể kết nối phòng PvP trên Firebase lúc này.");
  }
}

async function fetchPvpRoomLeaderboard(roomCode = null) {
  const room = roomCode || state.pvpRoomCode || "SAIGON01";
  const dbUrl = getFirebaseDbUrl();
  if (!dbUrl) {
    pvpRoomLeaderboardCache = [];
    if (typeof renderLeaderboardTab === "function") renderLeaderboardTab();
    return;
  }
  try {
    const res = await fetchWithTimeout(`${dbUrl}/pvp_rooms/${encodeURIComponent(room)}.json`, {}, 4500);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") {
        pvpRoomLeaderboardCache = Object.values(data).filter(x => x && x.shopName);
      } else {
        pvpRoomLeaderboardCache = [];
      }
    }
  } catch (e) {}
  if (typeof renderLeaderboardTab === "function") renderLeaderboardTab();
}

async function syncRemoteGameConfigV15() {
  const dbUrl = getFirebaseDbUrl();
  if (!dbUrl) return;
  try {
    const res = await fetchWithTimeout(`${dbUrl}/game_config.json`, {}, 4500);
    if (!res.ok) return;
    const cfg = await res.json();
    if (!cfg || typeof cfg !== "object") return;
    if (cfg.dishes && typeof cfg.dishes === "object") {
      Object.keys(cfg.dishes).forEach(k => {
        if (DISH_MENU[k] && typeof cfg.dishes[k].price === "number") {
          DISH_MENU[k].price = cfg.dishes[k].price;
        }
      });
    }
    if (Array.isArray(cfg.bankLoanTiers) && cfg.bankLoanTiers.length === 5) {
      SAIGON_BANK_LOAN_TIERS = cfg.bankLoanTiers;
    }
    if (Array.isArray(cfg.levelGatedCampaigns) && cfg.levelGatedCampaigns.length > 0) {
      LEVEL_GATED_CAMPAIGNS = cfg.levelGatedCampaigns;
    }
    updateAllUI();
  } catch (e) {}
}

// ================= MODAL CẤU HÌNH KẾT NỐI FIREBASE & ĐẨY 105 QUÁN LÊN CLOUD =================
function openFirebaseConfigModal() {
  playSFX("snip");
  const modal = document.getElementById("modal-firebase-config");
  if (!modal) return;
  const inp = document.getElementById("firebase-db-url-input");
  if (inp) inp.value = getFirebaseDbUrl();
  const statusBox = document.getElementById("firebase-config-status-msg");
  if (statusBox) {
    const cur = getFirebaseDbUrl();
    statusBox.className = `p-2 rounded-xl border text-[11px] font-bold ${cur ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`;
    statusBox.innerHTML = cur
      ? `🟢 Đang gắn URL Firebase: <b class="break-all">${escapeHtml(cur)}</b>`
      : `🟠 Chưa gắn URL Firebase Realtime Database. Hãy dán link Database của bạn vào ô bên trên rồi bấm <b>Kiểm Tra & Kết Nối</b>!`;
  }
  modal.classList.remove("hidden");
}

function closeFirebaseConfigModal() {
  const modal = document.getElementById("modal-firebase-config");
  if (modal) modal.classList.add("hidden");
}

async function saveAndTestFirebaseConnection() {
  const inp = document.getElementById("firebase-db-url-input");
  const statusBox = document.getElementById("firebase-config-status-msg");
  const btn = document.getElementById("btn-test-firebase-conn");
  if (!inp || !statusBox) return;

  const raw = inp.value.trim();
  const cleanUrl = normalizeFirebaseDbUrl(raw);
  if (!cleanUrl) {
    statusBox.className = "p-2 rounded-xl border bg-red-100 border-red-400 text-red-900 text-[11px] font-black";
    statusBox.innerHTML = "❌ Đường dẫn URL không hợp lệ! URL Firebase Realtime Database phải bắt đầu bằng <b>https://</b> (VD: <i>https://ten-project-default-rtdb.asia-southeast1.firebasedatabase.app</i>)";
    return;
  }

  if (btn) btn.disabled = true;
  statusBox.className = "p-2 rounded-xl border bg-blue-50 border-blue-400 text-blue-900 text-[11px] font-bold";
  statusBox.innerHTML = "⏳ Đang kiểm tra kết nối đọc/ghi tới Firebase Realtime Database...";

  try {
    const t0 = Date.now();
    const res = await fetchWithTimeout(`${cleanUrl}/leaderboard.json?shallow=true`, {}, 5500);
    const pingMs = Date.now() - t0;

    if (!res.ok) {
      let errDetail = `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403) {
        errDetail = "Bị chặn quyền truy cập (HTTP 401/403) — Hãy mở tab <b>Rules</b> trong Firebase Realtime Database và bật <code>{\".read\": true, \".write\": true}</code>!";
      }
      statusBox.className = "p-2 rounded-xl border bg-red-100 border-red-400 text-red-900 text-[11px] font-bold";
      statusBox.innerHTML = `❌ Kết nối thất bại: ${errDetail}`;
      if (btn) btn.disabled = false;
      return;
    }

    setFirebaseDbUrl(cleanUrl);
    isCloudConnectedLive = true;
    state.offlineMode = false;
    updateFirebaseStatusBadgesUI();

    if (state && state.shopName) {
      await syncShopToFirebaseCloud(false);
    }
    await fetchCloudLeaderboard(false);
    await syncAdminLiveOpsAndMail(false);

    statusBox.className = "p-2 rounded-xl border bg-emerald-100 border-emerald-500 text-emerald-950 text-[11px] font-black";
    statusBox.innerHTML = `✅ Kết nối Firebase thành công! (Độ trễ: ${pingMs}ms • Đã tải ${cloudLeaderboardCache.length} quán trên BXH). Toàn bộ dữ liệu của bạn hiện đã tự động lưu lên Firebase!`;
    playSFX("cash");
    showToast(`☁️ Đã kết nối Firebase Cloud thành công (${pingMs}ms)!`);
  } catch (e) {
    statusBox.className = "p-2 rounded-xl border bg-red-100 border-red-400 text-red-900 text-[11px] font-bold";
    statusBox.innerHTML = "❌ Không thể kết nối tới URL này (Kiểm tra lại đường dẫn URL hoặc kết nối mạng / CORS).";
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function pushAll105SeedShopsToFirebase() {
  const dbUrl = getFirebaseDbUrl();
  const statusBox = document.getElementById("firebase-config-status-msg");
  const btn = document.getElementById("btn-push-seed-firebase");
  if (!dbUrl) {
    if (statusBox) {
      statusBox.className = "p-2 rounded-xl border bg-red-100 border-red-400 text-red-900 text-[11px] font-black";
      statusBox.innerHTML = "⚠️ Vui lòng nhập URL Firebase và bấm <b>Kiểm Tra & Kết Nối</b> trước khi đẩy dữ liệu!";
    }
    return;
  }

  const vault = getCombinedShopsVault();
  const entries = Object.entries(vault).filter(([k, v]) => v && typeof v === "object" && !k.startsWith("npc_"));
  if (entries.length === 0) return;

  if (btn) btn.disabled = true;
  if (statusBox) {
    statusBox.className = "p-2 rounded-xl border bg-blue-50 border-blue-400 text-blue-900 text-[11px] font-bold";
    statusBox.innerHTML = `⏳ Đang đẩy ${entries.length} quán (gồm 105 quán cũ & quán trên máy) lên Firebase (/shops, /leaderboard, /recoveryCodes)...`;
  }

  const shopsPayload = {};
  const lbPayload = {};
  const recPayload = {};

  entries.forEach(([k, v]) => {
    const fs = v.fullState || v;
    const nw = computeShopNetWorth(fs);
    const summary = {
      shopKey: k,
      shopName: fs.shopName || k,
      avatar: (typeof fs.avatar === "string" && fs.avatar.startsWith("data:image/")) ? "av_ditu" : (fs.avatar || "av_ditu"),
      money: Number(fs.money || 350000),
      rating: Number(fs.rating || 4.8),
      level: Number(fs.level || 1),
      totalSold: Number(fs.totalSold || 0),
      day: Number(fs.day || 1),
      shopScale: Number(fs.shopScale || 0),
      decorCount: Array.isArray(fs.ownedDecors) ? fs.ownedDecors.length : Number(fs.decorCount || 0),
      netWorth: nw,
      creditScore: Number(fs.creditScore || 520),
      savingsBalance: Number(fs.savingsBalance || 0),
      prestigeGen: Number(fs.prestigeGen || 0),
      marketSharePct: Number(fs.marketSharePct || 28),
      isBankrupt: Boolean(fs.isBankrupt),
      bankruptcyResetAt: Number(fs.bankruptcyResetAt || 0),
      updatedAt: Number(fs.updatedAt || Date.now())
    };
    lbPayload[k] = summary;
    shopsPayload[k] = {
      ...summary,
      recoveryCode: fs.recoveryCode || "",
      pin: fs.pin || "",
      fullState: fs
    };
    if (fs.recoveryCode) {
      recPayload[fs.recoveryCode] = {
        shopKey: k,
        shopName: summary.shopName,
        isBankrupt: summary.isBankrupt,
        bankruptcyResetAt: summary.bankruptcyResetAt,
        updatedAt: summary.updatedAt
      };
    }
  });

  try {
    const [r1, r2, r3] = await Promise.all([
      fetchWithTimeout(`${dbUrl}/leaderboard.json`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lbPayload)
      }, 9000),
      fetchWithTimeout(`${dbUrl}/shops.json`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(shopsPayload)
      }, 9000),
      fetchWithTimeout(`${dbUrl}/recoveryCodes.json`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recPayload)
      }, 9000)
    ]);

    if (r1.ok && r2.ok) {
      await fetchCloudLeaderboard(false);
      if (statusBox) {
        statusBox.className = "p-2 rounded-xl border bg-emerald-100 border-emerald-500 text-emerald-950 text-[11px] font-black";
        statusBox.innerHTML = `🎉 Đã đẩy thành công toàn bộ <b>${entries.length} quán</b> lên Firebase Realtime Database (/shops, /leaderboard, /recoveryCodes)!`;
      }
      playSFX("cash");
      showToast(`☁️ Đã đồng bộ ${entries.length} quán lên Firebase thành công!`);
    } else {
      throw new Error("HTTP error when patching");
    }
  } catch (e) {
    if (statusBox) {
      statusBox.className = "p-2 rounded-xl border bg-red-100 border-red-400 text-red-900 text-[11px] font-bold";
      statusBox.innerHTML = "❌ Lỗi khi đẩy dữ liệu hàng loạt (Kiểm tra Rules .write: true trên Firebase). Bạn cũng có thể bấm nút <b>Tải File JSON Import</b> để nạp trực tiếp trong Firebase Console!";
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function downloadFirebaseSeedJsonFile() {
  try {
    const vault = getCombinedShopsVault();
    const exportObj = { shops: {}, leaderboard: {}, recoveryCodes: {} };
    Object.entries(vault).forEach(([k, v]) => {
      if (!v || typeof v !== "object" || k.startsWith("npc_")) return;
      const fs = v.fullState || v;
      const nw = computeShopNetWorth(fs);
      const summary = {
        shopKey: k,
        shopName: fs.shopName || k,
        avatar: (typeof fs.avatar === "string" && fs.avatar.startsWith("data:image/")) ? "av_ditu" : (fs.avatar || "av_ditu"),
        money: Number(fs.money || 350000),
        rating: Number(fs.rating || 4.8),
        level: Number(fs.level || 1),
        totalSold: Number(fs.totalSold || 0),
        day: Number(fs.day || 1),
        shopScale: Number(fs.shopScale || 0),
        decorCount: Array.isArray(fs.ownedDecors) ? fs.ownedDecors.length : Number(fs.decorCount || 0),
        netWorth: nw,
        creditScore: Number(fs.creditScore || 520),
        savingsBalance: Number(fs.savingsBalance || 0),
        prestigeGen: Number(fs.prestigeGen || 0),
        marketSharePct: Number(fs.marketSharePct || 28),
        isBankrupt: Boolean(fs.isBankrupt),
        bankruptcyResetAt: Number(fs.bankruptcyResetAt || 0),
        updatedAt: Number(fs.updatedAt || Date.now())
      };
      exportObj.leaderboard[k] = summary;
      exportObj.shops[k] = { ...summary, recoveryCode: fs.recoveryCode || "", pin: fs.pin || "", fullState: fs };
      if (fs.recoveryCode) {
        exportObj.recoveryCodes[fs.recoveryCode] = {
          shopKey: k,
          shopName: summary.shopName,
          isBankrupt: summary.isBankrupt,
          bankruptcyResetAt: summary.bankruptcyResetAt,
          updatedAt: summary.updatedAt
        };
      }
    });
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "firebase-seed-105-shops.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSFX("cash");
    showToast("📥 Đã tải file firebase-seed-105-shops.json để Import vào Firebase Console!");
  } catch (e) {}
}
