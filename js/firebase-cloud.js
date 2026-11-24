/**
 * ================= ĐỘNG CƠ LƯU TRỮ LOCAL OFFLINE 100%, KHÔI PHỤC, GIFTCODE & PVP BOT (VER 17) =================
 * - Lưu trữ & khôi phục 100% trên localStorage (không gọi Firebase / không cần mạng)
 * - Hỗ trợ Mã Quán (BT-XXXXXX + PIN), Mã Đổi Máy tự chứa dữ liệu (BTT1-...) và File JSON
 * - Giftcode kiểm tra local (không lộ danh sách mã hợp lệ khi nhập sai)
 * - Phòng PvP Offline thi đấu cùng các quán bot từ 105 quán mẫu
 */

let userManuallyChangedLoginAvatar = false;
let lastDisplayedResumeSave = null;
let pvpRoomLeaderboardCache = [];

const OFFLINE_VALID_PVP_ROOMS = ["SAIGON01", "QUAN1", "QUAN4", "HOTHIKY", "BUIVIEN"];

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

function selectLocalSaveMode() {
  state.offlineMode = true;
  state.saveMode = "local";
  playSFX("snip");
  const lbl = document.getElementById("login-network-mode-label");
  if (lbl) {
    lbl.textContent = "🔑 Mã Quán Local (Offline 100%)";
    lbl.className = "text-emerald-700 font-black";
  }
  showLoginMessage("🔑 Đã chọn chế độ lưu Mã Quán (Offline Local) — Dữ liệu lưu trực tiếp trên máy!", "success");
}

function openRecoveryModalFromMenu() {
  playSFX("snip");
  const modal = document.getElementById("modal-recovery-local");
  if (modal) {
    const codeEl = document.getElementById("modal-rec-current-code");
    if (codeEl) codeEl.textContent = ensureRecoveryCode();
    const bttEl = document.getElementById("modal-rec-btt1-preview");
    if (bttEl) bttEl.value = generatePortableSaveCode(state);
    const inp = document.getElementById("modal-rec-code-input");
    const pin = document.getElementById("modal-rec-pin-input");
    const msg = document.getElementById("modal-rec-status-msg");
    if (inp) inp.value = "";
    if (pin) pin.value = "";
    if (msg) msg.classList.add("hidden");
    modal.classList.remove("hidden");
    return;
  }
  // Fallback: mở màn hình đăng nhập và bật sẵn hộp nhập mã khôi phục
  openLoginModalForSwitch();
  const box = document.getElementById("recovery-code-box");
  if (box) box.classList.remove("hidden");
}

function closeRecoveryModalFromMenu() {
  const modal = document.getElementById("modal-recovery-local");
  if (modal) modal.classList.add("hidden");
}

const SAVE_DIAG_LOG_KEY = "btt_save_diag_log_v175";
const TAB_SESSION_SHOP_KEY = "btt_tab_shop_key_v179";

function setTabSessionShopKey(shopKey) {
  try {
    const k = String(shopKey || "").trim();
    if (k) sessionStorage.setItem(TAB_SESSION_SHOP_KEY, k);
  } catch (e) {}
}

function getTabSessionShopKey() {
  try {
    return String(sessionStorage.getItem(TAB_SESSION_SHOP_KEY) || "").trim();
  } catch (e) {
    return "";
  }
}

function formatSaveDiagRec(r) {
  if (!r || typeof r !== "object") return "null";
  return `day=${r.day || 1} lv=${r.level || 1} money=${Math.round(Number(r.money || 0))} seq=${Number(r.saveSeq || 0)} ts=${Number(r.updatedAt || 0)}`;
}

function recordSaveDiagEntry(context, key, masterRec, vaultRec, seedRec, chosenRec) {
  try {
    const line = `[${context}] key=${key || "-"} | master(${formatSaveDiagRec(masterRec)}) | reg(${formatSaveDiagRec(vaultRec)}) | seed(${formatSaveDiagRec(seedRec)}) => chosen(${formatSaveDiagRec(chosenRec)})`;
    let logs = [];
    const raw = localStorage.getItem(SAVE_DIAG_LOG_KEY);
    if (raw) logs = JSON.parse(raw) || [];
    logs.unshift(line);
    logs = logs.slice(0, 16);
    localStorage.setItem(SAVE_DIAG_LOG_KEY, JSON.stringify(logs));
    renderSaveDiagUI(line, logs);
  } catch (e) {}
}

function recordSaveWriteDiag(sourceLabel, stateObj, status, reason = "", existingRec = null) {
  try {
    const line = `[SAVE:${status}:${sourceLabel || "auto"}] st(${formatSaveDiagRec(stateObj)})${existingRec ? ` vs cur(${formatSaveDiagRec(existingRec)})` : ""}${reason ? ` [${reason}]` : ""}`;
    let logs = [];
    const raw = localStorage.getItem(SAVE_DIAG_LOG_KEY);
    if (raw) logs = JSON.parse(raw) || [];
    logs.unshift(line);
    logs = logs.slice(0, 16);
    localStorage.setItem(SAVE_DIAG_LOG_KEY, JSON.stringify(logs));
    renderSaveDiagUI(line, logs);
  } catch (e) {}
}

function renderSaveDiagUI(latestLine = null, allLogs = null) {
  try {
    const sumEl = document.getElementById("save-diag-summary");
    const detEl = document.getElementById("save-diag-details");
    if (!sumEl && !detEl) return;
    let logs = allLogs;
    if (!Array.isArray(logs)) {
      const raw = localStorage.getItem(SAVE_DIAG_LOG_KEY);
      logs = raw ? (JSON.parse(raw) || []) : [];
    }
    const top = latestLine || logs[0] || "Chưa có log lưu/tải.";
    if (sumEl) sumEl.textContent = `🔍 ${top}`;
    if (detEl) detEl.textContent = logs.join("\n---\n");
  } catch (e) {}
}

