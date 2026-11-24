/**
 * ================= VER 18.0 UI UPGRADE CONTROLLER (G1 - G8) =================
 * - G2: Màn "Hành Trình" (gộp Hồi Ký + Thành Tựu + Cấp Độ) & đóng modal cũ khi mở modal mới
 * - G3: Nhãn rõ ràng (Nút Ớt, Thanh trộn %, Bảng kê tiền, Giải thích Sao, Đổi nhãn viết tắt)
 * - G4: Màn "Hồ Sơ Quán" đưa 5 hệ sâu ra ánh sáng (Truyền Nghề, Tín Dụng/Vay, Tiết Kiệm, Tinh Thần NV, Thị Phần)
 * - G5: Thẻ to khách gọi thêm giữa chừng, Cảnh báo khóa topping trước B3, Nút topping thật
 * - G7: Nút tăng tốc 2x & Lazy-load toàn bộ ảnh sprite
 * - G8: Ẩn khung chẩn đoán dev mặc định, mở bằng 5 lần chạm vào phiên bản hoặc nút debug
 */

window.gameSpeedMult = 1;
window._v18DiagTapCount = 0;

function toggleGameSpeed2x() {
  window.gameSpeedMult = window.gameSpeedMult === 2 ? 1 : 2;
  const btn = document.getElementById("btn-speed-toggle-2x");
  if (btn) {
    btn.textContent = window.gameSpeedMult === 2 ? "⚡ Tốc độ: 2x" : "⏱️ Tốc độ: 1x";
    btn.className = window.gameSpeedMult === 2
      ? "soft-btn px-2.5 py-1 rounded-xl font-black text-xs bg-amber-400 text-amber-950 border-2 border-amber-800 shadow"
      : "soft-btn px-2.5 py-1 rounded-xl font-black text-xs bg-white/90 text-amber-950 border-2 border-amber-400";
  }
  if (typeof playSFX === "function") playSFX("snip");
  if (typeof showToast === "function") {
    showToast(window.gameSpeedMult === 2 ? "⚡ Đã bật Tăng Tốc 2x cho ca bán hàng!" : "⏱️ Đã về tốc độ chuẩn 1x.");
  }
}

// G8: Ẩn/hiện khung chẩn đoán dev bằng thao tác debug (5 lần chạm badge Ver 18.0)
function handleVersionBadgeDebugTap() {
  window._v18DiagTapCount = (window._v18DiagTapCount || 0) + 1;
  if (window._v18DiagTapCount >= 5) {
    window._v18DiagTapCount = 0;
    const strip = document.getElementById("save-diag-strip");
    if (strip) {
      strip.classList.toggle("hidden");
      if (typeof showToast === "function") showToast("🔍 Đã bật/tắt khung chẩn đoán lưu (Dev)");
    }
  }
}

