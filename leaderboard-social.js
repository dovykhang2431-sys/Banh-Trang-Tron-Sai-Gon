/**
 * ================= BẢNG XẾP HẠNG ĐẾ CHẾ SÀI GÒN V2.0, SỔ TAY MỐI RUỘT & MXH TÓP TÓP =================
 * - 4 Chế độ xếp hạng: Định Giá Đế Chế (Net Worth), Cấp Độ & Sản Lượng, Danh Tiếng & Chuỗi, Phòng Thách Đấu Ca (PvP)
 * - Ghim Thứ hạng của Quán bạn (Sticky My Rank Card), Tìm kiếm quán & Xem Hồ Sơ Chi Tiết Đối Thủ
 */

let currentLeaderboardSortMode = "networth"; // 'networth' | 'level' | 'rating' | 'pvp'
let currentLeaderboardSearchQuery = "";

function switchLeaderboardSortMode(mode) {
  currentLeaderboardSortMode = mode;
  playSFX("snip");
  ["networth", "level", "rating", "pvp"].forEach(m => {
    const btn = document.getElementById(`lb-filter-${m}`);
    if (btn) {
      btn.className = m === mode
        ? "soft-btn lb-filter-btn lb-filter-active py-1.5 px-1 rounded-lg font-black text-[10px] border border-orange-800 shadow"
        : "soft-btn lb-filter-btn py-1.5 px-1 rounded-lg font-black text-[10px] bg-white text-amber-950 border border-amber-300";
    }
  });
  const pvpBox = document.getElementById("lb-pvp-room-bar");
  if (pvpBox) pvpBox.classList.toggle("hidden", mode !== "pvp");
  if (mode === "pvp") {
    fetchPvpRoomLeaderboard(state.pvpRoomCode || "SAIGON01");
  } else {
    renderLeaderboardTab();
  }
}

function handleLeaderboardSearchInput(val) {
  currentLeaderboardSearchQuery = String(val || "").trim().toLowerCase();
  renderLeaderboardTab();
}

function openLeaderboardFromAnywhere() {
  playSFX("snip");
  if (state.isStreetSelling) {
    // Nếu đang ở màn hình bán hàng ngoài phố, mở Pop-up xem nhanh Bảng Xếp Hạng hoặc chuyển tab
    openRivalProfileModal(state.shopKey || sanitizeShopKey(state.shopName), true);
    return;
  }
  switchPrepSubTab("leaderboard");
}

function getMergedLeaderboardEntries() {
  const mergedMap = new Map();
  if (cloudLeaderboardCache.length === 0) {
    const vault = getCombinedShopsVault();
    Object.values(vault).forEach(raw => {
      if (!raw) return;
      const fs = raw.fullState || raw;
      const sKey = sanitizeShopKey(raw.shopKey || fs.shopName || "");
      if (!sKey || sKey.startsWith("npc_")) return;
      mergedMap.set(sKey, {
        shopKey: sKey,
        shopName: fs.shopName || sKey,
        avatar: fs.avatar || "av_ditu",
        money: Number(fs.money || 0),
        netWorth: computeShopNetWorth(fs),
        shopScale: Number(fs.shopScale || 0),
        decorCount: Array.isArray(fs.ownedDecors) ? fs.ownedDecors.length : Number(fs.decorCount || 0),
        rating: Number(fs.rating || 4.8),
        level: Number(fs.level || 1),
        totalSold: Number(fs.totalSold || 0),
        day: Number(fs.day || 1),
        creditScore: Number(fs.creditScore || 520),
        prestigeGen: Number(fs.prestigeGen || 0),
        marketSharePct: Number(fs.marketSharePct || 28)
      });
    });
  } else {
    cloudLeaderboardCache.forEach(i => {
      if (i && i.shopKey && !String(i.shopKey).startsWith("npc_")) {
        mergedMap.set(i.shopKey, i);
      }
    });
  }

  if (state.shopName && isStateLegitimate(state)) {
    const myK = state.shopKey || sanitizeShopKey(state.shopName);
    mergedMap.set(myK, {
      shopKey: myK,
      shopName: state.shopName,
      avatar: state.avatar,
      money: Number(state.money || 0),
      netWorth: computeShopNetWorth(state),
      shopScale: Number(state.shopScale || 0),
      decorCount: Array.isArray(state.ownedDecors) ? state.ownedDecors.length : 0,
      rating: Number(state.rating || 5.0),
      level: Number(state.level || 1),
      totalSold: Number(state.totalSold || 0),
      day: Number(state.day || 1),
      creditScore: Number(state.creditScore || 520),
      prestigeGen: Number(state.prestigeGen || 0),
      marketSharePct: Number(state.marketSharePct || 28)
    });
  }

  return Array.from(mergedMap.values());
}