function toggleSaveDiagDetails() {
  const detEl = document.getElementById("save-diag-details");
  if (!detEl) return;
  renderSaveDiagUI();
  detEl.classList.toggle("hidden");
}

function isSaveRecordNewer(candidate, existing) {
  if (!candidate || typeof candidate !== "object") return false;
  if (!existing || typeof existing !== "object") return true;
  const cSeq = Number(candidate.saveSeq || 0);
  const eSeq = Number(existing.saveSeq || 0);
  // 1. Snapshot mẫu (saveSeq === 0) không bao giờ thắng bản lưu local (saveSeq >= 1)
  if (cSeq === 0 && eSeq >= 1) return false;
  if (cSeq >= 1 && eSeq === 0) return true;
  // 2. Nếu có reset phá sản mới hơn thì ưu tiên bản sau reset
  const cReset = Number(candidate.bankruptcyResetAt || 0);
  const eReset = Number(existing.bankruptcyResetAt || 0);
  if (cReset !== eReset) return cReset > eReset;
  // 3. Ưu tiên NGÀY (day) cao hơn: bản Ngày 4 không bao giờ thắng bản Ngày 5 cùng quán
  const cDay = Number(candidate.day || 1);
  const eDay = Number(existing.day || 1);
  if (cDay !== eDay) return cDay > eDay;
  // 4. Cùng ngày: ưu tiên tổng bịch đã bán cao hơn, rồi saveSeq, rồi updatedAt
  const cSold = Number(candidate.totalSold || 0);
  const eSold = Number(existing.totalSold || 0);
  if (cSold !== eSold) return cSold > eSold;
  if (cSeq !== eSeq) return cSeq > eSeq;
  const cTs = Number(candidate.updatedAt || candidate.fullState?.updatedAt || 0);
  const eTs = Number(existing.updatedAt || existing.fullState?.updatedAt || 0);
  return cTs >= eTs;
}

function getMaxKnownSaveMeta(shopKey) {
  let maxSeq = 0;
  let maxTs = 0;
  const consider = (rec) => {
    if (!rec || typeof rec !== "object") return;
    maxSeq = Math.max(maxSeq, Number(rec.saveSeq || 0));
    maxTs = Math.max(maxTs, Number(rec.updatedAt || rec.fullState?.updatedAt || 0));
  };
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const m = JSON.parse(raw);
      const mk = m?.shopKey || sanitizeShopKey(m?.shopName || "");
      if (!shopKey || (mk && mk === shopKey)) consider(m);
    }
    const vRaw = localStorage.getItem(LOCAL_SHOPS_REGISTRY_KEY);
    if (vRaw) {
      const vMap = JSON.parse(vRaw) || {};
      if (shopKey && vMap[shopKey]) consider(vMap[shopKey]);
      Object.values(vMap).forEach((entry) => {
        if (!entry || typeof entry !== "object") return;
        const ek = entry.shopKey || sanitizeShopKey(entry.shopName || "");
        if (!shopKey || ek === shopKey) consider(entry);
      });
    }
    if (typeof EMBEDDED_SERVER_SHOPS_SNAPSHOT === "object" && EMBEDDED_SERVER_SHOPS_SNAPSHOT && shopKey && EMBEDDED_SERVER_SHOPS_SNAPSHOT[shopKey]) {
      consider(EMBEDDED_SERVER_SHOPS_SNAPSHOT[shopKey]);
    }
    if (lastDisplayedResumeSave && typeof lastDisplayedResumeSave === "object") {
      const lk = lastDisplayedResumeSave.shopKey || sanitizeShopKey(lastDisplayedResumeSave.shopName || "");
      if (!shopKey || lk === shopKey) consider(lastDisplayedResumeSave);
    }
  } catch (e) {}
  return { maxSeq, maxTs };
}