// G2: Đóng tất cả modal đang mở để không bao giờ còn modal đè modal
function closeAllModalsV18(exceptId = "") {
  const allModalIds = [
    "modal-quick-menu", "modal-pwa-install", "modal-giftcode", "modal-ditu-tutorial",
    "modal-bargain", "modal-codex", "modal-prep", "modal-reviews", "modal-out-of-stock",
    "modal-dilemma", "modal-profile-edit", "modal-story", "modal-achievements",
    "modal-end-day", "modal-bankruptcy", "modal-level-up", "modal-recovery-local",
    "modal-rival-profile", "modal-journey", "modal-shop-profile"
  ];
  allModalIds.forEach(id => {
    if (id === exceptId) return;
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
}

// G2: Màn "Hành Trình" (gộp Hồi Ký 8 Chương + 16 Thành Tựu + Lộ Trình Cấp Độ 1–80)
let currentJourneyTab = "story";
function openJourneyModal(tab = "story") {
  closeAllModalsV18("modal-journey");
  currentJourneyTab = tab;
  const modal = document.getElementById("modal-journey");
  if (!modal) return;
  modal.classList.remove("hidden");
  renderJourneyModalContent(tab);
  if (typeof playSFX === "function") playSFX("snip");
}

function closeJourneyModal() {
  const modal = document.getElementById("modal-journey");
  if (modal) modal.classList.add("hidden");
}

function renderJourneyModalContent(tab = currentJourneyTab) {
  currentJourneyTab = tab;
  ["story", "achievements", "levels"].forEach(t => {
    const b = document.getElementById(`journey-tab-${t}`);
    if (b) {
      b.className = t === tab
        ? "soft-btn btn-game-orange py-1.5 px-2 rounded-xl font-black text-xs"
        : "soft-btn py-1.5 px-2 rounded-xl font-black text-xs bg-white text-amber-950 border border-amber-300";
    }
  });
  const body = document.getElementById("journey-modal-body");
  if (!body) return;

  if (tab === "story" && typeof STORY_CHAPTERS !== "undefined") {
    const claimed = Array.isArray(state.claimedChapters) ? state.claimedChapters : [];
    body.innerHTML = STORY_CHAPTERS.map(ch => {
      const unlocked = (state.level || 1) >= ch.reqLevel;
      const done = ch.check(state);
      const isClaimed = claimed.includes(ch.id);
      return `<div class="p-2.5 rounded-xl border-2 ${done ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-amber-200'}">
        <div class="flex items-center justify-between gap-2">
          <div class="font-black text-xs text-amber-950">${ch.title}</div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${isClaimed ? 'bg-emerald-600 text-white' : unlocked ? 'bg-amber-200 text-amber-950' : 'bg-slate-200 text-slate-600'}">${isClaimed ? '✓ Đã nhận' : unlocked ? 'Đang mở' : 'Cấp ' + ch.reqLevel}</span>
        </div>
        <div class="text-xs text-amber-900 mt-1">${ch.goalDesc} • Thưởng: <b>${formatVND(ch.reward)}</b></div>
      </div>`;
    }).join("");
  } else if (tab === "achievements" && typeof ACHIEVEMENTS_DATA !== "undefined") {
    const claimed = Array.isArray(state.claimedAchievements) ? state.claimedAchievements : [];
    body.innerHTML = ACHIEVEMENTS_DATA.map(a => {
      const done = a.check(state);
      const isClaimed = claimed.includes(a.id);
      return `<div class="p-2.5 rounded-xl border-2 ${done ? 'bg-amber-50 border-amber-400' : 'bg-white border-amber-200'} flex items-center justify-between gap-2">
        <div>
          <div class="font-black text-xs text-amber-950">${a.title}</div>
          <div class="text-xs text-amber-800">${a.desc}</div>
        </div>
        <span class="px-2 py-1 rounded-lg text-xs font-black shrink-0 ${isClaimed ? 'bg-emerald-600 text-white' : done ? 'bg-orange-500 text-white' : 'bg-amber-100 text-amber-900'}">${isClaimed ? '✓ Xong' : done ? 'Đạt!' : formatShortK(a.rewardMoney)}</span>
      </div>`;
    }).join("");
  } else if (typeof LEVEL_DATA !== "undefined") {
    const curLvl = state.level || 1;
    const milestones = LEVEL_DATA.filter(l => l.level === curLvl || l.level % 5 === 0 || l.level === 1 || l.level === 80);
    body.innerHTML = `<div class="p-2.5 rounded-xl bg-amber-100 border-2 border-amber-400 text-xs font-bold text-amber-950 mb-2">
      👑 Hiện tại: <b>Cấp ${curLvl}/80</b> • XP: <b>${state.xp || 0}/${(LEVEL_DATA[curLvl - 1]?.xpNeed || 100)}</b>
    </div>` + milestones.map(l => {
      const reached = curLvl >= l.level;
      return `<div class="p-2 rounded-xl border ${reached ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-amber-200'} flex items-center justify-between text-xs">
        <span class="font-black text-amber-950">Cấp ${l.level} — ${l.title}</span>
        <span class="font-bold ${reached ? 'text-emerald-700' : 'text-amber-700'}">${reached ? '✓ Đạt' : l.xpNeed + ' XP'}</span>
      </div>`;
    }).join("");
  }
}

// G4: Màn "Hồ Sơ Quán" đưa 5 hệ sâu ra ánh sáng
function openShopProfileModal() {
  closeAllModalsV18("modal-shop-profile");
  const modal = document.getElementById("modal-shop-profile");
  const body = document.getElementById("shop-profile-modal-body");
  if (!modal || !body) return;
  if (typeof ensureV15State === "function") ensureV15State(state);

  const lvl = state.level || 1;
  const prestigeGen = state.prestigeGen || 0;
  const credit = state.creditScore || 520;
  const debt = state.loanDebt || 0;
  const savings = state.savingsBalance || 0;
  const nightlyInterest = Math.round(savings * 0.015);
  const share = state.marketSharePct || 28;
  const rating = Number(state.rating || 4.3).toFixed(2);

  // 4. Thanh tinh thần từng nhân viên
  const hiredStaff = (typeof STAFF_CATALOG !== "undefined" ? STAFF_CATALOG : []).filter(st => state.staff && state.staff[st.id]);
  const staffHtml = hiredStaff.length > 0
    ? hiredStaff.map(st => {
        const m = Math.max(0, Math.min(100, Number(state.staffMorale?.[st.id] ?? 90)));
        const barColor = m >= 80 ? "bg-emerald-500" : m >= 55 ? "bg-amber-500" : "bg-rose-600";
        return `<div class="text-xs">
          <div class="flex justify-between font-bold text-amber-950"><span>${st.name}</span><span>${m}%</span></div>
          <div class="w-full h-2 bg-amber-200 rounded-full overflow-hidden"><div class="h-full ${barColor}" style="width:${m}%"></div></div>
        </div>`;
      }).join("")
    : `<div class="text-xs text-amber-800 italic">Chưa thuê nhân viên (mở từ Cấp 8 ở mục Xây Quán → Nhân Sự).</div>`;

  // Gợi ý việc tiếp theo nên làm
  let nextHint = "Bấm ⚡ Lấy Đủ Hàng ở Đi Chợ và sơ chế 3/3 món để tối đa hóa tiền Tip (+1.000đ/bịch).";
  if (lvl >= 60) nextHint = "👑 Bạn đã đủ Cấp 60! Có thể kích hoạt Truyền Nghề (Prestige) để tăng vĩnh viễn sức mua & định giá.";
  else if (savings === 0 && (state.money || 0) >= 500000) nextHint = "💰 Tiền mặt đang dư dả — hãy gửi một phần vào Sổ Tiết Kiệm để nhận lãi +1,5%/đêm!";
  else if (debt > 0) nextHint = `🏦 Đang có dư nợ ${formatVND(debt)} — ưu tiên trả bớt nợ để tăng Điểm Tín Dụng (${credit}/850).`;
  else if (hiredStaff.some(st => (state.staffMorale?.[st.id] ?? 90) < 70)) nextHint = "💛 Có nhân viên tinh thần dưới 70% — vào Xây Quán → Nhân Sự để khích lệ giữ tốc độ bếp!";

  body.innerHTML = `
    <div class="p-2.5 rounded-xl bg-amber-100 border-2 border-amber-400 text-xs text-amber-950">
      <div class="font-black">💡 Gợi ý việc tiếp theo nên làm:</div>
      <div class="mt-0.5 font-semibold">${nextHint}</div>
    </div>

    <div class="p-2.5 rounded-xl bg-white border-2 border-amber-200 space-y-1">
      <div class="font-black text-xs text-amber-950">1. 🎓 Truyền Nghề (Prestige)</div>
      <div class="text-xs text-amber-900">Đời truyền nghề hiện tại: <b>Đời thứ ${prestigeGen + 1}</b> • Điều kiện mở: <b>Cấp 60</b> (hiện Cấp ${lvl}).</div>
    </div>

    <div class="p-2.5 rounded-xl bg-white border-2 border-amber-200 space-y-1">
      <div class="font-black text-xs text-amber-950">2. 🏦 Điểm Tín Dụng & Vay Ngân Hàng</div>
      <div class="text-xs text-amber-900">Điểm tín dụng: <b>${credit}/850</b> • Dư nợ hiện tại: <b>${formatVND(debt)}</b> (mở gói vay từ Cấp 20 ở mục Thu Chi).</div>
    </div>

    <div class="p-2.5 rounded-xl bg-white border-2 border-amber-200 space-y-1">
      <div class="font-black text-xs text-amber-950">3. 💎 Sổ Tiết Kiệm (+1,5%/đêm)</div>
      <div class="text-xs text-amber-900">Số dư tiết kiệm: <b>${formatVND(savings)}</b> • Lãi dự kiến đêm nay: <b>+${formatVND(nightlyInterest)}</b>.</div>
    </div>

    <div class="p-2.5 rounded-xl bg-white border-2 border-amber-200 space-y-1.5">
      <div class="font-black text-xs text-amber-950">4. 🧑‍🍳 Tinh Thần Từng Nhân Viên</div>
      ${staffHtml}
    </div>

    <div class="p-2.5 rounded-xl bg-white border-2 border-amber-200 space-y-1">
      <div class="font-black text-xs text-amber-950">5. 📊 Thị Phần Khu Phố & Công Thức Điểm Sao</div>
      <div class="text-xs text-amber-900">Thị phần khu phố: <b>${share}%</b> (tỷ lệ khách trong khu chọn quán bạn thay vì 3 quán đối thủ).</div>
      <div class="text-xs text-amber-800">⭐ Điểm Sao hiện tại: <b>${rating}⭐</b> — Khởi điểm <b>4,3⭐</b> lúc 0 đánh giá; mỗi đánh giá 5⭐ cộng dần điểm hướng về 5,0⭐.</div>
    </div>
  `;
  modal.classList.remove("hidden");
  if (typeof playSFX === "function") playSFX("snip");
}

function closeShopProfileModal() {
  const modal = document.getElementById("modal-shop-profile");
  if (modal) modal.classList.add("hidden");
}

// G3c: Bảng kê tiền chi tiết sau mỗi bịch bán xong
function showLastSaleReceiptV18(dishPrice, tipAmt, appFee, netEarned) {
  const el = document.getElementById("v18-last-sale-receipt");
  if (!el) return;
  el.classList.remove("hidden");
  el.innerHTML = `🧾 <b>Bảng kê đơn vừa bán:</b> Giá món ${formatVND(dishPrice)} + Tip ${formatVND(tipAmt)} − Phí sàn ${formatVND(appFee)} = <b class="text-emerald-800">+${formatVND(netEarned)}</b>`;
}

// G5a: Thẻ to khách gọi thêm giữa chừng
function showMidOrderAddonCardV18(text) {
  const el = document.getElementById("v18-mid-order-card");
  if (!el) return;
  if (!text) {
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  el.innerHTML = `<div class="v18-mid-order-card text-xs font-black text-orange-950">⚡ KHÁCH VỪA GỌI THÊM GIỮA CHỪNG: ${text}</div>`;
}

// G3a / G3b / G5b: Cập nhật nhãn nút Ớt (#spice-bottle-btn), cảnh báo B3
function syncV18StreetLabels() {
  const spiceBtn = document.getElementById("spice-bottle-btn");
  if (spiceBtn && typeof bowl !== "undefined") {
    const sp = Number(bowl.spice || 0);
    const lblEl = document.getElementById("spice-bottle-label");
    const targetTxt = sp === 0 ? "🌶️ Ớt (0/2)" : (sp === 1 ? "🌶️ Cay vừa (1/2)" : "🌶️🌶️ Siêu cay (2/2)");
    if (lblEl) {
      if (!lblEl.textContent.includes(`(${sp}/2)`)) {
        lblEl.textContent = targetTxt;
      }
    } else if (!spiceBtn.textContent.includes(`(${sp}/2)`)) {
      spiceBtn.textContent = targetTxt;
    }
  }
  const b3Warn = document.getElementById("v18-b3-lock-warning");
  if (b3Warn && typeof bowl !== "undefined") {
    b3Warn.classList.toggle("hidden", Boolean(bowl.step3Done));
  }
}

// G7: Tự động gắn loading="lazy" cho mọi ảnh sprite
function applyLazyLoadingToImagesV18() {
  document.querySelectorAll("img").forEach(img => {
    if (!img.getAttribute("loading")) img.setAttribute("loading", "lazy");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  applyLazyLoadingToImagesV18();
  const obs = new MutationObserver(() => {
    applyLazyLoadingToImagesV18();
    syncV18StreetLabels();
  });
  obs.observe(document.body, { childList: true, subtree: true });
});

// G2: Chuyển hướng các hàm mở modal cũ sang màn Hành Trình chung (tránh lỗi null sau khi xóa 3 modal trùng)
window.addEventListener("DOMContentLoaded", () => {
  window.openStoryModal = function() { openJourneyModal("story"); };
  window.openAchievementsModal = function() { openJourneyModal("achievements"); };
  window.showNextLevelUpModal = function() {
    if (typeof pendingLevelUpQueue !== "undefined" && pendingLevelUpQueue.length > 0) {
      const next = pendingLevelUpQueue.shift();
      if (typeof showToast === "function") showToast(`🎉 Thăng cấp thành công: Đạt Cấp ${next?.level || state.level}!`);
    }
  };
});
