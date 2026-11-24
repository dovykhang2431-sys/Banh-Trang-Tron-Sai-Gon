/**
 * Gameplay Giai Đoạn Chuẩn Bị Sân Nhà: Đi Chợ, Sơ Chế, Thực Đơn, Tiếp Thị, Xây Quán, Sổ Thu Chi & Ngân Hàng
 */
    function renderMenuAndPricingTab() {
      const impactBox = document.getElementById("pricing-customer-impact-box");
      const listEl = document.getElementById("menu-dishes-list");
      const appBtn = document.getElementById("btn-toggle-app-markup");
      const commLbl = document.getElementById("app-comm-rate-label");
      const alertBox = document.getElementById("upgrade-demand-alert");
      if (!impactBox || !listEl) return;

      const commPct = Math.round(getCurrentAppCommissionRate() * 100);
      if (commLbl) commLbl.textContent = `${commPct}%`;
      if (appBtn) {
        appBtn.textContent = state.appPriceMarkup ? "Phụ thu +10%: BẬT" : "Phụ thu: TẮT";
        appBtn.className = state.appPriceMarkup
          ? "soft-btn px-2 py-0.5 rounded-lg font-black text-[9px] bg-blue-600 text-white shadow"
          : "soft-btn px-2 py-0.5 rounded-lg font-black text-[9px] bg-blue-50 border border-blue-400 text-blue-900";
      }

      const unpurchased = getUnpurchasedEligibleDishes(false);
      if (alertBox) {
        if (unpurchased.length > 0) {
          alertBox.classList.remove("hidden");
          alertBox.innerHTML = `🚨 Đủ cấp mở: <b>${unpurchased.map(d => d.name).join(", ")}</b>!`;
        } else {
          alertBox.classList.add("hidden");
        }
      }

      const stratBox = document.getElementById("daily-sales-strategy-box");
      if (stratBox) {
        const curStrat = getActiveSalesStrategyObj();
        const shortLabels = { flyer_tea: "Tờ Rơi", flash_featured: "Món Tủ", office_combo: "Combo", vip_livestream: "Review" };
        const chipsHtml = SALES_STRATEGIES.map(st => {
          const isSelected = state.activeSalesStrategy === st.id;
          const unlocked = state.level >= st.reqLevel;
          return `
            <button type="button" onclick="activateDailySalesStrategy('${st.id}')" class="soft-btn py-1 px-1 rounded-xl border ${isSelected ? 'bg-emerald-600 text-white border-emerald-800 shadow' : unlocked ? 'bg-white text-amber-950 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-300'} flex flex-col items-center justify-center leading-tight">
              <span class="font-black text-[10px] whitespace-nowrap">${st.icon} ${shortLabels[st.id] || st.icon}</span>
              <span class="text-[8.5px] font-bold ${isSelected ? 'text-yellow-200' : unlocked ? 'text-emerald-800' : 'text-slate-500'}">${isSelected ? '✅ Đang bật' : unlocked ? formatShortK(st.cost) : '🔒 C.' + st.reqLevel}</span>
            </button>
          `;
        }).join("");
        stratBox.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="font-black text-[10.5px] text-amber-950">📢 Chiến Lược Quảng Cáo Hôm Nay:</span>
            <span class="text-[9.5px] font-bold ${curStrat ? 'text-emerald-800' : 'text-amber-800'}">${curStrat ? curStrat.shortDesc : 'Chọn 1 gói bên dưới'}</span>
          </div>
          <div class="grid grid-cols-4 gap-1">${chipsHtml}</div>
        `;
      }

      const imp = getPricingCustomerImpact();
      impactBox.className = `px-2.5 py-1.5 rounded-xl border ${imp.colorClass} flex flex-wrap items-center justify-between gap-1`;
      impactBox.innerHTML = `
        <span class="font-black text-[10.5px] leading-snug">${imp.badge}</span>
        <span class="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white/90 border whitespace-nowrap shrink-0">Chịu giá: +${formatShortK(imp.tol)}</span>
      `;

      listEl.innerHTML = Object.values(DISH_MENU).map(d => {
        const unlocked = state.unlockedDishes.includes(d.id);
        const isFeatured = (d.id === state.featuredDishKey);

        if (!unlocked) {
          const canUnlock = state.level >= d.reqLevel;
          return `
            <div class="px-2.5 py-1.5 rounded-xl ${canUnlock ? 'bg-red-50 border-2 border-red-400 shadow-sm' : 'bg-slate-50 border border-slate-200 opacity-75'} flex items-center justify-between gap-2 text-xs">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="shrink-0 ${canUnlock ? '' : 'grayscale'}">${getDishSvgIcon(d.id, "w-9 h-9")}</div>
                <div class="min-w-0 flex-1 leading-tight">
                  <div class="font-black text-amber-950 leading-tight break-words">${d.name}</div>
                  <div class="text-[10px] font-bold text-emerald-800 mt-0.5">Giá gốc: ${formatShortK(d.price)}/bịch</div>
                </div>
              </div>
              <div class="shrink-0">
                ${canUnlock
                  ? `<button onclick="buyDishRecipe('${d.id}')" class="soft-btn btn-game-red px-2.5 py-1.5 rounded-xl font-black text-[10px] animate-bounce">🔓 Mở (${formatShortK(d.unlockCost)})</button>`
                  : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px] whitespace-nowrap">🔒 Cấp ${d.reqLevel}</span>`
                }
              </div>
            </div>
          `;
        }

        const sellPrice = getDishEffectivePrice(d.id);
        const recipeCost = getDishRecipeCost(d.id);
        const grossProfit = sellPrice - recipeCost;
        const over = getDishPerceivedOverprice(d.id);
        const warnBadge = over > 2000
          ? `<span class="text-[8px] font-black px-1.5 py-0 rounded bg-red-100 text-red-700 border border-red-300 whitespace-nowrap">Đắt</span>`
          : over > 0
            ? `<span class="text-[8px] font-black px-1.5 py-0 rounded bg-orange-100 text-orange-800 border border-orange-300 whitespace-nowrap">Hơi cao</span>`
            : "";

        return `
          <div class="px-2.5 py-1.5 rounded-xl bg-amber-50/85 border ${isFeatured ? 'border-rose-400 bg-rose-50/40' : 'border-amber-200'} flex items-center justify-between gap-2 text-xs shadow-sm">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="relative shrink-0">
                ${getDishSvgIcon(d.id, "w-9 h-9")}
                ${isFeatured ? `<span class="absolute -top-1 -left-1 px-1 rounded bg-rose-600 text-white font-black text-[7px]">ĐINH</span>` : ''}
              </div>
              <div class="min-w-0 flex-1 leading-tight">
                <div class="flex items-center gap-1">
                  <span class="font-black text-amber-950 leading-tight break-words">${d.name}</span>
                  ${warnBadge}
                </div>
                <div class="text-[10px] font-bold text-emerald-700 mt-0.5">
                  Lãi: +${formatShortK(grossProfit)}/bịch
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button onclick="adjustDishPrice('${d.id}', -1000)" class="soft-btn w-6 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs shadow">-</button>
              <div class="min-w-[46px] text-center font-black text-xs text-amber-950 bg-white py-1 px-1 rounded-lg border border-amber-400">${formatShortK(sellPrice)}</div>
              <button onclick="adjustDishPrice('${d.id}', 1000)" class="soft-btn w-6 h-7 rounded-lg bg-rose-600 text-white font-black text-xs shadow">+</button>
            </div>
          </div>
        `;
      }).join("");
    }

    // Chi phí và Yêu cầu Cấp độ cho 8 Nâng Cấp Hút Khách & Giữ Chân (5 Cấp Gọn Gàng)

    function handleTopLeftButtonClick() {
      if (state.isStreetSelling) endDaySummary();
      else openDiTuTutorialModal(0);
    }


    // ================= 11. CẬP NHẬT TOÀN BỘ GIAO DIỆN V11 =================
    function _baseUpdateAllUI() {
      ensureValidStockBatches();
      const r = typeof state.rating === "number" ? state.rating : 5.0;
      const unrepliedCount = (state.reviews || []).filter(rv => !rv.replied).length;
      const h = Math.floor(state.clockMinutes / 60), m = state.clockMinutes % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const sched = getTodayScheduleInfo(state.day);
      const actualCap = getActualCartBagDemandCap(state.day);
      const curChap = getCurrentChapterObj();

      const modeBtn = document.getElementById("topbar-mode-btn");
      if (modeBtn) {
        modeBtn.classList.toggle("hidden", !state.isStreetSelling);
      }

      document.getElementById("topbar-day-label").textContent = `N.${state.day} • ${sched.dowName}`;
      document.getElementById("topbar-sub-time").textContent = state.isStreetSelling ? `${timeStr}` : `Chuẩn bị`;
      document.getElementById("topbar-money").textContent = formatShortK(state.money);

      const fullStars = Math.round(r);
      document.getElementById("topbar-stars-row").textContent = "★".repeat(fullStars) + "☆".repeat(Math.max(0, 5 - fullStars));
      document.getElementById("topbar-rating-num").textContent = r.toFixed(1).replace(".", ",");
      document.getElementById("topbar-review-count").textContent = (state.reviews || []).length;

      document.getElementById("screen-home-prep").classList.toggle("hidden", state.isStreetSelling);
      document.getElementById("screen-street-sell").classList.toggle("hidden", !state.isStreetSelling);

      const homeAv = document.getElementById("home-avatar-box");
      if (homeAv) homeAv.innerHTML = renderAvatarContent(state.avatar, "w-full h-full object-cover");
      const rawShopTitle = state.shopName || "Bánh Tráng Dì Tư";
      const homeTitleEl = document.getElementById("home-shop-title");
      if (homeTitleEl) {
        homeTitleEl.textContent = rawShopTitle;
        homeTitleEl.title = rawShopTitle;
        homeTitleEl.className = rawShopTitle.length > 16
          ? "cursor-pointer font-black text-[10.5px] sm:text-xs text-yellow-200 leading-tight break-words line-clamp-2 drop-shadow"
          : "cursor-pointer font-black text-xs sm:text-sm text-yellow-200 leading-tight break-words line-clamp-2 drop-shadow";
      }

      const currentLvlObj = LEVEL_DATA.find(l => l.level === state.level) || LEVEL_DATA[LEVEL_DATA.length - 1];
      document.getElementById("home-level-text").textContent = `Cấp ${state.level}`;
      const xpPct = Math.min(100, Math.round((state.xp / currentLvlObj.xpNeed) * 100));
      document.getElementById("home-xp-bar").style.width = `${xpPct}%`;

      document.getElementById("prep-forecast-title").textContent = sched.isHoliday ? `${sched.name}` : `${sched.dowName}`;
      document.getElementById("prep-demand-badge").textContent = `🎯 Dự kiến ~${actualCap} bịch`;

      const featDish = DISH_MENU[state.featuredDishKey] || DISH_MENU.tron;
      document.getElementById("prep-featured-title").textContent = `🔥 ${featDish.short}`;
      document.getElementById("prep-featured-progress").textContent = `${Math.min(8, state.featuredSoldToday || 0)}/8`;

      const chapBadge = document.getElementById("prep-chapter-badge");
      if (chapBadge && curChap) {
        const hasUnclaimedChap = STORY_CHAPTERS.some(ch => !state.claimedChapters.includes(ch.id) && ch.check(state));
        chapBadge.innerHTML = `${hasUnclaimedChap ? '🎁 ' : '📍 '}C.${curChap.id}: ${curChap.shortLoc}`;
      }

      const stageLocBadge = document.getElementById("stage-location-badge");
      if (stageLocBadge && curChap) {
        stageLocBadge.textContent = curChap.shortLoc;
      }

      const btnSuggest = document.getElementById("btn-suggested-order");
      if (btnSuggest) {
        btnSuggest.innerHTML = `<span>⚡ LẤY ĐỦ HÀNG (~${actualCap} BỊCH)</span>`;
      }
      const slotCapBadge = document.getElementById("stage-slot-cap-badge");
      if (slotCapBadge) {
        slotCapBadge.textContent = `👥 ${getMaxActiveCustomerSlots()} chỗ`;
      }

      const unrepBadge = document.getElementById("prep-unreplied-badge");
      if (unrepBadge) {
        if (unrepliedCount > 0) { unrepBadge.textContent = unrepliedCount; unrepBadge.classList.remove("hidden"); }
        else unrepBadge.classList.add("hidden");
      }

      const unpurchasedDishes = getUnpurchasedEligibleDishes(false);
      const demandBadge = document.getElementById("badge-new-dish-demand");
      if (demandBadge) demandBadge.classList.toggle("hidden", unpurchasedDishes.length === 0);

      document.getElementById("btn-open-day-big").textContent = `🚀 MỞ CỬA HÀNG (NGÀY ${state.day} • ${sched.dowName.toUpperCase()})`;
      const stageNameEl = document.getElementById("stage-shop-name");
      if (stageNameEl) {
        const upName = (state.shopName || "BÁNH TRÁNG DÌ TƯ").toUpperCase();
        stageNameEl.textContent = upName;
        stageNameEl.className = upName.length > 16
          ? "font-black text-[9px] sm:text-[11px] saigon-red-title uppercase leading-tight break-words line-clamp-1"
          : "font-black text-[10.5px] sm:text-xs saigon-red-title uppercase leading-tight break-words line-clamp-1";
      }
      const scaleObj = getCurrentShopScaleObj();
      const scaleMini = document.getElementById("stage-scale-mini-badge");
      if (scaleMini) {
        scaleMini.textContent = scaleObj.tier > 0 ? `${scaleObj.icon} B${scaleObj.tier}` : "";
        scaleMini.classList.toggle("hidden", scaleObj.tier <= 0);
      }
      const empBadge = document.getElementById("home-empire-badge");
      if (empBadge) empBadge.textContent = scaleObj.badge;
      applyEquippedDecorsVisuals();

      updateStageSkyByHour();
      renderMarketGrid();
      renderPrepStatus();
      renderSellDishGrid();
      renderBottomIngredientTray();
      renderStaffActiveStrip();
      renderCustomerSlotsRow();
      renderSelectedOrderBubble();
      updateSweetSpotUI();
      updateVesselVisualByDish();
      updateStepButtonsHighlight();
      renderUpgradesTab();
      renderLedgerTab();
      renderMenuAndPricingTab();
      renderDiTuSmartTip();
      if (typeof renderBargainBanner === "function") renderBargainBanner();
      if (typeof updateCodexNotificationBadges === "function") updateCodexNotificationBadges();
    }

    function updateStageSkyByHour() {
      const tint = document.getElementById("stage-time-tint");
      if (!tint) return;
      const h = state.clockMinutes / 60;
      if (h < 16.5) {
        tint.className = "absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-slate-950/55 pointer-events-none transition-colors duration-700";
      } else if (h < 18.5) {
        tint.className = "absolute inset-0 bg-gradient-to-b from-purple-900/30 via-orange-600/15 to-slate-950/70 pointer-events-none transition-colors duration-700";
      } else {
        tint.className = "absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-900/30 to-slate-950/80 pointer-events-none transition-colors duration-700";
      }
    }


    // ================= 12. CHỢ NGUYÊN LIỆU DẠNG HÀNG NGANG TRUYỀN THỐNG GỌN ĐẸP =================
    function adjustMarketInputQty(ingId, delta) {
      const el = document.getElementById(`buy-qty-${ingId}`);
      if (!el) return;
      const cur = Math.max(0, parseInt(el.value || "0", 10) || 0);
      const next = Math.max(0, Math.min(999, cur + delta));
      el.value = next > 0 ? next : "";
      playSFX("snip");
      recalcMarketOrderTotal();
      if (typeof renderBargainBanner === "function") renderBargainBanner();
      if (typeof updateCodexNotificationBadges === "function") updateCodexNotificationBadges();
    }

    function renderMarketGrid() {
      const grid = document.getElementById("market-grid");
      if (!grid) return;
      const currentInputs = {};
      INGREDIENTS.forEach(ing => { const el = document.getElementById(`buy-qty-${ing.id}`); if (el) currentInputs[ing.id] = el.value; });
      const usedSet = getActiveUsedIngredientSet();

      grid.innerHTML = INGREDIENTS.map(ing => {
        const unitCost = getIngredientCost(ing);
        const stockCount = state.stock[ing.id] || 0;
        const val = currentInputs[ing.id] !== undefined ? currentInputs[ing.id] : "";
        const maxLife = getEffectiveShelfLife(ing);
        const { expTodayQty } = getExpiringTodayInfo(ing.id);
        const isUsedNow = usedSet.has(ing.id);

        const expBadge = !isUsedNow
          ? `<span class="text-[8px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">Chưa dùng</span>`
          : expTodayQty > 0
            ? `<span class="text-[8px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded-full whitespace-nowrap animate-pulse">⚠️ ${expTodayQty} cận date</span>`
            : (maxLife <= 1 ? `<span class="text-[8px] font-black text-white bg-rose-600 px-1.5 py-0.5 rounded-full whitespace-nowrap border border-rose-800 shadow-sm">⚠️ HSD 1N</span>` : `<span class="text-[8px] font-bold text-amber-900 bg-amber-200/75 px-1.5 py-0.5 rounded-full whitespace-nowrap">HSD ${maxLife}N</span>`);

        const wsDiscPct = getWorkshopDiscountPctForIng(ing.id);
        const wholesaleBtnHtml = wsDiscPct > 0
          ? `<span class="px-1.5 py-0 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[8px] whitespace-nowrap">-${wsDiscPct}%</span>`
          : "";

        return `
          <div class="px-2 py-1.5 rounded-xl ${isUsedNow ? 'bg-[#f8efe0] border-[#c49a6c]' : 'bg-slate-50 border-slate-200 opacity-60'} border flex items-center justify-between gap-1 text-xs shadow-sm">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <div class="relative shrink-0">
                ${getIngredientSvgIcon(ing.id, "w-8 h-8")}
                <span class="absolute -bottom-1 -right-1 px-1 py-0 rounded-full bg-amber-950 text-yellow-300 border border-yellow-400 font-black text-[8px] shadow">
                  x${stockCount}
                </span>
              </div>
              <div class="min-w-0 flex-1 leading-tight pr-1">
                <div class="font-black text-xs text-amber-950 leading-tight">${ing.name}</div>
                <div class="flex items-center gap-1 flex-wrap mt-0.5">
                  <span class="px-1.5 py-0 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[8.5px] whitespace-nowrap">${formatShortK(unitCost)}</span>
                  ${expBadge}
                  ${wholesaleBtnHtml}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-0.5 shrink-0">
              <button onclick="adjustMarketInputQty('${ing.id}', -1)" class="soft-btn w-6 h-6 rounded-lg bg-amber-200 text-amber-950 font-black text-xs">-</button>
              <input id="buy-qty-${ing.id}" type="number" min="0" max="999" value="${val}" placeholder="+0" oninput="recalcMarketOrderTotal()" class="w-8 h-6 rounded-lg border border-amber-500 text-center font-black text-[11px] bg-white text-amber-950" />
              <button onclick="adjustMarketInputQty('${ing.id}', 1)" class="soft-btn px-1.5 h-6 rounded-lg bg-emerald-600 text-white font-black text-[10px]">+1</button>
              <button onclick="adjustMarketInputQty('${ing.id}', 5)" class="soft-btn px-1.5 h-6 rounded-lg bg-orange-600 text-white font-black text-[10px]">+5</button>
            </div>
          </div>
        `;
      }).join("");
      recalcMarketOrderTotal();
      if (typeof renderBargainBanner === "function") renderBargainBanner();
    }

    function recalcMarketOrderTotal() {
      let totalCost = 0, totalUnits = 0;
      INGREDIENTS.forEach(ing => {
        const el = document.getElementById(`buy-qty-${ing.id}`);
        const qty = Math.max(0, parseInt(el?.value || "0", 10) || 0);
        if (qty > 0) { totalUnits += qty; totalCost += qty * getIngredientCost(ing); }
      });
      const totalEl = document.getElementById("market-order-total");
      if (totalEl) totalEl.textContent = `${formatVND(totalCost)} (${totalUnits} phần)`;
      return { totalCost, totalUnits };
    }

    function fillSuggestedOrder() {
      const sched = getTodayScheduleInfo(state.day);
      const targetBags = getActualCartBagDemandCap(state.day);
      const stoolBonusProb = (state.equipLevels?.upg_stool || 0) * 0.03;
      const targetDrink = Math.max(5, Math.round(targetBags * Math.min(0.85, (sched.traTacChance || 0.4) + stoolBonusProb)));
      const unlocked = state.unlockedDishes && state.unlockedDishes.length > 0 ? state.unlockedDishes : ["tron"];

      INGREDIENTS.forEach(ing => {
        const el = document.getElementById(`buy-qty-${ing.id}`);
        if (!el) return;

        if (ing.id === "tratac") {
          const toBuy = Math.max(0, targetDrink - (state.stock.tratac || 0));
          el.value = toBuy > 0 ? toBuy : "";
          return;
        }

        let dishesUsingWeight = 0;
        let totalWeight = 0;
        unlocked.forEach(dKey => {
          const dWeight = ((dKey === state.featuredDishKey) ? 1.5 : 1.0) * getDishDemandInfo(dKey).weight;
          totalWeight += dWeight;
          if (DISH_MENU[dKey]?.recipe?.[ing.id]) {
            dishesUsingWeight += dWeight;
          }
        });

        if (dishesUsingWeight <= 0 || totalWeight <= 0) {
          el.value = "";
          return;
        }

        const usageRatio = Math.min(1, dishesUsingWeight / totalWeight);
        const needed = Math.ceil(targetBags * usageRatio);
        const toBuy = Math.max(0, needed - (state.stock[ing.id] || 0));
        el.value = toBuy > 0 ? toBuy : "";
      });

      if ((state.day || 1) === 1) {
        state.day1MarketDone = true;
        if (typeof renderDay1OnboardingChecklist === "function") renderDay1OnboardingChecklist();
      }
      const { totalUnits, totalCost } = recalcMarketOrderTotal();
      if (totalUnits <= 0) {
        showToast(`✅ Kho đã đủ cho dự kiến ~${targetBags} bịch hôm nay, không cần nhập thêm!`);
      } else {
        showToast(`✨ Đã điền đúng ${totalUnits} phần còn thiếu (${formatVND(totalCost)}) cho ~${targetBags} bịch! Bấm '✅ Nhập Kho' nhé!`);
      }
    }

    function clearMarketInputs() {
      INGREDIENTS.forEach(ing => { const el = document.getElementById(`buy-qty-${ing.id}`); if (el) el.value = ""; });
      recalcMarketOrderTotal();
    }

    function confirmMarketPurchase() {
      const { totalCost, totalUnits } = recalcMarketOrderTotal();
      if (totalUnits <= 0) { showToast("⚠️ Hãy bấm nút '⚡ LẤY ĐỦ HÀNG' hoặc chọn số lượng trước nhé!"); return; }
      if (totalCost > state.money) { showToast("❌ Không đủ tiền mặt thanh toán đơn hàng này!"); return; }
      state.money -= totalCost;
      state.todayCogsSpent += totalCost;
      if ((state.day || 1) === 1) state.day1MarketDone = true;
      state.cumulativeCosts.cogs = (state.cumulativeCosts.cogs || 0) + totalCost;
      INGREDIENTS.forEach(ing => {
        const el = document.getElementById(`buy-qty-${ing.id}`);
        const qty = Math.max(0, parseInt(el?.value || "0", 10) || 0);
        if (qty > 0) {
          recordMarketPurchaseDetail(ing.id, qty, qty * getIngredientCost(ing), "regular");
          addStockBatch(ing.id, qty);
        }
        if (el) el.value = "";
      });
      saveGameEverywhere(false);
      playSFX("cash"); updateAllUI();
      showToast(`✅ Đã nhập ${totalUnits} phần vào kho (-${formatVND(totalCost)})!`);
    }

    function renderPrepStatus() {
      const keys = ["sate", "hanhphi", "trungcut"]; let doneCount = 0;
      keys.forEach(k => {
        const isDone = state.prepDone[k]; if (isDone) doneCount++;
        const sEl = document.getElementById(`prep-status-${k}`), bEl = document.getElementById(`prep-btn-${k}`);
        if (sEl && bEl) {
          sEl.textContent = isDone ? "✅ Xong" : "Làm ngay";
          sEl.className = isDone ? "text-[10px] font-black text-emerald-700" : "text-[10px] font-bold text-orange-600";
          bEl.className = isDone ? "soft-btn p-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex flex-col items-center text-center gap-0.5" : "soft-btn p-2.5 rounded-2xl bg-white border-2 border-amber-300 flex flex-col items-center text-center gap-0.5";
        }
      });
      const badge = document.getElementById("prep-bonus-status");
      if (badge) badge.textContent = doneCount === 3 ? "🌟 Đủ 3/3 (+1k Tip)" : `${doneCount}/3 món`;
      const summary = document.getElementById("prep-quick-summary");
      if (summary) summary.textContent = doneCount === 3 ? "✅ Đủ 3/3" : `${doneCount}/3 món`;
      const dockBadge = document.getElementById("badge-soche-notify");
      if (dockBadge) {
        dockBadge.innerHTML = doneCount === 3 ? "✓<span class='sr-only'> món</span>" : `${doneCount}/3<span class='sr-only'> món</span>`;
        dockBadge.className = doneCount === 3
          ? "absolute top-0 right-1.5 px-1 rounded-full bg-emerald-500 text-white font-black text-[7px]"
          : "absolute top-0 right-1.5 px-1 rounded-full bg-red-600 text-white font-black text-[7px] animate-pulse";
      }
      if (typeof renderCustomSauceLab === "function") renderCustomSauceLab();
    }

    function openPrepModal(key) {
      if (state.prepDone[key]) { showToast("✅ Món này hôm nay đã sơ chế xong rồi!"); return; }
      activePrepKey = key; activePrepProgress = 0;
      const meta = {
        sate: { icon: "🌶️", title: "Thắng Sa Tế Ớt Tỏi", desc: "Đảo đều tay cho sa tế lên màu đỏ óng!" },
        hanhphi: { icon: "🧅", title: "Phi Hành Tím Vàng Giòn", desc: "Canh lửa đều tay để hành tím vàng ruộm!" },
        trungcut: { icon: "🥚", title: "Luộc & Lột Trứng Cút", desc: "Lột vỏ khéo léo cho trứng trắng mịn!" }
      }[key];
      document.getElementById("prep-modal-icon").textContent = meta.icon;
      document.getElementById("prep-modal-title").textContent = meta.title;
      document.getElementById("prep-modal-desc").textContent = meta.desc;
      document.getElementById("prep-modal-bar").style.width = "0%";
      document.getElementById("modal-prep").classList.remove("hidden");
    }

    function tapPrepAction() {
      if (!activePrepKey) return; playSFX("snip");
      activePrepProgress = Math.min(100, activePrepProgress + (state.staff.mylan ? 50 : 34));
      document.getElementById("prep-modal-bar").style.width = `${activePrepProgress}%`;
      if (activePrepProgress >= 100) {
        state.prepDone[activePrepKey] = true;
        if (state.prepDone.sate && state.prepDone.hanhphi && state.prepDone.trungcut) {
          state.totalPrepDays = (state.totalPrepDays || 0) + 1;
        }
        addXP(15);
        saveGameEverywhere(false);
        const doneNow = ["sate", "hanhphi", "trungcut"].filter(k => state.prepDone[k]).length;
        setTimeout(() => {
          document.getElementById("modal-prep").classList.add("hidden");
          updateAllUI();
          saveGameEverywhere(false);
          showToast(doneNow >= 3 ? "🎉 Sơ chế hoàn tất 3/3 món (+1.000đ Tip/bịch)!" : `✅ Đã xong ${doneNow}/3 món sơ chế!`);
        }, 180);
      }
    }
    function closePrepModal() {
      document.getElementById("modal-prep").classList.add("hidden");
      activePrepKey = null;
      if (pendingLevelUpQueue.length > 0 && !state.isStreetSelling) {
        const nextLvl = Math.max(...pendingLevelUpQueue);
        pendingLevelUpQueue = [];
        showLevelUpModal(nextLvl);
      }
    }


    // ================= 19. SỔ THU CHI CHI TIẾT TỪNG NGÀY (BẤM MỞ BUNG 4 NHÓM CHI TIẾT) & 4 TÍNH NĂNG MỚI =================
    let expandedLedgerDays = {};

    function ensureTodayDetail() {
      if (!state.todayDetail || typeof state.todayDetail !== "object") {
        state.todayDetail = {};
      }
      const td = state.todayDetail;
      if (!td.dishes || typeof td.dishes !== "object") td.dishes = {};
      if (!td.traTac || typeof td.traTac !== "object") td.traTac = { qty: 0, rev: 0 };
      if (typeof td.traTac.qty !== "number") td.traTac.qty = Number(td.traTac.qty || 0);
      if (typeof td.traTac.rev !== "number") td.traTac.rev = Number(td.traTac.rev || 0);
      if (typeof td.tips !== "number") td.tips = Number(td.tips || 0);
      if (typeof td.eventRev !== "number") td.eventRev = Number(td.eventRev || 0);
      if (!td.purchases || typeof td.purchases !== "object") td.purchases = {};
      if (typeof td.packagingCost !== "number") td.packagingCost = Number(td.packagingCost || 0);
      if (typeof td.manualDebtPaid !== "number") td.manualDebtPaid = Number(td.manualDebtPaid || 0);
      if (typeof td.loansTaken !== "number") td.loansTaken = Number(td.loansTaken || 0);
      return td;
    }

    function recordMarketPurchaseDetail(ingId, qty, cost, mode = "regular") {
      if (!ingId || qty <= 0) return;
      const td = ensureTodayDetail();
      if (!td.purchases[ingId]) {
        td.purchases[ingId] = { qty: 0, cost: 0, wholesaleBundles: 0, oosQty: 0 };
      }
      td.purchases[ingId].qty += qty;
      td.purchases[ingId].cost += cost;
      if (mode === "wholesale") td.purchases[ingId].wholesaleBundles += 1;
      if (mode === "oos") td.purchases[ingId].oosQty += qty;
    }

    function recordDishSaleDetail(dishKey, qty, dishRev, traTacQty, traTacRev, tipAmt, packCost) {
      const td = ensureTodayDetail();
      if (!td.dishes[dishKey]) td.dishes[dishKey] = { qty: 0, rev: 0 };
      td.dishes[dishKey].qty += qty;
      td.dishes[dishKey].rev += dishRev;
      if (traTacQty > 0) {
        td.traTac.qty = (td.traTac.qty || 0) + traTacQty;
        td.traTac.rev = (td.traTac.rev || 0) + traTacRev;
      }
      td.tips = (td.tips || 0) + (tipAmt || 0);
      td.packagingCost = (td.packagingCost || 0) + (packCost || 0);
    }

    function recordExtraEventRevDetail(amount) {
      const td = ensureTodayDetail();
      td.eventRev = (td.eventRev || 0) + amount;
    }

    function recordBankActionDetail(type, amount) {
      const td = ensureTodayDetail();
      if (type === "loan") td.loansTaken = (td.loansTaken || 0) + amount;
      if (type === "repay") td.manualDebtPaid = (td.manualDebtPaid || 0) + amount;
    }

    function toggleLedgerDetailCard(dayKey) {
      expandedLedgerDays[dayKey] = !expandedLedgerDays[dayKey];
      playSFX("snip");
      renderLedgerTab();
    }

    function buildDetailedReceiptHtml(detail, appFee, isTodayLive = false) {
      if (!detail) {
        return `<div class="mt-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-[10px] text-amber-800 italic">Bản ghi cũ chưa tách dòng. Các ngày mới sẽ lưu đầy đủ hóa đơn chi tiết tại đây!</div>`;
      }

      const leaderRow = (leftHtml, rightHtml, rightClass = "text-amber-950") => `
        <div class="flex items-baseline justify-between gap-1 py-0.5">
          <span class="text-amber-900 leading-snug">${leftHtml}</span>
          <span class="flex-1 border-b border-dotted border-amber-300 mx-1"></span>
          <b class="shrink-0 whitespace-nowrap ${rightClass}">${rightHtml}</b>
        </div>
      `;

      // 1. Khoản Thu: Bán bánh tráng, Trà Tắc, Tip
      const dishEntries = Object.entries(detail.dishes || {}).filter(([_, v]) => v && v.qty > 0);
      const dishRows = dishEntries.map(([dKey, v]) => {
        const dName = DISH_MENU[dKey]?.short || DISH_MENU[dKey]?.name || dKey;
        return leaderRow(`🥙 ${escapeHtml(dName)} (${v.qty} phút)`, `+${formatVND(v.rev)}`, "text-emerald-700");
      }).join("");
      const traTacRow = (detail.traTac && detail.traTac.qty > 0)
        ? leaderRow(`🧋 Trà Tắc (${detail.traTac.qty} ly)`, `+${formatVND(detail.traTac.rev)}`, "text-emerald-700")
        : "";
      const tipRow = (detail.tips || 0) > 0
        ? leaderRow(`💝 Tiền Tip khách thưởng`, `+${formatVND(detail.tips)}`, "text-emerald-700")
        : "";
      const eventRevRow = (detail.eventRev || 0) > 0
        ? leaderRow(`🏆 Thưởng Đơn Sỉ / Sự Kiện`, `+${formatVND(detail.eventRev)}`, "text-emerald-700")
        : "";
      const appFeeRow = (appFee || 0) > 0
        ? leaderRow(`🛵 Trừ chiết khấu Sàn App`, `-${formatVND(appFee)}`, "text-blue-700")
        : "";
      const salesContent = (dishRows || traTacRow || tipRow || eventRevRow)
        ? `${dishRows}${traTacRow}${tipRow}${eventRevRow}${appFeeRow}`
        : `<div class="text-[10px] text-amber-700 italic py-0.5">Chưa có đơn bán hàng trong ngày.</div>`;

      // 2. Khoản Chi Chợ & Bao Bì
      const purEntries = Object.entries(detail.purchases || {}).filter(([_, v]) => v && v.qty > 0);
      const purRows = purEntries.map(([ingId, v]) => {
        const ingName = INGREDIENTS.find(x => x.id === ingId)?.short || ingId;
        return leaderRow(`🧺 Nhập ${escapeHtml(ingName)} (+${v.qty}p)`, `-${formatVND(v.cost)}`, "text-rose-700");
      }).join("");
      const packRow = (detail.packagingCost || 0) > 0
        ? leaderRow(`🛍️ Túi bóng & hộp đựng`, `-${formatVND(detail.packagingCost)}`, "text-rose-700")
        : "";
      const marketContent = (purRows || packRow)
        ? `${purRows}${packRow}`
        : `<div class="text-[10px] text-amber-700 italic py-0.5">Dùng hàng tồn kho, không tốn tiền đi chợ.</div>`;

      // 3. Chi Phí Cố Định & Lương Nhân Viên
      const fb = detail.fixedBreakdown || {};
      const staffRows = Array.isArray(fb.staffList) && fb.staffList.length > 0
        ? fb.staffList.map(st => leaderRow(`🧑‍🍳 Lương ${escapeHtml(st.name.replace('Phụ Bếp ', '').replace('Chị Phụ Việc ', '').replace('Chú Bảo Vệ ', '').replace('Nghệ Nhân ', '').replace('Hoạt Náo Viên ', '').replace('Chuyên Viên ', ''))} (${st.star}⭐)`, `-${formatVND(st.wage)}`, "text-orange-800")).join("")
        : leaderRow(`🧑‍🍳 Lương Phụ Bếp`, `0đ`, "text-slate-500");

      const fixedContent = `
        ${leaderRow(`💡 Điện nước & hao mòn xe`, `-${formatVND(fb.depAndUtil || 0)}`, "text-orange-800")}
        ${(fb.streetClean || 0) > 0 ? leaderRow(`🧹 Phí vệ sinh vỉa hè`, `-${formatVND(fb.streetClean)}`, "text-orange-800") : ''}
        ${(fb.rentCost || 0) > 0 ? leaderRow(`📐 Thuê vỉa hè đô thị`, `-${formatVND(fb.rentCost)}`, "text-orange-800") : ''}
        ${staffRows}
        ${(fb.tax || 0) > 0 ? leaderRow(`🏛️ Thuế kinh doanh`, `-${formatVND(fb.tax)}`, "text-orange-800") : ''}
      `;

      // 4. Ngân Hàng & Hao Hụt
      const bs = detail.bankAndSpoil || {};
      const bankContent = `
        ${leaderRow(`🏦 Trả góp Ngân hàng${isTodayLive ? ' (dự kiến)' : ''}`, `-${formatVND(bs.autoInstallment || 0)}`, (bs.autoInstallment || 0) > 0 ? "text-red-700" : "text-slate-500")}
        ${(bs.manualPaid || 0) > 0 ? leaderRow(`🦅 Trả nợ chủ động`, `-${formatVND(bs.manualPaid)}`, "text-emerald-800") : ''}
        ${(bs.loansTaken || 0) > 0 ? leaderRow(`💵 Vay mới trong ngày`, `+${formatVND(bs.loansTaken)}`, "text-emerald-700") : ''}
        ${leaderRow(`📌 Dư nợ Ngân hàng còn lại`, `${formatVND(bs.remainingDebt || 0)}`, (bs.remainingDebt || 0) > 0 ? "text-red-600" : "text-emerald-700")}
        ${(bs.spoiledVal || 0) > 0 ? leaderRow(`🗑️ Hủy hàng hết hạn`, `-${formatVND(bs.spoiledVal)}`, "text-rose-700") : ''}
      `;

      return `
        <div class="mt-2 pt-2 border-t border-dashed border-amber-300 space-y-2 text-[10px]" onclick="event.stopPropagation()">
          <div class="p-2 rounded-xl bg-[#fffdf9] border border-amber-200 space-y-0.5">
            <div class="font-black text-[10px] text-emerald-900 uppercase tracking-wide mb-0.5">1. Khoản Thu Bán Hàng</div>
            ${salesContent}
          </div>
          <div class="p-2 rounded-xl bg-[#fffdf9] border border-amber-200 space-y-0.5">
            <div class="font-black text-[10px] text-rose-900 uppercase tracking-wide mb-0.5">2. Tiền Đi Chợ & Bao Bì</div>
            ${marketContent}
          </div>
          <div class="p-2 rounded-xl bg-[#fffdf9] border border-amber-200 space-y-0.5">
            <div class="font-black text-[10px] text-orange-900 uppercase tracking-wide mb-0.5">3. Chi Phí Cố Định & Lương</div>
            ${fixedContent}
          </div>
          <div class="p-2 rounded-xl bg-[#fffdf9] border border-amber-200 space-y-0.5">
            <div class="font-black text-[10px] text-sky-900 uppercase tracking-wide mb-0.5">4. Ngân Hàng & Kiểm Kho</div>
            ${bankContent}
          </div>
        </div>
      `;
    }

    function _baseRenderLedgerTab() {
      const dur = Math.round(state.cartDurability || 100);
      const durText = document.getElementById("ledger-durability-text");
      const durBar = document.getElementById("ledger-durability-bar");
      const btnRepair = document.getElementById("btn-repair-cart");
      if (durText) durText.textContent = `${dur}%`;
      if (durBar) durBar.style.width = `${dur}%`;
      if (btnRepair) {
        const repCost = getRepairCost();
        btnRepair.textContent = repCost > 0 ? `🛠️ Tu Sửa (${formatShortK(repCost)})` : `✅ Xe Mới 100%`;
      }
      document.getElementById("ledger-loan-count").textContent = `${state.rescueLoanCount || 0}/2`;
      document.getElementById("ledger-debt-amount").textContent = formatVND(state.loanDebt || 0);

      const baseUtilAndWear = 15000 + (state.level * 3200);
      const streetCleanFee = (!state.licenses.lic_sidewalk && state.level >= 5) ? 15000 : 0;
      const rentCost = state.licenses.lic_sidewalk ? 25000 : 0;
      const staffWages = getDailyStaffWages();
      const taxRate = getChapterTaxRate();
      const rawTax = taxRate > 0 ? Math.round(((state.todayRevenue || 0) * taxRate) / 500) * 500 + (getCurrentChapterObj().id * 4000) : 0;
      const taxMult = state.licenses?.lic_heritage ? 0 : (1 - (state.licenses?.lic_franchise ? 0.25 : 0) - ((state.staff?.kimngan && Number(state.staffStars?.kimngan || 1) >= 5) ? 0.15 : 0));
      const progressiveTax = Math.round((rawTax * Math.max(0, taxMult)) / 500) * 500;
      const bankInstallment = (state.loanDebt || 0) > 0 ? Math.min(state.loanDebt, 35000) : 0;
      const fixedToday = baseUtilAndWear + streetCleanFee + rentCost + staffWages + progressiveTax + bankInstallment;

      const avgProfitPerBag = 15000;
      const bagsNeeded = Math.max(1, Math.ceil(fixedToday / avgProfitPerBag));
      const bePct = Math.min(100, Math.round(((state.todaySold || 0) / bagsNeeded) * 100));
      const beBox = document.getElementById("ledger-breakeven-box");
      if (beBox) {
        beBox.innerHTML = `
          <div class="flex items-center justify-between font-black text-[11px] text-amber-950">
            <span>🎯 Hòa Vốn Hôm Nay: <b>${state.todaySold || 0}/${bagsNeeded} bịch</b></span>
            <span class="${bePct >= 100 ? 'text-emerald-700' : 'text-orange-700'}">${bePct >= 100 ? '✅ Đã có lãi!' : `Cần +${Math.max(0, bagsNeeded - (state.todaySold || 0))} bịch`}</span>
          </div>
          <div class="w-full h-1.5 bg-white rounded-full overflow-hidden border border-amber-400">
            <div class="h-full bg-gradient-to-r from-amber-500 to-emerald-600 transition-all duration-300" style="width: ${bePct}%"></div>
          </div>
        `;
      }

      const list = document.getElementById("ledger-history-list");
      if (!list) return;

      const td = ensureTodayDetail();
      const liveStaffList = STAFF_CATALOG.filter(st => state.staff[st.id]).map(st => {
        const star = state.staffStars?.[st.id] || 1;
        return { id: st.id, name: st.name, star, wage: st.dailyWage + (star - 1) * 4000 };
      });
      const liveTodayDetailObj = {
        dishes: td.dishes || {},
        traTac: td.traTac || { qty: 0, rev: 0 },
        tips: td.tips || 0,
        eventRev: td.eventRev || 0,
        purchases: td.purchases || {},
        packagingCost: td.packagingCost || 0,
        fixedBreakdown: {
          depAndUtil: baseUtilAndWear,
          streetClean: streetCleanFee,
          rentCost,
          staffWages,
          staffList: liveStaffList,
          tax: progressiveTax
        },
        bankAndSpoil: {
          autoInstallment: bankInstallment,
          manualPaid: td.manualDebtPaid || 0,
          loansTaken: td.loansTaken || 0,
          remainingDebt: state.loanDebt || 0,
          spoiledVal: 0,
          spoiledItems: []
        }
      };

      const todayStartBal = Number.isFinite(Number(state.dayStartMoney)) ? Number(state.dayStartMoney) : ((state.money || 0) - (state.todayRevenue || 0) + (state.todayCogsSpent || 0));
      const todayNetPreview = ((state.money || 0) - fixedToday) - todayStartBal;
      const isTodayExpanded = Boolean(expandedLedgerDays["today"]);

      const renderCleanDayCard = (cardKey, badgeHtml, titleHtml, subQtyHtml, netVal, revVal, cogsVal, fixVal, endBalVal, isExp, detailObj, appFeeVal, isLive) => `
        <div onclick="toggleLedgerDetailCard('${cardKey}')" class="cursor-pointer p-2.5 rounded-2xl bg-white border-2 ${isExp ? 'border-amber-500 shadow-md' : 'border-amber-200'} space-y-1.5 transition-all">
          <!-- Hàng 1: Tiêu đề Ngày + Lãi ròng + Mũi tên gọn (Không bao giờ rớt chữ) -->
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 min-w-0">
              ${badgeHtml}
              <span class="font-black text-xs text-amber-950">${titleHtml}</span>
              <span class="text-[10px] font-bold text-amber-700 whitespace-nowrap">(${subQtyHtml})</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <span class="px-2 py-0.5 rounded-full font-black text-[10px] whitespace-nowrap ${netVal >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}">
                ${netVal >= 0 ? '+' : ''}${formatVND(netVal)}
              </span>
              <span class="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] flex items-center justify-center shrink-0">${isExp ? '▴' : '▾'}</span>
            </div>
          </div>

          <!-- Hàng 2: Thanh 3 chỉ số trên 1 dòng nền kem thanh lịch -->
          <div class="grid grid-cols-3 divide-x divide-amber-200 bg-amber-50/75 rounded-xl border border-amber-200/80 py-1 px-1 text-center">
            <div class="px-1">
              <div class="text-[9px] font-bold text-amber-800">Bán bánh</div>
              <div class="text-[11px] font-black text-emerald-700 whitespace-nowrap">+${formatShortK(revVal)}</div>
            </div>
            <div class="px-1">
              <div class="text-[9px] font-bold text-amber-800">Đi chợ</div>
              <div class="text-[11px] font-black text-rose-600 whitespace-nowrap">-${formatShortK(cogsVal)}</div>
            </div>
            <div class="px-1">
              <div class="text-[9px] font-bold text-amber-800">Cố định & Nợ</div>
              <div class="text-[11px] font-black text-orange-700 whitespace-nowrap">-${formatShortK(fixVal)}</div>
            </div>
          </div>

          <!-- Hàng 3: Ghi chú chạm xem chi tiết + Số dư cuối ngày -->
          <div class="flex items-center justify-between text-[10px] text-amber-800 px-0.5">
            <span class="font-bold text-amber-700">${isExp ? 'Chạm để thu gọn ▴' : 'Chạm xem hóa đơn chi tiết ▾'}</span>
            ${endBalVal !== null ? `<span>Số dư: <b class="text-amber-950">${formatVND(endBalVal)}</b></span>` : `<span class="italic text-amber-700">Đang mở ca</span>`}
          </div>

          ${isExp ? buildDetailedReceiptHtml(detailObj, appFeeVal, isLive) : ''}
        </div>
      `;

      const currentDayCard = renderCleanDayCard(
        "today",
        `<span class="px-1.5 py-0.5 rounded-md bg-orange-600 text-white font-black text-[8px] uppercase shrink-0">Hôm nay</span>`,
        `Ngày ${state.day}`,
        `${state.todaySold || 0}p`,
        todayNetPreview,
        state.todayRevenue || 0,
        state.todayCogsSpent || 0,
        fixedToday,
        null,
        isTodayExpanded,
        liveTodayDetailObj,
        state.todayAppFees || 0,
        true
      );

      const historyCards = (state.ledgerHistory || []).slice(0, MAX_LEDGER_DAYS).map(item => {
        const revCart = item.cartRev !== undefined ? item.cartRev : (item.revenue || 0);
        const cogs = item.cogs !== undefined ? item.cogs : 0;
        const fixed = item.fixed !== undefined ? item.fixed : 0;
        const appFee = item.appFee || 0;
        const endBal = item.endBalance !== undefined ? item.endBalance : null;
        const dKey = `day_${item.day}`;
        const isExp = Boolean(expandedLedgerDays[dKey]);

        return renderCleanDayCard(
          dKey,
          `<span class="text-xs shrink-0">🧾</span>`,
          `Ngày ${item.day}${item.dowName ? ` • ${item.dowName}` : ''}`,
          `${item.sold || 0}p`,
          item.netProfit || 0,
          revCart,
          cogs,
          fixed,
          endBal,
          isExp,
          item.detail || null,
          appFee,
          false
        );
      }).join("");

      const retentionHeader = `<div class="flex items-center justify-between px-1 pt-1 text-[10px] font-bold text-amber-800"><span>📅 Lịch sử 7 ngày gần nhất (${Math.min(MAX_LEDGER_DAYS, (state.ledgerHistory || []).length)}/${MAX_LEDGER_DAYS})</span><span class="text-emerald-700">💎 Định giá: ${formatShortK(computeShopNetWorth(state))}</span></div>`;
      list.innerHTML = currentDayCard + retentionHeader + (historyCards || `<div class="text-center py-2 text-amber-800 text-[11px]">Chốt sổ lúc 22:00 tối để lưu hóa đơn (giữ 7 ngày gần nhất).</div>`);
    }

    // ================= TÍNH NĂNG MỚI 1: MINIGAME TRẢ GIÁ CHỢ ĐẦU MỐI (-2%, -5%, -10%) =================
    let bargainTimer = null;
    let bargainPos = 50;
    let bargainDir = 1;

    function renderBargainBanner() {
      const box = document.getElementById("market-bargain-banner");
      if (!box) return;
      if (state.dailyBargainDone) {
        const pct = state.dailyBargainDiscountPct || 2;
        box.innerHTML = `
          <div class="flex items-center gap-2 min-w-0">
            <img src="${CASUAL_2D_ASSETS.feat_bargain}" alt="Trả giá" class="w-8 h-8 rounded-xl object-cover border border-amber-500 shrink-0" />
            <div class="min-w-0">
              <div class="font-black text-xs text-emerald-900">🤝 Đã trả giá chợ sỉ hôm nay</div>
              <div class="text-[10px] font-semibold text-amber-800">Đã giảm -${pct}% toàn bộ nguyên liệu</div>
            </div>
          </div>
          <span class="px-2 py-1 rounded-xl bg-emerald-600 text-white font-black text-[10px] shrink-0 shadow">✅ -${pct}%</span>
        `;
      } else {
        box.innerHTML = `
          <div class="flex items-center gap-2 min-w-0">
            <img src="${CASUAL_2D_ASSETS.feat_bargain}" alt="Trả giá" class="w-8 h-8 rounded-xl object-cover border border-amber-500 shrink-0" />
            <div class="min-w-0">
              <div class="font-black text-xs text-amber-950">🤝 Trả Giá Bạn Hàng Chợ Sỉ</div>
              <div class="text-[10px] font-semibold text-amber-800">Giảm <b>-2%, -5% hoặc -10%</b> giá nhập hôm nay</div>
            </div>
          </div>
          <button onclick="openBargainModal()" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px] shrink-0 shadow">
            🗣️ Trả Giá
          </button>
        `;
      }
    }

    function openBargainModal() {
      if (state.dailyBargainDone) {
        showToast(`✅ Hôm nay bạn đã chốt mức giảm -${state.dailyBargainDiscountPct || 2}% rồi!`);
        return;
      }
      const modal = document.getElementById("modal-bargain");
      const imgEl = document.getElementById("bargain-modal-img");
      const msgEl = document.getElementById("bargain-result-msg");
      const btnEl = document.getElementById("btn-stop-bargain");
      if (!modal) return;
      if (imgEl) imgEl.src = CASUAL_2D_ASSETS.feat_bargain;
      if (msgEl) msgEl.innerHTML = `Canh kim vào giữa <b class="text-rose-600">Tâm Đỏ (-10%)</b> rồi bấm chốt ngay!`;
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = "🗣️ CHỐT GIÁ NGAY!";
      }

      bargainPos = 10;
      bargainDir = 1;
      if (bargainTimer) clearInterval(bargainTimer);
      bargainTimer = setInterval(() => {
        bargainPos += bargainDir * 3.6;
        if (bargainPos >= 96) { bargainPos = 96; bargainDir = -1; }
        if (bargainPos <= 4) { bargainPos = 4; bargainDir = 1; }
        const needle = document.getElementById("bargain-needle");
        if (needle) needle.style.left = `${bargainPos}%`;
      }, 25);

      playSFX("snip");
      modal.classList.remove("hidden");
    }

    function stopBargainNeedle() {
      if (bargainTimer) {
        clearInterval(bargainTimer);
        bargainTimer = null;
      }
      if (state.dailyBargainDone) return;

      let discount = 2;
      let label = "🟢 Khéo miệng sơ sơ: Giảm -2% giá chợ hôm nay!";
      if (bargainPos >= 42 && bargainPos <= 58) {
        discount = 10;
        label = "💎 ĐỈNH CAO TRẢ GIÁ! Cô Tư bớt hẳn -10% toàn bộ chợ hôm nay!";
      } else if (bargainPos >= 22 && bargainPos <= 78) {
        discount = 5;
        label = "🌟 Mối quen dễ thương! Được giảm -5% toàn bộ nguyên liệu hôm nay!";
      }

      state.dailyBargainDone = true;
      state.dailyBargainDiscountPct = discount;
      playSFX("cash");

      const msgEl = document.getElementById("bargain-result-msg");
      const btnEl = document.getElementById("btn-stop-bargain");
      if (msgEl) msgEl.innerHTML = `<span class="text-emerald-700 font-black">${label}</span>`;
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = `✅ ĐÃ CHỐT -${discount}%`;
      }

      renderMarketGrid();
      saveGameEverywhere();
      showToast(`🤝 Chốt trả giá thành công: Giảm -${discount}% giá chợ hôm nay!`);
      setTimeout(() => {
        closeBargainModal();
      }, 1100);
    }

    function closeBargainModal() {
      if (bargainTimer) {
        clearInterval(bargainTimer);
        bargainTimer = null;
      }
      const modal = document.getElementById("modal-bargain");
      if (modal) modal.classList.add("hidden");
    }

    // ================= TÍNH NĂNG MỚI 2: PHA CHẾ NƯỚC SỐT ĐỘC QUYỀN BUỔI SÁNG (CUSTOM SAUCE LAB) =================
    const DAILY_SAUCE_OPTIONS = [
      {
        id: "bo_toi",
        icon: "🧈",
        name: "Sốt Bơ Tỏi Béo Ngậy",
        desc: "Thơm lừng góc phố: Tăng +15% tỷ lệ Khách VIP ghé xe & cộng +1.000đ Tip mỗi đơn 5⭐!"
      },
      {
        id: "me_chua",
        icon: "🤎",
        name: "Sốt Me Chua Ngọt Đậm Đà",
        desc: "Hợp khẩu vị số đông: Khách kiên nhẫn đứng chờ lâu hơn +20% (dễ đạt 5⭐)!"
      },
      {
        id: "mam_ruoc",
        icon: "🌶️",
        name: "Sốt Mắm Ruốc Cay Nồng",
        desc: "Kích thích vị giác: Khách gọi kèm Trà Tắc (+8.000đ) tăng +30% & +15% XP!"
      }
    ];

    function selectDailySauce(sauceId) {
      if (state.isStreetSelling) {
        showToast("⚠️ Chỉ có thể đổi Hũ Sốt Chủ Đạo vào buổi sáng trước khi mở bán!");
        return;
      }
      state.selectedDailySauce = sauceId;
      saveGameEverywhere(false);
      playSFX("sauce");
      renderCustomSauceLab();
      const sObj = DAILY_SAUCE_OPTIONS.find(x => x.id === sauceId);
      if (sObj) showToast(`🥣 Đã chọn ${sObj.name} làm vị sốt chủ đạo hôm nay!`);
    }

    function renderCustomSauceLab() {
      const box = document.getElementById("custom-sauce-lab-box");
      if (!box) return;
      const curSauce = state.selectedDailySauce || "";

      box.innerHTML = `
        <div class="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-300 mb-1.5">
          <img src="${CASUAL_2D_ASSETS.feat_sauce}" alt="Pha chế sốt" class="w-11 h-11 rounded-xl object-cover border border-amber-500 shrink-0" />
          <div class="text-[10px] font-bold text-amber-900 leading-snug">
            Mỗi sáng Dì Tư chuẩn bị 3 hũ sốt gia truyền. Hãy chọn <b>1 vị sốt chủ đạo</b> phù hợp chiến thuật bán hàng hôm nay của bạn!
          </div>
        </div>
        <div class="space-y-1.5">
          ${DAILY_SAUCE_OPTIONS.map(s => {
            const active = (s.id === curSauce);
            return `
              <div onclick="selectDailySauce('${s.id}')" class="cursor-pointer p-2 rounded-2xl border-2 ${active ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-amber-200 hover:border-amber-400'} flex items-center justify-between gap-2 text-xs transition-all">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class="text-xl shrink-0">${s.icon}</span>
                  <div class="min-w-0 flex-1">
                    <div class="font-black text-amber-950">${s.name}</div>
                    <div class="text-[10px] text-amber-800 leading-tight">${s.desc}</div>
                  </div>
                </div>
                <span class="px-2 py-1 rounded-xl font-black text-[10px] shrink-0 ${active ? 'bg-emerald-600 text-white shadow' : 'bg-amber-100 text-amber-900'}">
                  ${active ? '✓ Đang dùng' : 'Chọn'}
                </span>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }


    let activeDilemmaObj = null;
    function triggerRandomDilemmaEvent(manual = false) {
      if (!manual && isAnyBlockingModalOpen()) return;
      if (!Array.isArray(state.usedDilemmaIds)) state.usedDilemmaIds = [];

      let eligible = DILEMMA_EVENTS.filter(ev => (!ev.canTrigger || ev.canTrigger(state)) && !state.usedDilemmaIds.includes(ev.id));
      if (eligible.length === 0) {
        state.usedDilemmaIds = [];
        eligible = DILEMMA_EVENTS.filter(ev => !ev.canTrigger || ev.canTrigger(state));
      }
      if (eligible.length === 0) return;

      const ev = eligible[Math.floor(Math.random() * eligible.length)];
      activeDilemmaObj = ev;
      state.usedDilemmaIds.push(ev.id);
      playSFX("whistle");

      const canPickA = !ev.choiceA.reqCheck || ev.choiceA.reqCheck(state);

      const dIconEl = document.getElementById("dilemma-icon");
      if (dIconEl) {
        dIconEl.innerHTML = ev.img
          ? `<img src="${ev.img}" alt="${escapeHtml(ev.title)}" class="w-full h-full object-cover rounded-2xl" />`
          : ev.icon;
      }
      document.getElementById("dilemma-category").textContent = ev.category;
      document.getElementById("dilemma-title").textContent = ev.title;
      document.getElementById("dilemma-speaker").textContent = `🗣️ ${ev.speaker || "Khách quen Sài Gòn"}`;
      document.getElementById("dilemma-desc").textContent = ev.desc;
      document.getElementById("dilemma-choices").innerHTML = `
        <button onclick="chooseDilemmaOption('A')" ${canPickA ? '' : 'disabled'} class="soft-btn w-full p-2.5 rounded-xl ${canPickA ? 'btn-game-green' : 'bg-gray-200 text-gray-500'} font-black text-left">
          <div>👉 ${ev.choiceA.label}</div>
          ${!canPickA ? `<div class="text-[10px] text-red-200 font-bold mt-0.5">${ev.choiceA.lockReason}</div>` : ''}
        </button>
        <button onclick="chooseDilemmaOption('B')" class="soft-btn w-full p-2.5 rounded-xl bg-amber-100 text-amber-950 border-2 border-amber-300 font-extrabold text-left">
          👉 ${ev.choiceB.label}
        </button>
      `;
      document.getElementById("modal-dilemma").classList.remove("hidden");
    }

    function chooseDilemmaOption(opt) {
      if (!activeDilemmaObj) return;
      if (opt === "A" && activeDilemmaObj.choiceA.reqCheck && !activeDilemmaObj.choiceA.reqCheck(state)) return;
      const resMsg = (opt === "A" ? activeDilemmaObj.choiceA : activeDilemmaObj.choiceB).effect(state);
      if (opt === "A") state.resolvedDilemmasCount = (state.resolvedDilemmasCount || 0) + 1;
      document.getElementById("modal-dilemma").classList.add("hidden"); activeDilemmaObj = null;
      playSFX("cash"); updateAllUI(); saveGameEverywhere(); showToast(resMsg);
    }

    function openAchievementsModal() { renderAchievementsList(); document.getElementById("modal-achievements").classList.remove("hidden"); }
    function closeAchievementsModal() { document.getElementById("modal-achievements").classList.add("hidden"); }

    function renderAchievementsList() {
      const container = document.getElementById("achievements-list-container");
      if (!container) return;
      container.innerHTML = ACHIEVEMENTS_DATA.map(a => {
        const claimed = state.claimedAchievements.includes(a.id);
        const unlocked = !claimed && a.check(state);
        return `
          <div class="p-2.5 rounded-2xl border-2 ${claimed ? 'bg-emerald-50 border-emerald-400' : unlocked ? 'bg-amber-100 border-orange-500 shadow' : 'bg-white border-amber-200 opacity-80'} flex items-center justify-between gap-2">
            <div>
              <div class="font-black text-xs text-amber-950">${a.title}</div>
              <div class="text-[10px] text-amber-800">${a.desc}</div>
              <div class="text-[10px] font-extrabold text-emerald-700">+${formatVND(a.rewardMoney)} & +${a.rewardXp} XP</div>
            </div>
            <div class="shrink-0">
              ${claimed ? `<span class="px-2 py-1 rounded-xl bg-emerald-600 text-white font-black text-[10px]">✅ Đã Nhận</span>`
                        : unlocked ? `<button onclick="claimAchievement('${a.id}')" class="soft-btn btn-game-orange px-3 py-1.5 rounded-xl font-black text-xs animate-bounce">🎁 Nhận</button>`
                                   : `<span class="px-2 py-1 rounded-xl bg-gray-200 text-gray-600 font-bold text-[10px]">Đang cày</span>`}
            </div>
          </div>
        `;
      }).join("");
    }

    function claimAchievement(id) {
      const a = ACHIEVEMENTS_DATA.find(x => x.id === id);
      if (!a || state.claimedAchievements.includes(id) || !a.check(state)) return;
      state.claimedAchievements.push(id); state.money += a.rewardMoney; addXP(a.rewardXp);
      playSFX("cash"); renderAchievementsList(); updateAllUI(); saveGameEverywhere();
      showToast(`🎖️ Thành tựu "${a.title}": +${formatVND(a.rewardMoney)}!`);
    }

    function renderDiTuSmartTip() {
      const el = document.getElementById("ditu-smart-tip");
      if (!el) return;

      const unpurchased = getUnpurchasedEligibleDishes(false);
      if (unpurchased.length > 0) {
        const d = unpurchased[0];
        el.innerHTML = `🚨 Đủ cấp mở món <b>${d.name}</b> (${formatShortK(d.unlockCost)}) ở tab <b>🥙 Thực Đơn</b>!`;
        return;
      }

      const priceImp = getPricingCustomerImpact();
      if (priceImp.tier === "expensive") {
        el.innerHTML = `⚠️ Giá bán đang quá cao làm vắng 60% khách! Vào <b>🥙 Thực Đơn</b> hạ giá hoặc nâng <b>🤳 Thuê TikToker</b> nhé!`;
        return;
      }

      const usedSet = getActiveUsedIngredientSet();
      const expTodayList = INGREDIENTS.filter(ing => usedSet.has(ing.id) && getExpiringTodayInfo(ing.id).expTodayQty > 0);
      if (expTodayList.length > 0) {
        const previewNames = expTodayList.slice(0, 2).map(i => i.short).join(", ") + (expTodayList.length > 2 ? ` (+${expTodayList.length - 2} món)` : "");
        el.innerHTML = `⚠️ Cận date: <b>${previewNames}</b> • Nâng <b>🧊 Tủ Kính</b> để giữ tươi!`;
        return;
      }

      const actualCap = getActualCartBagDemandCap(state.day);
      const sched = getTodayScheduleInfo(state.day);
      el.innerHTML = `${sched.dowName} dự kiến ~<b>${actualCap} bịch</b>. Nâng cấp <b>📣 Hút Khách</b> nếu muốn quán đông hơn nghen!`;
    }

    function addXP(amount) {
      const xpMult = (window.serverLiveConfig && window.serverLiveConfig.enabled) ? Math.max(1, Number(window.serverLiveConfig.xpMult || 1)) : 1;
      state.xp += Math.round(amount * xpMult);
      let lObj = LEVEL_DATA.find(l => l.level === state.level);
      let leveledUp = false;
      while (lObj && state.level < MAX_PLAYER_LEVEL && state.xp >= lObj.xpNeed) {
        state.xp -= lObj.xpNeed;
        state.level += 1;
        leveledUp = true;
        lObj = LEVEL_DATA.find(l => l.level === state.level);
      }
      updateAllUI();
      if (leveledUp) {
        if (state.isStreetSelling) {
          pendingLevelUpQueue.push(state.level);
          spawnFloatingFX(`🎉 LÊN CẤP ${state.level}!`, "gold");
        } else {
          state.levelAtStartOfDay = state.level;
          showLevelUpModal(state.level);
        }
      }
    }

    function showLevelUpModal(newLvl) {
      const prepModal = document.getElementById("modal-prep");
      if (prepModal && !prepModal.classList.contains("hidden")) {
        pendingLevelUpQueue.push(newLvl);
        return;
      }
      const modal = document.getElementById("modal-level-up");
      if (!modal) return;
      playSFX("cash");
      const lObj = LEVEL_DATA.find(l => l.level === newLvl) || { title: "Huyền Thoại Sài Thành" };
      document.getElementById("lvlup-title").textContent = `Cấp ${newLvl} • ${lObj.title}!`;

      const unlockedItems = [];
      Object.values(DISH_MENU).forEach(d => { if (d.reqLevel <= newLvl && !state.unlockedDishes.includes(d.id)) unlockedItems.push(`🥙 Món mới: <b>${d.name}</b> (${formatShortK(d.unlockCost)})`); });
      STORY_CHAPTERS.forEach(ch => { if (ch.reqLevel === newLvl) unlockedItems.push(`📍 Chương mới: <b>${ch.title}</b>`); });
      STAFF_CATALOG.forEach(s => { if (s.reqLevel === newLvl) unlockedItems.push(`🧑‍🍳 Phụ bếp: <b>${s.name}</b>`); });
      LICENSES_CATALOG.forEach(l => { if (l.reqLevel === newLvl) unlockedItems.push(`📜 Giấy phép: <b>${l.name}</b>`); });

      const box = document.getElementById("lvlup-unlocked-box");
      box.innerHTML = unlockedItems.length > 0
        ? `<div class="font-black text-emerald-800 mb-1">🎁 Mở khóa ở Cấp ${newLvl}:</div>` + unlockedItems.map(i => `<div>• ${i}</div>`).join("")
        : `<div class="font-bold text-emerald-800">✨ Thưởng thăng cấp <b>+20.000đ</b> vào két tiền!</div>`;
      if (unlockedItems.length === 0) {
        state.money += 20000;
        state.todayRevenue = (state.todayRevenue || 0) + 20000;
        recordExtraEventRevDetail(20000);
      }

      document.getElementById("lvlup-next-teaser").innerHTML = `🔥 Vào tab <b>🥙 Thực Đơn</b> và <b>🛠️ Nâng Cấp</b> để nâng đời Đồ Nghề & mở rộng xe đẩy nhé!`;
      modal.classList.remove("hidden");
      updateAllUI();
    }

    function closeLevelUpModal() {
      document.getElementById("modal-level-up").classList.add("hidden");
      if (state.money < 0 || (state.money < 15000 && (state.stock.banhtrang || 0) < 1)) {
        checkBankruptcyOrRescueLoan();
      }
    }

    function switchUpgradeSubTab(sub) {
      if (sub === "dishes") {
        switchPrepSubTab("menu");
        return;
      }
      if (sub === "tools") sub = "marketing";
      if (sub === "cart") sub = "comfort";
      currentUpgradeSubTab = sub;
      ["marketing", "comfort", "staff", "scale", "decor", "licenses"].forEach(k => {
        const btn = document.getElementById(`upg-sub-${k}`);
        if (btn) btn.className = k === sub ? "soft-btn py-1.5 px-1 rounded-lg font-black text-[10px] bg-orange-600 text-white shadow" : "soft-btn py-1.5 px-1 rounded-lg font-black text-[10px] text-amber-950 bg-white";
      });
      renderUpgradesTab();
    }

    // Giao diện Thẻ Nâng Cấp 1 Hàng Ngang Gọn Đẹp (Bỏ hoàn toàn 2 hộp giải thích Đột Phá gây rối mắt)
    function renderEquipBranchCards(branchKey) {
      const list = EQUIP_UPGRADES.filter(eq => eq.branch === branchKey);
      return `<div class="space-y-1.5">${list.map(eq => {
        const cur = state.equipLevels[eq.id] || 0;
        const isMax = cur >= eq.maxLvl;
        const nextLvl = cur + 1;
        const reqLvl = getEquipLevelGate(eq, nextLvl);
        const canLevel = state.level >= reqLvl;
        const cost = getEquipCost(eq);
        const badgeStyle = isMax
          ? "bg-amber-400 text-amber-950 border-amber-700"
          : cur > 0
            ? "bg-emerald-100 text-emerald-900 border-emerald-400"
            : "bg-amber-100 text-amber-900 border-amber-300";

        return `
          <div class="p-2 rounded-2xl bg-amber-50/90 border-2 ${isMax ? 'border-amber-500 bg-yellow-50/90' : cur > 0 ? 'border-emerald-300' : 'border-amber-200'} flex items-center justify-between gap-2 text-xs shadow-sm">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <img src="${eq.img}" alt="${escapeHtml(eq.name)}" class="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 shrink-0 shadow-sm" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="font-black text-amber-950 text-xs">${eq.name}</span>
                  <span class="px-1.5 py-0.5 rounded-full text-[9px] font-black border ${badgeStyle}">Cấp ${cur}/${eq.maxLvl}</span>
                </div>

                <div class="text-[10px] font-extrabold text-emerald-800 leading-tight mt-0.5">${eq.effectLine(cur)}</div>
              </div>
            </div>

            <div class="shrink-0">
              ${isMax
                ? `<span class="px-2.5 py-1.5 rounded-xl bg-amber-400 text-amber-950 border border-amber-700 font-black text-[10px] inline-block shadow">👑 Đạt Đỉnh</span>`
                : canLevel
                  ? `<button onclick="buyEquipUpgrade('${eq.id}')" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Nâng Cấp ${nextLvl}</div><div class="text-[9px] text-yellow-200">${formatShortK(cost)}</div></button>`
                  : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px] inline-block">🔒 Cấp ${reqLvl}</span>`
              }
            </div>
          </div>
        `;
      }).join("")}</div>`;
    }

    function renderUpgradesTab() {
      const container = document.getElementById("upgrade-sub-content");
      if (!container) return;

      if (currentUpgradeSubTab === "marketing") {
        container.innerHTML = renderEquipBranchCards("marketing");
      } else if (currentUpgradeSubTab === "comfort") {
        container.innerHTML = renderEquipBranchCards("comfort");
      } else if (currentUpgradeSubTab === "staff") {
        container.innerHTML = `<div class="space-y-2">${STAFF_CATALOG.map(st => {
          const hired = state.staff[st.id];
          const star = state.staffStars?.[st.id] || 1;
          const okHire = state.level >= st.reqLevel;
          const nextStar = star + 1;
          const trainCost = getStaffTrainCost(st);
          const reqTrainLvl = getStaffTrainReqLevel(st, nextStar);
          const okTrain = state.level >= reqTrainLvl;
          const effWage = st.dailyWage + (star - 1) * 4000;

          let actionHtml = "";
          if (!hired) {
            actionHtml = okHire
              ? `<button onclick="hireStaffMember('${st.id}')" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px]">Thuê (${formatShortK(st.hireCost)})</button>`
              : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${st.reqLevel}</span>`;
          } else if (star < 5) {
            actionHtml = okTrain
              ? `<button onclick="trainStaffMember('${st.id}')" class="soft-btn btn-game-green px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Đào Tạo ${nextStar}⭐</div><div class="text-[9px] text-emerald-100">${formatShortK(trainCost)}</div></button>`
              : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${reqTrainLvl} (${nextStar}⭐)</span>`;
          } else {
            actionHtml = `<span class="px-2.5 py-1.5 bg-amber-400 text-amber-950 border border-amber-700 font-black rounded-xl text-[10px] inline-block">👑 Thợ Chính 5⭐</span>`;
          }

          return `<div class="p-2 rounded-2xl bg-amber-50/90 border-2 ${hired ? 'border-emerald-400' : 'border-amber-200'} flex items-center justify-between gap-2 text-xs shadow-sm">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <img src="${st.portrait}" alt="${escapeHtml(st.name)}" class="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 shrink-0 shadow-sm" />
              <div class="min-w-0 flex-1 leading-snug">
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="font-black text-amber-950 text-xs">${st.name}</span>
                  ${hired ? `<span class="px-1.5 py-0.5 rounded-full bg-amber-300 text-amber-950 font-black text-[9px] border border-amber-600">${"⭐".repeat(star)}</span>` : ''}
                  <span class="text-red-700 font-bold text-[9px]">• Lương ${formatShortK(effWage)}/ngày</span>
                </div>
                <div class="text-[10px] text-amber-900 mt-0.5">${st.role}</div>
                <div class="text-[10px] font-extrabold text-emerald-800 mt-0.5">🌟 ${st.starPerk(star)}</div>
              </div>
            </div>
            <div class="shrink-0">${actionHtml}</div>
          </div>`;
        }).join("")}</div>`;
      } else if (currentUpgradeSubTab === "scale") {
        const curScale = Math.min(6, Math.max(0, Number(state.shopScale || 0)));
        const expScale = getExpectedShopScaleForLevel(state.level);
        const subMode = window.activeScaleSubFilter || "matbang";
        const filterNav = `
          <div class="grid grid-cols-3 gap-1 bg-amber-100/80 p-1 rounded-xl border border-amber-300">
            <button type="button" onclick="switchScaleSubFilter('matbang')" class="soft-btn py-1 rounded-lg font-black text-[10px] ${subMode === 'matbang' ? 'bg-amber-800 text-white shadow' : 'bg-white text-amber-950'}">🏢 Quy Mô (${curScale}/6)</button>
            <button type="button" onclick="switchScaleSubFilter('xuong')" class="soft-btn py-1 rounded-lg font-black text-[10px] ${subMode === 'xuong' ? 'bg-amber-800 text-white shadow' : 'bg-white text-amber-950'}">🏭 Xưởng (3)</button>
            <button type="button" onclick="switchScaleSubFilter('chinhanh')" class="soft-btn py-1 rounded-lg font-black text-[10px] ${subMode === 'chinhanh' ? 'bg-amber-800 text-white shadow' : 'bg-white text-amber-950'}">🏪 Chi Nhánh (5)</button>
          </div>
        `;

        let bodyHtml = "";
        if (subMode === "matbang") {
          bodyHtml = SHOP_SCALE_TIERS.slice(1).map(st => {
            const isOwned = curScale >= st.tier;
            const isNext = curScale + 1 === st.tier;
            const canLevel = state.level >= st.reqLevel;
            let btnHtml = "";
            if (isOwned) {
              btnHtml = `<span class="px-2 py-1 rounded-xl bg-emerald-600 text-white font-black text-[10px] inline-block shadow">✅ Đã Mở</span>`;
            } else if (isNext && canLevel) {
              btnHtml = `<button onclick="buyShopScaleTier(${st.tier})" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Nâng Bậc ${st.tier}</div><div class="text-[9px] text-yellow-200">${formatShortK(st.cost)}</div></button>`;
            } else if (!canLevel) {
              btnHtml = `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px] inline-block">🔒 Cấp ${st.reqLevel}</span>`;
            } else {
              btnHtml = `<span class="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-[10px] inline-block">Cần Bậc ${st.tier - 1}</span>`;
            }
            return `
              <div class="p-2 rounded-2xl border-2 ${isOwned ? 'bg-emerald-50/90 border-emerald-400' : isNext ? 'bg-amber-50 border-orange-400 shadow-md' : 'bg-white/80 border-amber-200 opacity-85'} flex items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <img src="${st.img}" alt="${escapeHtml(st.name)}" class="w-10 h-10 rounded-xl object-cover border-2 border-amber-500 shrink-0 shadow-sm" />
                  <div class="min-w-0 flex-1">
                    <div class="font-black text-amber-950 text-xs leading-tight">${st.icon} ${st.name}</div>
                    <div class="text-[10px] font-extrabold text-emerald-800 leading-tight mt-0.5">${st.perkText}</div>
                  </div>
                </div>
                <div class="shrink-0">${btnHtml}</div>
              </div>
            `;
          }).join("");
        } else if (subMode === "xuong") {
          bodyHtml = SUPPLY_WORKSHOPS.map(ws => {
            const lvl = Math.min(3, Math.max(0, Number(state.workshops?.[ws.id] || 0)));
            const isMax = lvl >= 3;
            const nextCost = ws.costs[lvl] || 0;
            const reqLvl = ws.reqLevels[lvl] || 80;
            const canLvl = state.level >= reqLvl;
            return `
              <div class="p-2 rounded-2xl bg-amber-50/90 border-2 ${isMax ? 'border-amber-500 bg-yellow-50' : lvl > 0 ? 'border-emerald-300' : 'border-amber-200'} flex items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <img src="${ws.img}" alt="${escapeHtml(ws.name)}" class="w-10 h-10 rounded-xl object-cover border-2 border-amber-500 shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="font-black text-amber-950 text-xs">${ws.name} <span class="px-1.5 py-0.5 rounded-full bg-amber-200 text-[9px]">Cấp ${lvl}/3</span></div>
                    <div class="text-[10px] font-extrabold text-emerald-800 mt-0.5">${ws.effectLine(lvl)}</div>
                  </div>
                </div>
                <div class="shrink-0">
                  ${isMax
                    ? `<span class="px-2 py-1 rounded-xl bg-amber-400 text-amber-950 font-black text-[10px]">👑 Tối Đa</span>`
                    : canLvl
                      ? `<button onclick="upgradeSupplyWorkshop('${ws.id}')" class="soft-btn btn-game-green px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Ký Cấp ${lvl + 1}</div><div class="text-[9px] text-emerald-100">${formatShortK(nextCost)}</div></button>`
                      : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${reqLvl}</span>`
                  }
                </div>
              </div>
            `;
          }).join("");
        } else {
          const estDiv = getDailyFranchiseDividend(false);
          const headerNote = `<div class="px-2 py-1 rounded-lg bg-teal-50 border border-teal-300 flex items-center justify-between text-[10px] font-bold text-teal-900"><span>💎 Cộng +15% Định Giá BXH (Bán ≥12p & ≥4.2⭐)</span><span>+${formatShortK(estDiv)}/tối</span></div>`;
          bodyHtml = headerNote + FRANCHISE_BRANCHES.map(fr => {
            const lvl = Math.min(5, Math.max(0, Number(state.franchises?.[fr.id] || 0)));
            const isMax = lvl >= 5;
            const nextCost = fr.costs[lvl] || 0;
            const canLvl = state.level >= fr.reqLevel;
            const curPayout = fr.dailyPayouts[lvl] || 0;
            const nextPayout = fr.dailyPayouts[lvl + 1] || curPayout;
            return `
              <div class="p-2 rounded-2xl bg-white border-2 ${isMax ? 'border-amber-500 bg-yellow-50/70' : lvl > 0 ? 'border-teal-400 bg-teal-50/30' : 'border-amber-200'} flex items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <img src="${fr.img}" alt="${escapeHtml(fr.name)}" class="w-10 h-10 rounded-xl object-cover border-2 border-amber-500 shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="font-black text-amber-950 text-xs">${fr.name} <span class="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[9px]">Cấp ${lvl}/5</span></div>
                    <div class="text-[10px] font-extrabold text-teal-800 mt-0.5">💎 Định giá +15% • Thưởng: ${lvl > 0 ? '+' + formatShortK(curPayout) : '0đ'}${!isMax ? ' ➔ +' + formatShortK(nextPayout) + '/tối' : '/tối'}</div>
                  </div>
                </div>
                <div class="shrink-0">
                  ${isMax
                    ? `<span class="px-2 py-1 rounded-xl bg-amber-400 text-amber-950 font-black text-[10px]">👑 Cấp 5/5</span>`
                    : canLvl
                      ? `<button onclick="upgradeFranchiseBranch('${fr.id}')" class="soft-btn btn-game-blue px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>${lvl === 0 ? 'Mở Quầy' : 'Nâng Cấp ' + (lvl + 1)}</div><div class="text-[9px] text-yellow-200">${formatShortK(nextCost)}</div></button>`
                      : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${fr.reqLevel}</span>`
                  }
                </div>
              </div>
            `;
          }).join("");
        }

        container.innerHTML = `
          <div class="space-y-1.5">
            <div class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 flex items-center justify-between text-xs">
              <div class="min-w-0">
                <div class="font-black text-amber-950 leading-tight">🏢 ${SHOP_SCALE_TIERS[curScale].name}</div>
                <div class="text-[10px] font-bold ${curScale < expScale ? 'text-rose-700' : 'text-emerald-800'}">${curScale < expScale ? '⚠️ Chương này cần Quy Mô Bậc ' + expScale + '+ để chống hao mòn xe!' : '💎 Tăng +15% Định giá BXH & Chống hao mòn xe'}</div>
              </div>
              <img src="${SHOP_SCALE_TIERS[curScale].img}" alt="Scale" class="w-8 h-8 rounded-lg object-cover border border-amber-500 shrink-0" />
            </div>
            ${filterNav}
            <div class="space-y-1.5">${bodyHtml}</div>
          </div>
        `;
      } else if (currentUpgradeSubTab === "decor") {
        const slots = [
          { key: "lights", short: "🏮 Đèn" },
          { key: "sign", short: "🪧 Bảng" },
          { key: "prop", short: "🐱 Linh vật" },
          { key: "table", short: "🥣 Bàn" },
          { key: "particles", short: "🎇 Hiệu ứng" },
          { key: "awning", short: "🏖️ Mái hiên" }
        ];
        const activeSlot = window.activeDecorSlotFilter || "lights";
        const ownedList = Array.isArray(state.ownedDecors) ? state.ownedDecors : [];
        const eqMap = state.equippedDecors || {};

        const slotTabsHtml = slots.map(sl => `
          <button type="button" onclick="switchDecorSlotFilter('${sl.key}')" class="soft-btn py-1 px-1 rounded-lg font-black text-[9.5px] whitespace-nowrap ${activeSlot === sl.key ? 'bg-rose-600 text-white shadow' : 'bg-white text-amber-950 border border-amber-200'}">
            ${sl.short}${eqMap[sl.key] ? ' ✓' : ''}
          </button>
        `).join("");

        const items = DECOR_CATALOG.filter(x => x.slot === activeSlot);
        const cardsHtml = items.map(item => {
          const owned = ownedList.includes(item.id);
          const equipped = eqMap[activeSlot] === item.id;
          let actionBtn = "";
          if (!owned) {
            actionBtn = `<button onclick="buyOrToggleDecor('${item.id}')" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Mua</div><div class="text-[9px] text-yellow-200">${formatShortK(item.cost)}</div></button>`;
          } else if (equipped) {
            actionBtn = `<button onclick="buyOrToggleDecor('${item.id}')" class="soft-btn px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] shadow">✨ Đang Dùng</button>`;
          } else {
            actionBtn = `<button onclick="buyOrToggleDecor('${item.id}')" class="soft-btn btn-game-blue px-2.5 py-1.5 rounded-xl font-black text-[10px]">Trang Bị</button>`;
          }
          return `
            <div class="p-2 rounded-2xl border-2 ${equipped ? 'bg-yellow-50 border-amber-500 shadow-md' : owned ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-amber-200'} flex items-center justify-between gap-2 text-xs">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <img src="${item.img}" alt="${escapeHtml(item.name)}" class="w-10 h-10 rounded-xl object-cover border border-amber-400 shrink-0 shadow-sm" />
                <div class="min-w-0 flex-1">
                  <div class="font-black text-amber-950 text-xs">${item.icon} ${item.name}</div>
                  <div class="text-[10px] text-amber-800 leading-tight mt-0.5">${item.desc}</div>
                </div>
              </div>
              <div class="shrink-0">${actionBtn}</div>
            </div>
          `;
        }).join("");

        container.innerHTML = `
          <div class="space-y-1.5">
            <div class="px-2.5 py-1 rounded-xl bg-gradient-to-r from-pink-50 via-amber-50 to-yellow-50 border border-amber-400 text-[10px] font-bold text-amber-950 flex items-center justify-between">
              <span>🎨 Điểm Phong Cách BXH (Giữ 100% Định giá Tài sản)</span>
              <span class="px-2 py-0.5 rounded-full bg-amber-200 font-black whitespace-nowrap">🎨 ${ownedList.length}/${DECOR_CATALOG.length}</span>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-1">${slotTabsHtml}</div>
            <div class="space-y-1.5">${cardsHtml}</div>
          </div>
        `;
      } else {
        // Tab 10 Giấy Phép & Lộ Trình 8 Chương Địa Điểm Sài Gòn
        const licensesHtml = LICENSES_CATALOG.map(lic => {
          const owned = state.licenses[lic.id], ok = state.level >= lic.reqLevel;
          return `<div class="p-2.5 rounded-2xl bg-amber-50/90 border-2 ${owned ? 'border-emerald-400 bg-emerald-50/40' : 'border-amber-200'} flex items-center justify-between gap-2 text-xs shadow-sm">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <img src="${lic.img}" alt="${escapeHtml(lic.name)}" class="w-11 h-11 rounded-xl object-cover border-2 border-amber-500 shrink-0 shadow-sm" />
              <div class="min-w-0 flex-1">
                <div class="font-black text-amber-950">${lic.name}</div>
                <div class="text-[10px] text-amber-800">${lic.desc}</div>
              </div>
            </div>
            <div class="shrink-0">${owned ? `<span class="px-2.5 py-1 bg-emerald-600 text-white font-black rounded-xl text-[10px]">✅ Đã Cấp</span>` : ok ? `<button onclick="buyLicenseItem('${lic.id}')" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px]">Đăng ký (${formatShortK(lic.cost)})</button>` : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${lic.reqLevel}</span>`}</div>
          </div>`;
        }).join("");

        const chaptersHtml = STORY_CHAPTERS.map(ch => {
          const unlocked = state.level >= ch.reqLevel;
          const claimed = state.claimedChapters.includes(ch.id);
          const canClaim = !claimed && ch.check(state);
          return `
            <div class="p-2.5 rounded-2xl border-2 ${claimed ? 'bg-emerald-50 border-emerald-400' : unlocked ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200 opacity-75'} space-y-1 text-xs shadow-sm">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <img src="${ch.img}" alt="${escapeHtml(ch.shortLoc)}" class="w-10 h-10 rounded-xl object-cover border border-amber-500 shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="font-black text-amber-950">${ch.title}</div>
                    <div class="text-[10px] font-bold text-emerald-800">🌟 ${ch.passiveDesc}</div>
                  </div>
                </div>
                <div class="shrink-0">
                  ${claimed
                    ? `<span class="px-2 py-1 rounded-lg bg-emerald-600 text-white font-black text-[9px]">✅ Đã Nhận</span>`
                    : canClaim
                      ? `<button onclick="claimStoryChapter(${ch.id})" class="soft-btn btn-game-orange px-2.5 py-1 rounded-lg font-black text-[10px] animate-bounce">🎁 +${formatShortK(ch.reward)}</button>`
                      : `<span class="text-[9px] font-bold text-amber-800">+${formatShortK(ch.reward)}</span>`
                  }
                </div>
              </div>
              <div class="text-[10px] text-amber-900">🎯 Mục tiêu: <b>${ch.goalDesc}</b></div>
            </div>
          `;
        }).join("");

        container.innerHTML = `
          <div class="space-y-2">
            <div class="font-black text-xs text-amber-950">📜 10 Giấy Phép & Chứng Nhận</div>
            ${licensesHtml}
            <div class="font-black text-xs text-amber-950 pt-2 border-t border-amber-200">📍 Lộ Trình 8 Chương Đời (Cấp 1 ➔ 80)</div>
            ${chaptersHtml}
          </div>
        `;
      }
    }

    function buyDishRecipe(id) {
      const d = DISH_MENU[id];
      if (!d) return;
      if (state.level < d.reqLevel) { showToast(`🔒 Cần đạt Cấp ${d.reqLevel} để mở món này!`); return; }
      if (state.money < d.unlockCost) { showToast("❌ Chưa đủ tiền mở món mới!"); return; }
      state.money -= d.unlockCost;
      if (!state.unlockedDishes.includes(id)) state.unlockedDishes.push(id);
      playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast(`🎉 Đã mở khóa món ${d.name}!`);
    }

    function hireStaffMember(id) {
      const st = STAFF_CATALOG.find(x => x.id === id);
      if (!st) return;
      if (state.money < st.hireCost) { showToast("❌ Chưa đủ tiền thuê phụ bếp!"); return; }
      state.money -= st.hireCost;
      state.staff[id] = true;
      if (!state.staffStars) state.staffStars = { beti: 1, mylan: 1, tunghia: 1, anhba: 1, baoloc: 1, kimngan: 1, utnhanh: 1 };
      state.staffStars[id] = 1;
      if (id === "mylan") state.prepDone = { sate: true, hanhphi: true, trungcut: true };
      playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast(`🧑‍🍳 Đã tuyển dụng ${st.name} (1⭐)!`);
    }

    function trainStaffMember(id) {
      const st = STAFF_CATALOG.find(x => x.id === id);
      if (!st || !state.staff[id]) return;
      const curStar = state.staffStars?.[id] || 1;
      if (curStar >= 5) return;
      const nextStar = curStar + 1;
      const reqLvl = getStaffTrainReqLevel(st, nextStar);
      if (state.level < reqLvl) {
        showToast(`🔒 Cần đạt Cấp ${reqLvl} để đào tạo ${st.name} lên ${nextStar}⭐!`);
        return;
      }
      const cost = getStaffTrainCost(st);
      if (state.money < cost) {
        showToast(`❌ Cần ${formatVND(cost)} để đào tạo ${st.name} lên ${nextStar}⭐!`);
        return;
      }
      state.money -= cost;
      state.staffStars[id] = nextStar;
      addXP(25);
      playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast(`🌟 ${st.name} đã thăng cấp tay nghề lên ${nextStar}⭐!`);
    }

    function buyEquipUpgrade(id) {
      const eq = EQUIP_UPGRADES.find(x => x.id === id);
      if (!eq) return;
      const cur = state.equipLevels[id] || 0;
      if (cur >= eq.maxLvl) return;
      const nextLvl = cur + 1;
      const reqLvl = getEquipLevelGate(eq, nextLvl);
      if (state.level < reqLvl) {
        showToast(`🔒 Cần đạt Cấp ${reqLvl} để nâng ${eq.name} lên Cấp ${nextLvl}!`);
        return;
      }
      const cost = getEquipCost(eq);
      if (state.money < cost) { showToast("❌ Chưa đủ tiền nâng cấp đồ nghề!"); return; }
      state.money -= cost;
      state.equipLevels[id] = nextLvl;
      addXP(20);
      playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast(`🎉 Đã nâng cấp ${eq.name} lên Cấp ${nextLvl}/${eq.maxLvl}!`);
    }

    function buyLicenseItem(id) {
      const lic = LICENSES_CATALOG.find(x => x.id === id);
      if (!lic || state.licenses[id]) return;
      if (state.level < lic.reqLevel) { showToast(`🔒 Cần đạt Cấp ${lic.reqLevel}!`); return; }
      if (state.money < lic.cost) { showToast("❌ Chưa đủ tiền đăng ký giấy phép!"); return; }
      state.money -= lic.cost;
      state.licenses[id] = true;
      addXP(40);
      playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast(`📜 Đã cấp ${lic.name}!`);
    }

    function activateDailySalesStrategy(stratId) {
      const st = SALES_STRATEGIES.find(x => x.id === stratId);
      if (!st) return;
      if (state.level < st.reqLevel) { showToast(`🔒 Cần đạt Cấp ${st.reqLevel}!`); return; }
      if (state.activeSalesStrategy === stratId) return;
      if (state.money < st.cost) { showToast(`❌ Cần ${formatVND(st.cost)} ngân sách quảng cáo!`); return; }
      state.money -= st.cost;
      state.todayCogsSpent += st.cost;
      state.activeSalesStrategy = stratId;
      if (st.forceRushEvent) state.pendingGuaranteedRushEvent = true;
      playSFX("win");
      updateAllUI();
      saveGameEverywhere();
      showToast(`📢 Đã bật: ${st.name}!`);
    }

    function switchScaleSubFilter(mode) {
      window.activeScaleSubFilter = mode;
      renderUpgradesTab();
    }

    function switchDecorSlotFilter(slotKey) {
      window.activeDecorSlotFilter = slotKey;
      renderUpgradesTab();
    }

    function getChapterTaxRate() {
      const chapId = getCurrentChapterObj()?.id || 1;
      if (chapId <= 1) return 0;
      return Math.min(0.16, 0.02 + chapId * 0.0175);
    }

    function buyShopScaleTier(targetTier) {
      const st = SHOP_SCALE_TIERS.find(x => x.tier === targetTier);
      const cur = Number(state.shopScale || 0);
      if (!st || cur >= targetTier || targetTier !== cur + 1) return;
      if (state.level < st.reqLevel) { showToast(`🔒 Cần đạt Cấp ${st.reqLevel}!`); return; }
      if (state.money < st.cost) { showToast(`❌ Cần ${formatVND(st.cost)} để nâng cấp ${st.name}!`); return; }
      state.money -= st.cost;
      state.shopScale = targetTier;
      state.cartDurability = 100;
      addXP(60);
      playSFX("win");
      updateAllUI();
      saveGameEverywhere();
      showToast(`🏢 Đã nâng cấp: ${st.name}!`);
    }

    function upgradeSupplyWorkshop(wsId) {
      const ws = SUPPLY_WORKSHOPS.find(x => x.id === wsId);
      if (!ws) return;
      if (!state.workshops) state.workshops = { ws_tayninh: 0, ws_tiengiang: 0, ws_khobo: 0 };
      const cur = Math.min(3, Math.max(0, Number(state.workshops[wsId] || 0)));
      if (cur >= 3) return;
      const reqLvl = ws.reqLevels[cur] || 80;
      const cost = ws.costs[cur] || 0;
      if (state.level < reqLvl) { showToast(`🔒 Cần đạt Cấp ${reqLvl}!`); return; }
      if (state.money < cost) { showToast(`❌ Cần ${formatVND(cost)}!`); return; }
      state.money -= cost;
      state.workshops[wsId] = cur + 1;
      addXP(45);
      playSFX("win");
      updateAllUI();
      saveGameEverywhere();
      showToast(`🏭 ${ws.name} đạt Cấp ${cur + 1}/3!`);
    }

    function upgradeFranchiseBranch(frId) {
      const fr = FRANCHISE_BRANCHES.find(x => x.id === frId);
      if (!fr) return;
      if (!state.franchises) state.franchises = { fr_benthanh: 0, fr_buivien: 0, fr_thuthiem: 0, fr_landmark: 0, fr_airport: 0 };
      const cur = Math.min(5, Math.max(0, Number(state.franchises[frId] || 0)));
      if (cur >= 5) return;
      const cost = fr.costs[cur] || 0;
      if (state.level < fr.reqLevel) { showToast(`🔒 Cần đạt Cấp ${fr.reqLevel}!`); return; }
      if (state.money < cost) { showToast(`❌ Cần ${formatVND(cost)}!`); return; }
      state.money -= cost;
      state.franchises[frId] = cur + 1;
      addXP(55);
      playSFX("win");
      updateAllUI();
      saveGameEverywhere();
      showToast(`🏪 ${fr.name} đạt Cấp ${cur + 1}/5!`);
    }

    function getDailyFranchiseDividend(requireActiveDayCheck = true) {
      if (requireActiveDayCheck && ((state.todaySold || 0) < 12 || Number(state.rating || 4.3) < 4.0)) {
        return 0;
      }
      let baseSum = 0;
      FRANCHISE_BRANCHES.forEach(fr => {
        const lvl = Math.min(5, Math.max(0, Number(state.franchises?.[fr.id] || 0)));
        if (lvl > 0) baseSum += (fr.dailyPayouts[lvl] || 0);
      });
      if (baseSum <= 0) return 0;
      const r = Number(state.rating || 4.3);
      const rMult = r >= 4.8 ? 1.15 : (r >= 4.2 ? 1.0 : 0.75);
      const licMult = state.licenses?.lic_franchise ? 1.15 : 1.0;
      const scaleMult = Number(state.shopScale || 0) >= 6 ? 1.15 : 1.0;
      return Math.round((baseSum * rMult * licMult * scaleMult) / 500) * 500;
    }

    function buyOrToggleDecor(decorId) {
      const item = DECOR_CATALOG.find(x => x.id === decorId);
      if (!item) return;
      if (!Array.isArray(state.ownedDecors)) state.ownedDecors = [];
      if (!state.equippedDecors || typeof state.equippedDecors !== "object") {
        state.equippedDecors = { lights: "", sign: "", prop: "", table: "", particles: "", awning: "" };
      }

      if (!state.ownedDecors.includes(decorId)) {
        if (state.money < item.cost) {
          showToast(`❌ Cần ${formatVND(item.cost)} để mua ${item.name}!`);
          return;
        }
        state.money -= item.cost;
        state.ownedDecors.push(decorId);
        state.equippedDecors[item.slot] = decorId;
        playSFX("win");
        updateAllUI();
        saveGameEverywhere();
        showToast(`🎨 Đã trang bị: ${item.name}!`);
        return;
      }

      if (state.equippedDecors[item.slot] === decorId) {
        state.equippedDecors[item.slot] = "";
        playSFX("snip");
        showToast(`Đã tháo: ${item.name}`);
      } else {
        state.equippedDecors[item.slot] = decorId;
        playSFX("snip");
        showToast(`✨ Đã trang bị: ${item.name}!`);
      }
      updateAllUI();
      saveGameEverywhere();
    }

    function applyEquippedDecorsVisuals() {
      const eq = state.equippedDecors || {};
      const stageEl = document.getElementById("stage-sky-container");
      const lightsBar = document.getElementById("stage-decor-lights-bar");
      const signBox = document.getElementById("stage-sign-box");
      const propBadge = document.getElementById("stage-decor-prop-badge");
      const worktable = document.getElementById("main-worktable-box");
      const vesselRim = document.getElementById("svg-vessel-rim");
      const topAwning = document.getElementById("top-awning-roof");

      if (stageEl) {
        stageEl.classList.remove("stage-skin-neon", "stage-skin-tet");
        if (eq.lights === "light_neon") stageEl.classList.add("stage-skin-neon");
        if (eq.lights === "light_tet") stageEl.classList.add("stage-skin-tet");
      }
      if (lightsBar) {
        const lObj = DECOR_CATALOG.find(x => x.id === eq.lights);
        if (lObj && lObj.previewEmojis) {
          lightsBar.classList.remove("hidden");
          lightsBar.innerHTML = lObj.previewEmojis.map((em, i) => `<span class="decor-lantern-item" style="animation-delay:${(i * 0.25).toFixed(2)}s">${em}</span>`).join("");
        } else {
          lightsBar.classList.add("hidden");
          lightsBar.innerHTML = "";
        }
      }

      if (signBox) {
        signBox.classList.remove("sign-skin-retro90", "sign-skin-wood", "sign-skin-led", "sign-skin-royal");
        const sObj = DECOR_CATALOG.find(x => x.id === eq.sign);
        if (sObj && sObj.cssClass) signBox.classList.add(sObj.cssClass);
      }

      if (propBadge) {
        const pObj = DECOR_CATALOG.find(x => x.id === eq.prop);
        if (pObj && pObj.badgeEmoji) {
          propBadge.textContent = pObj.badgeEmoji;
          propBadge.classList.remove("hidden");
        } else {
          propBadge.textContent = "";
          propBadge.classList.add("hidden");
        }
      }

      if (worktable) {
        worktable.classList.remove("worktable-skin-marble", "worktable-skin-bamboo", "worktable-skin-ebony", "worktable-skin-gold");
        const tObj = DECOR_CATALOG.find(x => x.id === eq.table);
        if (tObj && tObj.tableClass) worktable.classList.add(tObj.tableClass);
        if (vesselRim) {
          vesselRim.setAttribute("stroke", (tObj && tObj.rimColor) ? tObj.rimColor : "#1e293b");
        }
      }

      if (topAwning) {
        topAwning.classList.remove("awning-skin-mint", "awning-skin-cholon", "awning-skin-cyber", "awning-skin-royal");
        const aObj = DECOR_CATALOG.find(x => x.id === eq.awning);
        if (aObj && aObj.awningClass) topAwning.classList.add(aObj.awningClass);
      }
    }

    function openStoryModal() {
      document.getElementById("story-chapters-container").innerHTML = STORY_CHAPTERS.map(ch => `
        <div class="p-2.5 rounded-2xl border-2 ${state.claimedChapters.includes(ch.id) ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-amber-300'} space-y-1">
          <div class="flex items-center gap-2">
            <img src="${ch.img}" alt="${escapeHtml(ch.shortLoc)}" class="w-10 h-10 rounded-xl object-cover border border-amber-500 shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex justify-between font-black text-xs"><span>${ch.title}</span><span class="text-emerald-700 shrink-0">+${formatShortK(ch.reward)}</span></div>
              <div class="text-[10px] font-bold text-orange-700">${ch.passiveDesc}</div>
            </div>
          </div>
          <p class="text-[11px] text-amber-900 italic">"${ch.story}"</p>
          <div class="flex justify-between items-center text-[11px] pt-1 border-t"><span>🎯 ${ch.goalDesc}</span>${state.claimedChapters.includes(ch.id) ? `<span class="font-black text-emerald-700">✅ Đã nhận</span>` : ch.check(state) ? `<button onclick="claimStoryChapter(${ch.id})" class="px-2.5 py-1 bg-orange-600 text-white font-black rounded-lg">Nhận Thưởng</button>` : `<span class="text-amber-800 font-bold">Đang làm</span>`}</div>
        </div>
      `).join("");
      document.getElementById("modal-story").classList.remove("hidden");
    }
    function claimStoryChapter(id) {
      const ch = STORY_CHAPTERS.find(c => c.id == id); if (!ch || state.claimedChapters.includes(ch.id)) return;
      state.claimedChapters.push(ch.id); state.money += ch.reward; addXP(50); playSFX("cash"); openStoryModal(); updateAllUI(); saveGameEverywhere(); showToast(`📖 Nhận thưởng ${ch.shortLoc}: +${formatVND(ch.reward)}!`);
    }
    function closeStoryModal() { document.getElementById("modal-story").classList.add("hidden"); }

    function getRepairCost() {
      const missing = Math.max(0, 100 - Math.round(state.cartDurability || 100));
      if (missing <= 0) return 0;
      return Math.max(20000, Math.round((missing * (550 + state.level * 55)) / 1000) * 1000);
    }
    function repairCartEquipment() {
      if ((state.cartDurability || 100) >= 100) { showToast("✨ Xe Inox đang mới 100%!"); return; }
      const cost = getRepairCost();
      if (state.money < cost) { showToast(`❌ Cần ${formatVND(cost)} để đại tu xe!`); return; }
      state.money -= cost; state.cartDurability = 100; playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast(`🛠️ Đã lau dọn & tu sửa xe mới 100% (-${formatVND(cost)})!`);
    }
    function takeInvestmentLoan() {
      if ((state.loanDebt || 0) > 0) { showToast("⚠️ Đang có dư nợ Ngân hàng chưa tất toán!"); return; }
      state.money += 200000; state.loanDebt = 220000; recordBankActionDetail("loan", 200000); playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast("🏦 Ngân hàng giải ngân +200.000đ vốn đầu tư!");
    }
    function payOffAllDebt() {
      if ((state.loanDebt || 0) <= 0) { showToast("✅ Quán không nợ Ngân hàng!"); return; }
      if (state.money < state.loanDebt) { showToast(`❌ Cần ${formatVND(state.loanDebt)} để tất toán!`); return; }
      const paid = state.loanDebt; state.money -= paid; state.loanDebt = 0; recordBankActionDetail("repay", paid); state.hasRepaidAllDebt = true;
      playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast(`🦅 Đã tất toán sạch nợ Ngân hàng (-${formatVND(paid)})!`);
    }

    function checkBankruptcyOrRescueLoan() {
      const modal = document.getElementById("modal-bankruptcy");
      if (!modal) return;
      playSFX("whistle");
      const usedLoans = state.rescueLoanCount || 0;
      if (usedLoans < 2 && (state.rating || 5.0) > 1.2) {
        const nextTier = usedLoans + 1;
        const grantAmount = nextTier === 1 ? 250000 : 350000;
        const debtAdded = nextTier === 1 ? 275000 : 392000;
        document.getElementById("bankruptcy-icon").textContent = "🏦";
        document.getElementById("bankruptcy-title").textContent = `Gói Vay Cứu Trợ (Lần ${nextTier}/2)!`;
        document.getElementById("bankruptcy-desc").innerHTML = `Quán đang cạn tiền mặt! <b>Ngân Hàng Chính Sách Sài Gòn</b> hỗ trợ gói vay <b>+${formatVND(grantAmount)}</b> (Trả góp 35.000đ mỗi tối).`;
        document.getElementById("bankruptcy-actions").innerHTML = `
          <button onclick="acceptRescueLoan(${grantAmount}, ${debtAdded})" class="soft-btn btn-game-green w-full py-3 rounded-xl font-black text-sm">✍️ Nhận Gói Vay +${formatVND(grantAmount)}</button>
          <button onclick="declareTrueBankruptcy()" class="soft-btn w-full py-2 rounded-xl bg-gray-200 text-gray-800 font-bold text-xs">💔 Chấp nhận Phá Sản</button>
        `;
      } else {
        declareTrueBankruptcy(); return;
      }
      modal.classList.remove("hidden");
    }
    function acceptRescueLoan(grantAmount, debtAdded) {
      state.rescueLoanCount = (state.rescueLoanCount || 0) + 1;
      state.money = Math.max(0, state.money) + grantAmount;
      state.loanDebt = (state.loanDebt || 0) + debtAdded;
      recordBankActionDetail("loan", grantAmount);
      document.getElementById("modal-bankruptcy").classList.add("hidden");
      playSFX("cash"); updateAllUI(); saveGameEverywhere();
      showToast(`🏦 Đã nhận +${formatVND(grantAmount)} vốn cứu trợ!`);
    }

    function declareTrueBankruptcy(skipIncrement = false) {
      if (slotPatienceTimer) clearInterval(slotPatienceTimer);
      if (slotSpawnerTimer) clearInterval(slotSpawnerTimer);
      state.isStreetSelling = false;
      const oldCode = state.recoveryCode;
      if (!state.isBankrupt || !skipIncrement) {
        state.isBankrupt = true;
        state.bankruptcyAt = Date.now();
        state.bankruptcyCount = Number(state.bankruptcyCount || 0) + (skipIncrement ? 0 : 1);
        if (oldCode) state.bankruptRecoveryCode = oldCode;
      }
      saveToLocalOnly();
      saveGameEverywhere();
      persistBankruptcyLockToCloud(oldCode);

      const modal = document.getElementById("modal-bankruptcy");
      if (!modal) return;
      document.getElementById("bankruptcy-icon").textContent = "💔";
      document.getElementById("bankruptcy-title").textContent = "PHÁ SẢN – ĐÓNG CỬA XE BÁNH TRÁNG!";
      document.getElementById("bankruptcy-desc").innerHTML = `Sau <b>${state.day} ngày</b> và bán <b>${state.totalSold} bịch</b>, quán <b>${escapeHtml(state.shopName || "")}</b> đã cạn kiệt vốn và chính thức đóng cửa.<br><span class="text-[11px] text-red-700 font-black mt-1 block">🔒 Mã Khóa cũ (${escapeHtml(oldCode || "BT-xxxxxx")}) đã bị khóa vĩnh viễn — không thể khôi phục lại dữ liệu cũ!</span>`;
      document.getElementById("bankruptcy-actions").innerHTML = `
        <button onclick="restartFromBankruptcy()" class="soft-btn btn-game-red w-full py-3 rounded-xl font-black text-sm shadow-lg">🔄 KHỞI NGHIỆP LẠI TỪ NGÀY 1 (350K)</button>
      `;
      modal.classList.remove("hidden");
    }

    async function restartFromBankruptcy() {
      const keepName = state.shopName, keepPin = state.pin, keepAvatar = state.avatar, keepKey = state.shopKey;
      const oldRecovery = state.recoveryCode || state.bankruptRecoveryCode;
      const prevAdminTs = Number(state.adminOverrideAt || 0);
      const prevBankruptcyCount = Math.max(1, Number(state.bankruptcyCount || 1));
      const prevBroadcasts = Array.isArray(state.claimedBroadcasts) ? [...state.claimedBroadcasts] : [];
      const prevMails = Array.isArray(state.claimedMailIds) ? [...state.claimedMailIds] : [];
      const prevGiftcodes = Array.isArray(state.redeemedGiftcodes) ? [...state.redeemedGiftcodes] : [];
      const resetTs = Date.now();

      state = getInitialDefaultState();
      state.shopKey = keepKey;
      state.shopName = keepName;
      state.pin = keepPin;
      state.avatar = keepAvatar;
      state.isBankrupt = false;
      state.bankruptcyResetAt = resetTs;
      state.bankruptcyCount = prevBankruptcyCount;
      state.bankruptRecoveryCode = oldRecovery || "";
      state.adminOverrideAt = prevAdminTs;
      state.lastAppliedAdminOverrideAt = prevAdminTs;
      state.claimedBroadcasts = prevBroadcasts;
      state.claimedMailIds = prevMails;
      state.redeemedGiftcodes = prevGiftcodes;
      state.updatedAt = resetTs;

      // Cấp Mã Khôi Phục mới hoàn toàn cho cuộc đời mới, vô hiệu hóa mã cũ của quán đã phá sản
      let newCode = `BT-${Math.floor(100000 + Math.random() * 900000)}`;
      if (newCode === oldRecovery) newCode = `BT-${Math.floor(100000 + Math.random() * 900000)}`;
      state.recoveryCode = newCode;

      document.getElementById("modal-bankruptcy").classList.add("hidden");
      saveToLocalOnly();
      updateAllUI();
      await persistBankruptcyLockToCloud(oldRecovery);
      await saveGameEverywhere();
      showToast(`🌅 Đã khởi nghiệp lại từ Ngày 1 với 350.000đ! (Mã Khóa mới: ${newCode})`);
    }


    let dailyPlaySeconds = 0;
    let warned30Min = false;
    let warned60Min = false;
    let warned90Min = false;
    let warned120Min = false;
    let warned150Min = false;
    let warned180Min = false;

    function loadDailyPlaytimeTracker() {
      const todayStr = new Date().toISOString().slice(0, 10);
      try {
        const raw = JSON.parse(localStorage.getItem(ND147_PLAYTIME_KEY) || "{}");
        if (raw && raw.date === todayStr) {
          dailyPlaySeconds = Math.max(0, Number(raw.seconds || 0));
          warned30Min = Boolean(raw.warned30);
          warned60Min = Boolean(raw.warned60);
          warned90Min = Boolean(raw.warned90);
          warned120Min = Boolean(raw.warned120);
          warned150Min = Boolean(raw.warned150);
          warned180Min = Boolean(raw.warned180);
        } else {
          dailyPlaySeconds = 0;
          warned30Min = warned60Min = warned90Min = warned120Min = warned150Min = warned180Min = false;
        }
      } catch (e) {
        dailyPlaySeconds = 0;
      }
      updatePlaytimeBadgeUI();
    }

    function saveDailyPlaytimeTracker() {
      const todayStr = new Date().toISOString().slice(0, 10);
      try {
        localStorage.setItem(ND147_PLAYTIME_KEY, JSON.stringify({
          date: todayStr,
          seconds: dailyPlaySeconds,
          warned30: warned30Min,
          warned60: warned60Min,
          warned90: warned90Min,
          warned120: warned120Min,
          warned150: warned150Min,
          warned180: warned180Min
        }));
      } catch (e) {}
    }

    function updatePlaytimeBadgeUI() {
      const badge = document.getElementById("playtime-180-badge");
      if (!badge) return;
      const totalMins = Math.floor(dailyPlaySeconds / 60);
      const secs = dailyPlaySeconds % 60;
      const mm = String(totalMins).padStart(2, "0");
      const ss = String(secs).padStart(2, "0");
      badge.textContent = `⏱️ ${mm}:${ss}/180p`;
      if (totalMins >= 180) {
        badge.className = "px-1.5 py-0 rounded bg-red-700 border border-yellow-300 text-white font-black text-[8.5px] whitespace-nowrap animate-pulse shrink-0";
      } else if (totalMins >= 120) {
        badge.className = "px-1.5 py-0 rounded bg-orange-700 border border-amber-300 text-yellow-100 font-black text-[8.5px] whitespace-nowrap shrink-0";
      }
    }

    setInterval(() => {
      if (document.visibilityState !== "visible") return;
      dailyPlaySeconds += 1;
      if (dailyPlaySeconds % 5 === 0) saveDailyPlaytimeTracker();
      updatePlaytimeBadgeUI();
      const mins = Math.floor(dailyPlaySeconds / 60);
      if (mins >= 30 && !warned30Min) {
        warned30Min = true; saveDailyPlaytimeTracker();
        showToast("⏰ Đã chơi 30 phút. Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe!");
      } else if (mins >= 60 && !warned60Min) {
        warned60Min = true; saveDailyPlaytimeTracker();
        showToast("⏰ Đã chơi 60 phút. Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe!");
      } else if (mins >= 90 && !warned90Min) {
        warned90Min = true; saveDailyPlaytimeTracker();
        showToast("⏰ Đã chơi 90 phút. Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe!");
      } else if (mins >= 120 && !warned120Min) {
        warned120Min = true; saveDailyPlaytimeTracker();
        showToast("⏰ Đã chơi 120/180 phút. Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe!");
      } else if (mins >= 150 && !warned150Min) {
        warned150Min = true; saveDailyPlaytimeTracker();
        showToast("⏰ Đã chơi 150/180 phút. Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe!");
      } else if (mins >= 180 && !warned180Min) {
        warned180Min = true; saveDailyPlaytimeTracker();
        openLegalComplianceModal(true);
      }
    }, 1000);

    function toggleNetworkComplianceMode() {
      state.offlineMode = true;
      saveToLocalOnly();
      showToast("🛡️ Phiên bản Độc lập: Quán tự động lưu trên máy & bảo mật bằng PIN / Mã Khôi Phục!");
    }

    function exportSaveJson() {
      try {
        saveToLocalOnly();
        const payload = JSON.stringify(state, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = (state.shopKey || "vua_banh_trang").replace(/[^a-z0-9_-]/gi, "_");
        a.href = url;
        a.download = `${safeName}_ngay${state.day || 1}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("💾 Đã tải File Lưu (.json) của quán về máy!");
      } catch (e) {
        showToast("⚠️ Không thể tải file sao lưu lúc này.");
      }
    }

    function triggerImportSaveJson() {
      const inp = document.getElementById("import-save-json-input");
      if (inp) {
        inp.value = "";
        inp.click();
      }
    }

    function handleImportSaveJson(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const raw = JSON.parse(e.target.result);
          if (!raw || typeof raw !== "object") {
            showToast("❌ File JSON không hợp lệ!");
            return;
          }
          const singleShop = raw.shopName ? raw : (raw.fullState && raw.fullState.shopName ? { ...raw.fullState, ...raw } : null);
          if (singleShop) {
            state = getInitialDefaultState();
            mergeLoadedState(singleShop);
            state.offlineMode = true;
            ensureRecoveryCode();
            saveToLocalOnly();
            renderLoginTop3Preview();
            const loginScreen = document.getElementById("login-screen");
            if (loginScreen) loginScreen.classList.add("hidden");
            updateAllUI();
            showToast(`✅ Đã khôi phục quán "${state.shopName}" (Cấp ${state.level})!`);
            return;
          }

          const shopsContainer = raw.shops && typeof raw.shops === "object" ? raw.shops : raw;
          let importedCount = 0;
          Object.entries(shopsContainer).forEach(([k, v]) => {
            if (!v || typeof v !== "object" || k === "npc_admin_registry" || k.startsWith("npc_")) return;
            const fs = v.fullState || v;
            if (!fs.shopName && !v.shopName) return;
            const clean = {
              ...fs,
              shopKey: k,
              shopName: v.shopName || fs.shopName || k,
              pin: v.pin || fs.pin || "",
              recoveryCode: v.recoveryCode || fs.recoveryCode || `BT-${Math.floor(100000 + Math.random() * 900000)}`,
              offlineMode: true
            };
            saveShopToLocalVault(clean);
            importedCount++;
          });

          if (importedCount > 0) {
            renderLoginTop3Preview();
            showToast(`🎉 Đã nạp ${importedCount} quán vào máy! Hãy chọn quán và nhập PIN 4 số để vào.`);
          } else {
            showToast("❌ Không tìm thấy dữ liệu quán hợp lệ trong file!");
          }
        } catch (err) {
          showToast("❌ Không thể đọc file JSON!");
        }
      };
      reader.readAsText(file);
    }

    function openLegalComplianceModal(isOver180 = false) {
      let modal = document.getElementById("modal-nd147-legal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-nd147-legal";
        modal.className = "fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm";
        document.body.appendChild(modal);
      }
      const mins = Math.floor(dailyPlaySeconds / 60);
      modal.classList.remove("hidden");
      modal.innerHTML = `
        <div class="w-full max-w-md wooden-clipboard-frame">
          <div class="clipboard-paper-inner p-3.5 space-y-2.5 text-xs text-amber-950">
            <div class="flex items-center justify-between border-b border-amber-300 pb-2">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-xs">00+</span>
                <h3 class="font-black text-sm text-amber-950">Tuân Thủ Nghị Định 147/2024/NĐ-CP</h3>
              </div>
              <button type="button" onclick="document.getElementById('modal-nd147-legal').classList.add('hidden')" class="px-2.5 py-0.5 rounded-lg bg-amber-200 font-black">✕</button>
            </div>
            ${isOver180 ? `
              <div class="p-2.5 rounded-xl bg-red-100 border-2 border-red-500 text-red-950 font-bold">
                🚨 <b>Cảnh báo Sức khỏe (180 phút):</b> Bạn đã chơi đủ 180 phút hôm nay. Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe. Hãy nghỉ ngơi nhé!
              </div>
            ` : ""}
            <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5 leading-relaxed">
              <div>• <b>Đồng bộ Đám mây & Lưu máy:</b> Hỗ trợ kết nối trực tiếp máy chủ Firebase Realtime Database kèm Bảng Xếp Hạng Đế Chế và lưu dự phòng trên thiết bị.</div>
              <div>• <b>Đăng nhập & Khôi phục:</b> Nhập <b>Tên Bảng Hiệu + Mã PIN 4 số</b> hoặc dùng <b>Mã Khóa (${escapeHtml(state.recoveryCode || "BT-XXXXXX")}) / Mã BTT1</b>.</div>
              <div>• <b>Thời gian chơi hôm nay:</b> <b class="text-emerald-800">${mins} phút / 180 phút khuyến nghị</b> (nhắc mỗi 30 phút).</div>
            </div>
            <div class="flex items-center justify-between gap-2 pt-1">
              <button type="button" onclick="document.getElementById('modal-nd147-legal').classList.add('hidden'); openProfileEditModal();" class="soft-btn flex-1 py-2 rounded-xl bg-amber-100 border border-amber-400 font-black text-amber-950">
                🔑 Xem Mã Khôi Phục
              </button>
              <button type="button" onclick="document.getElementById('modal-nd147-legal').classList.add('hidden')" class="soft-btn btn-game-green flex-1 py-2 rounded-xl font-black">
                Đã Hiểu & Tiếp Tục
              </button>
            </div>
          </div>
        </div>
      `;
    }


    function switchMarketInnerMode(mode) {
      playSFX("snip");
      const btnBuy = document.getElementById("subbtn-market-buy");
      const btnPrep = document.getElementById("subbtn-market-prep");
      if (mode === "prep") {
        document.getElementById("prep-panel-kho").classList.add("hidden");
        document.getElementById("prep-panel-soche").classList.remove("hidden");
        renderPrepStatus();
      } else {
        document.getElementById("prep-panel-soche").classList.add("hidden");
        document.getElementById("prep-panel-kho").classList.remove("hidden");
        if (btnBuy) btnBuy.className = "soft-btn py-1.5 px-2 rounded-lg font-black text-[10.5px] bg-orange-600 text-white shadow flex items-center justify-center gap-1";
        if (btnPrep) btnPrep.className = "soft-btn py-1.5 px-2 rounded-lg font-black text-[10.5px] bg-white text-amber-950 flex items-center justify-center gap-1";
        renderMarketGrid();
      }
    }

    function renderMorningForecastBriefing() {
      ensureV15State(state);
      const box = document.getElementById("morning-forecast-briefing-box");
      const menuHint = document.getElementById("menu-weather-dish-hint-box");
      const prepCntLbl = document.getElementById("inner-prep-count-lbl");
      const doneCnt = ["sate", "hanhphi", "trungcut"].filter(k => state.prepDone?.[k]).length;
      if (prepCntLbl) prepCntLbl.textContent = `${doneCnt}/3`;

      const sched = getTodayScheduleInfo(state.day);
      const weather = getTodayWeatherObj(state.day);
      const fest = EXTENDED_FESTIVALS[state.day % 31] || EXTENDED_FESTIVALS[state.day];
      const cap = getActualCartBagDemandCap(state.day);

      const absentNames = STAFF_CATALOG
        .filter(st => state.staff?.[st.id] && state.staffAbsentToday?.[st.id] && !state.staffTempReplacedToday?.[st.id])
        .map(st => `${st.name} (${st.stepRole})`);

      if (menuHint) {
        menuHint.innerHTML = `
          <span>${weather.icon} <b>${weather.name}:</b> ${weather.tipNote}</span>
          <span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black whitespace-nowrap">Dự kiến: ~${cap}p</span>
        `;
      }

      if (!box) return;
      box.innerHTML = `
        <div class="flex items-center justify-between gap-1.5">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-lg leading-none">${weather.icon}</span>
            <div class="leading-tight min-w-0">
              <div class="font-black text-[11px] text-amber-950 truncate">
                ${sched.dowName} (Ngày ${state.day}) • ${weather.name}
              </div>
              <div class="text-[9.5px] font-bold text-amber-800">
                Sức mua tổng hợp: <b class="text-emerald-700">~${cap} bịch</b> • Trà tắc: <b>${Math.round(weather.traTacChance * 100)}%</b>
              </div>
            </div>
          </div>
          ${currentMorningStaffEvent ? `
            <button type="button" onclick="openMorningStaffDramaModal()" class="soft-btn px-2 py-1 rounded-xl bg-red-600 text-white font-black text-[9.5px] animate-bounce shrink-0 shadow">
              🔔 Biến cố Nhân sự!
            </button>
          ` : `
            <span class="px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-900 font-black text-[9px] shrink-0">
              📊 Thị phần: ${state.marketSharePct || 28}%
            </span>
          `}
        </div>
        <div class="text-[9.5px] font-semibold text-amber-900 leading-snug bg-white/80 px-2 py-1 rounded-lg border border-amber-200">
          💡 ${fest ? `<b class="text-rose-700">${fest.name}:</b> ${fest.desc} ` : ''}${weather.tipNote}
        </div>
        ${absentNames.length > 0 ? `
          <div class="px-2 py-1 rounded-lg bg-rose-100 border border-rose-400 text-rose-900 font-extrabold text-[9.5px] flex items-center justify-between">
            <span>🤒 Vắng mặt hôm nay: <b>${absentNames.join(", ")}</b> (Chủ quán tự đứng bếp khâu này)</span>
            ${currentMorningStaffEvent ? `<button type="button" onclick="openMorningStaffDramaModal()" class="underline font-black">Xử lý</button>` : ''}
          </div>
        ` : ''}
      `;
    }

    // --- 7. TRUNG TÂM TIẾP THỊ MỞ THEO CẤP & ĐUA THỊ PHẦN KHU PHỐ ---
    function switchMarketingCenterSubTab(sub) {
      activeMarketingSubTab = sub;
      playSFX("snip");
      ["campaigns", "vouchers", "rivals"].forEach(k => {
        const btn = document.getElementById(`mkt-sub-${k}`);
        if (btn) {
          btn.className = k === sub
            ? "soft-btn py-1.5 px-1 rounded-lg font-black text-[10px] bg-orange-600 text-white shadow"
            : "soft-btn py-1.5 px-1 rounded-lg font-black text-[10px] bg-white text-amber-950";
        }
      });
      renderMarketingCenterTab();
    }

    function toggleLevelGatedCampaign(campId) {
      ensureV15State(state);
      const camp = LEVEL_GATED_CAMPAIGNS.find(c => c.id === campId);
      if (!camp) return;
      if ((state.level || 1) < camp.reqLevel) {
        showToast(`🔒 Cần đạt Cấp ${camp.reqLevel} để mở chiến dịch "${camp.name}"!`);
        return;
      }
      if (state.dailyCampaigns[campId]) {
        showToast(`📢 Chiến dịch "${camp.name}" đang chạy trong ngày hôm nay rồi!`);
        return;
      }
      const managerStar = isStaffWorkingToday("baoloc") ? (state.staffStars?.baoloc || 1) : 0;
      const discountMult = Math.max(0.75, 1 - managerStar * 0.05);
      const finalCost = Math.round((camp.cost * discountMult) / 500) * 500;
      if (state.money < finalCost) {
        showToast(`⚠️ Cần ${formatVND(finalCost)} để bật chiến dịch "${camp.name}"!`);
        return;
      }
      state.money -= finalCost;
      state.todayCogsSpent = (state.todayCogsSpent || 0) + finalCost;
      state.dailyCampaigns[campId] = true;
      adjustViral(camp.viralGain);
      recalcNeighborhoodMarketShare();
      playSFX("cash");
      updateAllUI();
      saveGameEverywhere();
      showToast(`🚀 Đã kích hoạt "${camp.name}" (+${camp.bagBonus} bịch)! Sức mua hôm nay: ~${getActualCartBagDemandCap()} bịch!`);
    }

    function setVoucherConfigV15(field, val) {
      ensureV15State(state);
      if ((state.level || 1) < 12) {
        showToast("🔒 Đạt Cấp 12 (Ra Đầu Hẻm & Cổng Trường) mới mở tính năng Tự Tạo Voucher!");
        return;
      }
      playSFX("snip");
      const v = state.customVoucher;
      if (field === "discountPct") {
        const pct = Number(val || 0);
        if ((pct === 20 || pct === 30) && (state.level || 1) < 28) {
          showToast("🔒 Đạt Cấp 28 (Kiot Góc Phố) để mở Voucher giảm sâu -20% / -30%!");
          return;
        }
        v.promoType = "percent";
        v.discountPct = pct;
        v.active = pct > 0;
      } else if (field === "free_tea") {
        if ((state.level || 1) < 28) {
          showToast("🔒 Đạt Cấp 28 để mở gói Voucher 'Mua 2 Tặng 1 Trà Tắc'!");
          return;
        }
        v.promoType = "free_tea";
        v.discountPct = 15;
        v.active = true;
      } else if (field === "scope") {
        v.targetScope = String(val || "all");
      } else if (field === "quota") {
        v.quotaMax = Number(val || 20);
      } else if (field === "keepTomorrow") {
        v.keepTomorrow = !Boolean(v.keepTomorrow);
      }
      recalcNeighborhoodMarketShare();
      updateAllUI();
      saveToLocalOnly();
    }


    function renderMarketingCenterTab() {
      ensureV15State(state);
      const container = document.getElementById("marketing-center-content");
      if (!container) return;
      const lvl = state.level || 1;
      recalcNeighborhoodMarketShare();

      const badgeEl = document.getElementById("badge-marketing-unlock");
      if (badgeEl) {
        badgeEl.textContent = lvl < 8 ? "C.8+" : `${state.marketSharePct}%`;
      }

      if (activeMarketingSubTab === "campaigns") {
        if (lvl < 8) {
          container.innerHTML = `
            <div class="p-3 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-400 space-y-2 text-center shadow-sm">
              <div class="w-14 h-14 mx-auto rounded-2xl bg-white border-2 border-amber-500 flex items-center justify-center overflow-hidden shadow">
                ${CASUAL_2D_ASSETS.mk_ads ? `<img src="${CASUAL_2D_ASSETS.mk_ads}" alt="Quảng cáo" class="w-full h-full object-cover" />` : '<span class="text-2xl">📣</span>'}
              </div>
              <div class="font-black text-sm text-amber-950">🔒 GIAI ĐOẠN XE ĐẨY HẺM NHỎ (CẤP 1–7)</div>
              <p class="text-[11px] font-semibold text-amber-900 leading-relaxed">
                Ở các cấp độ nhỏ mới khởi nghiệp trong hẻm, quán chưa cần chạy quảng cáo tốn kém. Hãy tập trung đi chợ, sơ chế và bán bánh tích vốn lên <b class="text-red-700">Cấp 8 (Hiện tại: Cấp ${lvl}/8)</b> để mở khóa <b>Chiến Dịch Thu Hút Khách Hàng Ngày</b>!
              </p>
              <div class="p-2 rounded-xl bg-white/90 border border-amber-300 text-left space-y-1 text-[10px] text-amber-950">
                <div class="font-black text-orange-800">🗺️ Lộ trình Mở Khóa Tiếp Thị Sắp Tới:</div>
                <div>• <b>Cấp 8:</b> Phát Tờ Rơi & Trà Đá Đầu Hẻm (+3 bịch/ngày)</div>
                <div>• <b>Cấp 12:</b> Tự Thiết Kế Phiếu Giảm Giá (Voucher -10% / -15%)</div>
                <div>• <b>Cấp 16:</b> Bảng Gói Mua Chung Học Sinh & Văn Phòng</div>
                <div>• <b>Cấp 19:</b> Chiến Dịch Đẩy Top Ứng Dụng Giao Đồ Ăn</div>
                <div>• <b>Cấp 24–40:</b> Hội Ẩm Thực Quận, Thánh Ăn Đánh Giá & Phát Trực Tiếp</div>
              </div>
            </div>
          `;
          return;
        }

        const managerStar = isStaffWorkingToday("baoloc") ? (state.staffStars?.baoloc || 1) : 0;
        const discountMult = Math.max(0.75, 1 - managerStar * 0.05);

        const cardsHtml = LEVEL_GATED_CAMPAIGNS.map(c => {
          const unlocked = lvl >= c.reqLevel;
          const isOn = Boolean(state.dailyCampaigns?.[c.id]);
          const finalCost = Math.round((c.cost * discountMult) / 500) * 500;
          const imgSrc = CASUAL_2D_ASSETS[c.assetKey] || CASUAL_2D_ASSETS.mk_ads || "";
          return `
            <div class="p-2 rounded-2xl border-2 ${isOn ? 'bg-emerald-50 border-emerald-500 shadow-sm' : unlocked ? 'bg-white border-amber-300' : 'bg-slate-50 border-slate-200 opacity-75'} flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHtml(c.name)}" class="w-11 h-11 rounded-xl object-cover border-2 border-amber-400 shrink-0 bg-amber-50" />` : '<span class="text-xl">📣</span>'}
                <div class="min-w-0 flex-1 leading-snug">
                  <div class="font-black text-amber-950 text-xs">${c.name}</div>
                  <div class="text-[10px] font-bold text-emerald-800">${c.desc}</div>
                  <div class="text-[9.5px] font-extrabold text-amber-800">Chi phí ngày: <b class="text-orange-700">${formatVND(finalCost)}</b>${managerStar > 0 ? ` (Gia Bảo -${managerStar * 5}%)` : ''}</div>
                </div>
              </div>
              <div class="shrink-0">
                ${!unlocked
                  ? `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px] whitespace-nowrap">🔒 Cấp ${c.reqLevel}</span>`
                  : isOn
                    ? `<span class="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] inline-block shadow">✅ Đang Chạy</span>`
                    : `<button type="button" onclick="toggleLevelGatedCampaign('${c.id}')" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Mở Chiến Dịch</div><div class="text-[9px] text-yellow-200">${formatShortK(finalCost)}</div></button>`
                }
              </div>
            </div>
          `;
        }).join("");

        container.innerHTML = `
          <div class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-400 flex items-center justify-between text-[10.5px] font-black text-amber-950">
            <span>📢 Khách cộng thêm từ Chiến dịch: <b class="text-emerald-700">+${getActiveCampaignBagBonus()} bịch/ngày</b></span>
            <span>Sức mua: <b class="text-red-700">~${getActualCartBagDemandCap()}p</b></span>
          </div>
          <div class="space-y-1.5">${cardsHtml}</div>
        `;
      } else if (activeMarketingSubTab === "vouchers") {
        if (lvl < 12) {
          container.innerHTML = `
            <div class="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center space-y-2">
              <div class="w-12 h-12 mx-auto rounded-xl bg-white border border-amber-400 flex items-center justify-center overflow-hidden">
                ${CASUAL_2D_ASSETS.mk_voucher ? `<img src="${CASUAL_2D_ASSETS.mk_voucher}" alt="Voucher" class="w-full h-full object-cover" />` : '🎟️'}
              </div>
              <div class="font-black text-sm text-amber-950">🔒 ĐẠT CẤP 12 ĐỂ MỞ TỰ TẠO PHIẾU GIẢM GIÁ (VOUCHER)</div>
              <p class="text-[11px] font-semibold text-amber-800">Khi quán đạt <b>Cấp 12 (Hiện tại: Cấp ${lvl}/12)</b>, bạn sẽ tự thiết kế mã giảm giá (-10%, -15%, -20%, -30%, Mua 2 Tặng Trà Tắc) để hút khách và đẩy món tồn kho!</p>
            </div>
          `;
          return;
        }

        const v = state.customVoucher;
        const sampleDishId = state.featuredDishKey || "tron";
        const basePrice = getDishEffectivePrice(sampleDishId);
        const recipeCost = getDishRecipeCost(sampleDishId);
        const discPct = v.active ? v.discountPct : 0;
        const discountedPrice = Math.round((basePrice * (100 - discPct)) / 500) * 500;
        const estNet = discountedPrice - recipeCost;
        const vMultPct = Math.round((getVoucherCustomerMult() - 1) * 100);

        container.innerHTML = `
          <div class="p-2.5 rounded-2xl bg-white border-2 border-orange-300 space-y-2 shadow-sm">
            <div class="flex items-center justify-between border-b border-amber-200 pb-1.5">
              <div class="flex items-center gap-1.5">
                ${CASUAL_2D_ASSETS.mk_voucher ? `<img src="${CASUAL_2D_ASSETS.mk_voucher}" alt="Voucher" class="w-8 h-8 rounded-lg border border-orange-400 object-cover" />` : '🎟️'}
                <div>
                  <div class="font-black text-xs text-amber-950">XƯỞNG THIẾT KẾ PHIẾU GIẢM GIÁ HÔM NAY</div>
                  <div class="text-[9.5px] font-bold text-emerald-700">Hiệu quả hút khách: +${vMultPct}% lượt ghé • Đã dùng: ${v.usedToday}/${v.quotaMax} phiếu</div>
                </div>
              </div>
              <button type="button" onclick="setVoucherConfigV15('keepTomorrow')" class="soft-btn px-2 py-1 rounded-lg border font-black text-[9px] ${v.keepTomorrow ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-slate-100 border-slate-300 text-slate-600'}">
                🔁 Giữ ngày mai: ${v.keepTomorrow ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-[10px] font-extrabold text-amber-950">
                <span>1. Chọn mức ưu đãi (Cấp 28 mở -20%, -30% & Tặng Trà):</span>
                <span class="${estNet >= 0 ? 'text-emerald-700' : 'text-red-600'}">Lãi sau giảm: ${estNet >= 0 ? '+' : ''}${formatShortK(estNet)}/bịch</span>
              </div>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-1">
                ${[0, 10, 15, 20, 30].map(pct => {
                  const locked28 = (pct >= 20 && lvl < 28);
                  const isSel = v.promoType === "percent" && v.discountPct === pct;
                  return `
                    <button type="button" onclick="setVoucherConfigV15('discountPct', ${pct})" class="soft-btn py-1.5 px-1 rounded-xl border font-black text-[10px] ${isSel ? 'bg-orange-600 text-white border-orange-800 shadow' : locked28 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-950 border-amber-300'}">
                      ${pct === 0 ? 'Tắt' : locked28 ? `🔒 -${pct}%` : `Giảm -${pct}%`}
                    </button>
                  `;
                }).join("")}
                <button type="button" onclick="setVoucherConfigV15('free_tea')" class="soft-btn py-1.5 px-1 rounded-xl border font-black text-[9.5px] ${v.promoType === 'free_tea' && v.active ? 'bg-orange-600 text-white border-orange-800 shadow' : lvl < 28 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-950 border-amber-300'}">
                  ${lvl < 28 ? '🔒 Mua 2+Trà' : '🧋 Mua 2+Trà'}
                </button>
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-[10px] font-extrabold text-amber-950">2. Phạm vi áp dụng & Hạn mức số phiếu:</div>
              <div class="grid grid-cols-4 gap-1">
                ${[
                  { id: "all", label: "Toàn Thực Đơn" },
                  { id: "featured", label: "Món Đinh" },
                  { id: "grill", label: "Cuộn & Nướng" },
                  { id: "app", label: "Đơn Giao Hàng" }
                ].map(sc => `
                  <button type="button" onclick="setVoucherConfigV15('scope', '${sc.id}')" class="soft-btn py-1 px-1 rounded-lg border font-bold text-[9.5px] ${v.targetScope === sc.id ? 'bg-amber-900 text-yellow-200 border-amber-950' : 'bg-white text-amber-900 border-amber-300'}">
                    ${sc.label}
                  </button>
                `).join("")}
              </div>
              <div class="flex items-center justify-between pt-1">
                <span class="text-[10px] font-bold text-amber-900">Số phiếu phát hành hôm nay:</span>
                <div class="flex gap-1">
                  ${[10, 20, 40].map(q => `
                    <button type="button" onclick="setVoucherConfigV15('quota', ${q})" class="soft-btn py-1 px-2.5 rounded-lg border font-black text-[10px] ${v.quotaMax === q ? 'bg-emerald-700 text-white border-emerald-900' : 'bg-white text-amber-950 border-amber-300'}">
                      ${q} phiếu
                    </button>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        const myShare = state.marketSharePct || 28;
        const remShare = Math.max(15, 100 - myShare);
        const rShares = [Math.round(remShare * 0.42), Math.round(remShare * 0.33), remShare - Math.round(remShare * 0.42) - Math.round(remShare * 0.33)];

        const rivalsHtml = RIVAL_SHOPS_DATA.map((rv, idx) => `
          <div class="p-2 rounded-xl bg-white border border-amber-300 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-8 h-8 rounded-lg bg-amber-100 border border-amber-400 flex items-center justify-center text-base shrink-0">${rv.icon}</span>
              <div class="min-w-0 leading-tight">
                <div class="font-black text-amber-950 text-[11px] truncate">${rv.name}</div>
                <div class="text-[9.5px] font-bold text-amber-800">${rv.style}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-900 font-black text-[10px] shrink-0">Thị phần: ${rShares[idx]}%</span>
          </div>
        `).join("");

        container.innerHTML = `
          <div class="p-2.5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-400 space-y-2 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="font-black text-xs text-amber-950">🏆 ĐUA THỊ PHẦN KHU PHỐ (CHỦ NHẬT TRAO CÚP)</span>
              <span class="px-2 py-0.5 rounded-full ${myShare >= 50 ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white'} font-black text-[10px]">Quán bạn: ${myShare}%</span>
            </div>
            <div class="w-full h-2.5 bg-rose-200 rounded-full overflow-hidden border border-amber-500 flex">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300" style="width: ${myShare}%"></div>
            </div>
            <div class="text-[9.5px] font-bold text-amber-900">
              ${myShare >= 50 ? '👑 Quán bạn đang dẫn đầu khu phố! Giữ vững để nhận thưởng Bá Chủ Khu Phố (+150.000đ) tối Chủ Nhật!' : '💡 Bật Chiến dịch Tiếp thị, tạo Voucher và giữ 5⭐ để giành thị phần từ 3 quán đối thủ bên dưới:'}
            </div>
            <div class="space-y-1">${rivalsHtml}</div>
          </div>

          <div class="p-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-black text-emerald-950">🔑 Mã Khôi Phục Quán: <span class="text-blue-800">${escapeHtml(state.recoveryCode || "BT-000000")}</span></span>
              <button type="button" onclick="openProfileEditModal()" class="soft-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[9.5px]">📋 Lấy Mã Đổi Máy</button>
            </div>
            <div class="text-[10px] font-bold text-emerald-900">
              Quán tự động lưu sau mỗi thao tác. Bạn có thể đăng nhập bằng Tên Quán + PIN 4 số hoặc Mã Khôi Phục.
            </div>
          </div>
        `;
      }
    }

    // --- 8. BA TRỤC TINH GỌN CỦA TAB 🏗️ XÂY QUÁN ---
    // Trục 1: 🏠 Quán & Đồ Nghề (Thẻ Tiến Hóa Đời Quán Hợp Nhất + 6 Đồ Nghề & Tiện Nghi)
    function renderStreamlinedShopAndToolsHtml() {
      ensureV15State(state);
      const curScale = Math.min(6, Math.max(0, Number(state.shopScale || 0)));
      const curTierObj = SHOP_SCALE_TIERS[curScale] || SHOP_SCALE_TIERS[0];
      const nextTierObj = SHOP_SCALE_TIERS[curScale + 1] || null;
      const curChap = getCurrentChapterObj();

      let evolutionCardHtml = "";
      if (!nextTierObj) {
        evolutionCardHtml = `
          <div class="p-3 rounded-2xl bg-gradient-to-r from-yellow-100 via-amber-100 to-orange-100 border-2 border-amber-500 flex items-center justify-between gap-2.5 shadow-sm">
            <div class="flex items-center gap-2.5 min-w-0">
              <img src="${curTierObj.img}" alt="Max" class="w-12 h-12 rounded-xl object-cover border-2 border-amber-600 shrink-0" />
              <div class="leading-snug">
                <div class="font-black text-xs text-amber-950">👑 ĐẠT ĐỈNH ĐỜI QUÁN: ${curTierObj.name}</div>
                <div class="text-[10px] font-bold text-emerald-800">${curTierObj.perkText} • Khu vực: ${curChap.shortLoc}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        const reqLicId = SCALE_REQUIRED_LICENSES[nextTierObj.tier] || "lic_vsattp";
        const licObj = LICENSES_CATALOG.find(l => l.id === reqLicId) || LICENSES_CATALOG[0];
        const hasLic = Boolean(state.licenses?.[reqLicId]);
        const okLevelForLic = (state.level || 1) >= licObj.reqLevel;
        const okLevelForScale = (state.level || 1) >= nextTierObj.reqLevel;
        const canUpgradeNow = hasLic && okLevelForScale;

        evolutionCardHtml = `
          <div class="p-3 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-orange-400 space-y-2 shadow-sm">
            <div class="flex items-center justify-between gap-2 border-b border-orange-200 pb-2">
              <div class="flex items-center gap-2 min-w-0">
                <img src="${curTierObj.img}" alt="${escapeHtml(curTierObj.name)}" class="w-11 h-11 rounded-xl object-cover border-2 border-amber-500 shrink-0 shadow-sm" />
                <div class="min-w-0 leading-tight">
                  <span class="px-1.5 py-0.5 rounded bg-amber-900 text-yellow-200 font-black text-[8.5px] uppercase">Đời quán hiện tại (Bậc ${curScale}/6) • ${curChap.shortLoc}</span>
                  <div class="font-black text-xs text-amber-950 mt-0.5 truncate">${curTierObj.icon} ${curTierObj.name}</div>
                  <div class="text-[9.5px] font-bold text-emerald-800">${curTierObj.perkText}</div>
                </div>
              </div>
            </div>

            <!-- Lộ trình 2 bước gộp gọn để lên Đời Quán tiếp theo -->
            <div class="p-2 rounded-xl bg-white/95 border border-amber-300 space-y-1.5">
              <div class="flex items-center justify-between text-[10.5px] font-black text-amber-950">
                <span>🚀 Mục tiêu lên đời: <span class="text-orange-700">${nextTierObj.icon} ${nextTierObj.name}</span></span>
                <span class="text-[9.5px] font-bold text-emerald-700">Yêu cầu: Cấp ${nextTierObj.reqLevel}</span>
              </div>

              <!-- Bước 1: Giấy phép mặt bằng tích hợp trực tiếp -->
              <div class="p-1.5 rounded-lg ${hasLic ? 'bg-emerald-50 border border-emerald-300' : 'bg-amber-50 border border-amber-300'} flex items-center justify-between gap-2 text-[10px]">
                <div class="min-w-0 flex-1 leading-tight">
                  <div class="font-black text-amber-950">1. ${licObj.icon} ${licObj.name}</div>
                  <div class="text-[9px] text-amber-800">${licObj.desc}</div>
                </div>
                <div class="shrink-0">
                  ${hasLic
                    ? `<span class="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[9px]">✓ Đã có</span>`
                    : okLevelForLic
                      ? `<button type="button" onclick="buyLicenseItem('${licObj.id}')" class="soft-btn btn-game-orange px-2 py-1 rounded-lg font-black text-[9.5px]">Xin Cấp (${formatShortK(licObj.cost)})</button>`
                      : `<span class="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-black text-[9px]">🔒 Cấp ${licObj.reqLevel}</span>`
                  }
                </div>
              </div>

              <!-- Bước 2: Khai trương mặt bằng mới -->
              <div class="flex items-center justify-between gap-2 pt-0.5">
                <div class="text-[9.5px] font-bold text-amber-900">
                  2. Quyền lợi mới: <b class="text-emerald-800">${nextTierObj.perkText}</b>
                </div>
                <button type="button" onclick="upgradeConsolidatedShopScale(${nextTierObj.tier}, '${reqLicId}')" class="soft-btn px-3 py-1.5 rounded-xl font-black text-[10px] shrink-0 ${canUpgradeNow ? 'btn-game-red shadow-md' : 'bg-slate-200 text-slate-600'}">
                  ${canUpgradeNow ? `🎉 Lên Đời (${formatShortK(nextTierObj.cost)})` : !hasLic ? 'Cần Giấy Phép B1' : `🔒 Cấp ${nextTierObj.reqLevel}`}
                </button>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="space-y-2">
          ${evolutionCardHtml}
          <div class="px-1 pt-0.5 flex items-center justify-between text-[10.5px] font-black text-amber-950">
            <span>🛠️ 6 Đồ Nghề Đứng Bếp & Tiện Nghi Quán (Cấp 1 ➔ 5):</span>
            <span class="text-[9.5px] font-bold text-amber-800">Mở chỗ đợi & Tăng tốc làm bánh</span>
          </div>
          ${renderEquipBranchCards("marketing")}
        </div>
      `;
    }

    function upgradeConsolidatedShopScale(targetTier, reqLicId) {
      if (reqLicId && !state.licenses?.[reqLicId]) {
        const licObj = LICENSES_CATALOG.find(l => l.id === reqLicId);
        showToast(`⚠️ Hãy bấm xin cấp "${licObj ? licObj.name : 'Giấy phép'}" ở mục số 1 ngay phía trên trước nhé!`);
        return;
      }
      buyShopScaleTier(targetTier);
    }

    // Trục 2: 🧑‍🍳 Nhân Sự (7 Người + Thanh Tinh Thần + Biến cố)
    function renderStaffCardsWithMoraleHtml() {
      ensureV15State(state);
      return `<div class="space-y-2">${STAFF_CATALOG.map(st => {
        const hired = Boolean(state.staff?.[st.id]);
        const star = state.staffStars?.[st.id] || 1;
        const okHire = (state.level || 1) >= st.reqLevel;
        const nextStar = star + 1;
        const trainCost = getStaffTrainCost(st);
        const reqTrainLvl = getStaffTrainReqLevel(st, nextStar);
        const okTrain = (state.level || 1) >= reqTrainLvl;
        const raisePct = state.staffWageRaisePct?.[st.id] || 0;
        let effWage = Math.round((st.dailyWage + (star - 1) * 4000) * (1 + raisePct / 100));
        if ((st.id === "anhba" || st.id === "mylan") && state.romanceStageAnhBaMyLan === 3) {
          effWage = Math.round(effWage * 0.90);
        }
        const morale = state.staffMorale?.[st.id] ?? 90;
        const isAbsent = Boolean(state.staffAbsentToday?.[st.id] && !state.staffTempReplacedToday?.[st.id]);

        let statusBadge = `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-[8.5px]">🟢 Đứng ca (${st.stepRole})</span>`;
        if (isAbsent) {
          statusBadge = `<span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-black text-[8.5px]">🤒 Nghỉ phép hôm nay</span>`;
        } else if ((st.id === "anhba" || st.id === "mylan") && state.romanceStageAnhBaMyLan === 3) {
          statusBadge = `<span class="px-1.5 py-0.5 rounded bg-pink-100 text-rose-900 font-black text-[8.5px]">💍 Cặp đôi gắn bó (+30% tốc độ)</span>`;
        } else if ((st.id === "anhba" || st.id === "mylan") && state.romanceStageAnhBaMyLan === 2) {
          statusBadge = `<span class="px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 font-black text-[8.5px]">💔 Đang giận dỗi (-25% tốc độ)</span>`;
        } else if ((st.id === "anhba" || st.id === "mylan") && state.romanceStageAnhBaMyLan === 1) {
          statusBadge = `<span class="px-1.5 py-0.5 rounded bg-pink-50 text-pink-800 font-black text-[8.5px]">💘 Thầm thương (+20% tốc độ)</span>`;
        }

        let actionHtml = "";
        if (!hired) {
          actionHtml = okHire
            ? `<button onclick="hireStaffMember('${st.id}')" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px]">Thuê (${formatShortK(st.hireCost)})</button>`
            : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${st.reqLevel}</span>`;
        } else if (star < 5) {
          actionHtml = okTrain
            ? `<button onclick="trainStaffMember('${st.id}')" class="soft-btn btn-game-green px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Đào Tạo ${nextStar}⭐</div><div class="text-[9px] text-emerald-100">${formatShortK(trainCost)}</div></button>`
            : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${reqTrainLvl} (${nextStar}⭐)</span>`;
        } else {
          actionHtml = `<span class="px-2 py-1 bg-amber-400 text-amber-950 border border-amber-700 font-black rounded-xl text-[10px] inline-block">👑 Thợ Chính 5⭐</span>`;
        }

        return `
          <div class="p-2.5 rounded-2xl bg-amber-50/90 border-2 ${hired ? 'border-emerald-400' : 'border-amber-200'} space-y-1.5 text-xs shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <img src="${st.portrait}" alt="${escapeHtml(st.name)}" class="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 shrink-0 shadow-sm" />
                <div class="min-w-0 flex-1 leading-snug">
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="font-black text-amber-950 text-xs">${st.name}</span>
                    ${hired ? `<span class="px-1.5 py-0 rounded-full bg-amber-300 text-amber-950 font-black text-[9px] border border-amber-600">${"⭐".repeat(star)}</span>` : ''}
                    <span class="text-red-700 font-bold text-[9px]">• Lương ${formatShortK(effWage)}/ngày</span>
                  </div>
                  <div class="text-[10px] text-amber-900 mt-0.5">${st.role}</div>
                  <div class="text-[9.5px] font-extrabold text-emerald-800 mt-0.5">🌟 ${st.starPerk(star)}</div>
                </div>
              </div>
              <div class="shrink-0">${actionHtml}</div>
            </div>
            ${hired ? `
              <div class="pt-1.5 border-t border-amber-200/80 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-1 min-w-0">
                  ${statusBadge}
                  <div class="flex-1 max-w-[100px] h-1.5 bg-gray-200 rounded-full overflow-hidden border border-amber-300">
                    <div class="h-full ${morale >= 75 ? 'bg-emerald-500' : morale >= 50 ? 'bg-amber-500' : 'bg-red-600'}" style="width: ${morale}%"></div>
                  </div>
                  <span class="text-[9px] font-black text-amber-900">${morale}%</span>
                </div>
                <button type="button" onclick="encourageStaffMorale('${st.id}')" class="soft-btn px-2 py-0.5 rounded-lg bg-pink-100 border border-pink-400 text-rose-950 font-black text-[9px] shrink-0">
                  💝 Khích lệ (25k)
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join("")}</div>`;
    }

    // Trục 3: 🎨 6 Bộ Chủ Đề Phong Cách Quán + Chuỗi Vĩ Mô (3 Xưởng, 5 Chi Nhánh & Học Viện Truyền Nghề)
    function buyOrEquipDecorThemeSet(themeId) {
      ensureV15State(state);
      const tObj = DECOR_THEME_SETS.find(x => x.id === themeId);
      if (!tObj) return;
      if (!Array.isArray(state.ownedDecors)) state.ownedDecors = [];
      const ownedSteps = getThemeSetOwnedSteps(tObj);

      if (ownedSteps < 4) {
        if (state.money < tObj.costPerStep) {
          showToast(`⚠️ Cần ${formatVND(tObj.costPerStep)} để sưu tầm mảnh ${ownedSteps + 1}/4 của "${tObj.name}"!`);
          return;
        }
        const nextPieceId = tObj.pieces.find(p => !state.ownedDecors.includes(p));
        state.money -= tObj.costPerStep;
        if (nextPieceId && !state.ownedDecors.includes(nextPieceId)) {
          state.ownedDecors.push(nextPieceId);
        }
        state.activeDecorThemeId = themeId;
        state.equippedDecors = { ...(state.equippedDecors || {}), ...tObj.equipMap };
        addXP(35);
        playSFX("cash");
        applyEquippedDecorsVisuals();
        updateAllUI();
        saveGameEverywhere();
        const newCount = getThemeSetOwnedSteps(tObj);
        showToast(newCount >= 4
          ? `🎉 Đã hoàn tất trọn bộ 4/4 "${tObj.name}" và kích hoạt Hiệu ứng Bộ!`
          : `🎨 Đã mở mảnh ${newCount}/4 (${tObj.pieceNames[newCount - 1]}) của "${tObj.name}"!`);
      } else {
        state.activeDecorThemeId = themeId;
        state.equippedDecors = { ...(state.equippedDecors || {}), ...tObj.equipMap };
        playSFX("snip");
        applyEquippedDecorsVisuals();
        updateAllUI();
        saveGameEverywhere();
        showToast(`✨ Đã trang bị "${tObj.name}" cho toàn bộ quán!`);
      }
    }

    function renderThemeSetsAndEmpireChainHtml() {
      ensureV15State(state);
      const lvl = state.level || 1;
      const totalOwnedDecors = Array.isArray(state.ownedDecors) ? state.ownedDecors.length : 0;

      const themeCardsHtml = DECOR_THEME_SETS.map(t => {
        const steps = getThemeSetOwnedSteps(t);
        const isComplete = steps >= 4;
        const isEquipped = state.activeDecorThemeId === t.id;
        const imgSrc = CASUAL_2D_ASSETS[t.imgKey] || CASUAL_2D_ASSETS.dec_lantern || "";
        const nextPieceLabel = steps < 4 ? t.pieceNames[steps] : "Đã đủ 4/4 mảnh";

        return `
          <div class="p-2.5 rounded-2xl border-2 ${isEquipped ? 'bg-yellow-50 border-orange-500 shadow-md' : isComplete ? 'bg-emerald-50/60 border-emerald-400' : 'bg-white border-amber-200'} space-y-1.5 text-xs">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHtml(t.name)}" class="w-11 h-11 rounded-xl object-cover border-2 border-amber-400 shrink-0 shadow-sm" />` : `<span class="text-xl">${t.icon}</span>`}
                <div class="min-w-0 flex-1 leading-snug">
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="font-black text-amber-950 text-xs">${t.name}</span>
                    <span class="px-1.5 py-0 rounded-full text-[9px] font-black ${isComplete ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-950'}">${steps}/4 mảnh</span>
                  </div>
                  <div class="text-[9.5px] font-bold text-emerald-800 mt-0.5">🌟 ${t.perkDesc}</div>
                </div>
              </div>
              <div class="shrink-0">
                ${!isComplete
                  ? `<button type="button" onclick="buyOrEquipDecorThemeSet('${t.id}')" class="soft-btn btn-game-orange px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Mở ${steps + 1}/4</div><div class="text-[9px] text-yellow-200">${formatShortK(t.costPerStep)}</div></button>`
                  : isEquipped
                    ? `<span class="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] inline-block shadow">✨ Đang Dùng</span>`
                    : `<button type="button" onclick="buyOrEquipDecorThemeSet('${t.id}')" class="soft-btn btn-game-blue px-2.5 py-1.5 rounded-xl font-black text-[10px]">Trang Bị</button>`
                }
              </div>
            </div>
            <div class="flex items-center justify-between text-[9px] font-bold text-amber-800 pt-0.5 border-t border-amber-100">
              <span>Tiến độ bộ: ${t.pieceNames.map((pn, i) => `<b class="${i < steps ? 'text-emerald-700' : 'text-slate-400'}">${i < steps ? '✓' : '○'} ${pn}</b>`).join(" • ")}</span>
            </div>
          </div>
        `;
      }).join("");

      let empireChainHtml = "";
      if (lvl < 22) {
        empireChainHtml = `
          <div class="p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-center text-[10.5px] font-bold text-amber-900">
            🔒 <b>Chuỗi Vĩ Mô (3 Xưởng Nguyên Liệu, 5 Chi Nhánh Nhượng Quyền & Học Viện Truyền Nghề)</b> sẽ tự động mở khóa tại đây khi quán đạt <b class="text-red-700">Cấp 22</b> (Hiện tại: Cấp ${lvl}/22).
          </div>
        `;
      } else {
        const workshopsHtml = SUPPLY_WORKSHOPS.map(ws => {
          const wLvl = Math.min(3, Math.max(0, Number(state.workshops?.[ws.id] || 0)));
          const isMax = wLvl >= 3;
          const nextCost = ws.costs[wLvl] || 0;
          const reqLvl = ws.reqLevels[wLvl] || 80;
          const canLvl = lvl >= reqLvl;
          return `
            <div class="p-2 rounded-2xl bg-amber-50/90 border-2 ${isMax ? 'border-amber-500 bg-yellow-50' : wLvl > 0 ? 'border-emerald-300' : 'border-amber-200'} flex items-center justify-between gap-2 text-xs">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <img src="${ws.img}" alt="${escapeHtml(ws.name)}" class="w-10 h-10 rounded-xl object-cover border border-amber-500 shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="font-black text-amber-950 text-xs">${ws.name} <span class="px-1.5 py-0.5 rounded-full bg-amber-200 text-[9px]">Cấp ${wLvl}/3</span></div>
                  <div class="text-[10px] font-extrabold text-emerald-800 mt-0.5">${ws.effectLine(wLvl)}</div>
                </div>
              </div>
              <div class="shrink-0">
                ${isMax
                  ? `<span class="px-2 py-1 rounded-xl bg-amber-400 text-amber-950 font-black text-[10px]">👑 Tối Đa</span>`
                  : canLvl
                    ? `<button onclick="upgradeSupplyWorkshop('${ws.id}')" class="soft-btn btn-game-green px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>Ký Cấp ${wLvl + 1}</div><div class="text-[9px] text-emerald-100">${formatShortK(nextCost)}</div></button>`
                    : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${reqLvl}</span>`
                }
              </div>
            </div>
          `;
        }).join("");

        const franchisesHtml = FRANCHISE_BRANCHES.map(fr => {
          const fLvl = Math.min(5, Math.max(0, Number(state.franchises?.[fr.id] || 0)));
          const isMax = fLvl >= 5;
          const nextCost = fr.costs[fLvl] || 0;
          const canLvl = lvl >= fr.reqLevel;
          const curPayout = fr.dailyPayouts[fLvl] || 0;
          const nextPayout = fr.dailyPayouts[fLvl + 1] || curPayout;
          return `
            <div class="p-2 rounded-2xl bg-white border-2 ${isMax ? 'border-amber-500 bg-yellow-50/70' : fLvl > 0 ? 'border-teal-400 bg-teal-50/30' : 'border-amber-200'} flex items-center justify-between gap-2 text-xs">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <img src="${fr.img}" alt="${escapeHtml(fr.name)}" class="w-10 h-10 rounded-xl object-cover border border-amber-500 shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="font-black text-amber-950 text-xs">${fr.name} <span class="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[9px]">Cấp ${fLvl}/5</span></div>
                  <div class="text-[10px] font-extrabold text-teal-800 mt-0.5">💎 Cổ tức: ${fLvl > 0 ? '+' + formatShortK(curPayout) : '0đ'}${!isMax ? ' ➔ +' + formatShortK(nextPayout) + '/tối' : '/tối'}</div>
                </div>
              </div>
              <div class="shrink-0">
                ${isMax
                  ? `<span class="px-2 py-1 rounded-xl bg-amber-400 text-amber-950 font-black text-[10px]">👑 Cấp 5/5</span>`
                  : canLvl
                    ? `<button onclick="upgradeFranchiseBranch('${fr.id}')" class="soft-btn btn-game-blue px-2.5 py-1.5 rounded-xl font-black text-[10px] text-center"><div>${fLvl === 0 ? 'Mở Quầy' : 'Nâng Cấp ' + (fLvl + 1)}</div><div class="text-[9px] text-yellow-200">${formatShortK(nextCost)}</div></button>`
                    : `<span class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-black text-[10px]">🔒 Cấp ${fr.reqLevel}</span>`
                }
              </div>
            </div>
          `;
        }).join("");

        empireChainHtml = `
          <div class="pt-2 border-t border-amber-300 space-y-1.5">
            <div class="font-black text-xs text-amber-950">🏭 3 Xưởng Nguyên Liệu Gốc & 5 Chi Nhánh Nhượng Quyền:</div>
            ${workshopsHtml}
            ${franchisesHtml}
            ${renderPrestigeSubTabHtml()}
          </div>
        `;
      }

      return `
        <div class="space-y-2">
          <div class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-50 via-amber-50 to-yellow-50 border border-amber-400 text-[10px] font-bold text-amber-950 flex items-center justify-between">
            <span>🎨 6 Bộ Chủ Đề Phong Cách (Mở mảnh kích hoạt Hiệu ứng Bộ)</span>
            <span class="px-2 py-0.5 rounded-full bg-amber-200 font-black">Đã sưu tầm: ${totalOwnedDecors}/24 mảnh</span>
          </div>
          <div class="space-y-1.5">${themeCardsHtml}</div>
          ${empireChainHtml}
        </div>
      `;
    }


    function switchSaigonBankTab(tabKey) {
      activeBankSubTab = tabKey;
      playSFX("snip");
      renderSaigonBankCenterBox();
    }

    function depositToSaigonSavings(amount) {
      ensureV15State(state);
      if ((state.level || 1) < 20) {
        showToast("🔒 Đạt Cấp 20 (Kiot Góc Phố) để mở Sổ Tiết Kiệm Ngân Hàng Sài Gòn!");
        return;
      }
      const val = Math.round(Number(amount || 0));
      if (val <= 0 || state.money < val) {
        showToast(`⚠️ Số dư tiền mặt không đủ để gửi tiết kiệm ${formatVND(val)}!`);
        return;
      }
      state.money -= val;
      state.savingsBalance = (state.savingsBalance || 0) + val;
      state.creditScore = Math.min(850, (state.creditScore || 520) + 4);
      playSFX("cash");
      updateAllUI();
      saveGameEverywhere();
      showToast(`📗 Đã gửi ${formatVND(val)} vào Sổ Tiết Kiệm (+1,5%/đêm • +4 Điểm Uy Tín)!`);
    }

    function withdrawAllSaigonSavings() {
      ensureV15State(state);
      const bal = Math.round(Number(state.savingsBalance || 0));
      if (bal <= 0) {
        showToast("⚠️ Sổ Tiết Kiệm hiện chưa có số dư để rút!");
        return;
      }
      state.money += bal;
      state.savingsBalance = 0;
      playSFX("cash");
      updateAllUI();
      saveGameEverywhere();
      showToast(`💰 Đã rút toàn bộ ${formatVND(bal)} từ Sổ Tiết Kiệm về két tiền mặt!`);
    }

    function takeTieredBankLoan(tierNum) {
      ensureV15State(state);
      const tObj = SAIGON_BANK_LOAN_TIERS.find(t => t.tier === Number(tierNum));
      if (!tObj) return;
      if ((state.loanDebt || 0) > 0) {
        showToast("⚠️ Hãy tất toán khoản dư nợ hiện tại trước khi giải ngân gói vay mới!");
        return;
      }
      if ((state.level || 1) < tObj.reqLevel) {
        showToast(`🔒 Cần đạt Cấp ${tObj.reqLevel} để mở ${tObj.name}!`);
        return;
      }
      if ((state.creditScore || 520) < tObj.reqCredit) {
        showToast(`⚠️ Cần tối thiểu ${tObj.reqCredit} Điểm Uy Tín để vay gói này!`);
        return;
      }
      if (tObj.reqLic && !(state.licenses && state.licenses[tObj.reqLic])) {
        const licObj = LICENSES_CATALOG.find(l => l.id === tObj.reqLic);
        showToast(`⚠️ Cần sở hữu "${licObj ? licObj.name : tObj.reqLic}" để thế chấp gói vay này!`);
        return;
      }
      const totalRepay = Math.round(tObj.principal * (1 + tObj.dailyInterestRate * 5));
      state.money += tObj.principal;
      state.loanDebt = totalRepay;
      state.bankLoanTier = tObj.tier;
      const td = ensureTodayDetail();
      td.loansTaken = (td.loansTaken || 0) + tObj.principal;
      playSFX("cash");
      updateAllUI();
      saveGameEverywhere();
      showToast(`🏦 Giải ngân thành công ${formatVND(tObj.principal)} (${tObj.name})!`);
    }

    function renderSaigonBankCenterBox() {
      const box = document.getElementById("saigon-bank-center-box");
      if (!box) return;
      ensureV15State(state);
      const lvl = state.level || 1;
      const cs = state.creditScore || 520;

      if (lvl < 20) {
        box.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              ${CASUAL_2D_ASSETS.fn_bank ? `<img src="${CASUAL_2D_ASSETS.fn_bank}" alt="Bank" class="w-9 h-9 rounded-xl border border-emerald-500 bg-white object-cover shrink-0" />` : '🏦'}
              <div class="leading-tight min-w-0">
                <div class="font-black text-xs text-emerald-950">QUỸ HỖ TRỢ TIỂU THƯƠNG DÌ TƯ (CẤP 1–19)</div>
                <div class="text-[9.5px] font-bold text-emerald-800">Đạt <b>Cấp 20</b> sẽ mở <b>Ngân Hàng Thương Mại Sài Gòn</b> (Sổ Tiết Kiệm & 5 Hạng Vay Lớn)</div>
              </div>
            </div>
          </div>
          <div class="p-2 rounded-xl bg-white border border-emerald-300 flex items-center justify-between gap-2">
            <div class="text-[10.5px] font-bold text-amber-950">
              Dư nợ hiện tại: <b class="text-red-600">${formatVND(state.loanDebt || 0)}</b> • Đã vay cứu trợ: <b>${state.rescueLoanCount || 0}/2 lần</b>
            </div>
            <div class="flex gap-1 shrink-0">
              <button type="button" onclick="takeInvestmentLoan()" class="soft-btn btn-game-green px-2.5 py-1 rounded-lg font-black text-[10px]">Vay 200k</button>
              <button type="button" onclick="payOffAllDebt()" class="soft-btn btn-game-orange px-2.5 py-1 rounded-lg font-black text-[10px]">Trả nợ</button>
            </div>
          </div>
        `;
        return;
      }

      const csRank = cs >= 780 ? "Kim Cương (AAA)" : cs >= 680 ? "Vàng (AA)" : cs >= 560 ? "Bạc (A)" : "Tiêu Chuẩn (B)";
      const sav = Math.round(state.savingsBalance || 0);
      const maxNightCap = lvl * 15000;
      const estNightInterest = Math.min(maxNightCap, Math.round(sav * 0.015));

      let subContentHtml = "";
      if (activeBankSubTab === "savings") {
        subContentHtml = `
          <div class="p-2 rounded-xl bg-white/95 border border-teal-300 space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                ${CASUAL_2D_ASSETS.fn_passbook ? `<img src="${CASUAL_2D_ASSETS.fn_passbook}" alt="Passbook" class="w-6 h-6 rounded-lg border border-teal-400 object-cover" />` : '📗'}
                <span class="font-black text-[10.5px] text-teal-950">Số dư: <b class="text-emerald-700">${formatVND(sav)}</b></span>
              </div>
              <span class="text-[9px] font-extrabold text-teal-800">Lãi đêm nay: +${formatShortK(estNightInterest)}</span>
            </div>
            <div class="grid grid-cols-4 gap-1">
              <button type="button" onclick="depositToSaigonSavings(100000)" class="soft-btn py-1 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-950 font-black text-[9.5px]">+100k</button>
              <button type="button" onclick="depositToSaigonSavings(500000)" class="soft-btn py-1 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-950 font-black text-[9.5px]">+500k</button>
              <button type="button" onclick="depositToSaigonSavings(2000000)" class="soft-btn py-1 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-950 font-black text-[9.5px]">+2 Triệu</button>
              <button type="button" onclick="withdrawAllSaigonSavings()" class="soft-btn py-1 rounded-lg bg-amber-100 border border-amber-400 text-amber-950 font-black text-[9.5px]">Rút Hết</button>
            </div>
          </div>
        `;
      } else {
        const loanRowsHtml = SAIGON_BANK_LOAN_TIERS.map(t => {
          const hasLic = !t.reqLic || Boolean(state.licenses && state.licenses[t.reqLic]);
          const eligible = (lvl >= t.reqLevel) && (cs >= t.reqCredit) && hasLic && ((state.loanDebt || 0) <= 0);
          const licName = t.reqLic ? (LICENSES_CATALOG.find(l => l.id === t.reqLic)?.name || t.reqLic) : "Tín chấp";
          return `
            <div class="p-1.5 rounded-xl bg-white border ${eligible ? 'border-emerald-400' : 'border-amber-200 opacity-85'} flex items-center justify-between gap-1.5">
              <div class="min-w-0 flex-1 leading-tight">
                <div class="font-black text-[10px] text-amber-950">${t.name}: <span class="text-emerald-700">+${formatShortK(t.principal)}</span></div>
                <div class="text-[8.5px] font-bold text-amber-800">Cấp ${t.reqLevel} • ${t.reqCredit} Uy tín • ${licName}</div>
              </div>
              <button type="button" onclick="takeTieredBankLoan(${t.tier})" class="soft-btn px-2 py-1 rounded-lg font-black text-[9px] shrink-0 ${eligible ? 'bg-emerald-600 text-white shadow' : 'bg-slate-200 text-slate-600'}">
                ${(state.loanDebt || 0) > 0 ? 'Đang nợ' : eligible ? 'Vay ngay' : `🔒 C.${t.reqLevel}`}
              </button>
            </div>
          `;
        }).join("");
        subContentHtml = `<div class="space-y-1">${loanRowsHtml}</div>`;
      }

      box.innerHTML = `
        <div class="flex items-center justify-between gap-1.5">
          <div class="flex items-center gap-1.5 min-w-0">
            ${CASUAL_2D_ASSETS.fn_bank ? `<img src="${CASUAL_2D_ASSETS.fn_bank}" alt="Bank" class="w-7 h-7 rounded-xl border border-emerald-500 bg-white object-cover shrink-0" />` : '🏦'}
            <div class="leading-tight min-w-0">
              <div class="font-black text-[11px] text-emerald-950 truncate">NGÂN HÀNG THƯƠNG MẠI SÀI GÒN</div>
              <div class="text-[9px] font-bold text-emerald-800">Uy tín: <b class="text-amber-950">${cs}/850 (${csRank})</b> • Nợ: <b class="text-red-600">${formatShortK(state.loanDebt || 0)}</b></div>
            </div>
          </div>
          ${(state.loanDebt || 0) > 0 ? `<button type="button" onclick="payOffAllDebt()" class="soft-btn btn-game-orange px-2 py-1 rounded-xl font-black text-[9.5px] shrink-0">Tất Toán</button>` : ''}
        </div>
        <div class="grid grid-cols-2 gap-1 bg-emerald-100/80 p-1 rounded-xl border border-emerald-300">
          <button type="button" onclick="switchSaigonBankTab('savings')" class="soft-btn py-1 rounded-lg font-black text-[9.5px] ${activeBankSubTab === 'savings' ? 'bg-emerald-700 text-white shadow' : 'bg-white text-emerald-950'}">📗 Sổ Tiết Kiệm (+1,5%)</button>
          <button type="button" onclick="switchSaigonBankTab('loans')" class="soft-btn py-1 rounded-lg font-black text-[9.5px] ${activeBankSubTab === 'loans' ? 'bg-emerald-700 text-white shadow' : 'bg-white text-emerald-950'}">🏦 5 Hạng Vay Vốn</button>
        </div>
        ${subContentHtml}
      `;
    }

    // --- 12. HỌC VIỆN TRUYỀN NGHỀ ĐỜI SAU (CẤP 60+) & PHÒNG PVP ---
    function triggerPrestigeNewGeneration() {
      ensureV15State(state);
      if ((state.level || 1) < 60) {
        showToast("🔒 Cần đạt tối thiểu Cấp 60 để thực hiện nghi thức Truyền Nghề Đời Sau!");
        return;
      }
      state.prestigeGen = (state.prestigeGen || 0) + 1;
      state.level = 10;
      state.xp = 0;
      state.money = (state.money || 0) + 1500000;
      state.creditScore = Math.min(850, (state.creditScore || 520) + 50);
      playSFX("cash");
      updateAllUI();
      saveGameEverywhere();
      showToast(`👑 Chúc mừng Truyền Nghề Đời Thứ ${state.prestigeGen + 1}! Nhận vĩnh viễn +${state.prestigeGen * 12}% khách & +1.500.000đ vốn!`);
    }

    function renderPrestigeSubTabHtml() {
      ensureV15State(state);
      const gen = state.prestigeGen || 0;
      const canPrestige = (state.level || 1) >= 60;
      return `
        <div class="p-3 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400 space-y-2 text-xs shadow-sm">
          <div class="flex items-center gap-2">
            ${CASUAL_2D_ASSETS.ev_trophy ? `<img src="${CASUAL_2D_ASSETS.ev_trophy}" alt="Trophy" class="w-10 h-10 rounded-xl border-2 border-amber-500 bg-white object-cover shrink-0" />` : '<span class="text-2xl">👑</span>'}
            <div class="min-w-0 flex-1 leading-snug">
              <div class="font-black text-amber-950 text-xs">HỌC VIỆN TRUYỀN NGHỀ ĐỜI SAU (ĐỜI THỨ ${gen + 1})</div>
              <div class="text-[9.5px] font-bold text-emerald-800">Thưởng vĩnh viễn: <b>+${gen * 12}% tổng lượng khách & +${gen * 3} bịch/ngày</b></div>
            </div>
          </div>
          <button type="button" onclick="triggerPrestigeNewGeneration()" class="soft-btn w-full py-1.5 rounded-xl font-black text-[10.5px] ${canPrestige ? 'btn-game-red shadow' : 'bg-slate-200 text-slate-600'}">
            ${canPrestige ? `👑 Truyền Nghề Đời Thứ ${gen + 2} (+1,5 Triệu Vốn & +12% Khách)` : `🔒 Đạt Cấp 60 để Truyền Nghề (Hiện tại: Cấp ${state.level || 1}/60)`}
          </button>
        </div>
      `;
    }


// ================= ĐIỀU HƯỚNG 6 TAB DƯỚI ĐÁY & CẬP NHẬT GIAO DIỆN THỐNG NHẤT =================
function switchUpgradeSubTab(sub) {
  if (sub === "dishes") { switchPrepSubTab("menu"); return; }
  if (sub === "scale" || sub === "licenses" || sub === "tools") sub = "marketing";
  if (sub === "comfort") sub = "decor";
  currentUpgradeSubTab = sub;
  ["marketing", "staff", "decor"].forEach(k => {
    const btn = document.getElementById(`upg-sub-${k}`);
    if (btn) {
      btn.className = k === sub
        ? "soft-btn py-1.5 px-1.5 rounded-lg font-black text-[10.5px] bg-orange-600 text-white shadow"
        : "soft-btn py-1.5 px-1.5 rounded-lg font-black text-[10.5px] text-amber-950 bg-white";
    }
  });
  renderUpgradesTab();
}

function renderUpgradesTab() {
  const container = document.getElementById("upgrade-sub-content");
  if (!container) return;
  if (currentUpgradeSubTab === "staff") {
    container.innerHTML = renderStaffCardsWithMoraleHtml();
  } else if (currentUpgradeSubTab === "decor") {
    container.innerHTML = renderThemeSetsAndEmpireChainHtml();
  } else {
    container.innerHTML = renderStreamlinedShopAndToolsHtml();
  }
}

function switchPrepSubTab(sub) {
  if (sub === "pricing" || sub === "dishes") sub = "menu";
  if (sub === "empire") sub = "upgrade";
  currentPrepSubTab = sub;
  playSFX("snip");
  const dockTabs = ["kho", "menu", "marketing", "upgrade", "ledger", "leaderboard"];
  dockTabs.forEach(t => {
    const btn = document.getElementById(`prep-tab-${t}`);
    const isActive = (t === sub) || (t === "kho" && sub === "soche");
    if (btn) {
      btn.className = isActive
        ? "dock-tab-btn dock-tab-active py-1 px-0.5 flex flex-col items-center justify-center relative"
        : "dock-tab-btn py-1 px-0.5 flex flex-col items-center justify-center relative";
    }
  });

  const showId = (id, visible) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", !visible);
  };
  showId("prep-panel-kho", sub === "kho");
  showId("prep-panel-soche", sub === "soche");
  showId("prep-panel-menu", sub === "menu");
  showId("prep-panel-marketing", sub === "marketing");
  showId("prep-panel-upgrade", sub === "upgrade");
  showId("prep-panel-ledger", sub === "ledger");
  showId("prep-panel-leaderboard", sub === "leaderboard");

  const vp = document.getElementById("main-scroll-viewport");
  if (vp) vp.scrollTop = 0;
  if (sub === "kho") { renderMorningForecastBriefing();
  if (typeof renderDay1OnboardingChecklist === "function") renderDay1OnboardingChecklist(); renderMarketGrid(); renderBargainBanner(); }
  else if (sub === "soche") { renderPrepStatus(); renderCustomSauceLab(); }
  else if (sub === "menu") { renderMorningForecastBriefing(); renderMenuAndPricingTab(); }
  else if (sub === "marketing") renderMarketingCenterTab();
  else if (sub === "upgrade") renderUpgradesTab();
  else if (sub === "ledger") renderLedgerTab();
  else if (sub === "leaderboard") {
    renderLeaderboardTab();
    fetchCloudLeaderboard(false);
  }
}

function renderLedgerTab() {
  _baseRenderLedgerTab();
  renderSaigonBankCenterBox();
}

function updateAllUI() {
  if (typeof renderDay1OnboardingChecklist === "function") renderDay1OnboardingChecklist();
  ensureV15State(state);
  if (!state.localCustomAvatar) {
    try {
      const localAv = localStorage.getItem("btt_local_custom_avatar_v15");
      if (localAv && localAv.startsWith("data:image/")) state.localCustomAvatar = localAv;
    } catch (e) {}
  }
  recalcNeighborhoodMarketShare();
  _baseUpdateAllUI();
  renderMorningForecastBriefing();
  if (currentPrepSubTab === "marketing") renderMarketingCenterTab();
  else if (currentPrepSubTab === "leaderboard") renderLeaderboardTab();
  if (typeof syncStep3VesselChibiAndLabel === "function") syncStep3VesselChibiAndLabel();
  if (typeof renderCompactStreetControlStrip === "function") renderCompactStreetControlStrip();
  const badgeEl = document.getElementById("badge-marketing-unlock");
  if (badgeEl) {
    badgeEl.textContent = (state.level || 1) < 8 ? "C.8+" : `${state.marketSharePct}%`;
  }
  updateFirebaseStatusBadgesUI();
}