function getCombinedShopsVault() {
  const merged = {};
  if (typeof EMBEDDED_SERVER_SHOPS_SNAPSHOT === "object" && EMBEDDED_SERVER_SHOPS_SNAPSHOT) {
    Object.entries(EMBEDDED_SERVER_SHOPS_SNAPSHOT).forEach(([k, v]) => {
      if (v && typeof v === "object" && !k.startsWith("npc_")) {
        merged[k] = { ...v, saveSeq: Number(v.saveSeq || 0) };
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
          if (!merged[k] || isSaveRecordNewer(v, merged[k])) {
            merged[k] = v;
          }
        });
      }
    }
  } catch (e) {}
  // Hợp nhất luôn bản lưu chính LOCAL_STORAGE_KEY nếu mới hơn bản trong vault
  try {
    const mRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (mRaw) {
      const m = JSON.parse(mRaw);
      if (m && m.shopName) {
        const mk = m.shopKey || sanitizeShopKey(m.shopName);
        if (mk && (!merged[mk] || isSaveRecordNewer(m, merged[mk]))) {
          merged[mk] = m;
        }
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
    const slimEntry = {
      ...shopState,
      localCustomAvatar: null,
      shopKey: key,
      offlineMode: true,
      saveMode: "local",
      saveSeq: Number(shopState.saveSeq || 1),
      updatedAt: Number(shopState.updatedAt || Date.now())
    };
    // Chốt chặn vô điều kiện cho VAULT: không bao giờ ghi đè bản có ngày cao hơn hoặc mới hơn
    if (localMap[key]) {
      const existingV = localMap[key];
      if (Number(slimEntry.day || 1) < Number(existingV.day || 1)) return;
      if (!isSaveRecordNewer(slimEntry, existingV)) return;
    }
    // Đối chiếu luôn với master để registry luôn là bản sao đồng bộ, không bao giờ tụt ngày sau master
    try {
      const mRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (mRaw) {
        const mObj = JSON.parse(mRaw);
        const mk = mObj?.shopKey || sanitizeShopKey(mObj?.shopName || "");
        if (mk && mk === key && Number(slimEntry.day || 1) < Number(mObj.day || 1)) {
          return;
        }
      }
    } catch (mErr) {}
    localMap[key] = slimEntry;
    try {
      localStorage.setItem(LOCAL_SHOPS_REGISTRY_KEY, JSON.stringify(localMap));
    } catch (quotaErr) {
      const entries = Object.entries(localMap)
        .sort((a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0))
        .slice(0, 12);
      const pruned = Object.fromEntries(entries);
      pruned[key] = slimEntry;
      localStorage.setItem(LOCAL_SHOPS_REGISTRY_KEY, JSON.stringify(pruned));
    }
  } catch (e) {}
}

function getLatestLocalSaveData(preferredKey = null, logContext = "") {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem("banh_trang_tron_saigon_v5_master_save");
    const master = raw ? JSON.parse(raw) : null;
    const masterKey = (master && (master.shopKey || sanitizeShopKey(master.shopName || ""))) || "";
    const key = preferredKey || masterKey || "";
    const vaultRaw = localStorage.getItem(LOCAL_SHOPS_REGISTRY_KEY);
    const vaultMap = vaultRaw ? (JSON.parse(vaultRaw) || {}) : {};
    const vaultEntry = key ? vaultMap[key] : null;
    const seedEntry = (typeof EMBEDDED_SERVER_SHOPS_SNAPSHOT === "object" && EMBEDDED_SERVER_SHOPS_SNAPSHOT && key)
      ? EMBEDDED_SERVER_SHOPS_SNAPSHOT[key]
      : null;

    // Chỉ xét bản ghi thuộc cùng shopKey khi preferredKey được chỉ định
    const masterCandidate = (master && master.shopName && (!key || masterKey === key)) ? master : null;
    const vaultCandidate = (vaultEntry && vaultEntry.shopName) ? vaultEntry : null;

    let chosen = null;
    if (masterCandidate && vaultCandidate) {
      chosen = isSaveRecordNewer(vaultCandidate, masterCandidate) ? vaultCandidate : masterCandidate;
    } else {
      chosen = masterCandidate || vaultCandidate || null;
    }

    if (logContext) {
      recordSaveDiagEntry(logContext, key, masterCandidate, vaultCandidate, seedEntry, chosen);
    }

    if (!chosen) return null;
    // Chỉ đọc thuần túy, không ghi đè ngược localStorage khi đang đọc
    return chosen;
  } catch (e) {
    return null;
  }
}

function checkExistingLocalSaveForLoginScreen() {
  try {
    userManuallyChangedLoginAvatar = false;
    updateFirebaseStatusBadgesUI();
    const tabKey = getTabSessionShopKey();
    let saved = tabKey ? getLatestLocalSaveData(tabKey, "loginCard:tabSession") : null;
    if (!saved) {
      saved = getLatestLocalSaveData(null, "loginCard");
    }
    lastDisplayedResumeSave = saved || null;
    if (!saved || !saved.shopName) {
      renderLoginTop3Preview();
      return;
    }

    const qBox = document.getElementById("quick-resume-box");
    if (qBox) {
      qBox.classList.remove("hidden");
      const lbl = document.getElementById("quick-resume-label");
      if (saved.isBankrupt) {
        if (lbl) lbl.textContent = "💔 Quán đã Phá Sản:";
        document.getElementById("quick-resume-avatar").innerHTML = renderAvatarContent(saved.avatar || "av_ditu", "w-full h-full object-cover rounded-xl grayscale");
        document.getElementById("quick-resume-name").textContent = saved.shopName;
        document.getElementById("quick-resume-stats").textContent = `💔 Đã phá sản (Ngày ${saved.day || 1}) • Bấm để Khởi nghiệp lại`;
      } else {
        if (lbl) lbl.textContent = "💾 Quán đang lưu trên máy:";
        document.getElementById("quick-resume-avatar").innerHTML = renderAvatarContent(saved.avatar || "av_ditu", "w-full h-full object-cover rounded-xl");
        document.getElementById("quick-resume-name").textContent = saved.shopName;
        document.getElementById("quick-resume-stats").textContent = `Cấp ${saved.level || 1} • ${(saved.rating || 5.0).toFixed(1)}⭐ • ${formatShortK(saved.money ?? 350000)}`;
      }
    }
    document.getElementById("login-shop-name").value = saved.shopName;
    document.getElementById("login-shop-pin").value = "";
    if (!userManuallyChangedLoginAvatar) {
      loginSelectedAvatar = saved.avatar || "av_ditu";
      renderLoginAvatarGrid();
    }
    renderLoginTop3Preview();
  } catch (e) {}
}

let currentLoginScreenMode = "continue";