function renderLeaderboardTab() {
  const container = document.getElementById("leaderboard-container");
  const myRankCard = document.getElementById("leaderboard-my-rank-card");
  const countBadge = document.getElementById("lb-total-shops-count");
  if (!container) return;

  updateFirebaseStatusBadgesUI();

  // Chế độ 4: Phòng Thách Đấu Ca (PvP)
  if (currentLeaderboardSortMode === "pvp") {
    const room = state.pvpRoomCode || "SAIGON01";
    const roomInp = document.getElementById("pvp-room-code-input");
    if (roomInp && document.activeElement !== roomInp) roomInp.value = room;

    const pvpMap = new Map();
    pvpRoomLeaderboardCache.forEach(p => {
      if (p && p.shopKey) pvpMap.set(p.shopKey, p);
    });
    const myK = state.shopKey || sanitizeShopKey(state.shopName || "quan_moi");
    if (state.shopName) {
      pvpMap.set(myK, {
        shopKey: myK,
        shopName: state.shopName,
        avatar: state.avatar,
        level: state.level || 1,
        rating: state.rating || 5.0,
        todayRevenue: state.todayRevenue || 0,
        todaySold: state.todaySold || 0,
        netWorth: computeShopNetWorth(state)
      });
    }
    const pvpArr = Array.from(pvpMap.values()).sort((a, b) => (b.todayRevenue || 0) - (a.todayRevenue || 0) || (b.todaySold || 0) - (a.todaySold || 0));
    if (countBadge) countBadge.textContent = `${pvpArr.length} quán trong phòng [${room}]`;
    if (myRankCard) {
      const myIdx = pvpArr.findIndex(x => x.shopKey === myK);
      myRankCard.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div>
            <div class="text-[9.5px] font-black uppercase text-amber-900">⚔️ Thứ Hạng Phòng Thách Đấu [${escapeHtml(room)}]</div>
            <div class="font-black text-xs text-amber-950">Quán bạn: Hạng #${myIdx >= 0 ? myIdx + 1 : 1} • Doanh thu ca: <span class="text-emerald-800">${formatVND(state.todayRevenue || 0)} (${state.todaySold || 0} bịch)</span></div>
          </div>
          <button type="button" onclick="joinOrSyncPvpRoom()" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px] shrink-0">⚡ Đồng Bộ Ca</button>
        </div>
      `;
    }
    const medals = ["🥇", "🥈", "🥉"];
    container.innerHTML = pvpArr.map((item, idx) => {
      const isMe = item.shopKey === myK;
      return `
        <div onclick="openRivalProfileModal('${escapeHtml(item.shopKey)}')" class="cursor-pointer p-2 rounded-2xl border-2 flex items-center justify-between gap-1.5 ${isMe ? 'bg-amber-100 border-orange-500 shadow-md' : 'bg-white border-amber-200 hover:bg-amber-50'}">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="text-sm font-black shrink-0 w-6 text-center">${idx < 3 ? medals[idx] : `#${idx + 1}`}</span>
            <div class="w-9 h-9 rounded-xl bg-amber-50 overflow-hidden flex items-center justify-center shrink-0 border border-amber-400">${renderAvatarContent(item.avatar || 'av_ditu', "w-full h-full object-cover")}</div>
            <div class="min-w-0 flex-1 leading-tight">
              <div class="font-black text-amber-950 text-xs truncate">${escapeHtml(item.shopName)} ${isMe ? '<span class="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[8px]">Bạn</span>' : ''}</div>
              <div class="text-[10px] font-bold text-amber-800 mt-0.5">Cấp ${item.level || 1} • Bán hôm nay: <b>${item.todaySold || 0} bịch</b></div>
            </div>
          </div>
          <div class="text-right shrink-0 ml-1 leading-tight">
            <div class="font-black text-rose-700 text-xs">🔥 ${formatShortK(item.todayRevenue || 0)}</div>
            <div class="text-[9px] font-bold text-amber-700">Định giá: ${formatShortK(item.netWorth || 0)}</div>
          </div>
        </div>
      `;
    }).join("") || `<div class="text-center py-4 text-amber-800">Chưa có đối thủ trong phòng [${escapeHtml(room)}]. Bấm Đồng Bộ Ca để lên bảng!</div>`;
    return;
  }

  // 3 Chế độ Bảng Xếp Hạng Toàn Server
  const allEntries = getMergedLeaderboardEntries();

  allEntries.sort((a, b) => {
    if (currentLeaderboardSortMode === "level") {
      return (b.level - a.level) || ((b.totalSold || 0) - (a.totalSold || 0)) || ((b.netWorth || b.money) - (a.netWorth || a.money));
    }
    if (currentLeaderboardSortMode === "rating") {
      const scoreA = (a.rating || 4.5) * 100 + (a.shopScale || 0) * 25 + (a.decorCount || 0) * 3;
      const scoreB = (b.rating || 4.5) * 100 + (b.shopScale || 0) * 25 + (b.decorCount || 0) * 3;
      return (scoreB - scoreA) || ((b.netWorth || b.money) - (a.netWorth || a.money));
    }
    // Mặc định: 'networth' (Tổng Định Giá Đế Chế)
    return ((b.netWorth || b.money || 0) - (a.netWorth || a.money || 0)) || ((b.totalSold || 0) - (a.totalSold || 0));
  });

  // Gán thứ hạng gốc trước khi lọc tìm kiếm
  allEntries.forEach((item, index) => {
    item._globalRank = index + 1;
  });

  if (countBadge) {
    countBadge.textContent = `${allEntries.length} quán`;
  }

  const myKey = state.shopKey || sanitizeShopKey(state.shopName || "");
  const myEntry = allEntries.find(x => x.shopKey === myKey);

  if (myRankCard) {
    if (myEntry) {
      const aboveEntry = myEntry._globalRank > 1 ? allEntries[myEntry._globalRank - 2] : null;
      const diffNw = aboveEntry ? Math.max(0, (aboveEntry.netWorth || aboveEntry.money || 0) - (myEntry.netWorth || myEntry.money || 0)) : 0;
      const nextGoalTxt = aboveEntry
        ? `Cần thêm <b>+${formatShortK(diffNw)}</b> định giá để vượt <b>${escapeHtml(aboveEntry.shopName)} (#${aboveEntry._globalRank})</b>`
        : `👑 Quán của bạn đang giữ ngôi vị <b>TOP 1 ĐẾ CHẾ SÀI GÒN</b>!`;

      myRankCard.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-xl bg-amber-950 text-yellow-300 font-black text-xs flex flex-col items-center justify-center shrink-0 border-2 border-yellow-400 shadow">
              <span class="text-[8px] uppercase text-amber-200 leading-none">Hạng</span>
              <span class="text-sm leading-tight">#${myEntry._globalRank}</span>
            </div>
            <div class="min-w-0 flex-1 leading-tight">
              <div class="font-black text-amber-950 text-xs truncate">${escapeHtml(myEntry.shopName)} <span class="text-[10px] font-bold text-emerald-800">• Cấp ${myEntry.level} • ${(myEntry.rating || 5.0).toFixed(1)}⭐</span></div>
              <div class="text-[9.5px] font-semibold text-amber-900 mt-0.5 leading-snug">${nextGoalTxt}</div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="font-black text-emerald-800 text-xs">💎 ${formatShortK(myEntry.netWorth || myEntry.money)}</div>
            <div class="text-[9px] font-bold text-amber-800">Đã bán: ${myEntry.totalSold || 0}p</div>
          </div>
        </div>
      `;
    } else {
      myRankCard.innerHTML = `<div class="text-center text-[11px] font-bold text-amber-900">Hãy đăng nhập quán để ghi danh lên Bảng Xếp Hạng Đế Chế Sài Gòn!</div>`;
    }
  }

  const filtered = currentLeaderboardSearchQuery
    ? allEntries.filter(item =>
        String(item.shopName || "").toLowerCase().includes(currentLeaderboardSearchQuery) ||
        String(item.shopKey || "").toLowerCase().includes(currentLeaderboardSearchQuery) ||
        `#${item._globalRank}` === currentLeaderboardSearchQuery
      )
    : allEntries;

  const medals = ["🥇", "🥈", "🥉"];
  container.innerHTML = filtered.map((item) => {
    const rank = item._globalRank;
    const nw = item.netWorth || item.money || 0;
    const sc = Math.min(6, Math.max(0, Number(item.shopScale || 0)));
    const dc = Number(item.decorCount || 0);
    const scBadge = sc > 0 ? `<span class="px-1.5 py-0 rounded bg-orange-100 text-orange-900 border border-orange-300 text-[8.5px] font-black">${SHOP_SCALE_TIERS[sc].icon} B${sc}</span>` : "";
    const dcBadge = dc > 0 ? `<span class="px-1.5 py-0 rounded ${dc >= 12 ? 'bg-yellow-200 text-amber-950 border-amber-500' : 'bg-pink-100 text-rose-900 border-rose-300'} border text-[8.5px] font-black">🎨 ${dc}/24</span>` : "";
    const isMe = item.shopKey === myKey;
    const cardBorder = isMe
      ? "bg-amber-100 border-orange-500 shadow-md"
      : rank <= 3
        ? "bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-yellow-500 shadow-sm"
        : dc >= 6
          ? "bg-emerald-50/40 border-emerald-400"
          : "bg-white border-amber-200";

    return `
      <div onclick="openRivalProfileModal('${escapeHtml(item.shopKey)}')" title="Chạm để xem chi tiết hồ sơ quán" class="cursor-pointer hover:scale-[1.01] transition-transform p-2 rounded-2xl border-2 flex items-center justify-between gap-1.5 ${cardBorder}">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <span class="text-sm font-black shrink-0 w-7 text-center">${rank <= 3 ? medals[rank - 1] : `#${rank}`}</span>
          <div class="w-9 h-9 rounded-xl bg-amber-50 overflow-hidden flex items-center justify-center shrink-0 border border-amber-400 text-base">${renderAvatarContent(item.avatar || 'av_ditu', "w-full h-full object-cover")}</div>
          <div class="min-w-0 flex-1 leading-tight">
            <div class="flex items-center gap-1 flex-wrap">
              <span class="font-black text-amber-950 leading-tight break-words">${escapeHtml(item.shopName)}</span>
              ${isMe ? '<span class="px-1.5 py-0 rounded bg-orange-600 text-white font-black text-[8px]">Quán Bạn</span>' : ''}
              ${scBadge}
              ${dcBadge}
            </div>
            <div class="text-[10px] font-bold text-amber-800 mt-0.5">Cấp ${item.level} • ${(item.rating || 5.0).toFixed(1)}⭐ • Bán: ${(item.totalSold || 0).toLocaleString("vi-VN")} bịch • N.${item.day || 1}</div>
          </div>
        </div>
        <div class="text-right shrink-0 ml-1 leading-tight">
          <div class="font-black text-emerald-700 text-xs">💎 ${formatShortK(nw)}</div>
          <div class="text-[9px] font-bold text-amber-700">Tiền: ${formatShortK(item.money)}</div>
        </div>
      </div>
    `;
  }).join("") || `<div class="text-center py-4 text-amber-800 font-bold">Không tìm thấy quán nào khớp từ khóa "${escapeHtml(currentLeaderboardSearchQuery)}".</div>`;
}

function openRivalProfileModal(shopKey, showFullLeaderboardInModal = false) {
  playSFX("snip");
  const allEntries = getMergedLeaderboardEntries();
  allEntries.sort((a, b) => ((b.netWorth || b.money || 0) - (a.netWorth || a.money || 0)) || ((b.totalSold || 0) - (a.totalSold || 0)));
  allEntries.forEach((it, idx) => { it._globalRank = idx + 1; });

  const target = allEntries.find(x => x.shopKey === shopKey) || allEntries[0];
  if (!target) return;

  const modal = document.getElementById("modal-rival-profile");
  const body = document.getElementById("rival-profile-modal-body");
  if (!modal || !body) return;

  const sc = Math.min(6, Math.max(0, Number(target.shopScale || 0)));
  const scaleObj = SHOP_SCALE_TIERS[sc] || SHOP_SCALE_TIERS[0];
  const lvlObj = LEVEL_DATA.find(l => l.level === Number(target.level || 1)) || LEVEL_DATA[0];
  const nw = target.netWorth || target.money || 0;
  const assetValue = Math.max(0, nw - Number(target.money || 0));

  let top10QuickListHtml = "";
  if (showFullLeaderboardInModal) {
    top10QuickListHtml = `
      <div class="pt-2 border-t border-amber-200 space-y-1">
        <div class="font-black text-xs text-amber-950">🏆 Top 10 Đế Chế Dẫn Đầu Server:</div>
        <div class="space-y-1 max-h-44 overflow-y-auto pr-1">
          ${allEntries.slice(0, 10).map((it, i) => `
            <div onclick="openRivalProfileModal('${escapeHtml(it.shopKey)}', true)" class="cursor-pointer px-2 py-1 rounded-xl border ${it.shopKey === target.shopKey ? 'bg-amber-100 border-orange-500 font-black' : 'bg-white border-amber-200'} flex items-center justify-between text-[10.5px]">
              <span class="truncate">${i < 3 ? ['🥇','🥈','🥉'][i] : '#'+ (i+1)} ${escapeHtml(it.shopName)} (C.${it.level})</span>
              <span class="font-black text-emerald-700 shrink-0">💎 ${formatShortK(it.netWorth || it.money)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  body.innerHTML = `
    <div class="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 border-2 border-amber-400">
      <div class="w-14 h-14 rounded-2xl bg-white border-2 border-amber-500 overflow-hidden flex items-center justify-center shrink-0 shadow">
        ${renderAvatarContent(target.avatar || "av_ditu", "w-full h-full object-cover")}
      </div>
      <div class="min-w-0 flex-1 leading-snug">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="px-2 py-0.5 rounded-full bg-amber-950 text-yellow-300 font-black text-[10px]">Hạng #${target._globalRank} Server</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px]">Cấp ${target.level || 1}</span>
        </div>
        <div class="font-black text-sm text-amber-950 mt-0.5 break-words">${escapeHtml(target.shopName)}</div>
        <div class="text-[10.5px] font-bold text-amber-800">${escapeHtml(lvlObj.title)} • ${(target.rating || 5.0).toFixed(1)}⭐</div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-1.5 text-[11px]">
      <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-300">
        <div class="text-[9.5px] font-bold text-emerald-800">💎 Tổng Định Giá Đế Chế</div>
        <div class="font-black text-sm text-emerald-950">${formatVND(nw)}</div>
      </div>
      <div class="p-2 rounded-xl bg-amber-50 border border-amber-300">
        <div class="text-[9.5px] font-bold text-amber-800">💵 Tiền Mặt Trong Két</div>
        <div class="font-black text-sm text-amber-950">${formatVND(target.money || 0)}</div>
      </div>
      <div class="p-2 rounded-xl bg-orange-50 border border-orange-300">
        <div class="text-[9.5px] font-bold text-orange-800">🏢 Quy Mô Mặt Bằng</div>
        <div class="font-black text-xs text-orange-950">${scaleObj.icon} ${scaleObj.badge} (Bậc ${sc}/6)</div>
      </div>
      <div class="p-2 rounded-xl bg-blue-50 border border-blue-300">
        <div class="text-[9.5px] font-bold text-blue-800">🛍️ Sản Lượng Đã Bán</div>
        <div class="font-black text-xs text-blue-950">${(target.totalSold || 0).toLocaleString("vi-VN")} bịch (Ngày ${target.day || 1})</div>
      </div>
    </div>

    <div class="p-2.5 rounded-xl bg-white border border-amber-300 space-y-1 text-[10.5px]">
      <div class="flex justify-between"><span>🏗️ Giá trị Mặt bằng, Xưởng & Chi nhánh:</span><b class="text-emerald-700">${formatVND(assetValue)}</b></div>
      <div class="flex justify-between"><span>🎨 Bộ sưu tập Trang trí Quán:</span><b class="text-rose-700">${target.decorCount || 0}/24 mảnh</b></div>
      <div class="flex justify-between"><span>🏦 Điểm Uy Tín Ngân Hàng Sài Gòn:</span><b class="text-blue-800">${target.creditScore || 520}/850 điểm</b></div>
      <div class="flex justify-between"><span>👑 Truyền Nghề Học Viện Dì Tư:</span><b class="text-amber-900">Đời thứ ${(target.prestigeGen || 0) + 1}</b></div>
    </div>
    ${top10QuickListHtml}
  `;
  modal.classList.remove("hidden");
}

function closeRivalProfileModal() {
  const modal = document.getElementById("modal-rival-profile");
  if (modal) modal.classList.add("hidden");
}

    // ================= TÍNH NĂNG MỚI 3: SỔ TAY KHÁCH QUEN MỐI RUỘT (CUSTOMER CODEX) =================
    function updateCodexNotificationBadges() {
      const counts = state.customerLoyaltyCounts || {};
      const claimed = state.claimedLoyaltyRewards || [];
      const hasUnclaimed = CUSTOMERS.some(c => (counts[c.id] || 0) >= 3 && !claimed.includes(c.id));
      const dot1 = document.getElementById("header-codex-dot");
      const badge2 = document.getElementById("menu-codex-badge");
      if (dot1) dot1.classList.toggle("hidden", !hasUnclaimed);
      if (badge2) badge2.classList.toggle("hidden", !hasUnclaimed);
    }

    function openCustomerCodexModal() {
      const modal = document.getElementById("modal-codex");
      const imgEl = document.getElementById("codex-header-img");
      if (!modal) return;
      if (imgEl) imgEl.src = CASUAL_2D_ASSETS.feat_codex;
      renderCustomerCodexList();
      playSFX("snip");
      modal.classList.remove("hidden");
    }

    function closeCustomerCodexModal() {
      const modal = document.getElementById("modal-codex");
      if (modal) modal.classList.add("hidden");
    }

    function claimCustomerLoyaltyReward(custId) {
      if (!state.customerLoyaltyCounts) state.customerLoyaltyCounts = {};
      if (!Array.isArray(state.claimedLoyaltyRewards)) state.claimedLoyaltyRewards = [];
      if ((state.customerLoyaltyCounts[custId] || 0) < 3 || state.claimedLoyaltyRewards.includes(custId)) return;

      const cObj = CUSTOMERS.find(x => x.id === custId);
      state.claimedLoyaltyRewards.push(custId);
      state.money += 25000;
      addXP(35);
      playSFX("cash");
      renderCustomerCodexList();
      updateCodexNotificationBadges();
      updateAllUI();
      saveGameEverywhere();
      showToast(`💛 Kết thân Mối Ruột ${cObj ? cObj.name : ''}: Nhận +25.000đ & +35 XP!`);
    }

    function renderCustomerCodexList() {
      const listEl = document.getElementById("codex-list-container");
      const sumEl = document.getElementById("codex-summary-banner");
      if (!listEl) return;

      const counts = state.customerLoyaltyCounts || {};
      const claimed = state.claimedLoyaltyRewards || [];
      const loyalCount = CUSTOMERS.filter(c => (counts[c.id] || 0) >= 3).length;

      if (sumEl) {
        sumEl.innerHTML = `
          <span>💛 Đã kết thân Mối Ruột: <b>${loyalCount}/${CUSTOMERS.length} khách</b></span>
          <span class="text-emerald-800">Đặc quyền: Kiên nhẫn +20% & Mua x2 bịch!</span>
        `;
      }

      listEl.innerHTML = CUSTOMERS.map(c => {
        const cnt = Math.min(3, counts[c.id] || 0);
        const totalServed = counts[c.id] || 0;
        const isLoyal = totalServed >= 3;
        const isClaimed = claimed.includes(c.id);
        const pct = Math.round((cnt / 3) * 100);

        return `
          <div class="p-2.5 rounded-2xl border-2 ${isLoyal ? 'bg-yellow-50/95 border-amber-500 shadow-sm' : 'bg-white border-amber-200'} flex items-center justify-between gap-2.5">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <div class="relative w-12 h-12 rounded-xl overflow-hidden border-2 ${isLoyal ? 'border-amber-500' : 'border-slate-300'} shrink-0 bg-amber-50">
                <img src="${c.portrait}" alt="${escapeHtml(c.name)}" class="w-full h-full object-cover" />
                ${isLoyal ? `<span class="absolute -bottom-0.5 right-0 px-1 bg-yellow-400 text-amber-950 font-black text-[8px] rounded-tl">💛VIP</span>` : ''}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="font-black text-amber-950 text-xs">${escapeHtml(c.name)}</span>
                  <span class="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[9px]">${escapeHtml(c.job)}</span>
                  ${c.vip ? `<span class="px-1 py-0.5 rounded bg-red-600 text-white font-black text-[8px]">VIP</span>` : ''}
                  ${c.picky ? `<span class="px-1 py-0.5 rounded bg-purple-700 text-yellow-200 font-black text-[8px]">Khó tính</span>` : ''}
                </div>
                <div class="w-full h-2 bg-amber-100 rounded-full overflow-hidden border border-amber-300 mt-1">
                  <div class="h-full bg-gradient-to-r from-amber-500 to-emerald-500" style="width: ${pct}%"></div>
                </div>
                <div class="text-[10px] font-bold text-amber-800 mt-0.5">
                  Đạt 5⭐: <b>${totalServed} lần</b> ${isLoyal ? '• <span class="text-emerald-700 font-black">Đã thành Mối Ruột (+20% kiên nhẫn)</span>' : `(Cần thêm ${3 - cnt} lần 5⭐)`}
                </div>
              </div>
            </div>
            <div class="shrink-0">
              ${isClaimed
                ? `<span class="px-2 py-1 rounded-xl bg-emerald-600 text-white font-black text-[10px]">✅ Đã nhận</span>`
                : isLoyal
                  ? `<button onclick="claimCustomerLoyaltyReward('${c.id}')" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px] animate-bounce">🎁 +25.000đ</button>`
                  : `<span class="px-2 py-1 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px]">${cnt}/3 ⭐</span>`
              }
            </div>
          </div>
        `;
      }).join("");
    }

    // ================= 20. MXH, SỰ KIỆN, THÀNH TỰU & NÂNG CẤP =================
    function findCustomerForReview(rv) {
      if (!rv) return null;
      if (rv.custId) {
        const byId = CUSTOMERS.find(c => c.id === rv.custId);
        if (byId) return byId;
      }
      if (rv.custName) {
        const norm = String(rv.custName).trim().toLowerCase();
        const byName = CUSTOMERS.find(c => String(c.name).trim().toLowerCase() === norm);
        if (byName) return byName;
      }
      return null;
    }

    function generateCharacterReviewComment(custObj, stars = 5, dishLabel = "Bánh Tráng Trộn", deductions = []) {
      const cName = (custObj && custObj.name) || "Khách quen";
      const cId = (custObj && custObj.id) || "";
      const cJob = (custObj && custObj.job) || "";
      const dish = dishLabel || "Bánh Tráng Dì Tư";
      const reason = (Array.isArray(deductions) && deductions.length > 0) ? deductions.join(", ") : "đợi hơi lâu chút xíu";

      if (stars >= 5) {
        if (cId.includes("tiktok") || cId === "codao" || cId === "phuonglinh" || cId === "vlogger_amthuc") {
          return `“Quay cận cảnh phần ${dish} sốt sánh quyện lên xu hướng luôn! Hương vị đỉnh của chóp, chấm 5 sao kịch trần nha Dì Tư! 🔥📹”`;
        }
        if (cId === "photographer" || cId === "sv_kientruc" || cId === "dj_catoi") {
          return `“Màu sắc phần ${dish} vừa bắt mắt vừa thơm nức mũi, đứng góc phố chụp tấm hình xong ăn liền ngon xuất sắc! 📸✨”`;
        }
        if (cId.includes("ship_") || (custObj && custObj.isShipper)) {
          return `“Dì Tư làm đơn ${dish} siêu lẹ, đóng túi sạch sẽ thơm phức, giao tới nơi khách bo thêm tiền luôn! 🛵💨”`;
        }
        if (cId === "david_tay" || cId === "khach_taybalo" || cId === "dukhach_han" || cId === "chu_vietkieu") {
          return `“Best Saigon street food! Phần ${dish} đậm đà đúng điệu Sài Gòn, nhất định sẽ rủ thêm bạn bè ghé xe Dì Tư! 🌍👍”`;
        }
        if (cId === "bena" || cId === "nusinh_aodai" || cId === "namsinh_chuyen" || cId === "capdoi_hocthem" || cJob.includes("Học sinh") || cJob.includes("Sinh viên")) {
          return `“Tan học ghé xe Dì Tư ăn ${dish} là hết sảy! Sốt thấm đều, hành phi giòn rụm ăn hoài không ngán luôn ạ! 🥰🥙”`;
        }
        if (custObj && custObj.picky) {
          return `“Mình ăn uống rất kỹ tính mà phải khen phần ${dish} của Dì Tư: nguyên liệu tươi mới, nêm nếm chuẩn vị 5 sao!”`;
        }
        return `“Món ${dish} thấm vị đậm đà, nguyên liệu tươi ngon và phục vụ cực kỳ chu đáo chuẩn 5 sao!”`;
      }

      if (stars === 4) {
        return `“Món ${dish} vị rất cuốn nhưng hôm nay ${reason} nên ${cName} chấm 4 sao khích lệ quán nha!”`;
      }
      return `“Nay ghé mua ${dish} mà quán làm ${reason}, mong Dì Tư điều chỉnh lại để giữ phong độ nghen!”`;
    }

    function normalizeAndRepairReviews(reviewsArr) {
      if (!Array.isArray(reviewsArr)) return [];
      return reviewsArr.map((rv, idx) => {
        const custObj = findCustomerForReview(rv) || CUSTOMERS[idx % CUSTOMERS.length];
        const stars = Math.max(1, Math.min(5, Number(rv.stars || 5)));
        const dishName = rv.dishName || "1x Trộn Thập Cẩm";
        let rawComment = String(rv.comment || rv.text || "").trim();
        if (!rawComment || rawComment === "undefined") {
          rawComment = generateCharacterReviewComment(custObj, stars, dishName, []);
        }
        let likesNum = Number(rv.likes);
        if (!Number.isFinite(likesNum) || likesNum <= 0) {
          const seed = (String(rv.id || idx).charCodeAt(0) || 17) + idx * 7;
          likesNum = (custObj && custObj.vip ? 42 : 18) + (seed % 35) + (rv.replied ? 28 : 0);
        }
        return {
          ...rv,
          id: rv.id || ("rev_migrated_" + idx + "_" + Date.now()),
          custId: custObj ? custObj.id : (rv.custId || "bena"),
          custName: (custObj && custObj.name) || rv.custName || "Khách Sài Gòn",
          custJob: (custObj && custObj.job) || rv.custJob || "Thực khách",
          custAvatar: (custObj && custObj.avatar) || rv.custAvatar || "😋",
          custPortrait: (custObj && custObj.portrait) || rv.custPortrait || CASUAL_2D_ASSETS.cust_bena,
          vip: Boolean((custObj && custObj.vip) || rv.vip),
          picky: Boolean((custObj && custObj.picky) || rv.picky),
          dishName,
          stars,
          likes: likesNum,
          comment: rawComment,
          replied: Boolean(rv.replied),
          replyText: rv.replyText || ""
        };
      });
    }

    function openReviewsModal() {
      state.reviews = normalizeAndRepairReviews(state.reviews || []);
      renderReviewsModalList();
      document.getElementById("modal-reviews").classList.remove("hidden");
    }
    function closeReviewsModal() { document.getElementById("modal-reviews").classList.add("hidden"); }

    function renderReviewsModalList() {
      state.reviews = normalizeAndRepairReviews(state.reviews || []);
      const r = typeof state.rating === "number" ? state.rating : 5.0;
      const tier = getRatingTierInfo(r);
      document.getElementById("social-modal-rating").textContent = `${r.toFixed(1)} ⭐`;
      const tierEl = document.getElementById("social-modal-tier");
      if (tierEl) {
        tierEl.textContent = tier.full;
        tierEl.className = `px-2 py-0.5 rounded-full text-[10px] font-black ${tier.color}`;
      }
      const impactEl = document.getElementById("social-rating-impact-desc");
      if (impactEl && tier.impactDesc) {
        impactEl.textContent = tier.impactDesc;
      }

      const vPct = Math.max(0, Math.min(100, Math.round(state.viralPct || 0)));
      document.getElementById("social-viral-pct").textContent = `${vPct}%`;
      document.getElementById("social-viral-bar").style.width = `${vPct}%`;

      const hintEl = document.getElementById("social-viral-hint");
      if (hintEl) {
        hintEl.textContent = vPct >= 80
          ? (state.isStreetSelling ? "🔥 Đã đủ 80%+! Bấm kích hoạt Bão Đơn ngay!" : "🔥 Đã tích đủ Bão Đơn (Sẽ tự nổ khi Ra Phố)!")
          : "Đạt 80%+ nổ Bão Đơn 45s!";
      }

      const unrepliedPositive = (state.reviews || []).filter(rv => !rv.replied && rv.stars >= 4);
      const replyAllBtn = document.getElementById("btn-reply-all-positive");
      if (replyAllBtn) {
        if (unrepliedPositive.length >= 2) {
          replyAllBtn.classList.remove("hidden");
          replyAllBtn.textContent = `⚡ Thả Tim Nhanh ${unrepliedPositive.length} Đơn Khen (+${(unrepliedPositive.length * 0.02).toFixed(2)}⭐)`;
        } else {
          replyAllBtn.classList.add("hidden");
        }
      }

      const stormBtn = document.getElementById("btn-manual-viral-storm");
      if (stormBtn) {
        if (vPct >= 80) {
          stormBtn.classList.remove("hidden");
          stormBtn.textContent = state.isStreetSelling ? "🔥 Kích Hoạt Bão Đơn 45s Ngay!" : "🔥 Sẵn Sàng Bão Đơn Khi Ra Phố!";
        } else {
          stormBtn.classList.add("hidden");
        }
      }

      document.getElementById("reviews-list-container").innerHTML = (state.reviews || []).map(rv => {
        const custObj = findCustomerForReview(rv);
        const portraitSrc = (custObj && custObj.portrait) || rv.custPortrait || null;
        const jobLabel = (custObj && custObj.job) || rv.custJob || "Thực khách Sài Gòn";
        const isVip = Boolean((custObj && custObj.vip) || rv.vip);
        const isPicky = Boolean((custObj && custObj.picky) || rv.picky);
        const dishBadge = rv.dishName ? `<span class="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[9px]">🥙 ${escapeHtml(rv.dishName)}</span>` : "";

        const actionButtonsHtml = rv.stars >= 4
          ? `
            <div class="grid grid-cols-2 gap-1.5 pt-0.5">
              <button onclick="replySocialReview('friendly','${rv.id}')" class="soft-btn py-1.5 px-2 bg-pink-600 text-white font-black text-[10px] rounded-xl shadow-sm">💖 Thả tim (+0.02⭐ • Tip +3k)</button>
              <button onclick="replySocialReview('funny','${rv.id}')" class="soft-btn py-1.5 px-2 bg-purple-600 text-white font-black text-[10px] rounded-xl shadow-sm">😂 Bắt Trend (+16% Viral)</button>
            </div>
          `
          : `
            <div class="grid grid-cols-2 gap-1.5 pt-0.5">
              <button onclick="replySocialReview('apology','${rv.id}')" class="soft-btn py-1.5 px-2 bg-amber-600 text-white font-black text-[10px] rounded-xl shadow-sm">🙏 Cầu thị xin lỗi (+0.05⭐)</button>
              <button onclick="replySocialReview('voucher','${rv.id}')" class="soft-btn py-1.5 px-2 bg-emerald-600 text-white font-black text-[10px] rounded-xl shadow-sm">🎁 Đền Voucher -5k (+0.12⭐)</button>
            </div>
          `;

        return `
        <div class="p-2.5 rounded-2xl bg-white border-2 ${rv.stars >= 4 ? 'border-amber-200' : 'border-rose-400'} space-y-1.5 shadow-sm">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-10 h-10 rounded-full overflow-hidden border-2 ${isVip ? 'border-amber-500' : 'border-amber-300'} bg-amber-50 flex items-center justify-center shrink-0 shadow-sm">
                ${portraitSrc ? `<img src="${portraitSrc}" class="w-full h-full object-cover" alt="${escapeHtml(rv.custName)}" />` : `<span class="text-lg">${rv.custAvatar || "😋"}</span>`}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1 flex-wrap">
                  <b class="text-xs text-amber-950">${escapeHtml(rv.custName)}</b>
                  ${isVip ? `<span class="px-1 py-0.5 rounded bg-red-600 text-white font-black text-[8px]">VIP</span>` : ""}
                  ${isPicky ? `<span class="px-1 py-0.5 rounded bg-purple-700 text-yellow-200 font-black text-[8px]">Khó tính</span>` : ""}
                  <span class="text-[10px] text-rose-600 font-extrabold">❤️ ${rv.likes}</span>
                </div>
                <div class="flex items-center gap-1 flex-wrap mt-0.5">
                  <span class="text-[9px] font-bold text-amber-700">${escapeHtml(jobLabel)}</span>
                  ${dishBadge}
                </div>
              </div>
            </div>
            <span class="shrink-0 text-[11px]">${"⭐".repeat(rv.stars)}</span>
          </div>
          <p class="text-amber-950 italic bg-amber-50/90 p-2 rounded-xl border border-amber-200 mobile-safe-text leading-relaxed">${escapeHtml(rv.comment)}</p>
          ${rv.replied ? `<div class="p-2 bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold rounded-xl mobile-safe-text">👩‍🍳 <b>Dì Tư:</b> ${escapeHtml(rv.replyText)}</div>` : actionButtonsHtml}
        </div>
      `}).join("") || `<div class="text-center text-xs py-6 text-amber-800">Chưa có đánh giá nào trên Tóp Tóp Sài Gòn. Hãy đẩy xe ra phố bán những bịch bánh đầu tiên nhé!</div>`;
    }

    function triggerViralStormFromModal() {
      if ((state.viralPct || 0) < 80) return;
      playSFX("cash");
      if (state.isStreetSelling) {
        closeReviewsModal();
        launchViralStormNow();
      } else {
        closeReviewsModal();
        showToast("🔥 Đã nạp sẵn Bão Đơn! Bấm 'Đẩy Xe Ra Phố Bán' để nổ Bão Đơn 45s ngay đầu ca!");
      }
    }

    function replyAllPositiveReviews() {
      state.reviews = normalizeAndRepairReviews(state.reviews || []);
      const targets = (state.reviews || []).filter(rv => !rv.replied && rv.stars >= 4);
      if (targets.length === 0) return;
      const pool = SOCIAL_REPLY_TEMPLATES.friendly;
      let count = 0;
      targets.forEach((rv, i) => {
        rv.replied = true;
        rv.replyText = pool[i % pool.length];
        rv.likes = (Number(rv.likes) || 20) + 28;
        count++;
      });
      adjustRating(count * 0.02);
      adjustViral(count * 7);
      addXP(count * 6);
      state.nextCustomerTipBonus = 3000;
      state.repliedReviewsCount = (state.repliedReviewsCount || 0) + count;
      playSFX("cash");
      renderReviewsModalList();
      updateAllUI();
      saveGameEverywhere();
      showToast(`💖 Đã thả tim nhanh ${count} đánh giá khen (+${(count * 0.02).toFixed(2)}⭐)!`);
    }

    function replySocialReview(style, revId) {
      state.reviews = normalizeAndRepairReviews(state.reviews || []);
      const rv = state.reviews.find(x => x.id === revId); if (!rv || rv.replied) return;
      const pool = SOCIAL_REPLY_TEMPLATES[style] || SOCIAL_REPLY_TEMPLATES.friendly;
      const chosenReply = pool[Math.floor(Math.random() * pool.length)];

      if (style === "voucher") {
        if (state.money < 5000) { showToast("❌ Không đủ 5.000đ tặng Voucher!"); return; }
        state.money -= 5000; adjustRating(0.12); adjustViral(18); addXP(15);
      } else if (style === "funny") {
        adjustRating(0.01); adjustViral(16); addXP(12);
      } else if (style === "apology") {
        adjustRating(0.05); adjustViral(6); addXP(8);
      } else {
        adjustRating(0.02); adjustViral(8); addXP(6);
        state.nextCustomerTipBonus = 3000;
      }

      rv.replied = true; rv.replyText = chosenReply; rv.likes = (Number(rv.likes) || 20) + 28;
      state.repliedReviewsCount = (state.repliedReviewsCount || 0) + 1;
      playSFX("cash"); renderReviewsModalList(); updateAllUI(); saveGameEverywhere();
      showToast("💬 Đã phản hồi khách trên Tóp Tóp!");
    }