function switchLoginMode(mode = "continue") {
  currentLoginScreenMode = mode === "create" ? "create" : "continue";
  const btnCont = document.getElementById("btn-mode-continue");
  const btnCreate = document.getElementById("btn-mode-create");
  const safeNote = document.getElementById("login-create-safe-note");
  const submitBtn = document.getElementById("btn-login-submit");
  const listPanel = document.getElementById("login-saved-list-panel");
  const nameInp = document.getElementById("login-shop-name");
  const pinInp = document.getElementById("login-shop-pin");

  if (btnCont) btnCont.className = currentLoginScreenMode === "continue"
    ? "soft-btn btn-game-green py-2 rounded-xl font-black text-xs ring-2 ring-yellow-300"
    : "soft-btn py-2 rounded-xl font-black text-xs bg-white text-amber-950 border-2 border-amber-300";
  if (btnCreate) btnCreate.className = currentLoginScreenMode === "create"
    ? "soft-btn btn-game-orange py-2 rounded-xl font-black text-xs ring-2 ring-yellow-300"
    : "soft-btn py-2 rounded-xl font-black text-xs bg-white text-amber-950 border-2 border-amber-300";

  if (safeNote) safeNote.classList.toggle("hidden", currentLoginScreenMode !== "create");
  if (listPanel) listPanel.classList.toggle("hidden", currentLoginScreenMode === "create");

  if (currentLoginScreenMode === "create") {
    if (nameInp) { nameInp.value = ""; nameInp.focus(); }
    if (pinInp) pinInp.value = "";
    if (submitBtn) submitBtn.textContent = "🆕 TẠO QUÁN MỚI & RA NGHỀ!";
    const msgEl = document.getElementById("login-status-msg");
    if (msgEl) msgEl.classList.add("hidden");
  } else {
    if (submitBtn) submitBtn.textContent = "▶️ VÀO QUÁN ĐÃ CHỌN!";
    renderLoginTop3Preview();
  }
}

function prefillLoginShopName(shopName) {
  currentLoginScreenMode = "continue";
  const inp = document.getElementById("login-shop-name");
  const pinInp = document.getElementById("login-shop-pin");
  const submitBtn = document.getElementById("btn-login-submit");
  if (inp) inp.value = shopName;
  if (pinInp) {
    pinInp.value = "";
    pinInp.focus();
  }
  if (submitBtn) submitBtn.textContent = "▶️ VÀO QUÁN ĐÃ CHỌN!";
  showLoginMessage(`🔑 Hãy nhập Mã PIN 4 số của quán "${shopName}" rồi bấm VÀO QUÁN ĐÃ CHỌN!`, "info");
}

function quickResumeGame() {
  initAudio(); startChillBGM();
  try {
    const tabKey = getTabSessionShopKey();
    const displayedKey = (lastDisplayedResumeSave && (lastDisplayedResumeSave.shopKey || sanitizeShopKey(lastDisplayedResumeSave.shopName || ""))) || null;
    const preferredKey = tabKey || displayedKey || null;
    let localData = getLatestLocalSaveData(preferredKey, tabKey ? "quickResumeGame:tabSession" : "quickResumeGame");
    if (lastDisplayedResumeSave && lastDisplayedResumeSave.shopName) {
      const lKey = lastDisplayedResumeSave.shopKey || sanitizeShopKey(lastDisplayedResumeSave.shopName);
      if ((!preferredKey || lKey === preferredKey) && (!localData || isSaveRecordNewer(lastDisplayedResumeSave, localData))) {
        localData = lastDisplayedResumeSave;
      }
    }
    if (localData) {
      state = getInitialDefaultState();
      mergeLoadedState(localData);
      state.offlineMode = true;
      state.saveMode = "local";
      ensureRecoveryCode();
      setTabSessionShopKey(state.shopKey || sanitizeShopKey(state.shopName));
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
}

function handleLoginOrRegister() {
  initAudio(); startChillBGM();
  const nameInput = document.getElementById("login-shop-name").value.trim();
  const pinInput = document.getElementById("login-shop-pin").value.trim();

  if (nameInput.length < 2) { showLoginMessage("⚠️ Tên quán từ 2 ký tự trở lên!", "error"); return; }
  if (!/^\d{4}$/.test(pinInput)) { showLoginMessage("⚠️ Vui lòng nhập Mã PIN gồm đúng 4 chữ số!", "error"); return; }

  const key = sanitizeShopKey(nameInput);
  if (!key) { showLoginMessage("⚠️ Tên quán không hợp lệ!", "error"); return; }

  const vault = getCombinedShopsVault();
  const matchedRecord = vault[key] || null;

  let isExistingShop = false;
  let storedPinHash = null;
  let loadedAvatar = null;

  if (matchedRecord) {
    if (currentLoginScreenMode === "create") {
      showLoginMessage(`⚠️ Quán "${nameInput}" đã tồn tại! Hãy đặt tên khác để tạo quán mới (quán cũ không bị xóa), hoặc chuyển sang tab "Chơi Tiếp".`, "error");
      return;
    }
    const recordPin = matchedRecord.pin || matchedRecord.fullState?.pin || "";
    if (recordPin && recordPin !== "LOCAL") {
      if (!verifyShopPin(key, pinInput, recordPin)) {
        showLoginMessage("❌ Tên quán đã có chủ! Hãy nhập đúng Mã PIN 4 số hoặc đặt Tên khác.", "error");
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
  state.offlineMode = true;
  state.saveMode = "local";
  state.avatar = userManuallyChangedLoginAvatar ? loginSelectedAvatar : (loadedAvatar || state.avatar || "av_ditu");
  loginSelectedAvatar = state.avatar;
  userManuallyChangedLoginAvatar = false;
  state.levelAtStartOfDay = state.level || 1;
  ensureRecoveryCode();

  if (state.isBankrupt) {
    document.getElementById("login-screen").classList.add("hidden");
    updateAllUI();
    declareTrueBankruptcy(true);
    showToast(`💔 Quán "${state.shopName}" đã Phá Sản! Hãy Khởi nghiệp lại với 350.000đ.`);
    return;
  }

  setTabSessionShopKey(key);
  saveGameEverywhere(false, "loginOrReg");
  document.getElementById("login-screen").classList.add("hidden");
  updateAllUI();
  if (state.money < 0 || (state.money < 15000 && (state.stock.banhtrang || 0) < 1)) {
    checkBankruptcyOrRescueLoan();
    return;
  }
  if (state.isStreetSelling) {
    startStreetSellingPhase(true);
  } else if (!isExistingShop && state.day === 1 && state.totalSold === 0) {
    state.seenIntroTutorial = true;
    if (typeof renderDay1OnboardingChecklist === "function") renderDay1OnboardingChecklist();
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
  if (state && state.shopName) {
    saveGameEverywhere(false, "switchShop");
  }
  userManuallyChangedLoginAvatar = false;
  checkExistingLocalSaveForLoginScreen();
  fetchCloudLeaderboard(false);
  document.getElementById("login-screen").classList.remove("hidden");
}

function openProfileEditModal() {
  ensureRecoveryCode();
  saveToLocalOnly("profileModal");
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
  closeProfileEditModal(); playSFX("cash"); updateAllUI(); saveGameEverywhere(true, "profileSave");
  showToast(`✅ Đã lưu Bảng Hiệu mới! (Mã Quán Local: ${state.recoveryCode})`);
}

// ================= KHÔI PHỤC LOCAL (BT-XXXXXX + BTT1-... + FILE JSON) =================
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

function generatePortableSaveCode(targetState = state) {
  try {
    ensureRecoveryCode();
    const slim = {
      ...targetState,
      offlineMode: true,
      saveMode: "local",
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
  showToast(`📋 Đã sao chép Mã Quán: ${code}!`);
}

function copyFullPortableRecoveryCode() {
  saveToLocalOnly("copyBTT1");
  const portableCode = generatePortableSaveCode(state);
  const previewEl = document.getElementById("profile-portable-code-preview");
  if (previewEl) previewEl.value = portableCode;
  const previewEl2 = document.getElementById("modal-rec-btt1-preview");
  if (previewEl2) previewEl2.value = portableCode;
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

function handleRecoverByCode(fromModal = false) {
  initAudio(); startChillBGM();
  const rawInput = (document.getElementById(fromModal ? "modal-rec-code-input" : "recovery-code-input")?.value || "").trim();
  const pinInput = (document.getElementById(fromModal ? "modal-rec-pin-input" : "recovery-pin-input")?.value || "").trim();

  const showErr = (text) => {
    if (fromModal) {
      const el = document.getElementById("modal-rec-status-msg");
      if (el) {
        el.classList.remove("hidden");
        el.className = "text-[11px] font-black p-2 rounded-xl text-center bg-red-100 text-red-900 border border-red-400";
        el.textContent = text;
      }
    } else {
      showLoginMessage(text, "error");
    }
  };

  if (!rawInput) {
    showErr("⚠️ Nhập Mã Quán BT-123456 hoặc dán chuỗi BTT1-...");
    return;
  }

  if (rawInput.startsWith("BTT1-")) {
    const decoded = decodePortableSaveCode(rawInput);
    if (!decoded) {
      showErr("❌ Chuỗi Mã Sao Lưu BTT1-... không hợp lệ!");
      return;
    }
    state = getInitialDefaultState();
    mergeLoadedState(decoded);
    state.offlineMode = true;
    state.saveMode = "local";
    ensureRecoveryCode();
    setTabSessionShopKey(state.shopKey || sanitizeShopKey(state.shopName));
    saveGameEverywhere(false, "recoverBTT1");
    document.getElementById("login-screen").classList.add("hidden");
    closeRecoveryModalFromMenu();
    updateAllUI();
    if (state.isStreetSelling) startStreetSellingPhase(true);
    playSFX("cash");
    showToast(`🎉 Đã khôi phục quán "${state.shopName}" (Ngày ${state.day} • Cấp ${state.level})!`);
    return;
  }

  const codeInput = normalizeRecoveryCodeInput(rawInput);
  if (!/^BT-\d{6}$/.test(codeInput)) {
    showErr("⚠️ Nhập đúng định dạng BT-123456 hoặc BTT1-...");
    return;
  }

  const vault = getCombinedShopsVault();
  const foundRecord = Object.values(vault).find(s => s && (s.recoveryCode === codeInput || s.fullState?.recoveryCode === codeInput)) || null;

  if (!foundRecord) {
    showErr(`❌ Không tìm thấy quán có Mã ${codeInput} trong kho lưu trên máy!`);
    return;
  }

  const fullSt = foundRecord.fullState ? { ...foundRecord.fullState, ...foundRecord } : foundRecord;
  const sKey = fullSt.shopKey || sanitizeShopKey(fullSt.shopName || "");
  const savedPin = String(fullSt.pin || "");

  if (savedPin && savedPin !== "LOCAL") {
    if (!/^\d{4}$/.test(pinInput) || !verifyShopPin(sKey, pinInput, savedPin)) {
      showErr("❌ Vui lòng nhập đúng Mã PIN 4 số của quán để khôi phục!");
      return;
    }
  }

  if (fullSt.isBankrupt) {
    showErr(`💔 Quán "${fullSt.shopName}" đã Phá Sản! Hãy nhập Tên Quán & PIN để Khởi nghiệp lại từ Ngày 1.`);
    return;
  }

  state = getInitialDefaultState();
  mergeLoadedState(fullSt);
  state.shopKey = sKey;
  state.pin = savedPin || "LOCAL";
  state.offlineMode = true;
  state.saveMode = "local";
  ensureRecoveryCode();
  setTabSessionShopKey(sKey);
  saveGameEverywhere(false, "recoverBT");
  document.getElementById("login-screen").classList.add("hidden");
  closeRecoveryModalFromMenu();
  updateAllUI();
  if (state.isStreetSelling) startStreetSellingPhase(true);
  playSFX("cash");
  showToast(`🎉 Đã khôi phục quán "${state.shopName}" (Ngày ${state.day} • Cấp ${state.level})!`);
}

function setCloudSyncIndicator(status) {
  const dot = document.getElementById("cloud-sync-dot");
  const txt = document.getElementById("cloud-sync-text");
  if (!dot) return;
  dot.className = "w-2 h-2 rounded-full bg-emerald-400";
  if (txt) txt.textContent = "Đã lưu Local";
  updateFirebaseStatusBadgesUI();
}

function updateFirebaseStatusBadgesUI() {
  const loginModeLbl = document.getElementById("login-network-mode-label");
  if (loginModeLbl) {
    loginModeLbl.textContent = "🔑 Mã Quán Local (Offline 100%)";
    loginModeLbl.className = "text-emerald-700 font-black";
  }
  const lbStatusBadge = document.getElementById("lb-firebase-status-badge");
  if (lbStatusBadge) {
    lbStatusBadge.textContent = "💾 Lưu Local (Offline 100%)";
    lbStatusBadge.className = "px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-900 font-black text-[9.5px]";
  }
}

function forceManualCloudSync() {
  playSFX("cash");
  saveGameEverywhere(true, "manualSave");
}

function saveGameEverywhere(isManual = false, sourceLabel = "saveEverywhere") {
  ensureRecoveryCode();
  state.offlineMode = true;
  state.saveMode = "local";
  const key = state.shopKey || sanitizeShopKey(state.shopName);
  state.shopKey = key;
  saveToLocalOnly(sourceLabel);
  setCloudSyncIndicator("saved");
  if (isManual) showToast(`💾 Đã lưu quán "${state.shopName}" trên máy (Mã: ${state.recoveryCode})!`);
  return true;
}

function fetchCloudLeaderboard(showFeedback = false) {
  const badge = document.getElementById("login-cloud-badge");
  const mergedShopsMap = new Map();

  const addOrUpdateShop = (item) => {
    if (!item || (!item.shopName && !item.fullState?.shopName)) return;
    const fs = item.fullState || {};
    const rawName = item.shopName || fs.shopName || "";
    const sKey = sanitizeShopKey(item.shopKey || rawName);
    if (!sKey || String(sKey).startsWith("npc_")) return;
    const isCurrentLocalShop = state && state.shopName && sanitizeShopKey(state.shopName) === sKey;
    const mergedObj = { ...fs, ...item };
    const candidate = {
      shopKey: sKey,
      shopName: isCurrentLocalShop ? state.shopName : (item.shopName || fs.shopName),
      avatar: isCurrentLocalShop ? state.avatar : (item.avatar || fs.avatar || "av_ditu"),
      money: isCurrentLocalShop ? Number(state.money || 0) : (Number(item.money !== undefined ? item.money : fs.money) || 0),
      rating: isCurrentLocalShop ? Number(state.rating || 5.0) : (Number(item.rating !== undefined ? item.rating : fs.rating) || 5.0),
      level: isCurrentLocalShop ? Number(state.level || 1) : (Number(item.level !== undefined ? item.level : fs.level) || 1),
      totalSold: isCurrentLocalShop ? Number(state.totalSold || 0) : (Number(item.totalSold !== undefined ? item.totalSold : fs.totalSold) || 0),
      day: isCurrentLocalShop ? Number(state.day || 1) : (Number(item.day !== undefined ? item.day : fs.day) || 1),
      shopScale: isCurrentLocalShop ? Number(state.shopScale || 0) : Number(item.shopScale ?? fs.shopScale ?? 0),
      decorCount: isCurrentLocalShop ? (state.ownedDecors || []).length : (Array.isArray(mergedObj.ownedDecors) ? mergedObj.ownedDecors.length : Number(item.decorCount || 0)),
      creditScore: isCurrentLocalShop ? Number(state.creditScore || 520) : Number(mergedObj.creditScore || 520),
      savingsBalance: isCurrentLocalShop ? Number(state.savingsBalance || 0) : Number(mergedObj.savingsBalance || 0),
      prestigeGen: isCurrentLocalShop ? Number(state.prestigeGen || 0) : Number(mergedObj.prestigeGen || 0),
      marketSharePct: isCurrentLocalShop ? Number(state.marketSharePct || 28) : Number(mergedObj.marketSharePct || 28),
      netWorth: isCurrentLocalShop ? computeShopNetWorth(state) : Math.max(Number(item.netWorth || 0), computeShopNetWorth(mergedObj)),
      isBankrupt: isCurrentLocalShop ? Boolean(state.isBankrupt) : Boolean(item.isBankrupt || fs.isBankrupt),
      updatedAt: Number(item.updatedAt || fs.updatedAt || Date.now())
    };
    mergedShopsMap.set(sKey, candidate);
  };

  const localVault = getCombinedShopsVault();
  Object.values(localVault).forEach(addOrUpdateShop);

  cloudLeaderboardCache = Array.from(mergedShopsMap.values());
  if (badge) {
    badge.textContent = `💾 Offline (${cloudLeaderboardCache.length} quán)`;
    badge.className = "text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full";
  }
  updateFirebaseStatusBadgesUI();
  renderLoginTop3Preview();
  if (typeof renderLeaderboardTab === "function") renderLeaderboardTab();
  if (showFeedback) showToast(`🏆 Đã làm mới Bảng Xếp Hạng Offline (${cloudLeaderboardCache.length} quán)!`);
}

function renderLoginTop3Preview() {
  const container = document.getElementById("login-top3-list");
  const badge = document.getElementById("login-cloud-badge");
  if (!container) return;
  const vault = getCombinedShopsVault();
  const q = String(document.getElementById("login-shop-search")?.value || "").trim().toLowerCase();
  const allList = Object.values(vault)
    .filter(x => x && (x.shopName || x.fullState?.shopName))
    .sort((a, b) => {
      const aLocal = Number(a.saveSeq || 0) >= 1 ? 1 : 0;
      const bLocal = Number(b.saveSeq || 0) >= 1 ? 1 : 0;
      if (aLocal !== bLocal) return bLocal - aLocal;
      return Number(b.netWorth || b.money || b.fullState?.money || 0) - Number(a.netWorth || a.money || a.fullState?.money || 0);
    });
  const list = q
    ? allList.filter(rawItem => {
        const it = rawItem.fullState ? { ...rawItem.fullState, ...rawItem } : rawItem;
        const nm = String(it.shopName || rawItem.shopKey || "").toLowerCase();
        const code = String(it.recoveryCode || "").toLowerCase();
        return nm.includes(q) || code.includes(q);
      })
    : allList;
  if (badge) {
    badge.textContent = `💾 Offline (${list.length} quán)`;
  }
  if (list.length === 0) {
    container.innerHTML = `<div class="text-center text-amber-700 py-1 text-[11px]">Nhập Tên Bảng Hiệu + PIN 4 số để tạo quán hoặc mở lại quán.</div>`;
    return;
  }
  container.innerHTML = list.map((rawItem, idx) => {
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
        <button type="button" onclick="prefillLoginShopName('${escapeHtml(sName.replace(/'/g, "\'"))}')" class="soft-btn px-2 py-1 rounded-lg bg-amber-600 text-white font-black text-[10px] shrink-0">
          Chọn Quán
        </button>
      </div>
    `;
  }).join("");
}

// ================= GIFTCODE LOCAL & HỘP THƯ OFFLINE =================
window.serverLiveConfig = { enabled: false, title: "", customerMult: 1.0, xpMult: 1.0, tipMult: 1.0, marketDiscountPct: 0, patienceBonusPct: 0 };
window.serverBroadcastData = {
  id: "offline_welcome_v17",
  active: true,
  title: "🎉 Chào Mừng Ver 17 Offline 100%!",
  message: "Toàn bộ tiến độ, bảng xếp hạng 105 quán và phòng PvP Bot đã hoạt động hoàn toàn trên máy không cần mạng.",
  rewardMoney: 30000,
  rewardXp: 30
};
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

  const mailBox = document.getElementById("admin-mail-container");
  const claimedB = new Set(Array.isArray(state.claimedBroadcasts) ? state.claimedBroadcasts : []);
  const itemsHtml = [];
  let unclaimedCount = 0;

  const bc = window.serverBroadcastData;
  if (bc && bc.id && bc.active !== false) {
    const isClaimed = claimedB.has(bc.id);
    if (!isClaimed) unclaimedCount++;
    const rewardStr = `+${formatVND(bc.rewardMoney)} & +${bc.rewardXp} XP`;
    itemsHtml.push(`
      <div class="p-2.5 rounded-xl border-2 ${isClaimed ? 'bg-amber-50/60 border-amber-200 opacity-75' : 'bg-yellow-50 border-orange-400 shadow-sm'} flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="font-black text-amber-950 flex items-center gap-1">
            <span>📢</span><span class="leading-tight">${escapeHtml(bc.title)}</span>
          </div>
          <p class="text-[11px] font-bold text-amber-900 mt-0.5 leading-snug">${escapeHtml(bc.message)}</p>
          <div class="text-[10px] font-black text-emerald-700 mt-0.5">🎁 Quà đính kèm: ${rewardStr}</div>
        </div>
        ${isClaimed
          ? `<span class="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 font-black text-[10px] shrink-0">✓ Đã nhận</span>`
          : `<button onclick="claimServerBroadcast('${escapeHtml(bc.id)}')" class="soft-btn btn-game-green px-2.5 py-1.5 rounded-xl font-black text-[10px] shrink-0">🎉 Nhận</button>`
        }
      </div>
    `);
  }

  if (mailBox) {
    mailBox.innerHTML = itemsHtml.length > 0
      ? itemsHtml.join("")
      : `<div class="text-center py-3 text-amber-800 font-bold bg-amber-50/70 rounded-xl border border-amber-200">Chưa có thư mới.</div>`;
  }

  const dotEl = document.getElementById("header-gift-dot");
  const menuBadge = document.getElementById("menu-gift-badge");
  if (dotEl) dotEl.classList.toggle("hidden", unclaimedCount === 0);
  if (menuBadge) menuBadge.classList.toggle("hidden", unclaimedCount === 0);
}

function syncAdminLiveOpsAndMail(showFeedback = false) {
  renderGiftcodeModalContent();
  if (showFeedback) showToast("📬 Hộp thư nội bộ đã được cập nhật!");
}

function claimServerBroadcast(bId) {
  const bc = window.serverBroadcastData;
  if (!bc || bc.id !== bId) return;
  if (!Array.isArray(state.claimedBroadcasts)) state.claimedBroadcasts = [];
  if (state.claimedBroadcasts.includes(bId)) {
    showToast("⚠️ Quán của bạn đã nhận phần quà này rồi!");
    return;
  }
  state.claimedBroadcasts.push(bId);
  const rewardM = Math.max(0, Number(bc.rewardMoney || 0));
  const rewardX = Math.max(0, Number(bc.rewardXp || 0));
  if (rewardM > 0) {
    state.money += rewardM;
    state.adminGrantedMoney = (state.adminGrantedMoney || 0) + rewardM;
  }
  if (rewardX > 0) addXP(rewardX);
  playSFX("cash");
  renderGiftcodeModalContent();
  updateAllUI();
  saveGameEverywhere(false);
  showToast(`🎉 Đã nhận quà: +${formatVND(rewardM)}${rewardX > 0 ? ` & +${rewardX} XP` : ""}!`);
}

function handleRedeemGiftcode() {
  const inputEl = document.getElementById("giftcode-input");
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

  const LOCAL_GIFTCODES = {
    "TANTHU50K": { money: 50000, xp: 50, label: "Quà Tân Thủ Khởi Nghiệp" },
    "SAIGON100K": { money: 100000, xp: 80, label: "Quà Đại Lý Sài Gòn" },
    "DITU2026": { money: 50000, xp: 40, label: "Quà Bí Kíp Dì Tư" },
    "FIREBASE2026": { money: 150000, xp: 100, label: "Quà Đặc Biệt 2026" }
  };

  const localGift = LOCAL_GIFTCODES[rawCode];
  if (!localGift) {
    // Tuyệt đối không lộ danh sách mã hợp lệ khi nhập sai
    showGiftcodeStatus(`❌ Mã "${rawCode}" không tồn tại hoặc đã hết hạn!`, false);
    return;
  }

  state.redeemedGiftcodes.push(rawCode);
  state.money = (state.money || 0) + localGift.money;
  state.adminGrantedMoney = (state.adminGrantedMoney || 0) + localGift.money;
  addXP(localGift.xp);
  inputEl.value = "";
  saveGameEverywhere(false);
  renderGiftcodeModalContent();
  updateAllUI();
  playSFX("cash");
  showGiftcodeStatus(`🎉 Nhận thành công ${localGift.label}: +${formatVND(localGift.money)} & +${localGift.xp} XP!`, true);
}

// ================= PHÒNG PVP OFFLINE (ĐẤU VỚI BOT TỪ 105 QUÁN MẪU) =================
function buildOfflinePvpBotsForRoom(roomCode) {
  const vault = getCombinedShopsVault();
  const myKey = state.shopKey || sanitizeShopKey(state.shopName || "");
  const pool = Object.values(vault).filter(s => s && s.shopName && (s.shopKey || sanitizeShopKey(s.shopName)) !== myKey);
  let seed = 0;
  const seedStr = `${roomCode}_${state.day || 1}`;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const picked = [];
  const used = new Set();
  const targetCount = Math.min(8, pool.length);
  for (let i = 0; i < targetCount; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    let idx = seed % pool.length;
    while (used.has(idx) && used.size < pool.length) idx = (idx + 1) % pool.length;
    used.add(idx);
    const bot = pool[idx];
    const lvl = Math.max(1, Number(bot.level || 1));
    const soldToday = Math.max(4, Math.min(36, 5 + (seed % 14) + Math.floor(lvl / 4)));
    const revToday = soldToday * (22000 + ((seed >>> 4) % 9) * 1000);
    picked.push({
      shopKey: bot.shopKey || sanitizeShopKey(bot.shopName),
      shopName: bot.shopName,
      avatar: bot.avatar || "av_ditu",
      level: lvl,
      rating: Number(bot.rating || 4.8),
      todayRevenue: revToday,
      todaySold: soldToday,
      netWorth: computeShopNetWorth(bot)
    });
  }
  return picked;
}

function joinOrSyncPvpRoom() {
  ensureV15State(state);
  const inp = document.getElementById("pvp-room-code-input");
  const typed = inp ? inp.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 12) : "";
  const room = typed || state.pvpRoomCode || "SAIGON01";

  if (!OFFLINE_VALID_PVP_ROOMS.includes(room)) {
    playSFX("whistle");
    showToast(`❌ Mã phòng "${room}" không tồn tại! (Phòng mở: ${OFFLINE_VALID_PVP_ROOMS.join(", ")})`);
    return;
  }

  state.pvpRoomCode = room;
  saveToLocalOnly();
  fetchPvpRoomLeaderboard(room);
  playSFX("cash");
  showToast(`⚔️ Đã vào Phòng PvP Offline [${room}] đấu cùng 8 quán Sài Gòn!`);
}

function fetchPvpRoomLeaderboard(roomCode = null) {
  const room = roomCode || state.pvpRoomCode || "SAIGON01";
  if (!OFFLINE_VALID_PVP_ROOMS.includes(room)) {
    pvpRoomLeaderboardCache = [];
  } else {
    pvpRoomLeaderboardCache = buildOfflinePvpBotsForRoom(room);
  }
  if (typeof renderLeaderboardTab === "function") renderLeaderboardTab();
}

// Các stub tương thích ngược (Offline 100% không gọi mạng)
function persistBankruptcyLockToCloud() {}
function syncRemoteGameConfigV15() {}
