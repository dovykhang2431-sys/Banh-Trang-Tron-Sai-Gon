/**
 * Gameplay Giai Đoạn Bán Hàng Ngoài Phố: Hàng Đợi 4 Ô Khách, Chế Biến Tam Hệ, Chấm Sao 5⭐ & Chốt Sổ
 */
    // ================= 13. CA BÁN HÀNG & ĐỘ NHẠY GIÁ TỰ ĐỘNG ĐIỀU TIẾT KHÁCH =================
    function activateCartBuff(id, title, seconds) {
      activeCartBuff = { id, title, seconds };
      const bar = document.getElementById("cart-active-buff-bar");
      const titleEl = document.getElementById("cart-buff-title");
      const timerEl = document.getElementById("cart-buff-timer");
      if (bar && titleEl && timerEl) {
        titleEl.textContent = title;
        timerEl.textContent = `${seconds}s`;
        bar.classList.remove("hidden");
      }
      if (id === "rain_flood") {
        document.getElementById("rain-visual-layer").classList.remove("hidden");
        // Mái Hiên Cấp 5+ tự động bung bạt che mưa ngay lập tức!
        if ((state.equipLevels?.upg_awning || 0) >= 3) {
          rainTarpCovered = true;
          document.getElementById("btn-rain-tarp").classList.add("hidden");
          showToast("☂️ Mái Hiên (Cấp 3+) đã tự động bung bạt che mưa!");
        } else {
          rainTarpCovered = false;
          document.getElementById("btn-rain-tarp").classList.remove("hidden");
        }
      }
    }

    function toggleRainTarp() {
      rainTarpCovered = true;
      document.getElementById("btn-rain-tarp").classList.add("hidden");
      playSFX("snip");
      updateSweetSpotUI();
      showToast("☂️ Đã căng bạt che mưa! Bánh không còn sợ bị ẩm ướt!");
    }

    function startBulkOrderChallenge(targetBags, seconds, rewardMoney) {
      const scaleMult = 1 + (getCurrentShopScaleObj().bulkBonus || 0);
      const finalReward = Math.round((rewardMoney * scaleMult) / 500) * 500;
      bulkOrderChallenge = { active: true, target: targetBags, done: 0, seconds, reward: finalReward };
      const banner = document.getElementById("bulk-rush-banner");
      if (banner) banner.classList.remove("hidden");
      updateBulkRushUI();
      for (let i = 0; i < 4; i++) {
        if (!customerSlots[i]) spawnCustomerIntoEmptySlot(true);
      }
      showToast(`🏢 ĐƠN SỈ: Giao ${targetBags} phần trong ${seconds} giây!`);
    }

    function updateBulkRushUI() {
      const banner = document.getElementById("bulk-rush-banner");
      if (!bulkOrderChallenge || !bulkOrderChallenge.active) {
        if (banner) banner.classList.add("hidden");
        return;
      }
      document.getElementById("bulk-rush-title").textContent = `🏢 ĐƠN SỈ QUẬN 1: GIAO ${bulkOrderChallenge.target} PHẦN!`;
      document.getElementById("bulk-rush-progress").textContent = `Đã giao: ${bulkOrderChallenge.done}/${bulkOrderChallenge.target} • Thưởng: +${formatVND(bulkOrderChallenge.reward)}`;
      document.getElementById("bulk-rush-timer").textContent = `${bulkOrderChallenge.seconds}s`;
    }

    function startStreetSellingPhase(isResuming = false) {
      if (state.money < 15000 && (state.stock.banhtrang || 0) < 1) {
        checkBankruptcyOrRescueLoan();
        return;
      }
      if (!isResuming) {
        state.levelAtStartOfDay = state.level;
        state.todayCartBagsSpawned = 0;
      }
      state.isStreetSelling = true;
      if (!isResuming || state.clockMinutes < 14 * 60) state.clockMinutes = 14 * 60;
      customerSlots = [null, null, null, null];
      selectedSlotIndex = 0;
      resetBowl(false);
      playSFX("bike");
      updateAllUI();
      startFourSlotQueueEngine();
      if ((state.viralPct || 0) >= 80) {
        setTimeout(() => {
          if (state.isStreetSelling) launchViralStormNow();
        }, 600);
      } else {
        setTimeout(() => { if (state.isStreetSelling && !isAnyBlockingModalOpen()) spawnCustomerIntoEmptySlot(); }, 800);
      }
      if (state.pendingGuaranteedRushEvent) {
        state.pendingGuaranteedRushEvent = false;
        setTimeout(() => {
          if (state.isStreetSelling) {
            const rushPool = [
              { id: "intl_bus_rush", title: "🚌 Đoàn Du Lịch Quốc Tế (Kín 4 ô • Tip x2)" },
              { id: "tv_report_rush", title: "🎥 Phóng Sự Truyền Hình (Trộn 5⭐ +15k & +3% Viral)" },
              { id: "spicy_king_rush", title: "🌶️ Thử Thách Thánh Ăn Cay (Khách chuộng Siêu Cay • Tip +6k)" }
            ];
            const pick = rushPool[Math.floor(Math.random() * rushPool.length)];
            activateCartBuff(pick.id, pick.title, 45);
            for (let i = 0; i < 4; i++) { if (!customerSlots[i]) spawnCustomerIntoEmptySlot(true); }
          }
        }, 1200);
      }
    }

    function startFourSlotQueueEngine() {
      if (slotPatienceTimer) clearInterval(slotPatienceTimer);
      if (slotSpawnerTimer) clearInterval(slotSpawnerTimer);

      slotPatienceTimer = setInterval(() => {
        if (!state.isStreetSelling || isAnyBlockingModalOpen()) return;

        if (activeCartBuff) {
          activeCartBuff.seconds -= 1;
          const timerEl = document.getElementById("cart-buff-timer");
          if (timerEl) timerEl.textContent = `${activeCartBuff.seconds}s`;
          if (activeCartBuff.seconds <= 0) {
            if (activeCartBuff.id === "rain_flood") {
              document.getElementById("rain-visual-layer").classList.add("hidden");
              document.getElementById("btn-rain-tarp").classList.add("hidden");
            }
            activeCartBuff = null;
            document.getElementById("cart-active-buff-bar").classList.add("hidden");
            updateSweetSpotUI();
          }
        }

        if (bulkOrderChallenge && bulkOrderChallenge.active) {
          bulkOrderChallenge.seconds -= 1;
          updateBulkRushUI();
          if (bulkOrderChallenge.seconds <= 0) {
            bulkOrderChallenge.active = false;
            updateBulkRushUI();
            state.money = Math.max(0, state.money - 30000);
            adjustRating(-0.15);
            showToast("❌ Trễ Đơn Sỉ! Phạt -30.000đ & -0.15⭐!");
            updateAllUI();
          }
        }

        let baseDecay = 0.45;
        if (state.level >= 6 && state.level <= 15) baseDecay = 0.68 + (state.level - 6) * 0.035;
        else if (state.level > 15) baseDecay = 1.00 + Math.min(0.8, (state.level - 15) * 0.03);

        const priceImpact = getPricingCustomerImpact();
        baseDecay *= priceImpact.patienceDecayMult;

        // Tác động giữ chân khách từ Bàn Ghế Nhựa Đỏ (upg_stool), Quạt Phun Sương (upg_neon), Mái Hiên (upg_awning) & Chú Tư Nghĩa
        const stoolLvl = state.equipLevels?.upg_stool || 0;
        const fanLvl = state.equipLevels?.upg_neon || 0;
        const awningLvl = state.equipLevels?.upg_awning || 0;
        const tuNghiaBonus = (state.staff?.tunghia ? (0.20 + (state.staffStars?.tunghia || 1) * 0.05) : 0) + (getActiveSalesStrategyObj()?.patienceBonus || 0) + (state.licenses?.lic_vietgap ? 0.15 : 0);
        const durabilityPenalty = (state.cartDurability || 100) < 50 ? 1.25 : 1.0;
        const livePatienceBonus = (window.serverLiveConfig && window.serverLiveConfig.enabled) ? (Number(window.serverLiveConfig.patienceBonusPct || 0) / 100) : 0;
        const icedTeaLvl = state.equipLevels?.upg_icedtea || 0;
        const saucePatienceBonus = state.selectedDailySauce === "me_chua" ? 0.20 : 0;
        const patienceMult = 1 + (stoolLvl * 0.15) + (fanLvl * 0.10) + (awningLvl * 0.06) + (icedTeaLvl * 0.10) + saucePatienceBonus + tuNghiaBonus + livePatienceBonus;
        const slowFactor = Math.max(0.25, (1 / patienceMult) * durabilityPenalty);

        let changed = false;
        for (let i = 0; i < 4; i++) {
          const c = customerSlots[i];
          if (!c) continue;
          const isLoyal = (state.customerLoyaltyCounts?.[c.id] || 0) >= 3;
          const loyalFactor = isLoyal ? 0.80 : 1.0;
          const appMarkupMult = (c.isShipper && state.appPriceMarkup) ? 1.40 : (c.isShipper ? 1.18 : (c.picky ? 1.25 : 1.0));
          const d = baseDecay * appMarkupMult * slowFactor * loyalFactor;
          c.patience = Math.max(0, c.patience - d);
          changed = true;

          if (c.patience <= 0) {
            const wasSelected = (i === selectedSlotIndex);
            const penalty = c.isShipper ? -0.12 : (c.picky ? -0.15 : -0.08);
            customerSlots[i] = null;
            currentComboStreak = 0;
            adjustRating(penalty);
            showToast(`💢 ${c.name} đợi lâu bỏ đi (${penalty}⭐)!`);
            if (wasSelected) autoSelectFirstAvailableSlot();
          }
        }
        if (changed) {
          renderCustomerSlotsRow();
          renderSelectedOrderBubble();
        }
      }, 1000);

      const sched = getTodayScheduleInfo(state.day);
      const priceImpact = getPricingCustomerImpact();
      const mapsLvl = state.equipLevels?.upg_maps || 0;
      const signLvl = state.equipLevels?.upg_signbox || 0;
      const tiktokLvl = state.equipLevels?.upg_tiktoker || 0;
      const mktSpeedMult = Math.max(0.48, 1 - (mapsLvl * 0.06) - (signLvl * 0.04) - (tiktokLvl * 0.04));
      const finalSpawnMs = Math.round((sched.spawnMs || 9600) * priceImpact.spawnMult * mktSpeedMult);

      slotSpawnerTimer = setInterval(() => {
        if (!state.isStreetSelling || isAnyBlockingModalOpen()) return;
        const activeCount = customerSlots.filter(Boolean).length;
        let maxAllowed = getMaxActiveCustomerSlots();
        let spawnProb = 0.52 + (mapsLvl + signLvl + tiktokLvl) * 0.025;
        if (activeCartBuff && activeCartBuff.id === "tiktok_storm") { maxAllowed = 4; spawnProb = 1.0; }
        if (activeCartBuff && activeCartBuff.id === "alley_hide") { maxAllowed = 1; spawnProb = 0.35; }
        if (activeCount < maxAllowed && Math.random() < spawnProb) {
          spawnCustomerIntoEmptySlot(Boolean(activeCartBuff && activeCartBuff.id === "tiktok_storm"));
        }
      }, finalSpawnMs);
    }

    function spawnCustomerIntoEmptySlot(forceManualCall = false) {
      const isRushBuff = activeCartBuff && ["tiktok_storm", "intl_bus_rush", "tv_report_rush", "spicy_king_rush"].includes(activeCartBuff.id);
      if (state.clockMinutes >= 22 * 60) return;
      if (!forceManualCall && !isRushBuff && isAnyBlockingModalOpen()) return;
      const maxSlots = isRushBuff ? 4 : getMaxActiveCustomerSlots();
      const emptyIdx = customerSlots.findIndex((x, idx) => x === null && idx < maxSlots);
      if (emptyIdx === -1) return;

      const dailyCap = getActualCartBagDemandCap(state.day);
      const isStorm = isRushBuff || (bulkOrderChallenge && bulkOrderChallenge.active);
      if (!forceManualCall && !isStorm && (state.todayCartBagsSpawned || 0) >= dailyCap) {
        if (customerSlots.filter(Boolean).length === 0 && state.clockMinutes < 21 * 60 + 30) {
          state.clockMinutes = 22 * 60;
          showToast(`🌙 Đã hết lượt khách hôm nay! Tự động dọn xe chốt sổ!`);
          setTimeout(() => checkAndTriggerClosingIfEmpty(), 600);
        }
        return;
      }

      const priceImpact = getPricingCustomerImpact();
      if (!forceManualCall && priceImpact.walkAwayChance > 0 && Math.random() < priceImpact.walkAwayChance) {
        adjustViral(-1);
        spawnFloatingFX("💸 Chê đắt bỏ đi!", "red");
        showToast("💸 Khách ghé nhìn bảng giá thấy cao quá nên bỏ đi! Hãy chỉnh lại giá ở Thực Đơn nhé!");
        return;
      }

      const affordableUnpurchased = getUnpurchasedEligibleDishes(true).filter(d => state.money >= d.unlockCost);
      if (affordableUnpurchased.length > 0 && Math.random() < 0.12) {
        const demandedDish = affordableUnpurchased[Math.floor(Math.random() * affordableUnpurchased.length)];
        adjustRating(-0.02);
        adjustViral(-1);
        playSFX("whistle");
        const complainHtml = `<span class="text-red-600 font-black">😤 Khách hỏi món <u>${demandedDish.name}</u>! Nhớ mở món nha! (-0.02⭐)</span>`;
        renderSelectedOrderBubble(complainHtml);
        return;
      }

      const sched = getTodayScheduleInfo(state.day);
      const isRainFlood = activeCartBuff && activeCartBuff.id === "rain_flood";
      const isTikTokStorm = activeCartBuff && activeCartBuff.id === "tiktok_storm";
      const hasAppContract = (state.activeMultiDayEffects?.appPartnerDays || 0) > 0;

      const appAdsBoost = (state.equipLevels?.upg_appads || 0) * 0.07;
      const shipperChance = Math.min(0.70, (isRainFlood ? 0.50 : isTikTokStorm ? 0.45 : hasAppContract ? 0.38 : 0.18) + appAdsBoost);
      const shipperPool = CUSTOMERS.filter(c => c.isShipper);
      const regularPool = CUSTOMERS.filter(c => !c.isShipper);

      let chosenTemplate;
      if (Math.random() < shipperChance && shipperPool.length > 0) {
        chosenTemplate = shipperPool[Math.floor(Math.random() * shipperPool.length)];
      } else {
        const curRating = typeof state.rating === "number" ? state.rating : 4.3;
        const vipPool = regularPool.filter(c => c.vip);
        const nonVipPool = regularPool.filter(c => !c.vip);
        const festActive = (state.activeMultiDayEffects?.streetFestDays || 0) > 0;
        const vipChance = curRating < 3.5 ? 0.05 : (curRating >= 4.8 ? 0.48 : (curRating >= 4.2 ? 0.32 : 0.20)) + (festActive ? 0.20 : 0);
        if (Math.random() < vipChance && vipPool.length > 0) {
          chosenTemplate = vipPool[Math.floor(Math.random() * vipPool.length)];
        } else if (nonVipPool.length > 0) {
          chosenTemplate = nonVipPool[Math.floor(Math.random() * nonVipPool.length)];
        } else {
          chosenTemplate = regularPool[Math.floor(Math.random() * regularPool.length)];
        }
      }

      const unlockedPool = state.unlockedDishes.length > 0 ? state.unlockedDishes : ["tron"];
      const weightedDishes = unlockedPool.map(dKey => {
        const dInfo = getDishDemandInfo(dKey);
        const stratFeatMult = getActiveSalesStrategyObj()?.featuredWeightMult || 1.0;
        const featBoost = (dKey === state.featuredDishKey) ? (1.5 * stratFeatMult) : 1.0;
        return { dKey, weight: dInfo.weight * featBoost, walkAway: dInfo.walkAway };
      });
      const sumW = weightedDishes.reduce((acc, item) => acc + item.weight, 0);
      let rVal = Math.random() * Math.max(0.01, sumW);
      let chosenDishItem = weightedDishes[0];
      for (const item of weightedDishes) {
        rVal -= item.weight;
        if (rVal <= 0) { chosenDishItem = item; break; }
      }
      const wantedDish = chosenDishItem.dKey;

      const tuNghiaKeepFactor = isStaffWorkingToday('tunghia') ? Math.max(0.30, 1 - (state.staffStars?.tunghia || 1) * 0.12) : 1.0;
      if (!forceManualCall && chosenDishItem.walkAway > 0 && Math.random() < (chosenDishItem.walkAway * tuNghiaKeepFactor)) {
        const dishName = DISH_MENU[wantedDish]?.short || "Bánh tráng";
        spawnFloatingFX(`💸 Chê ${dishName} đắt!`, "red");
        showToast(`💸 Khách định mua ${dishName} nhưng thấy giá cao nên bỏ đi!`);
        return;
      }

      // Đảm bảo ít nhất 1-2 topping được khách gọi để người chơi bấm chọn vui tay
      const wantedSpice = (activeCartBuff && activeCartBuff.id === "spicy_king_rush") ? 2 : (Math.random() < 0.25 ? 0 : (Math.random() < 0.55 ? 1 : 2));
      const fanLvl = state.equipLevels?.upg_neon || 0;
      const sauceTraBoost = state.selectedDailySauce === "mam_ruoc" ? 0.30 : 0;
      const traTacProb = Math.min(0.92, (sched.traTacChance || 0.35) + fanLvl * 0.08 + sauceTraBoost);
      let wantedRau = Math.random() < 0.68;
      let wantedHanh = Math.random() < 0.68;
      if (!wantedRau && !wantedHanh && wantedSpice === 0) {
        wantedRau = true;
      }

      const remainingQuota = Math.max(1, dailyCap - (state.todayCartBagsSpawned || 0));
      const isLoyalTemplate = (state.customerLoyaltyCounts?.[chosenTemplate.id] || 0) >= 3;
      const stratCombo = getActiveSalesStrategyObj()?.comboBoost || 0;
      const scaleCombo = getCurrentShopScaleObj().comboBoost || 0;
      const licCombo = (state.licenses?.lic_app_diamond ? 0.04 : 0) + (state.licenses?.lic_export ? 0.06 : 0);
      const comboBoost = Math.min(0.22, (state.equipLevels?.upg_comboboard || 0) * 0.03 + (isLoyalTemplate ? 0.08 : 0) + stratCombo * 0.5 + scaleCombo + licCombo);
      const chance2Bags = chosenTemplate.isShipper ? Math.min(0.28, 0.12 + comboBoost) : Math.min(0.24, 0.06 + comboBoost);
      const chance3Bags = Math.min(0.08, comboBoost * 0.35);
      let rawBagQty = (state.level >= 3 && Math.random() < chance2Bags) ? (Math.random() < chance3Bags ? 3 : 2) : 1;
      const bagQty = forceManualCall ? rawBagQty : Math.min(rawBagQty, remainingQuota);

      state.todayCartBagsSpawned = (state.todayCartBagsSpawned || 0) + bagQty;

      const tiktokVipBoost = (state.equipLevels?.upg_tiktoker || 0) * 0.07 + (state.selectedDailySauce === "bo_toi" ? 0.15 : 0);
      const licVipBoost = state.licenses?.lic_nightmarket ? 0.15 : 0;
      const stratVip = getActiveSalesStrategyObj()?.vipBoost || 0;
      const scaleVip = getCurrentShopScaleObj().vipBoost || 0;
      const busVip = (activeCartBuff && activeCartBuff.id === "intl_bus_rush") ? 0.45 : 0;
      const vipBoost = (sched.vipBoost || 0) + tiktokVipBoost + licVipBoost + stratVip + scaleVip + busVip + ((state.activeMultiDayEffects?.streetFestDays || 0) > 0 ? 0.25 : 0);
      // Tăng tỷ lệ khách Khó Tính theo Cấp độ (lên tới 68% ở cấp cao đòi hỏi trộn chuẩn & nhanh)
      const extraPickyChance = Math.min(0.68, 0.24 + state.level * 0.009);
      const isPickyCustomer = Boolean(chosenTemplate.picky || (Math.random() < extraPickyChance));

      customerSlots[emptyIdx] = {
        ...chosenTemplate,
        slotId: "cust_" + Date.now() + "_" + emptyIdx,
        vip: chosenTemplate.vip || (Math.random() < vipBoost),
        picky: isPickyCustomer,
        midOrderWhimDone: false,
        bagQty,
        patience: 100,
        justArrived: true,
        wantedDish, wantedSpice,
        wantedRau,
        wantedHanh,
        wantedTraTac: Math.random() < traTacProb
      };

      playSFX(chosenTemplate.arriveMode === "bike" ? "bike" : "step");

      if (!customerSlots[selectedSlotIndex]) {
        selectedSlotIndex = emptyIdx;
        onCustomerSlotSelected();
      }

      renderCustomerSlotsRow();
      renderSelectedOrderBubble();

      setTimeout(() => {
        if (customerSlots[emptyIdx]) customerSlots[emptyIdx].justArrived = false;
      }, 420);
    }

    function autoSelectFirstAvailableSlot() {
      const idx = customerSlots.findIndex(Boolean);
      if (idx !== -1) {
        selectedSlotIndex = idx;
        onCustomerSlotSelected();
      } else {
        renderCustomerSlotsRow();
        renderSelectedOrderBubble();
        syncToppingButtonsUI();
      }
    }

    function selectCustomerSlot(idx) {
      if (!customerSlots[idx]) {
        const maxSlots = getMaxActiveCustomerSlots();
        if (idx >= maxSlots) {
          showToast("🔒 Nâng cấp '🪧 Bảng Hiệu Đầu Hẻm' ở mục Nâng Cấp để mở thêm chỗ khách đứng đợi!");
        }
        return;
      }
      selectedSlotIndex = idx;
      playSFX("step");
      onCustomerSlotSelected();
    }

    function checkFullOrderIngredientsImmediate(cust, dishKeyToCheck = null) {
      if (!cust) return true;
      const targetDish = dishKeyToCheck || cust.wantedDish || bowl.selectedDish || "tron";
      const multQty = cust.bagQty || 1;
      const recipe = DISH_MENU[targetDish]?.recipe || {};
      const missing = [];

      INGREDIENTS.forEach(ing => {
        let req = (recipe[ing.id] || 0) * multQty;
        if (ing.id === "tratac" && cust.wantedTraTac) req = 1;
        if (req > 0 && (state.stock[ing.id] || 0) < req) {
          missing.push(ing);
        }
      });

      if (missing.length > 0) {
        openOutOfStockModal(missing);
        return false;
      }
      return true;
    }

    function canAutoTriggerStep1() {
      return isStaffWorkingToday('beti');
    }

    function canAutoTriggerStep2() {
      return isStaffWorkingToday('mylan');
    }

    // getBetiDelayMs & getMylanDelayMs được quản lý tại state-economy.js

    // Kiểm tra xem người chơi đã bấm chọn đúng Món + đủ các Topping trong thau (Rau, Hành, Ớt) chưa
    function isBowlReadyForStaffAuto(c) {
      if (!c) return false;
      return bowl.selectedDish === c.wantedDish &&
             bowl.rau === Boolean(c.wantedRau) &&
             bowl.hanh === Boolean(c.wantedHanh) &&
             bowl.spice === c.wantedSpice;
    }

    function quickSelectCustomerWantedDish() {
      const c = getActiveCustomer();
      if (!c) return;
      if (!bowl.step1Done && state.unlockedDishes.includes(c.wantedDish)) {
        selectDish(c.wantedDish);
        scrollDishRibbonToDish(c.wantedDish);
      }
    }

    function scrollDishRibbonToDish(dishKey) {
      const grid = document.getElementById("sell-dish-grid");
      if (!grid || !dishKey) return;
      const btn = grid.querySelector(`[data-dish-id="${dishKey}"]`);
      if (btn && typeof btn.scrollIntoView === "function") {
        btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }

    // getUtAnhDelayMs được quản lý tại state-economy.js

    function applyUtAnhAutoSelectDishAndToppings(c, isMidWhim = false) {
      if (!c || !isStaffWorkingToday('utnhanh')) return;
      if (!bowl.step1Done && state.unlockedDishes.includes(c.wantedDish)) {
        bowl.selectedDish = c.wantedDish;
        scrollDishRibbonToDish(c.wantedDish);
      }
      bowl.rau = Boolean(c.wantedRau);
      bowl.hanh = Boolean(c.wantedHanh);
      bowl.spice = Number(c.wantedSpice || 0);
      bowl.tratac = Boolean(c.wantedTraTac && (state.stock.tratac || 0) >= 1);

      if (bowl.rau || bowl.hanh) {
        const herbs = document.getElementById("svg-layer-herbs");
        if (herbs && bowl.step1Done) herbs.classList.remove("hidden");
      }

      renderSellDishGrid();
      renderBottomIngredientTray();
      syncToppingButtonsUI();
      renderSelectedOrderBubble();
      updateVesselVisualByDish();
      updateStepButtonsHighlight();
      spawnFloatingFX(isMidWhim ? "⚡ Út Anh: Đã khớp ý khách!" : "⚡ Út Anh: Đã chọn Món & Topping!", "green");

      if (!bowl.step1Done) {
        if (!checkFullOrderIngredientsImmediate(c, bowl.selectedDish || c.wantedDish)) return;
        if (canAutoTriggerStep1() && isBowlReadyForStaffAuto(c)) {
          setTimeout(() => {
            if (!bowl.step1Done && getActiveCustomer() === c) doStep1Base(true);
          }, getBetiDelayMs());
        }
      }
    }

    function onCustomerSlotSelected() {
      const c = getActiveCustomer();
      renderCustomerSlotsRow();
      renderSelectedOrderBubble();
      renderSellDishGrid();
      syncToppingButtonsUI();
      updateStepButtonsHighlight();
      if (c && c.wantedDish) {
        setTimeout(() => scrollDishRibbonToDish(c.wantedDish), 40);
      }

      if (!c) return;
      if (!bowl.step1Done && !checkFullOrderIngredientsImmediate(c, c.wantedDish)) {
        return;
      }

      if (isStaffWorkingToday('utnhanh') && !bowl.step1Done && !isBowlReadyForStaffAuto(c)) {
        setTimeout(() => {
          if (state.isStreetSelling && !bowl.step1Done && getActiveCustomer() === c) {
            applyUtAnhAutoSelectDishAndToppings(c, false);
          }
        }, getUtAnhDelayMs());
        return;
      }

      if (canAutoTriggerStep1() && !bowl.step1Done && isBowlReadyForStaffAuto(c)) {
        setTimeout(() => { if (!bowl.step1Done && getActiveCustomer() === c) doStep1Base(true); }, getBetiDelayMs());
      }
    }

    function renderCustomerSlotsRow() {
      const row = document.getElementById("customer-slots-row");
      if (!row) return;
      const maxSlots = (activeCartBuff && ["tiktok_storm", "intl_bus_rush", "tv_report_rush", "spicy_king_rush"].includes(activeCartBuff.id)) ? 4 : getMaxActiveCustomerSlots();

      row.innerHTML = [0, 1, 2, 3].map(idx => {
        const c = customerSlots[idx];
        if (!c) {
          const isLockedSlot = idx >= maxSlots;
          return `
            <div onclick="selectCustomerSlot(${idx})" class="cursor-pointer flex flex-col items-center justify-center py-0.5 ${isLockedSlot ? 'opacity-60' : 'opacity-45'}">
              <div class="w-14 h-14 sm:w-14 sm:h-14 rounded-full border-2 border-dashed ${isLockedSlot ? 'border-amber-400/70 bg-slate-950/65' : 'border-slate-200 bg-slate-900/40'} flex flex-col items-center justify-center text-white text-[8px] font-black text-center px-1">
                ${isLockedSlot ? `<span>🔒</span><span>Bảng Hiệu</span>` : `<span>Trống</span>`}
              </div>
            </div>
          `;
        }

        const isSel = (idx === selectedSlotIndex);
        const pct = Math.max(0, Math.min(100, Math.round(c.patience)));
        const strokeColor = pct >= 60 ? "#22c55e" : pct >= 32 ? "#f59e0b" : "#ef4444";
        const r = 27;
        const circum = 2 * Math.PI * r;
        const offset = circum - (pct / 100) * circum;

        return `
          <div onclick="selectCustomerSlot(${idx})" class="cursor-pointer flex flex-col items-center relative ${c.justArrived ? 'slot-arrive' : ''} ${isSel ? 'scale-105' : 'opacity-90 hover:opacity-100'} transition-transform">
            <div class="relative w-14 h-14 flex items-center justify-center">
              <svg class="absolute inset-0 w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 62 62">
                <circle cx="31" cy="31" r="${r}" fill="#fffbeb" stroke="rgba(0,0,0,0.5)" stroke-width="5"/>
                <circle cx="31" cy="31" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="5"
                  stroke-dasharray="${circum.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" stroke-linecap="round"/>
              </svg>
              <div class="relative z-10 w-11 h-11 rounded-full overflow-hidden border border-amber-900/40 bg-amber-50 flex items-center justify-center">
                ${c.portrait
                  ? `<img src="${c.portrait}" alt="${escapeHtml(c.name)}" class="w-full h-full object-cover" />`
                  : `<span class="text-xl">${c.avatar}</span>`
                }
              </div>
              ${c.isShipper
                ? `<span class="absolute -top-1.5 px-1.5 py-0 leading-tight whitespace-nowrap rounded-full ${c.shipperColor} font-black text-[7px] shadow-sm z-20 border border-white">${c.shipperBadge}</span>`
                : c.vip
                  ? `<span class="absolute -top-1.5 px-1.5 py-0 leading-tight whitespace-nowrap rounded-full bg-red-600 text-white font-black text-[7px] shadow-sm z-20 border border-yellow-300">VIP</span>`
                  : c.picky
                    ? `<span class="absolute -top-1.5 px-1.5 py-0 leading-tight whitespace-nowrap rounded-full bg-purple-700 text-yellow-200 font-black text-[7px] shadow-sm z-20 border border-purple-300">Khó</span>`
                    : ''
              }
              ${(state.customerLoyaltyCounts?.[c.id] || 0) >= 3 ? `<span class="absolute -bottom-1 left-0 z-20 px-1 py-0.5 rounded-full bg-yellow-400 border border-amber-900 text-amber-950 font-black text-[7px] shadow">💛Ruột</span>` : ''}
              <span class="absolute -bottom-1 right-0 z-20 px-1 py-0.5 rounded-full bg-amber-950 border border-yellow-300 text-yellow-300 font-black text-[8px] shadow">x${c.bagQty}</span>
            </div>
            <span class="text-[9px] font-black ${isSel ? 'text-yellow-300 bg-black/75 px-1.5 rounded-full border border-yellow-400' : 'text-white drop-shadow'} mt-0.5 text-center leading-tight">${escapeHtml(c.name)}</span>
          </div>
        `;
      }).join("");
    }

    // Thẻ Order: Chưa bấm chọn thì màu trắng kem viền cam; Bấm đúng chuyển sang Xanh Lá (✓); Bấm nhầm/dư hiện Đỏ (❌)
    function renderOrderTag(text, stateMode = "pending") {
      if (stateMode === "match") {
        return `<span class="tag-pop inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-emerald-600 text-white border border-emerald-800 font-black text-[10px] shadow-sm">✓ ${text}</span>`;
      }
      if (stateMode === "wrong") {
        return `<span class="tag-pop inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-rose-600 text-white border border-rose-900 font-black text-[10px] animate-pulse">❌ ${text}</span>`;
      }
      return `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-950 border-2 border-amber-400 font-black text-[10px] shadow-sm">${text}</span>`;
    }

    function renderSelectedOrderBubble(customPraiseHtml = null) {
      const c = getActiveCustomer();
      const iconEl = document.getElementById("order-bubble-icon");
      const textEl = document.getElementById("order-bubble-text");
      const barEl = document.getElementById("order-bubble-patience-bar");
      if (!textEl || !iconEl || !barEl) return;

      if (customPraiseHtml) {
        textEl.innerHTML = customPraiseHtml;
        return;
      }

      if (!c) {
        iconEl.innerHTML = getDishSvgIcon("tron", "w-9 h-9");
        textEl.innerHTML = `<span class="text-amber-900 text-[11px]">Đang đợi khách ghé xe... (Nâng cấp <b>📣 Hút Khách</b> để quán đông hơn!)</span>`;
        barEl.style.width = "100%";
        return;
      }

      const dishObj = DISH_MENU[c.wantedDish] || DISH_MENU.tron;
      const tags = [];

      // 1. Thẻ Món Chính (Chỉ xanh khi người chơi đã bấm chọn đúng món trên băng chuyền)
      const dishState = !bowl.selectedDish
        ? "pending"
        : (bowl.selectedDish === c.wantedDish ? "match" : "wrong");
      const dishLabel = dishState === "wrong"
        ? `Nhầm món (Gọi ${c.bagQty}x ${dishObj.short})`
        : `${c.bagQty}x ${dishObj.short}`;
      tags.push(renderOrderTag(dishLabel, dishState));

      // 2. Các thẻ Topping: Khách CÓ gọi mới hiện trên Order để người chơi bấm vào; nếu khách không gọi mà bấm dư thì hiện cảnh báo đỏ!
      if (c.wantedRau) {
        tags.push(renderOrderTag("🌿 Rau", bowl.rau ? "match" : "pending"));
      } else if (bowl.rau) {
        tags.push(renderOrderTag("Dư Rau!", "wrong"));
      }

      if (c.wantedHanh) {
        tags.push(renderOrderTag("🧅 Hành", bowl.hanh ? "match" : "pending"));
      } else if (bowl.hanh) {
        tags.push(renderOrderTag("Dư Hành!", "wrong"));
      }

      if (c.wantedSpice > 0) {
        const spName = c.wantedSpice === 1 ? "🌶️ Cay vừa" : "🌶️🌶️ Siêu cay";
        const spState = bowl.spice === 0 ? "pending" : (bowl.spice === c.wantedSpice ? "match" : "wrong");
        tags.push(renderOrderTag(spName, spState));
      } else if (bowl.spice > 0) {
        tags.push(renderOrderTag("Không ăn cay!", "wrong"));
      }

      if (c.wantedTraTac) {
        tags.push(renderOrderTag("🧋 Trà tắc (+1 khách)", bowl.tratac ? "match" : "pending"));
      } else if (bowl.tratac) {
        tags.push(renderOrderTag("Dư Trà!", "wrong"));
      }

      if (c.picky) {
        tags.push(`<span class="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-400 font-black text-[9px]">🧐 Bỏ gia vị trước B3</span>`);
      }

      iconEl.innerHTML = getDishSvgIcon(c.wantedDish, "w-9 h-9");
      ensureV15State(state);
      const v = state.customVoucher;
      if ((state.level || 1) >= 12 && v && v.active && v.usedToday < v.quotaMax) {
        const badgeTxt = v.promoType === "free_tea" ? "🎟️ Mua 2+Trà" : `🎟️ Mã -${v.discountPct}%`;
        tags.push(`<span class="px-1.5 py-0.5 rounded-lg bg-orange-100 border border-orange-400 text-orange-900 font-black text-[9px]">${badgeTxt}</span>`);
      }
      textEl.innerHTML = tags.join(" ");

      barEl.style.width = `${Math.round(c.patience)}%`;
      barEl.className = `h-full transition-all duration-300 ${c.patience >= 60 ? 'bg-emerald-500' : c.patience >= 32 ? 'bg-amber-500' : 'bg-red-600'}`;
    }


    // ================= 15. BĂNG CHUYỀN 1 HÀNG MÓN ĂN & DẢI 9 ICON NGUYÊN LIỆU TRÒN DƯỚI ĐÁY =================
    function getMaxMakeablePortions(dishKey) {
      const recipe = DISH_MENU[dishKey]?.recipe || {};
      let minPortions = 999;
      for (const [ingId, req] of Object.entries(recipe)) {
        if (req > 0) {
          const avail = Math.floor((state.stock[ingId] || 0) / req);
          if (avail < minPortions) minPortions = avail;
        }
      }
      return minPortions === 999 ? 0 : minPortions;
    }

    function renderSellDishGrid() {
      const grid = document.getElementById("sell-dish-grid");
      if (!grid) return;

      const c = getActiveCustomer();
      const allDishes = Object.values(DISH_MENU);
      const unlockedList = allDishes.filter(d => state.unlockedDishes.includes(d.id));
      const lockedList = allDishes.filter(d => !state.unlockedDishes.includes(d.id)).slice(0, 3);
      const displayList = [...unlockedList, ...lockedList];

      grid.innerHTML = displayList.map(d => {
        const isUnlocked = state.unlockedDishes.includes(d.id);
        const isSelected = bowl.selectedDish === d.id;
        const isCorrectMatch = isSelected && c && c.wantedDish === d.id;
        const isWrongMatch = isSelected && c && c.wantedDish !== d.id;
        const maxMake = isUnlocked ? getMaxMakeablePortions(d.id) : 0;
        const isFeatured = (d.id === state.featuredDishKey);
        const isDemandedNow = !isUnlocked && d.reqLevel <= (state.levelAtStartOfDay || state.level);

        if (!isUnlocked) {
          return `
            <button onclick="showToast('🔒 Mở món ' + '${d.name}' + ' ở mục Thực Đơn - Cấp ' + '${d.reqLevel}' + '!')" class="soft-btn shrink-0 min-w-[74px] py-1 px-1.5 rounded-xl ${isDemandedNow ? 'bg-red-100 border-2 border-red-500 animate-pulse' : 'bg-slate-700/70 border border-slate-500 opacity-60'} flex flex-col items-center justify-center relative">
              ${isDemandedNow ? `<span class="absolute -top-1 right-0 px-1 rounded bg-red-600 text-white font-black text-[7px]">Mới!</span>` : `<span class="absolute top-0.5 right-0.5 text-[8px]">🔒${d.reqLevel}</span>`}
              <div class="grayscale">${getDishSvgIcon(d.id, "w-9 h-9")}</div>
              <span class="font-bold text-[9px] text-white whitespace-nowrap mt-0.5">${d.short}</span>
            </button>
          `;
        }

        const badgeClass = maxMake > 0 ? "bg-amber-300 text-amber-950 border border-amber-700" : "bg-red-600 text-white";
        const cardStyle = isCorrectMatch
          ? "bg-emerald-600 border-2 border-yellow-300 shadow-lg scale-105"
          : isWrongMatch
            ? "bg-rose-600 border-2 border-yellow-300 shadow-lg scale-105"
            : isSelected
              ? "bg-amber-100 border-2 border-yellow-400 shadow-md scale-105"
              : "bg-slate-700/90 border border-slate-500";
        const textStyle = (isCorrectMatch || isWrongMatch) ? "text-white" : isSelected ? "text-amber-950" : "text-amber-100";

        return `
          <button data-dish-id="${d.id}" onclick="selectDish('${d.id}')" class="soft-btn shrink-0 min-w-[74px] py-1 px-1.5 rounded-xl ${cardStyle} flex flex-col items-center justify-center relative">
            <span class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full ${badgeClass} font-black text-[8px] flex items-center justify-center z-10 shadow">${maxMake}</span>
            ${isCorrectMatch ? `<span class="absolute -top-1 -left-1 px-1 rounded-full bg-white text-emerald-700 font-black text-[8px] z-10 shadow">✓</span>` : isFeatured ? `<span class="absolute -top-1 -left-1 text-[9px] z-10">🔥</span>` : ''}
            <div>${getDishSvgIcon(d.id, "w-9 h-9")}</div>
            <span class="font-black text-[9px] ${textStyle} whitespace-nowrap mt-0.5">${d.short}</span>
          </button>
        `;
      }).join("");
    }

    function renderBottomIngredientTray() {
      const tray = document.getElementById("bottom-ingredient-tray");
      if (!tray) return;
      const activeDishKey = bowl.selectedDish || (getActiveCustomer()?.wantedDish) || "tron";
      const currentRecipe = DISH_MENU[activeDishKey]?.recipe || {};

      tray.innerHTML = INGREDIENTS.map(ing => {
        const count = state.stock[ing.id] || 0;
        const needed = (currentRecipe[ing.id] || 0) > 0 || (ing.id === "tratac" && bowl.tratac);
        const isLow = count <= 2 && needed;

        return `
          <button onclick="promptQuickRestockSingle('${ing.id}')" title="${escapeHtml(ing.name)}" class="soft-btn flex flex-col items-center justify-center relative py-0.5">
            <div class="w-9 h-9 rounded-full overflow-hidden border-2 ${count <= 0 && needed ? 'border-red-500 animate-pulse' : needed ? 'border-yellow-300 shadow-md' : 'border-amber-800 opacity-75'} bg-amber-50">
              <img src="${getIngredientImgSrc(ing.id)}" alt="${escapeHtml(ing.short)}" class="w-full h-full object-cover" />
            </div>
            <span class="font-black text-[9px] px-1 rounded-full -mt-1.5 z-10 ${isLow ? 'bg-red-600 text-white' : 'bg-amber-950 text-yellow-200 border border-amber-600'}">x${count}</span>
          </button>
        `;
      }).join("");
    }

    function promptQuickRestockSingle(ingId) {
      const ing = INGREDIENTS.find(x => x.id === ingId);
      if (!ing) return;
      if ((state.stock[ingId] || 0) > 3) {
        const { minDays } = getExpiringTodayInfo(ingId);
        showToast(`🧺 ${ing.name}: Còn ${state.stock[ingId]} phần (HSD: ${minDays || getEffectiveShelfLife(ing)} ngày).`);
        return;
      }
      openOutOfStockModal([ing]);
    }

    function renderStaffActiveStrip() {
      if (typeof renderCompactStreetControlStrip === 'function') renderCompactStreetControlStrip();
    }

    function updateVesselVisualByDish() {
      const dish = DISH_MENU[bowl.selectedDish || "tron"] || DISH_MENU.tron;
      const label = document.getElementById("vessel-mode-label"), inner = document.getElementById("svg-vessel-inner"), grillLines = document.getElementById("svg-grill-lines");
      if (!inner || !label || !grillLines) return;
      const qtyTag = bowl.lockedBagQty ? ` (x${bowl.lockedBagQty})` : "";
      if (!bowl.selectedDish) {
        label.textContent = `Chọn Món Bánh`;
        inner.setAttribute("fill", "url(#inoxGrad)"); grillLines.classList.add("hidden");
        return;
      }
      if (dish.vessel === "grill") {
        label.textContent = `🔥 Vỉ Nướng${qtyTag}`;
        inner.setAttribute("fill", "url(#grillGrad)"); grillLines.classList.remove("hidden");
      } else if (dish.vessel === "bamboo") {
        label.textContent = `🌿 Mẹt Tre${qtyTag}`;
        inner.setAttribute("fill", "url(#bambooGrad)"); grillLines.classList.add("hidden");
      } else {
        label.textContent = `🥣 Thau Inox${qtyTag}`;
        inner.setAttribute("fill", "url(#inoxGrad)"); grillLines.classList.add("hidden");
      }
    }

    // Đồng bộ màu sắc 4 nút Topping bên phải: Chưa chọn = Xám; Chọn đúng yêu cầu khách = Xanh Lá (✓); Chọn dư = Đỏ (❌)
    function syncToppingButtonsUI() {
      const c = getActiveCustomer();

      // 1. Nút Rau
      const rauBtn = document.getElementById("opt-rau-toggle");
      if (rauBtn) {
        if (!bowl.rau) {
          rauBtn.innerHTML = `<span>🌿 Rau</span><span class="text-[9px] font-black">+</span>`;
          rauBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-slate-200 text-amber-950 border-2 border-slate-400 shadow flex items-center justify-between";
        } else if (!c || c.wantedRau) {
          rauBtn.innerHTML = `<span>🌿 Rau</span><span class="text-[10px] font-black">✓</span>`;
          rauBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-emerald-600 text-white border-2 border-emerald-900 shadow flex items-center justify-between";
        } else {
          rauBtn.innerHTML = `<span>❌ Dư Rau</span><span class="text-[10px] font-black">✕</span>`;
          rauBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-rose-600 text-white border-2 border-rose-900 shadow flex items-center justify-between animate-pulse";
        }
      }

      // 2. Nút Hành
      const hanhBtn = document.getElementById("opt-hanh-toggle");
      if (hanhBtn) {
        if (!bowl.hanh) {
          hanhBtn.innerHTML = `<span>🧅 Hành</span><span class="text-[9px] font-black">+</span>`;
          hanhBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-slate-200 text-amber-950 border-2 border-slate-400 shadow flex items-center justify-between";
        } else if (!c || c.wantedHanh) {
          hanhBtn.innerHTML = `<span>🧅 Hành</span><span class="text-[10px] font-black">✓</span>`;
          hanhBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-emerald-600 text-white border-2 border-emerald-900 shadow flex items-center justify-between";
        } else {
          hanhBtn.innerHTML = `<span>❌ Dư Hành</span><span class="text-[10px] font-black">✕</span>`;
          hanhBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-rose-600 text-white border-2 border-rose-900 shadow flex items-center justify-between animate-pulse";
        }
      }

      // 3. Nút Ớt (0 = Không cay (0/2), 1 = Cay vừa (1/2), 2 = Siêu cay (2/2))
      const spiceBtn = document.getElementById("spice-bottle-btn");
      if (spiceBtn) {
        if (bowl.spice === 0) {
          spiceBtn.innerHTML = `<span id="spice-bottle-label" class="font-black text-[10px]">🌶️ Ớt (0/2)</span><span id="spice-bottle-icons" class="text-[9px] font-black">+</span>`;
          spiceBtn.className = "soft-btn v18-topping-btn py-1 px-1.5 font-black text-[10px] bg-slate-200 text-amber-950 border-2 border-slate-400 shadow flex items-center justify-between";
        } else {
          const spLabel = bowl.spice === 1 ? "🌶️ Cay vừa (1/2)" : "🌶️🌶️ Siêu cay (2/2)";
          if (!c || bowl.spice === c.wantedSpice) {
            spiceBtn.innerHTML = `<span id="spice-bottle-label" class="font-black text-[10px]">${spLabel}</span><span id="spice-bottle-icons" class="text-[10px] font-black">✓</span>`;
            spiceBtn.className = "soft-btn v18-topping-btn py-1 px-1.5 font-black text-[10px] bg-emerald-600 text-white border-2 border-emerald-900 shadow flex items-center justify-between";
          } else if (c.wantedSpice === 2 && bowl.spice === 1) {
            spiceBtn.innerHTML = `<span id="spice-bottle-label" class="font-black text-[10px]">🌶️ Cay vừa (1/2)</span><span id="spice-bottle-icons" class="text-[10px] font-black">+1</span>`;
            spiceBtn.className = "soft-btn v18-topping-btn py-1 px-1.5 font-black text-[10px] bg-amber-500 text-white border-2 border-amber-800 shadow flex items-center justify-between";
          } else {
            spiceBtn.innerHTML = `<span id="spice-bottle-label" class="font-black text-[10px]">❌ Sai Ớt (${bowl.spice}/2)</span><span id="spice-bottle-icons" class="text-[10px] font-black">✕</span>`;
            spiceBtn.className = "soft-btn v18-topping-btn py-1 px-1.5 font-black text-[10px] bg-rose-600 text-white border-2 border-rose-900 shadow flex items-center justify-between animate-pulse";
          }
        }
      }

      // 4. Nút Trà Tắc
      const traBtn = document.getElementById("opt-tratac-btn");
      if (traBtn) {
        if (!bowl.tratac) {
          traBtn.innerHTML = `<span>🧋 Trà</span><span class="text-[9px] font-black">+</span>`;
          traBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-slate-200 text-amber-950 border-2 border-slate-400 shadow flex items-center justify-between";
        } else if (!c || c.wantedTraTac) {
          traBtn.innerHTML = `<span>🧋 Trà</span><span class="text-[10px] font-black">✓</span>`;
          traBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-emerald-600 text-white border-2 border-emerald-900 shadow flex items-center justify-between";
        } else {
          traBtn.innerHTML = `<span>❌ Dư Trà</span><span class="text-[10px] font-black">✕</span>`;
          traBtn.className = "soft-btn py-1 px-1.5 rounded-full font-black text-[10px] bg-rose-600 text-white border-2 border-rose-900 shadow flex items-center justify-between animate-pulse";
        }
      }
      if (typeof syncV18StreetLabels === "function") syncV18StreetLabels();
    }

    function selectDish(dishKey) {
      if (!state.unlockedDishes.includes(dishKey)) return;
      if (bowl.step1Done && bowl.selectedDish !== dishKey) {
        showToast("⚠️ Thau đang làm dở! Bấm '🗑️ Đổ rác' nếu muốn đổi sang món khác!");
        return;
      }
      bowl.selectedDish = dishKey;
      playSFX("snip");
      renderSellDishGrid();
      renderBottomIngredientTray();
      renderSelectedOrderBubble();
      updateVesselVisualByDish();
      updateStepButtonsHighlight();

      const c = getActiveCustomer();
      if (c && dishKey === c.wantedDish) {
        spawnFloatingFX(`✓ Đúng món ${DISH_MENU[dishKey].short}!`, "green");
      } else {
        spawnFloatingFX(`🥙 ${DISH_MENU[dishKey].short}`, "gold");
      }

      if (c && !bowl.step1Done) {
        if (!checkFullOrderIngredientsImmediate(c, dishKey)) return;
      }
      if (canAutoTriggerStep1() && !bowl.step1Done && isBowlReadyForStaffAuto(c)) {
        setTimeout(() => { if (!bowl.step1Done && getActiveCustomer() === c) doStep1Base(true); }, getBetiDelayMs());
      }
    }

    function cycleSpiceLevel() {
      bowl.spice = (bowl.spice + 1) % 3;
      if (bowl.step3Done && bowl.spice > 0) {
        bowl.lateToppingsAdded = true;
      }
      const labels = ["Không ớt", "🌶️ Cay vừa", "🌶️🌶️ Siêu cay"];
      syncToppingButtonsUI();
      renderSelectedOrderBubble();
      updateStepButtonsHighlight();
      spawnFloatingFX(labels[bowl.spice], bowl.spice > 0 ? "green" : "orange");
      playSFX("snip");

      const c = getActiveCustomer();
      if (canAutoTriggerStep1() && !bowl.step1Done && isBowlReadyForStaffAuto(c)) {
        setTimeout(() => { if (!bowl.step1Done && getActiveCustomer() === c) doStep1Base(true); }, getBetiDelayMs());
      }
    }

    function setOption(type, val) {
      if (type === "rau") {
        bowl.rau = val;
        if (bowl.step3Done && val) bowl.lateToppingsAdded = true;
        spawnFloatingFX(val ? "✓ Thêm Rau răm!" : "Bỏ Rau răm", val ? "green" : "orange");
      } else if (type === "hanh") {
        bowl.hanh = val;
        if (bowl.step3Done && val) bowl.lateToppingsAdded = true;
        spawnFloatingFX(val ? "✓ Thêm Hành phi!" : "Bỏ Hành phi", val ? "green" : "orange");
      }
      if (bowl.rau || bowl.hanh) {
        const herbs = document.getElementById("svg-layer-herbs");
        if (herbs && bowl.step1Done) herbs.classList.remove("hidden");
      }
      syncToppingButtonsUI();
      renderSelectedOrderBubble();
      updateStepButtonsHighlight();
      playSFX("snip");

      const c = getActiveCustomer();
      if (canAutoTriggerStep1() && !bowl.step1Done && isBowlReadyForStaffAuto(c)) {
        setTimeout(() => { if (!bowl.step1Done && getActiveCustomer() === c) doStep1Base(true); }, getBetiDelayMs());
      }
    }

    function toggleTraTacOption() {
      bowl.tratac = !bowl.tratac;
      if (bowl.tratac) {
        spawnFloatingFX("✓ +1 Trà Tắc!", "green");
        if ((state.stock.tratac || 0) < 1) {
          openOutOfStockModal([INGREDIENTS.find(x => x.id === "tratac")]);
        }
      } else {
        spawnFloatingFX("Bỏ Trà Tắc", "orange");
      }
      syncToppingButtonsUI();
      renderBottomIngredientTray();
      renderSelectedOrderBubble();
      updateStepButtonsHighlight();
      playSFX("snip");
    }

    function getSweetSpotBounds() {
      const coolerLvl = state.equipLevels?.upg_cooler || 0;
      const min = Math.max(60, 68 - coolerLvl);
      let baseW = 19;
      if (state.level >= 41) baseW = 13; else if (state.level >= 31) baseW = 15; else if (state.level >= 21) baseW = 16; else if (state.level >= 11) baseW = 18;
      const durabilityPenalty = (state.cartDurability || 100) < 55 ? -4 : 0;
      const rainPenalty = (activeCartBuff && activeCartBuff.id === "rain_flood" && !rainTarpCovered && (state.equipLevels?.upg_awning || 0) < 3) ? -6 : 0;
      const priceBonus = getPricingCustomerImpact().sweetSpotBonus || 0;
      const feverBonus = (activeCartBuff && activeCartBuff.id === "fever_rush") ? 6 : 0;
      const width = Math.max(10, Math.min(36, baseW + (coolerLvl * 2.5) + durabilityPenalty + rainPenalty + priceBonus + feverBonus));
      return { min, max: Math.min(97, Math.round(min + width)) };
    }
    function updateSweetSpotUI() {
      const { min, max } = getSweetSpotBounds();
      const zone = document.getElementById("sweet-spot-zone");
      if (zone) { zone.style.left = `${min}%`; zone.style.width = `${max - min}%`; }
      const lbl = document.getElementById("sweet-spot-range-label");
      if (lbl) {
        const nextText = `🎯 Chuẩn: ${min}–${max}% (+22%/lần)`;
        if (lbl.firstChild && lbl.firstChild.nodeType === 3) {
          lbl.firstChild.nodeValue = nextText;
        } else {
          lbl.textContent = nextText;
        }
      }
    }

    // Đặt lại thau hoàn toàn trống cho mẻ bánh tiếp theo (selectedDish = null, 4 nút Topping đều tắt màu xám)
    function resetBowl(manual = false) {
      if (manual && (bowl.step1Done || bowl.step2Done || bowl.selectedDish)) showToast("🗑️ Đã dọn sạch thau để làm mẻ mới!");
      bowl.selectedDish = null;
      bowl.rau = false;
      bowl.hanh = false;
      bowl.spice = 0;
      bowl.tratac = false;
      bowl.step1Done = false;
      bowl.step2Done = false;
      bowl.mixProgress = 0;
      bowl.step3Done = false;
      bowl.sweetSpotLockedPass = false;
      bowl.lockedBagQty = null;
      bowl.lateToppingsAdded = false;

      ["svg-layer-base", "svg-layer-sauce", "svg-layer-herbs", "svg-layer-topping", "svg-anim-scissors", "svg-anim-glove"].forEach(id => {
        const el = document.getElementById(id); if (el) el.classList.add("hidden");
      });
      const rpBody = document.getElementById("svg-ricepaper-body");
      if (rpBody) rpBody.setAttribute("fill", "#fef9c3");
      const track = document.getElementById("mix-bar-track");
      if (track) track.classList.remove("sweet-spot-active");
      document.getElementById("mix-bar-fill").style.width = "0%";
      document.getElementById("bowl-instruction").textContent = "Chọn Món & Topping";
      syncToppingButtonsUI();
      updateVesselVisualByDish();
      updateStepButtonsHighlight();
      renderSellDishGrid();
      renderBottomIngredientTray();
      renderSelectedOrderBubble();
    }

    function updateStepButtonsHighlight() {
      const b1 = document.getElementById("step-btn-1"), b2 = document.getElementById("step-btn-2"), b3 = document.getElementById("step-btn-3"), b4 = document.getElementById("step-btn-4");
      [b1, b2, b3].forEach(b => { if (b) b.classList.remove("active-red-ring"); });
      const { min, max } = getSweetSpotBounds();

      document.getElementById("step-check-1").textContent = bowl.step1Done ? "✓" : "B1";
      document.getElementById("step-check-2").textContent = bowl.step2Done ? "✓" : "B2";

      if (!bowl.step1Done) {
        if (bowl.selectedDish && b1) b1.classList.add("active-red-ring");
        document.getElementById("step-check-3").textContent = "0%";
      } else if (!bowl.step2Done) {
        if (b2) b2.classList.add("active-red-ring");
        document.getElementById("step-check-3").textContent = `${bowl.mixProgress}%`;
      } else if (bowl.mixProgress < min) {
        if (b3) b3.classList.add("active-red-ring");
        document.getElementById("step-check-3").textContent = `${bowl.mixProgress}%`;
      } else {
        document.getElementById("step-check-3").textContent = bowl.mixProgress <= max ? "✅ Vừa thấm" : "⚠️ Quá tay";
      }

      if (b4) {
        const c = getActiveCustomer();
        const isSweetOk = Boolean(bowl.sweetSpotLockedPass) || (bowl.mixProgress >= min && bowl.mixProgress <= max);
        if (c && bowl.step3Done && isSweetOk) {
          let mismatch = null;
          if (bowl.selectedDish !== c.wantedDish) mismatch = "⚠️ Sai Món!";
          else if (bowl.rau !== Boolean(c.wantedRau)) mismatch = c.wantedRau ? "⚠️ Bấm Rau!" : "⚠️ Bỏ Rau!";
          else if (bowl.hanh !== Boolean(c.wantedHanh)) mismatch = c.wantedHanh ? "⚠️ Bấm Hành!" : "⚠️ Bỏ Hành!";
          else if (bowl.spice !== c.wantedSpice) mismatch = "⚠️ Bấm Ớt!";
          else if (Boolean(bowl.tratac) !== Boolean(c.wantedTraTac)) mismatch = c.wantedTraTac ? "⚠️ Bấm Trà!" : "⚠️ Bỏ Trà!";

          if (mismatch) {
            b4.disabled = true;
            b4.textContent = mismatch;
            b4.className = "soft-btn btn-game-orange w-full py-2 rounded-2xl font-black text-[10px] tracking-wide uppercase shadow-lg mt-0.5 opacity-60 cursor-not-allowed";
          } else {
            b4.disabled = false;
            b4.textContent = "✅ TRAO NGAY!";
            b4.className = "soft-btn btn-game-green active-red-ring w-full py-2 rounded-2xl font-black text-[11px] tracking-wide uppercase shadow-lg mt-0.5";
          }
        } else {
          b4.disabled = true;
          b4.textContent = "TRAO KHÁCH";
          b4.className = "soft-btn btn-game-green w-full py-2 rounded-2xl font-black text-[11px] tracking-wide uppercase shadow-lg mt-0.5 opacity-50 cursor-not-allowed";
        }
      }
    }

    // Khách Khó Tính có xác suất đổi ý / dặn thêm Topping giữa chừng khi đang làm bánh!
    function maybeTriggerCustomerMidOrderWhim(c) {
      if (!c || c.midOrderWhimDone || !c.picky) return;
      if (Math.random() > 0.35) return;
      c.midOrderWhimDone = true;

      if (!c.wantedTraTac && (state.stock.tratac || 0) >= 1) {
        c.wantedTraTac = true;
        playSFX("whistle");
        spawnFloatingFX("🗣️ Khách gọi thêm Trà Tắc!", "orange");
        showToast(`🗣️ ${c.name}: "À quên, lấy thêm cho 1 ly Trà Tắc nữa nha!"`);
        if (typeof showMidOrderAddonCardV18 === "function") showMidOrderAddonCardV18("1 ly Trà Tắc (+1 khách)");
      } else if (c.wantedSpice < 2) {
        c.wantedSpice += 1;
        playSFX("whistle");
        const spTxt = c.wantedSpice === 1 ? "Cay vừa" : "Siêu cay";
        spawnFloatingFX(`🗣️ Đổi sang ${spTxt}!`, "orange");
        showToast(`🗣️ ${c.name}: "Cho thêm miếng ớt (${spTxt}) mới đã miệng nha!"`);
        if (typeof showMidOrderAddonCardV18 === "function") showMidOrderAddonCardV18(`Thêm ớt (${spTxt})`);
      } else if (!c.wantedHanh) {
        c.wantedHanh = true;
        playSFX("whistle");
        spawnFloatingFX("🗣️ Khách dặn thêm Hành phi!", "orange");
        showToast(`🗣️ ${c.name}: "Bỏ thêm hành phi giòn rụm vô giùm nha!"`);
        if (typeof showMidOrderAddonCardV18 === "function") showMidOrderAddonCardV18("Thêm Hành phi giòn rụm");
      }
      syncToppingButtonsUI();
      renderSelectedOrderBubble();
      updateStepButtonsHighlight();
      if (isStaffWorkingToday('utnhanh')) {
        setTimeout(() => {
          if (state.isStreetSelling && getActiveCustomer() === c) {
            applyUtAnhAutoSelectDishAndToppings(c, true);
          }
        }, 180);
      }
    }

    // ================= 16. XỬ LÝ ĐỨT HÀNG & THAO TÁC LÀM BÁNH (BẮT BUỘC CHỌN MÓN TRƯỚC B1) =================
    function closeOutOfStockModal() {
      document.getElementById("modal-out-of-stock").classList.add("hidden");
    }

    function getStaffOosMultiplier() {
      const star = state.staffStars?.beti || 1;
      return Math.max(0.82, 1.30 - star * 0.09);
    }

    function openOutOfStockModal(missingList) {
      if (!missingList || missingList.length === 0) return;
      const modalEl = document.getElementById("modal-out-of-stock");
      if (modalEl && !modalEl.classList.contains("hidden")) return;

      pendingOosMissingList = missingList;
      oosMinigameProgress = 0;
      playSFX("whistle");
      document.getElementById("oos-desc").innerHTML = `Thiếu: <b>${missingList.map(m => m.name).join(", ")}</b>. Chọn cách xử lý:`;
      const baseSum = missingList.reduce((acc, m) => acc + getIngredientCost(m), 0);
      document.getElementById("oos-cost-self-5").textContent = `-${formatVND(Math.round(baseSum * 6 * 1.5 / 500) * 500)}`;

      const hasHelper = isStaffWorkingToday('beti') || isStaffWorkingToday('mylan');
      const staffBtn = document.getElementById("oos-btn-staff");
      if (hasHelper) {
        staffBtn.disabled = false;
        const mult = getStaffOosMultiplier();
        const star = state.staffStars?.beti || 1;
        document.getElementById("oos-staff-label").textContent = `${state.staff.beti ? '👦 Bé Tí (' + star + '⭐)' : '👧 Chị Lan'} chạy mua 10 phần`;
        document.getElementById("oos-cost-staff").textContent = `-${formatVND(Math.round(baseSum * 10 * mult / 500) * 500)}`;
      } else {
        staffBtn.disabled = true;
        document.getElementById("oos-staff-label").textContent = `🔒 Sai Phụ Bếp (Chưa thuê)`;
        document.getElementById("oos-cost-staff").textContent = `--`;
      }
      document.getElementById("oos-minigame-box").classList.add("hidden");
      document.getElementById("oos-choices-box").classList.remove("hidden");
      modalEl.classList.remove("hidden");
    }

    function handleOosOption1SelfBuy(qty) {
      const baseSum = pendingOosMissingList.reduce((acc, m) => acc + getIngredientCost(m), 0);
      const cost = Math.round((baseSum * qty * 1.5) / 500) * 500;
      if (state.money < cost) {
        document.getElementById("modal-out-of-stock").classList.add("hidden");
        checkBankruptcyOrRescueLoan();
        return;
      }
      state.money -= cost; state.todayCogsSpent += cost;
      state.cumulativeCosts.cogs = (state.cumulativeCosts.cogs || 0) + cost;
      const perItemCost1 = Math.round(cost / Math.max(1, pendingOosMissingList.length));
      pendingOosMissingList.forEach(m => recordMarketPurchaseDetail(m.id, qty, perItemCost1, "oos"));
      pendingOosBoughtQty = qty;
      oosMinigameProgress = 0;
      document.getElementById("oos-minigame-bar").style.width = "0%";
      document.getElementById("oos-choices-box").classList.add("hidden");
      document.getElementById("oos-minigame-box").classList.remove("hidden");
    }

    function tapOosMinigame() {
      playSFX("snip");
      oosMinigameProgress = Math.min(100, oosMinigameProgress + 34);
      document.getElementById("oos-minigame-bar").style.width = `${oosMinigameProgress}%`;
      if (oosMinigameProgress >= 100) {
        pendingOosMissingList.forEach(m => addStockBatch(m.id, pendingOosBoughtQty));
        document.getElementById("modal-out-of-stock").classList.add("hidden");
        updateAllUI();
        showToast("✅ Đã bổ sung nguyên liệu vào khay!");
      }
    }

    function handleOosOption2StaffBuy() {
      const baseSum = pendingOosMissingList.reduce((acc, m) => acc + getIngredientCost(m), 0);
      const mult = getStaffOosMultiplier();
      const cost = Math.round((baseSum * 10 * mult) / 500) * 500;
      if (state.money < cost) { showToast("❌ Không đủ tiền mặt đưa phụ bếp!"); return; }
      state.money -= cost; state.todayCogsSpent += cost;
      state.cumulativeCosts.cogs = (state.cumulativeCosts.cogs || 0) + cost;
      const perItemCost2 = Math.round(cost / Math.max(1, pendingOosMissingList.length));
      pendingOosMissingList.forEach(m => {
        recordMarketPurchaseDetail(m.id, 10, perItemCost2, "oos");
        addStockBatch(m.id, 10);
      });
      document.getElementById("modal-out-of-stock").classList.add("hidden");
      playSFX("cash");
      updateAllUI();
      showToast("🛵 Phụ bếp đã mua 10 phần về kịp thời!");
    }

    function handleOosOption3Apologize() {
      document.getElementById("modal-out-of-stock").classList.add("hidden");
      adjustRating(-0.12);
      customerSlots[selectedSlotIndex] = null;
      resetBowl(false);
      autoSelectFirstAvailableSlot();
      updateAllUI();
      showToast("🙇 Đã xin lỗi khách vì hết hàng (-0.12⭐)!");
    }

    function handleOosOption4CloseEarly() {
      document.getElementById("modal-out-of-stock").classList.add("hidden");
      customerSlots = [null, null, null, null];
      if (state.todaySold >= 6) {
        adjustViral(5);
        showToast("🪧 Quán bán hết hàng sớm! +5% Độ Nổi Tiếng!");
      } else {
        showToast("🪧 Đã dọn xe nghỉ sớm!");
      }
      endDaySummary();
    }

    function doStep1Base(byStaff = false) {
      const c = getActiveCustomer();
      if (!c) { showToast("🍃 Đang đợi khách ghé xe..."); return; }
      if (!bowl.selectedDish) {
        playSFX("whistle");
        showToast("Hãy bấm chọn Món Bánh khách gọi trên băng chuyền trước khi Cắt Bánh!");
        return;
      }
      if (bowl.step1Done) return;

      if (!checkFullOrderIngredientsImmediate(c, bowl.selectedDish)) return;

      bowl.lockedBagQty = c.bagQty || 1;
      const recipe = DISH_MENU[bowl.selectedDish]?.recipe || {};
      const step1Ings = [];
      INGREDIENTS.forEach(ing => {
        if (ing.stepGroup === 1) {
          const req = (recipe[ing.id] || 0) * bowl.lockedBagQty;
          if (req > 0) {
            consumeStockFIFO(ing.id, req);
            step1Ings.push(ing.id);
          }
        }
      });

      playSFX("snip");
      bowl.step1Done = true;
      document.getElementById("svg-layer-base").classList.remove("hidden");

      const sc = document.getElementById("svg-anim-scissors");
      if (sc) {
        sc.classList.remove("hidden", "anim-snip");
        void sc.offsetWidth;
        sc.classList.add("anim-snip");
        setTimeout(() => sc.classList.add("hidden"), 550);
      }

      spawnFlyingIngredientSprites(step1Ings.length ? step1Ings : ["banhtrang", "xoai"]);
      spawnParticleBurst(["✂️", "🥭", "✨"]);
      document.getElementById("bowl-instruction").textContent = "🥣 Bấm B2: Rưới Sốt";
      spawnFloatingFX(byStaff ? "👦 Bé Tí: Cắt bánh!" : "✂️ Cắt Bánh & Xoài!", "blue");
      updateVesselVisualByDish();
      renderSellDishGrid();
      renderBottomIngredientTray();
      updateStepButtonsHighlight();

      if (canAutoTriggerStep2() && !bowl.step2Done) {
        setTimeout(() => { if (bowl.step1Done && !bowl.step2Done && getActiveCustomer() === c) doStep2Sauce(true); }, getMylanDelayMs());
      }
    }

    function doStep2Sauce(byStaff = false) {
      if (!bowl.step1Done) { showToast("⚠️ Hãy chọn Món và bấm Bước 1 (Cắt bánh) trước!"); return; }
      if (bowl.step2Done) return;
      playSFX("sauce");
      bowl.step2Done = true;

      const recipe = DISH_MENU[bowl.selectedDish]?.recipe || {};
      const qtyMult = bowl.lockedBagQty || 1;
      const step2Ings = [];
      INGREDIENTS.forEach(ing => {
        if (ing.stepGroup === 2) {
          const req = (recipe[ing.id] || 0) * qtyMult;
          if (req > 0) {
            consumeStockFIFO(ing.id, req);
            step2Ings.push(ing.id);
          }
        }
      });

      const sauceLayer = document.getElementById("svg-layer-sauce");
      sauceLayer.classList.remove("hidden");
      const zz = document.getElementById("svg-anim-zigzag");
      if (zz) { zz.classList.remove("anim-zigzag"); void zz.offsetWidth; zz.classList.add("anim-zigzag"); }

      if (bowl.rau || bowl.hanh) document.getElementById("svg-layer-herbs").classList.remove("hidden");
      spawnFlyingIngredientSprites(step2Ings.length ? step2Ings : ["muoitom", "sotbo", "dauphong"]);
      spawnParticleBurst(["🍋", "🌶️", "🧅", "🥜"]);
      document.getElementById("bowl-instruction").textContent = "🧤 Bấm B3: Trộn Đều!";
      spawnFloatingFX(byStaff ? "👧 Mỹ Lan: Rưới sốt!" : "🍋 Rưới Sốt & Muối!", "orange");
      renderSellDishGrid();
      renderBottomIngredientTray();
      updateStepButtonsHighlight();

      const c = getActiveCustomer();
      maybeTriggerCustomerMidOrderWhim(c);

      if (isStaffWorkingToday('anhba') && !bowl.step3Done) {
        const star = state.staffStars?.anhba || 1;
        const delayMs = Math.max(110, 340 - star * 45);
        setTimeout(() => {
          if (bowl.step2Done && !bowl.step3Done && getActiveCustomer() === c) doStep3Mix(true);
        }, delayMs);
      }
    }

    function _baseDoStep3Mix(byStaff = false) {
      if (!bowl.step2Done) { showToast("⚠️ Làm Bước 1 & 2 trước!"); return; }
      playSFX("mix");
      const { min, max } = getSweetSpotBounds(), targetCenter = Math.round((min + max) / 2);

      if (byStaff) {
        bowl.mixProgress = targetCenter;
      } else {
        let gain = bowl.mixProgress < 42 ? 24 + Math.floor(Math.random() * 5) : 13 + Math.floor(Math.random() * 5);
        if (activeCartBuff && activeCartBuff.id === "fever_rush") {
          gain = Math.round(gain * 1.35);
          if (bowl.mixProgress < targetCenter && bowl.mixProgress + gain > max) gain = targetCenter - bowl.mixProgress;
        }
        bowl.mixProgress = Math.min(100, bowl.mixProgress + gain);
      }
      bowl.step3Done = true;
      document.getElementById("mix-bar-fill").style.width = `${bowl.mixProgress}%`;

      const glove = document.getElementById("svg-anim-glove");
      if (glove) {
        glove.classList.remove("hidden", "anim-glove");
        void glove.offsetWidth;
        glove.classList.add("anim-glove");
      }
      const rpBody = document.getElementById("svg-ricepaper-body");
      if (rpBody) {
        if (bowl.mixProgress < 50) rpBody.setAttribute("fill", "#fde047");
        else if (bowl.mixProgress <= max) rpBody.setAttribute("fill", "#fb923c");
        else rpBody.setAttribute("fill", "#c2410c");
      }

      spawnFlyingIngredientSprites(["khobo", "trungcut", "tepmo"]);
      spawnParticleBurst(["🧤", "✨", "🥚", "🥩"]);
      const svg = document.getElementById("bowl-svg"); svg.style.transform = `rotate(${bowl.mixProgress * 2}deg)`;
      const track = document.getElementById("mix-bar-track");

      if (bowl.mixProgress >= min && bowl.mixProgress <= max) {
        bowl.sweetSpotLockedPass = true;
        if (track) track.classList.add("sweet-spot-active");
        document.getElementById("bowl-instruction").textContent = "✅ Vừa thấm! Trao khách!";
        spawnFloatingFX(byStaff ? "🧑‍🍳 Anh Ba: Trộn Vừa Thấm!" : "✨ THẤM ĐỀU ĐẬM ĐÀ!", "green");
      } else if (bowl.mixProgress > max) {
        bowl.sweetSpotLockedPass = false;
        if (track) track.classList.remove("sweet-spot-active");
        document.getElementById("bowl-instruction").textContent = "⚠️ Bánh nhũn! Bấm Đổ";
        spawnFloatingFX("⚠️ Quá Tay Bánh Nhũn!", "red");
      } else {
        bowl.sweetSpotLockedPass = false;
        spawnFloatingFX(`🧤 Trộn ${bowl.mixProgress}%`, "purple");
      }
      updateStepButtonsHighlight();

      const c = getActiveCustomer();
      if (isStaffWorkingToday('utnhanh') && c && bowl.mixProgress >= min && bowl.mixProgress <= max) {
        if (c.wantedTraTac && !bowl.tratac && (state.stock.tratac || 0) >= 1) {
          bowl.tratac = true;
          syncToppingButtonsUI();
          renderSelectedOrderBubble();
          updateStepButtonsHighlight();
        }
      }
    }



// ================= 17. TRAO KHÁCH & CHẤM SAO THỐNG NHẤT (ĐỒNG BỘ 100% VOUCHER, SỔ THU CHI & FIREBASE) =================
function isVoucherApplicableForOrder(v, dishKey, c, bagQty) {
  if (!v || !v.active || (state.level || 1) < 12) return false;
  if ((v.usedToday || 0) >= (v.quotaMax || 20)) return false;
  const scope = v.targetScope || "all";
  if (scope === "featured" && dishKey !== state.featuredDishKey) return false;
  if (scope === "grill") {
    const vessel = DISH_MENU[dishKey]?.vessel || "inox";
    if (vessel !== "grill" && vessel !== "bamboo") return false;
  }
  if (scope === "app" && (!c || !c.isShipper)) return false;
  if (v.promoType === "free_tea" && bagQty < 2 && !(c && c.wantedTraTac)) return false;
  return true;
}

function doStep4Serve() {
  const c = getActiveCustomer();
  if (!c) { showToast("🍃 Chưa có khách nào để trao bánh!"); return; }
  if (!bowl.selectedDish) { showToast("⚠️ Hãy chọn Món Bánh trước!"); return; }
  if (!bowl.step1Done || !bowl.step2Done || !bowl.step3Done) { showToast("⚠️ Hãy làm đủ B1 ➔ B2 ➔ B3 trước khi trao khách!"); return; }
  const { min: _swMin, max: _swMax } = getSweetSpotBounds();
  if (!bowl.sweetSpotLockedPass && (bowl.mixProgress < _swMin || bowl.mixProgress > _swMax)) {
    showToast(`⚠️ Chưa đạt vùng chuẩn (${_swMin}%–${_swMax}%)!`);
    return;
  }

  if (bowl.tratac && (state.stock.tratac || 0) < 1) {
    openOutOfStockModal([INGREDIENTS.find(x => x.id === "tratac")]);
    return;
  }

  document.getElementById("svg-layer-topping").classList.remove("hidden");

  const dishObj = DISH_MENU[bowl.selectedDish];
  let notes = [];
  const { min, max } = getSweetSpotBounds();
  const bagQty = c.bagQty || 1;

  if (bowl.lockedBagQty && bowl.lockedBagQty < bagQty) notes.push(`thiếu số lượng (${bowl.lockedBagQty}/${bagQty} bịch)`);
  if (bowl.selectedDish !== c.wantedDish) notes.push(`nhầm món (khách gọi ${DISH_MENU[c.wantedDish].short})`);
  if (bowl.rau !== Boolean(c.wantedRau)) notes.push(c.wantedRau ? "thiếu Rau răm" : "dư Rau răm");
  if (bowl.hanh !== Boolean(c.wantedHanh)) notes.push(c.wantedHanh ? "thiếu Hành phi" : "dư Hành phi");
  if (bowl.spice !== c.wantedSpice) {
    const spNames = ["Không cay", "Cay vừa", "Siêu cay"];
    notes.push(`sai mức ớt (khách dặn ${spNames[c.wantedSpice]})`);
  }
  if (c.wantedTraTac && !bowl.tratac) notes.push("quên kèm Trà Tắc");
  if (!c.wantedTraTac && bowl.tratac) notes.push("dư Trà Tắc");
  if (!bowl.sweetSpotLockedPass) {
    if (bowl.mixProgress < min) notes.push(dishObj.vessel === "grill" ? "lửa nguội bánh chưa giòn" : "chưa thấm đều sốt");
    if (bowl.mixProgress > max) notes.push(dishObj.vessel === "bamboo" ? "cuộn quá tay rách bánh" : "trộn quá tay bị nhũn");
  }

  if (notes.length > 0) {
    playSFX("whistle");
    currentComboStreak = 0;
    const mistakeMult = getCurrentChapterObj().id >= 4 ? 1.5 : 1.0;
    c.patience = Math.max(5, c.patience - Math.round(22 * mistakeMult));
    adjustRating(-0.04);
    resetBowl(false);

    const errHtml = `<span class="text-red-600 font-black">❌ Khách trả lại vì ${notes.join(", ")}! (-0.04⭐)</span>`;
    renderCustomerSlotsRow();
    renderSelectedOrderBubble(errHtml);
    spawnFloatingFX("🗑️ KHÁCH CHÊ SAI MÓN!", "red");
    showToast(`⚠️ Sai yêu cầu (${notes[0]})! Hãy bấm chọn đúng các thẻ trên Order cho hiện Màu Xanh Lá nhé!`);
    return;
  }

  const recipe = DISH_MENU[bowl.selectedDish]?.recipe || {};
  const usedQty = bowl.lockedBagQty || bagQty;
  INGREDIENTS.forEach(ing => {
    if (ing.stepGroup === 4 && ing.id !== "tratac") {
      const req = (recipe[ing.id] || 0) * usedQty;
      const avail = Math.max(0, state.stock[ing.id] || 0);
      if (req > 0 && avail > 0) consumeStockFIFO(ing.id, Math.min(avail, req));
    }
  });
  if (bowl.tratac && (state.stock.tratac || 0) > 0) {
    consumeStockFIFO("tratac", 1);
  }

  // CHẤM ĐIỂM SAO KHẮT KHE (1⭐ .. 5⭐)
  let stars = 5;
  const starDeductions = [];
  const center = (min + max) / 2;
  const halfW = (max - min) / 2;
  const strictRatio = state.level >= 35 ? 0.45 : (state.level >= 20 ? 0.50 : 0.58);
  const isCorePerfect = Math.abs(bowl.mixProgress - center) <= Math.max(2.8, halfW * strictRatio);

  if (!isCorePerfect) {
    if (c.picky || c.vip || Math.random() < 0.65) {
      stars -= 1;
      starDeductions.push("vị thấm chưa đều tăm tắp");
    }
  }
  if (bowl.lateToppingsAdded && (c.picky || c.vip)) {
    stars -= 1;
    starDeductions.push("trộn xong mới rắc rau/hành/ớt");
  }
  const highLvlPatienceReq = state.level >= 30 ? 6 : (state.level >= 15 ? 3 : 0);
  const greenPatienceThreshold = ((c.picky || c.vip || c.isShipper) ? 68 : 58) + highLvlPatienceReq;
  if (c.patience < 32) {
    stars -= 2;
    starDeductions.push("đợi quá lâu mỏi cổ");
  } else if (c.patience < greenPatienceThreshold) {
    stars -= 1;
    starDeductions.push("đợi hơi lâu");
  }
  if ((state.activeMultiDayEffects?.cheapDryDays || 0) > 0 && Math.random() < 0.25) {
    stars -= 1;
    starDeductions.push("khô bò giá rẻ hơi cứng");
  }

  stars = Math.max(2, Math.min(5, stars));
  playSFX("cash");

  let ratingNote = "";
  if (stars === 5) {
    currentComboStreak += 1;
    state.maxStreak5Star = Math.max(state.maxStreak5Star || 0, currentComboStreak);
    if (c.picky) state.servedPickyCount = (state.servedPickyCount || 0) + 1;
    adjustRating(c.picky ? 0.03 : 0.02);
    if (c.isShipper) adjustViral(3);
    if (c.id === "codao") adjustViral(4);

    if (!state.customerLoyaltyCounts || typeof state.customerLoyaltyCounts !== "object") state.customerLoyaltyCounts = {};
    const prevLoyalty = state.customerLoyaltyCounts[c.id] || 0;
    state.customerLoyaltyCounts[c.id] = prevLoyalty + 1;
    if (prevLoyalty < 3 && state.customerLoyaltyCounts[c.id] >= 3) {
      showToast(`💛 ${c.name} đã thành MỐI RUỘT VIP (3/3 lần 5⭐)! Mở Sổ Tay Khách Quen nhận +25.000đ!`);
      if (typeof updateCodexNotificationBadges === "function") updateCodexNotificationBadges();
    }

    if (currentComboStreak >= 3 && currentComboStreak % 3 === 0 && (!activeCartBuff || (activeCartBuff.id !== "rain_flood" && activeCartBuff.id !== "alley_hide"))) {
      activateCartBuff("fever_rush", `🔥 COMBO ${currentComboStreak}x HƯNG PHẤN GIỜ VÀNG (Tâm rộng • Tip +2k)`, 25);
      spawnFloatingFX(`🔥 CHUỖI HƯNG PHẤN x${currentComboStreak}!`, "gold");
    }
  } else if (stars === 4) {
    currentComboStreak = 0;
    if ((state.rating || 4.3) > 4.5) adjustRating(-0.01);
    ratingNote = ` (4⭐: ${starDeductions[0] || 'hơi chậm'})`;
  } else {
    currentComboStreak = 0;
    adjustRating(stars === 3 ? -0.06 : -0.10);
    ratingNote = ` (${stars}⭐: ${starDeductions.join(", ")} -${stars === 3 ? '0.06' : '0.10'}⭐)`;
  }

  ensureV15State(state);
  const unitPrice = getDishEffectivePrice(bowl.selectedDish);
  let dishGrossRev = unitPrice * usedQty;
  let traTacRev = (c.wantedTraTac && bowl.tratac) ? 8000 : 0;

  // Áp dụng đúng Phạm vi & Loại Voucher trước khi ghi Sổ Thu Chi
  const v = state.customVoucher;
  if (isVoucherApplicableForOrder(v, bowl.selectedDish, c, usedQty)) {
    if (v.promoType === "free_tea") {
      if (traTacRev > 0) {
        traTacRev = 0;
      } else {
        const discountPerBag = Math.round((unitPrice * 0.12) / 500) * 500;
        dishGrossRev = Math.max(0, dishGrossRev - discountPerBag * usedQty);
      }
    } else if (v.discountPct > 0) {
      const discountPerBag = Math.round((unitPrice * (v.discountPct / 100)) / 500) * 500;
      dishGrossRev = Math.max(0, dishGrossRev - discountPerBag * usedQty);
    }
    v.usedToday = Math.min(v.quotaMax || 20, (v.usedToday || 0) + 1);
  }

  let grossOrderPrice = dishGrossRev + traTacRev;
  let appFeeDeducted = 0;
  let tip = 0;

  if (c.isShipper) {
    if (state.appPriceMarkup) {
      const markupExtra = Math.round((grossOrderPrice * 0.10) / 500) * 500;
      grossOrderPrice += markupExtra;
      dishGrossRev += markupExtra;
    }
    const commRate = getCurrentAppCommissionRate();
    appFeeDeducted = Math.round((grossOrderPrice * commRate) / 500) * 500;
    state.todayAppFees = (state.todayAppFees || 0) + appFeeDeducted;
    state.cumulativeCosts.appFee = (state.cumulativeCosts.appFee || 0) + appFeeDeducted;
  } else if (stars === 5) {
    if (Math.random() < 0.35) tip += 1000 + Math.floor(Math.random() * 2) * 1000;
    if (state.prepDone.sate && state.prepDone.hanhphi && state.prepDone.trungcut) tip += 1000;
    if ((state.equipLevels?.upg_icedtea || 0) > 0) {
      tip += (state.equipLevels.upg_icedtea * 500);
    }
    if (isStaffWorkingToday("baoloc")) {
      tip += (state.staffStars?.baoloc || 1) * 500;
    }
    if (state.selectedDailySauce === "bo_toi") {
      tip += 1000;
    }
    if (activeCartBuff && activeCartBuff.id === "fever_rush") {
      tip += 2000;
    }
    if ((state.equipLevels?.upg_awning || 0) >= 5 && activeCartBuff && activeCartBuff.id === "rain_flood") {
      tip += 1500;
    }
    if (isStaffWorkingToday("anhba")) {
      const anhbaStar = state.staffStars?.anhba || 1;
      if (Math.random() < anhbaStar * 0.15) {
        tip += 4000;
        spawnFloatingFX("🌟 MẺ BÁNH TUYỆT HẢO +4K!", "gold");
      }
    }
    if (c.vip) tip += 5000;
    if (c.picky) tip += 6000;
    if (state.licenses?.lic_michelin) tip = Math.round(tip * 1.20);
    if (isStaffWorkingToday("kimngan") && Number(state.staffStars?.kimngan || 1) >= 4) {
      tip += Number(state.staffStars?.kimngan) >= 5 ? 1500 : 1000;
    }
    const expScale = getExpectedShopScaleForLevel(state.level);
    const curScale = Number(state.shopScale || 0);
    if (c.vip && curScale < expScale) {
      const nextScaleCost = SHOP_SCALE_TIERS[curScale + 1]?.cost || 0;
      if (state.money >= nextScaleCost && Math.random() < 0.35) {
        tip = Math.round(tip * 0.70);
        adjustRating(-0.02);
        showToast(`🏢 Khách VIP nhắc: "Quán đông mà mặt bằng hơi chật! Nâng cấp Quy Mô ở mục Xây Quán nha!" (-0.02⭐)`);
      }
    }
    if (activeCartBuff && activeCartBuff.id === "tiktok_storm") tip = Math.round(tip * 1.5 / 500) * 500;
    if (activeCartBuff && activeCartBuff.id === "intl_bus_rush") tip = Math.round(tip * 2.0 / 500) * 500;
    if (activeCartBuff && activeCartBuff.id === "spicy_king_rush") tip += 6000;
    if (state.nextCustomerTipBonus > 0) { tip += state.nextCustomerTipBonus; state.nextCustomerTipBonus = 0; }
    if (window.serverLiveConfig && window.serverLiveConfig.enabled && Number(window.serverLiveConfig.tipMult || 1) > 1) {
      tip = Math.round(tip * Number(window.serverLiveConfig.tipMult));
    }
    const isRushNow = Boolean(activeCartBuff && ["tiktok_storm", "intl_bus_rush", "spicy_king_rush"].includes(activeCartBuff.id));
    const maxTipCap = isRushNow ? 18000 : 12000;
    tip = Math.min(maxTipCap, Math.round(tip / 500) * 500);
  }

  // Cộng thưởng theo Bộ Chủ Đề Phong Cách & Thời Tiết trực tiếp vào Tip để Sổ Thu Chi khớp 100%
  if (stars === 5 && state.activeDecorThemeId === "theme_retro") {
    tip += 1500;
  } else if (stars === 5 && state.activeDecorThemeId === "theme_tet" && Math.random() < 0.35) {
    tip += 6000;
    spawnFloatingFX("🧧 LÌ XÌ MAY MẮN +6K!", "gold");
  }
  const weather = getTodayWeatherObj(state.day);
  if (weather.id === "storm_tide") {
    tip += 2500;
  }

  if (stars === 5 && activeCartBuff && activeCartBuff.id === "tv_report_rush") {
    state.money += 15000;
    state.todayRevenue += 15000;
    recordExtraEventRevDetail(15000);
    adjustViral(3);
    spawnFloatingFX("🎥 Lên TV Chuẩn 5⭐ +15k!", "gold");
  }

  const packUnit = (state.activeSalesStrategy === "office_combo" || state.dailyCampaigns?.combo_student) ? 800 : 1000;
  const packagingCost = usedQty * packUnit;
  state.money -= packagingCost;
  state.todayCogsSpent += packagingCost;
  state.cumulativeCosts.cogs = (state.cumulativeCosts.cogs || 0) + packagingCost;

  if (bowl.selectedDish === state.featuredDishKey && stars >= 4) {
    state.featuredSoldToday = (state.featuredSoldToday || 0) + usedQty;
    if (state.featuredSoldToday >= 8 && !state.featuredRewardClaimed) {
      state.featuredRewardClaimed = true;
      const featReward = state.activeSalesStrategy === "flash_featured" ? 30000 : 15000;
      state.money += featReward;
      state.todayRevenue += featReward;
      recordExtraEventRevDetail(featReward);
      showToast(`🔥 Đủ 8/8 Món Nổi Bật: Thưởng +${formatVND(featReward)}!`);
    }
  }

  if (bulkOrderChallenge && bulkOrderChallenge.active) {
    bulkOrderChallenge.done += usedQty;
    updateBulkRushUI();
    if (bulkOrderChallenge.done >= bulkOrderChallenge.target) {
      const bonus = bulkOrderChallenge.reward;
      state.money += bonus;
      state.todayRevenue += bonus;
      recordExtraEventRevDetail(bonus);
      bulkOrderChallenge.active = false;
      updateBulkRushUI();
      adjustRating(0.15);
      showToast(`🏆 XONG ĐƠN SỈ! Thưởng +${formatVND(bonus)}!`);
    }
  }

  let shortchangeLoss = 0;
  if (state.level >= 10 && Math.random() < 0.18) {
    const hasCashier = isStaffWorkingToday("kimngan");
    const cashierStar = Number(state.staffStars?.kimngan || 1);
    const blockChance = !hasCashier ? 0 : (cashierStar >= 3 ? 1.0 : cashierStar === 2 ? 0.85 : 0.65);
    if (Math.random() < blockChance) {
      spawnFloatingFX("👩‍💼 Kim Ngân: Chặn khách đưa thiếu!", "green");
    } else {
      shortchangeLoss = Math.max(4000, Math.round((grossOrderPrice * 0.25) / 500) * 500);
      spawnFloatingFX(`💸 Khách đưa thiếu -${formatShortK(shortchangeLoss)}!`, "red");
      showToast(`💸 Khách đưa thiếu mất ${formatVND(shortchangeLoss)}! Thuê 👩‍💼 Thu Ngân Kim Ngân (3⭐) để chặn 100% nhé!`);
    }
  }

  const netDishRevAfterLoss = Math.max(0, dishGrossRev - shortchangeLoss);
  const finalEarned = Math.max(0, netDishRevAfterLoss + traTacRev - appFeeDeducted + tip);
  const sauceXpMult = state.selectedDailySauce === "mam_ruoc" ? 0.15 : 0;
  const cashierXpMult = (isStaffWorkingToday("kimngan") && Number(state.staffStars?.kimngan || 1) >= 3) ? 0.05 : 0;
  const xpGained = Math.round(stars * 7 * usedQty * (1 + (state.equipLevels?.upg_neon || 0) * 0.05 + sauceXpMult + cashierXpMult));

  recordDishSaleDetail(bowl.selectedDish, usedQty, netDishRevAfterLoss, (c.wantedTraTac && bowl.tratac) ? 1 : 0, traTacRev, tip, packagingCost);
  if (typeof showLastSaleReceiptV18 === "function") showLastSaleReceiptV18(netDishRevAfterLoss + traTacRev, tip, appFeeDeducted, finalEarned);
  if (typeof showMidOrderAddonCardV18 === "function") showMidOrderAddonCardV18("");

  state.money += finalEarned;
  state.todayRevenue += finalEarned;
  state.dishSalesRevenue[bowl.selectedDish] = (state.dishSalesRevenue[bowl.selectedDish] || 0) + finalEarned;
  state.totalSold += usedQty;
  state.todaySold += usedQty;
  state.creditScore = Math.min(850, (state.creditScore || 520) + 1);

  const frameLvl = state.equipLevels?.upg_cooler || 0;
  const chapId = getCurrentChapterObj()?.id || 1;
  const expScale = getExpectedShopScaleForLevel(state.level);
  const curScale = Number(state.shopScale || 0);
  const unscaledPenalty = curScale < expScale ? (1 + (expScale - curScale) * 0.45) : 1.0;
  const baseChapWear = (1.1 + (chapId - 1) * 0.28) * unscaledPenalty;
  const scaleWear = getCurrentShopScaleObj().wearFactor ?? 1.0;
  const wearMult = (frameLvl >= 5 ? 0.48 : Math.max(0.48, 1 - frameLvl * 0.10)) * scaleWear;
  state.cartDurability = scaleWear === 0 ? 100 : Math.max(15, Math.round(((state.cartDurability || 100) - baseChapWear * wearMult) * 10) / 10);
  addXP(xpGained);

  const dishLabel = `${usedQty}x ${dishObj.name}${bowl.tratac ? ' + Trà Tắc' : ''}`;
  const reviewComment = generateCharacterReviewComment(c, stars, dishLabel, starDeductions);
  const baseLikes = c.vip ? (Math.floor(Math.random() * 55) + 38) : (Math.floor(Math.random() * 28) + 14);

  state.reviews.unshift({
    id: "rev_" + Date.now() + "_" + Math.floor(Math.random() * 999),
    custId: c.id,
    custName: c.name,
    custJob: c.job,
    custAvatar: c.avatar,
    custPortrait: c.portrait,
    picky: Boolean(c.picky),
    vip: Boolean(c.vip),
    dishName: dishLabel,
    stars,
    likes: baseLikes,
    comment: reviewComment,
    replied: false,
    replyText: ""
  });
  if (state.reviews.length > 25) state.reviews.pop();

  spawnFlyingBagAndMoneyBadge(finalEarned, tip, stars, xpGained, bowl.selectedDish);
  spawnParticleBurst(["💸", "⭐", "🎉", "🥙"]);

  const appNote = appFeeDeducted > 0 ? ` (Sàn -${formatShortK(appFeeDeducted)})` : "";
  const starEmoji = stars === 5 ? "🥰" : stars === 4 ? "🙂" : "😒";
  const praiseHtml = `<span class="${stars === 5 ? 'text-emerald-700' : stars === 4 ? 'text-amber-800' : 'text-rose-700'} font-black">${starEmoji} ${escapeHtml(c.name)}: "+${formatVND(finalEarned)}${appNote}${ratingNote}"</span>`;

  const servedSlot = selectedSlotIndex;
  customerSlots[servedSlot] = null;
  resetBowl(false);
  const instrEl = document.getElementById("bowl-instruction");
  if (instrEl) instrEl.textContent = "Chọn Món & Topping";
  autoSelectFirstAvailableSlot();
  renderSelectedOrderBubble(praiseHtml);

  if (!state.dilemmaTriggeredToday && state.todaySold >= 5 && state.clockMinutes >= 16 * 60 && Math.random() < 0.35) {
    state.dilemmaTriggeredToday = true;
    setTimeout(() => triggerRandomDilemmaEvent(false), 500);
  } else if (customerSlots.filter(Boolean).length === 0 && state.isStreetSelling) {
    if (state.clockMinutes >= 22 * 60) {
      setTimeout(() => checkAndTriggerClosingIfEmpty(), 650);
    } else {
      setTimeout(() => { if (state.isStreetSelling && !isAnyBlockingModalOpen()) spawnCustomerIntoEmptySlot(false); }, 500);
    }
  }
  updateAllUI();
  saveGameEverywhere(false);
}

function spawnFlyingBagAndMoneyBadge(earned, tip, stars, xpGained = 14, dishKey = "tron") {
  const c = document.getElementById("floating-fx-container");
  if (!c) return;
  const wrap = document.createElement("div");
  wrap.className = "flex flex-col items-center pointer-events-none";
  wrap.style.setProperty("--arc-x", `${Math.round(Math.random() * 34 - 17)}px`);
  wrap.style.setProperty("--arc-rot", `${Math.round(Math.random() * 12 - 6)}deg`);

  const comboBadge = currentComboStreak >= 2 ? `<div class="arcade-float-text text-xs text-orange-300">🔥 ĐỀU TAY ${currentComboStreak} MẺ!</div>` : "";
  const tipBadge = tip > 0 ? `<div class="arcade-float-text text-xs text-emerald-300">💖 Tip +${formatShortK(tip)}</div>` : "";
  const dishImg = CASUAL_2D_ASSETS[dishKey] || CASUAL_2D_ASSETS.tron;

  wrap.innerHTML = `
    ${comboBadge}
    <div class="arcade-float-text text-base sm:text-lg text-yellow-300">
      +${formatVND(earned)} ✨
    </div>
    ${tipBadge}
    <div class="arcade-float-text text-[11px] text-sky-300 mb-1">
      +${xpGained} XP • ${"⭐".repeat(stars)}
    </div>
    <img src="${dishImg}" class="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-lg bag-fly-anim" alt="Dish" />
  `;
  c.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1250);
}

function triggerNextStepSmart() {
  const { min } = getSweetSpotBounds();
  if (!bowl.step1Done) doStep1Base(); else if (!bowl.step2Done) doStep2Sauce(); else if (bowl.mixProgress < min) doStep3Mix(); else doStep4Serve();
}

    function renderCompactStreetControlStrip() {
      const strip = document.getElementById("staff-active-strip");
      if (!strip) return;
      ensureV15State(state);
      const weather = getTodayWeatherObj(state.day);
      const b1Worker = isStaffWorkingToday("beti") ? "👦 Bé Tí" : "🖐️ Chủ quán";
      const b2Worker = isStaffWorkingToday("mylan") ? "👧 Mỹ Lan" : "🖐️ Chủ quán";
      const b3Worker = isStaffWorkingToday("anhba") ? "🧑‍🍳 Anh Ba" : "🖐️ Chủ quán";
      const canLive = (state.level || 1) >= 40;
      const liveActive = streetLivestreamRemainingSec > 0;

      strip.innerHTML = `
        <div class="w-full flex items-center justify-between gap-1 text-[9px] font-black text-amber-950">
          <span>${weather.icon} ${weather.name}</span>
          <span>B1: <b class="text-emerald-800">${b1Worker}</b> • B2: <b class="text-emerald-800">${b2Worker}</b> • B3: <b class="text-emerald-800">${b3Worker}</b></span>
        </div>
        <div class="w-full grid grid-cols-3 gap-1 pt-1 mt-0.5 border-t border-amber-300/80">
          <button type="button" onclick="triggerStreetLivestream()" class="soft-btn py-1 px-1.5 rounded-lg border font-black text-[9px] text-center ${liveActive ? 'bg-red-600 text-white border-yellow-300 animate-pulse' : canLive ? 'bg-rose-700 text-white border-rose-900' : 'bg-slate-200 text-slate-600 border-slate-300'}">
            ${liveActive ? `🔴 Live ${streetLivestreamRemainingSec}s (${streetLiveViewers}👁️)` : canLive ? '🎥 Phát Trực Tiếp (30k)' : '🔒 Phát Trực Tiếp (C.40)'}
          </button>
          <button type="button" onclick="triggerStreetFlashDrop()" class="soft-btn py-1 px-1.5 rounded-lg border font-black text-[9px] text-center ${streetFlashDropRemainingSec > 0 ? 'bg-orange-500 text-white border-orange-700' : liveActive ? 'bg-amber-300 text-amber-950 border-amber-500' : 'bg-slate-100 text-slate-500 border-slate-200'}">
            ${streetFlashDropRemainingSec > 0 ? `⚡ Đang Tung (${streetFlashDropRemainingSec}s)` : '⚡ Tung Ưu Đãi Live'}
          </button>
          <button type="button" onclick="triggerStaffActiveSkill()" class="soft-btn py-1 px-1.5 rounded-lg border font-black text-[9px] text-center ${staffActiveSkillCooldownSec > 0 ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-emerald-600 text-white border-emerald-800'}">
            ${staffActiveSkillCooldownSec > 0 ? `⏳ Hồi chiêu (${staffActiveSkillCooldownSec}s)` : '⚡ Động Viên Quầy Bếp'}
          </button>
        </div>
      `;
    }

    function triggerStreetLivestream() {
      ensureV15State(state);
      if (!state.isStreetSelling) return;
      if ((state.level || 1) < 40) {
        showToast("🔒 Đạt Cấp 40 (Nhà Hàng Phố Đêm) để mở Bàn Phát Trực Tiếp tại quầy!");
        return;
      }
      if (streetLivestreamRemainingSec > 0) {
        showToast(`🎥 Phiên Phát trực tiếp đang diễn ra (${streetLivestreamRemainingSec}s)!`);
        return;
      }
      const liveCost = 30000;
      if (state.money < liveCost) {
        showToast("⚠️ Cần 30.000đ để bật Phát trực tiếp 45s!");
        return;
      }
      state.money -= liveCost;
      state.todayCogsSpent = (state.todayCogsSpent || 0) + liveCost;
      streetLivestreamRemainingSec = 45;
      const neonBoost = state.activeDecorThemeId === "theme_neon" ? 1.3 : 1.0;
      streetLiveViewers = Math.round((50 + (state.level || 1) * 10) * neonBoost);
      adjustViral(5);
      playSFX("cash");
      spawnFloatingFX("🎥 BẬT PHÁT TRỰC TIẾP 45S!", "gold");
      renderCompactStreetControlStrip();
      if (customerSlots.filter(Boolean).length < getMaxActiveCustomerSlots()) {
        spawnCustomerIntoEmptySlot(true);
      }
    }

    function triggerStreetFlashDrop() {
      if (!state.isStreetSelling) return;
      if (streetLivestreamRemainingSec <= 0) {
        showToast("⚠️ Hãy bật '🎥 Phát Trực Tiếp' trước khi Tung Ưu Đãi!");
        return;
      }
      if (streetFlashDropRemainingSec > 0) return;
      streetFlashDropRemainingSec = 20;
      streetLiveViewers += 60;
      playSFX("cash");
      spawnFloatingFX("⚡ TUNG ƯU ĐÃI +60 MẮT XEM!", "orange");
      customerSlots.forEach(c => { if (c) c.patience = Math.min(100, c.patience + 20); });
      if (customerSlots.filter(Boolean).length < getMaxActiveCustomerSlots()) {
        spawnCustomerIntoEmptySlot(true);
      }
      renderCustomerSlotsRow();
      renderCompactStreetControlStrip();
    }

    function triggerStaffActiveSkill() {
      if (!state.isStreetSelling) return;
      const hiredCount = Object.values(state.staff || {}).filter(Boolean).length;
      if (hiredCount === 0) {
        showToast("⚠️ Hãy thuê Phụ Bếp từ Cấp 8 trở lên để dùng Động Viên Quầy Bếp!");
        return;
      }
      if (staffActiveSkillCooldownSec > 0) {
        showToast(`⏳ Đang hồi chiêu (${staffActiveSkillCooldownSec}s)!`);
        return;
      }
      staffActiveSkillCooldownSec = 35;
      customerSlots.forEach(c => { if (c) c.patience = 100; });
      activateCartBuff("fever_rush", "⚡ ĐỘNG VIÊN QUẦY BẾP: HỒI 100% KIÊN NHẪN & TÂM RỘNG!", 15);
      playSFX("cash");
      spawnFloatingFX("⚡ QUẦY BẾP TĂNG TỐC 100%!", "green");
      renderCustomerSlotsRow();
      renderCompactStreetControlStrip();
    }

    // --- 10. TAM HỆ CHẾ BIẾN & HƯỞNG HIỆU ỨNG BỘ PHONG CÁCH ---
    function syncStep3VesselChibiAndLabel() {
      const dKey = bowl.selectedDish || "tron";
      const dObj = DISH_MENU[dKey] || DISH_MENU.tron;
      const vessel = dObj.vessel || "inox";
      const btn3 = document.getElementById("step-btn-3");
      const vLabel = document.getElementById("vessel-mode-label");
      if (!btn3) return;
      let iconHtml = "🧤";
      let stepTitle = "3. Trộn Đều";
      let stationTag = "🥣 Thau Inox • Đảo Thấm";
      if (vessel === "bamboo") {
        const imgSrc = (dKey === "metditu" && CASUAL_2D_ASSETS.st_met) ? CASUAL_2D_ASSETS.st_met : CASUAL_2D_ASSETS.st_cuon;
        iconHtml = imgSrc ? `<img src="${imgSrc}" alt="Cuộn" class="w-6 h-6 rounded-md object-cover border border-white/60 mx-auto" />` : "🎋";
        stepTitle = "3. Cuộn Chặt";
        stationTag = "🎋 Mẹt Tre • Cuộn 2 Nhịp";
      } else if (vessel === "grill") {
        iconHtml = CASUAL_2D_ASSETS.st_nuong ? `<img src="${CASUAL_2D_ASSETS.st_nuong}" alt="Nướng" class="w-6 h-6 rounded-md object-cover border border-white/60 mx-auto" />` : "🔥";
        stepTitle = "3. Xoay Lửa";
        stationTag = "🔥 Vỉ Than • Giữ Nhiệt";
      } else {
        iconHtml = CASUAL_2D_ASSETS.st_tron ? `<img src="${CASUAL_2D_ASSETS.st_tron}" alt="Trộn" class="w-6 h-6 rounded-md object-cover border border-white/60 mx-auto" />` : "🧤";
        stepTitle = "3. Trộn Đều";
        stationTag = "🥣 Thau Inox • Đảo Thấm";
      }
      btn3.innerHTML = `
        <span class="leading-none drop-shadow">${iconHtml}</span>
        <span class="font-black text-[10px] leading-tight mt-0.5 uppercase">${stepTitle}</span>
        <span id="step-check-3" class="text-[8px] font-black px-1.5 rounded-full bg-black/25 text-yellow-200 mt-0.5">${bowl.mixProgress || 0}%</span>
      `;
      if (vLabel) vLabel.textContent = stationTag;
    }

    function doStep3Mix(byStaff = false) {
      if (!bowl.step2Done) { showToast("⚠️ Làm Bước 1 & 2 trước!"); return; }
      const dKey = bowl.selectedDish || "tron";
      const vessel = DISH_MENU[dKey]?.vessel || "inox";
      const { min, max } = getSweetSpotBounds();
      const targetCenter = Math.round((min + max) / 2);

      if (!byStaff && vessel === "bamboo") {
        playSFX("mix");
        if ((bowl.mixProgress || 0) < 35) bowl.mixProgress = 38;
        else if (bowl.mixProgress < min) bowl.mixProgress = targetCenter;
        else bowl.mixProgress = 98;
        bowl.step3Done = true;
        document.getElementById("mix-bar-fill").style.width = `${bowl.mixProgress}%`;
        const track = document.getElementById("mix-bar-track");
        if (bowl.mixProgress >= min && bowl.mixProgress <= max) {
          bowl.sweetSpotLockedPass = true;
          if (track) track.classList.add("sweet-spot-active");
          document.getElementById("bowl-instruction").textContent = "✅ Cuộn chặt đẹp! Trao khách!";
          spawnFloatingFX("🎋 CUỘN CHẶT CHUẨN VỊ!", "green");
        } else if (bowl.mixProgress > max) {
          bowl.sweetSpotLockedPass = false;
          if (track) track.classList.remove("sweet-spot-active");
          document.getElementById("bowl-instruction").textContent = "⚠️ Rách bánh cuộn! Bấm Đổ";
          spawnFloatingFX("⚠️ Quá Tay Rách Bánh!", "red");
        } else {
          bowl.sweetSpotLockedPass = false;
          document.getElementById("bowl-instruction").textContent = "🎋 Bấm thêm 1 nhịp để khóa mép cuộn!";
        }
        updateStepButtonsHighlight();
        syncStep3VesselChibiAndLabel();
        return;
      }

      _baseDoStep3Mix(byStaff);
      syncStep3VesselChibiAndLabel();
    };



setInterval(() => {
  if (!state || !state.isStreetSelling) return;
  let uiChanged = false;
  if (streetLivestreamRemainingSec > 0) {
    streetLivestreamRemainingSec -= 1;
    streetLiveViewers = Math.max(20, streetLiveViewers + Math.floor(Math.random() * 11) - 4);
    if (streetLivestreamRemainingSec % 8 === 0 && customerSlots.filter(Boolean).length < getMaxActiveCustomerSlots()) {
      spawnCustomerIntoEmptySlot(true);
    }
    uiChanged = true;
  }
  if (streetFlashDropRemainingSec > 0) { streetFlashDropRemainingSec -= 1; uiChanged = true; }
  if (staffActiveSkillCooldownSec > 0) { staffActiveSkillCooldownSec -= 1; uiChanged = true; }

  const dKey = bowl.selectedDish || "tron";
  if ((DISH_MENU[dKey]?.vessel === "grill") && bowl.step3Done && (bowl.mixProgress || 0) > 15) {
    bowl.mixProgress = Math.max(10, bowl.mixProgress - 4);
    const { min, max } = getSweetSpotBounds();
    const fillEl = document.getElementById("mix-bar-fill");
    const track = document.getElementById("mix-bar-track");
    const instrEl = document.getElementById("bowl-instruction");
    if (fillEl) fillEl.style.width = `${bowl.mixProgress}%`;
    bowl.sweetSpotLockedPass = (bowl.mixProgress >= min && bowl.mixProgress <= max);
    if (track) track.classList.toggle("sweet-spot-active", bowl.sweetSpotLockedPass);
    if (instrEl) {
      instrEl.textContent = bowl.sweetSpotLockedPass
        ? "✅ Lửa chuẩn! Trao khách ngay!"
        : "🔥 Lửa nguội dần! Bấm B3 xoay lửa thêm!";
    }
    updateStepButtonsHighlight();
    syncStep3VesselChibiAndLabel();
  }
  if (uiChanged) renderCompactStreetControlStrip();
}, 1000);

    // ================= 21. ĐỒNG HỒ CA BÁN HÀNG & CHỐT SỔ CUỐI NGÀY =================
    let closingTimeNotified = false;
    let manualDismissedClosingAt22 = false;
    let pendingEndDayData = null;

    function checkAndTriggerClosingIfEmpty() {
      if (!state.isStreetSelling || state.clockMinutes < 22 * 60) return;
      if (isAnyBlockingModalOpen() || manualDismissedClosingAt22) return;

      const remainingCustomers = customerSlots.filter(Boolean).length;
      if (remainingCustomers === 0) {
        closingTimeNotified = false;
        endDaySummary();
      }
    }

    function startDayClock() {
      if (clockTimer) clearInterval(clockTimer);
      clockTimer = setInterval(() => {
        if (!document.getElementById("login-screen").classList.contains("hidden")) return;
        if (!state.isStreetSelling || isAnyBlockingModalOpen()) return;

        if (state.clockMinutes < 22 * 60) {
          manualDismissedClosingAt22 = false;
          state.clockMinutes = Math.min(22 * 60, state.clockMinutes + (3 * (window.gameSpeedMult || 1)));
        }

        const h = Math.floor(state.clockMinutes / 60), m = state.clockMinutes % 60;
        const remainingCustomers = customerSlots.filter(Boolean).length;

        const closeBanner = document.getElementById("closing-22h-banner");
        if (state.clockMinutes >= 22 * 60) {
          if (closeBanner) closeBanner.classList.remove("hidden");
          if (remainingCustomers > 0) {
            document.getElementById("topbar-sub-time").textContent = `22:00 (${remainingCustomers})`;
            if (!closingTimeNotified) {
              closingTimeNotified = true;
              showToast(`🌙 Đã 22:00! Bấm "Chốt Sổ & Qua Ngày" hoặc phục vụ nốt ${remainingCustomers} khách!`);
            }
          } else {
            document.getElementById("topbar-sub-time").textContent = `22:00`;
            checkAndTriggerClosingIfEmpty();
          }
        } else {
          if (closeBanner) closeBanner.classList.add("hidden");
          document.getElementById("topbar-sub-time").textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }

        updateStageSkyByHour();
      }, 1350);
    }

    function endDaySummary() {
      ensureValidStockBatches();

      const depCost = Math.round(getDailyOperatingFixedCost() * 0.4), utilCost = Math.round(getDailyOperatingFixedCost() * 0.6);
      const rentCost = (state.licenses.lic_sidewalk && !state.licenses.lic_heritage) ? 25000 : 0;
      const staffWages = getDailyStaffWages();
      const taxRate = getChapterTaxRate();
      const rawTax = taxRate > 0 ? Math.round((state.todayRevenue * taxRate) / 500) * 500 + (getCurrentChapterObj().id * 4000) : 0;
      const taxMult = state.licenses?.lic_heritage ? 0 : (1 - (state.licenses?.lic_franchise ? 0.25 : 0) - ((isStaffWorkingToday('kimngan') && Number(state.staffStars?.kimngan || 1) >= 5) ? 0.15 : 0));
      const progressiveTax = Math.round((rawTax * Math.max(0, taxMult)) / 500) * 500;
      const bankInstallment = (state.loanDebt || 0) > 0 ? Math.min(state.loanDebt, 35000) : 0;
      const totalFixed = depCost + utilCost + rentCost + staffWages + progressiveTax + bankInstallment;
      const scaleContractBonus = (state.todaySold || 0) >= 10 ? (getCurrentShopScaleObj().contractBonus || 0) : 0;
      const franchiseDividend = getDailyFranchiseDividend(true) + scaleContractBonus;

      const coolerLvl = state.equipLevels?.upg_cooler || 0;
      const saveRate = Math.min(1.0, coolerLvl * 0.10);
      let spoiledTotalVal = 0;
      let savedTotalQty = 0;
      const spoiledSummaryItems = [];
      const nextStockBatches = {};

      INGREDIENTS.forEach(ing => {
        const list = state.stockBatches[ing.id] || [];
        const nextList = [];
        let expiredQty = 0;

        list.forEach(b => {
          const newDays = (b.daysLeft || 1) - 1;
          if (newDays <= 0) {
            const savedQty = saveRate > 0 ? Math.round(b.qty * saveRate) : 0;
            const lostQty = Math.max(0, b.qty - savedQty);
            expiredQty += lostQty;
            savedTotalQty += savedQty;
            if (savedQty > 0) nextList.push({ qty: savedQty, daysLeft: 1 });
          } else {
            nextList.push({ qty: b.qty, daysLeft: newDays });
          }
        });

        nextStockBatches[ing.id] = nextList;
        if (expiredQty > 0) {
          const lossVal = expiredQty * ing.baseCost;
          spoiledTotalVal += lossVal;
          spoiledSummaryItems.push(`${ing.short} (${expiredQty})`);
        }
      });

      const startBalance = Number.isFinite(Number(state.dayStartMoney))
        ? Number(state.dayStartMoney)
        : ((state.money || 0) - (state.todayRevenue || 0) + (state.todayCogsSpent || 0));
      const preCloseBalance = Number(state.money || 0);
      const otherCashDelta = (preCloseBalance - startBalance) - ((state.todayRevenue || 0) - (state.todayCogsSpent || 0));
      const closeDelta = franchiseDividend - totalFixed;
      const endBalance = preCloseBalance + closeDelta;
      const netProfit = endBalance - startBalance;

      pendingEndDayData = {
        depCost, utilCost, rentCost, staffWages, progressiveTax, bankInstallment,
        totalFixed, spoiledTotalVal, spoiledSummaryItems, nextStockBatches,
        netProfit, franchiseDividend, startBalance, preCloseBalance, otherCashDelta, endBalance
      };

      const sched = getTodayScheduleInfo(state.day);
      document.getElementById("end-day-title").textContent = `🌙 Chốt Sổ Ngày ${state.day} (${sched.dowName})`;
      document.getElementById("end-day-details").innerHTML = `
        <div class="flex justify-between text-amber-900"><span>Số dư đầu Ngày ${state.day}:</span><b>${formatVND(startBalance)}</b></div>
        <div class="flex justify-between"><span>Doanh thu bán bánh (${state.todaySold} phần • đã vào két):</span><b class="text-emerald-700">+${formatVND(state.todayRevenue)}</b></div>
        ${(state.todayAppFees || 0) > 0 ? `<div class="text-[10px] text-blue-700 text-right -mt-1">(Đã khấu trừ Phí sàn App ${formatVND(state.todayAppFees)} trước khi vào doanh thu)</div>` : ''}
        <div class="flex justify-between text-amber-800"><span>Tiền đi chợ & Túi đựng (đã trừ trong ngày):</span><b>-${formatVND(state.todayCogsSpent)}</b></div>
        ${otherCashDelta !== 0 ? `<div class="flex justify-between ${otherCashDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}"><span>Thu/Chi khác trong ngày (Nâng cấp/Mở món/Thưởng):</span><b>${otherCashDelta >= 0 ? '+' : ''}${formatVND(otherCashDelta)}</b></div>` : ''}
        <div class="flex justify-between text-slate-700 border-t border-dashed border-amber-300 pt-1"><span>Số dư hiện tại (trước chốt sổ):</span><b>${formatVND(preCloseBalance)}</b></div>
        ${franchiseDividend > 0 ? `<div class="flex justify-between text-teal-700"><span>🏢 Thưởng Quy mô & Cổ tức (cộng lúc chốt sổ):</span><b>+${formatVND(franchiseDividend)}</b></div>` : ''}
        <div class="flex justify-between text-red-700"><span>Điện đèn, Vỉa hè, Lương & Thuế (trừ lúc chốt sổ):</span><b>-${formatVND(totalFixed)}</b></div>
        <div class="flex justify-between border-t border-amber-300 pt-1.5 text-sm font-black ${netProfit >= 0 ? 'text-emerald-800' : 'text-red-700'}">
          <span>Lãi ròng Ngày ${state.day} (Cuối - Đầu ngày):</span><span>${netProfit >= 0 ? '+' : ''}${formatVND(netProfit)}</span>
        </div>
        <div class="flex justify-between text-xs font-black text-amber-950 bg-amber-100/80 px-2 py-1 rounded-lg border border-amber-300">
          <span>💰 Số dư cuối Ngày ${state.day} (đầu Ngày ${state.day + 1}):</span><span>${formatVND(endBalance)}</span>
        </div>
        <div class="text-[10.5px] text-orange-800 bg-orange-50 p-1.5 rounded-lg border border-orange-200 flex justify-between gap-2">
          <span>📦 Hàng hư hủy kho (${spoiledSummaryItems.length ? spoiledSummaryItems.join(", ") : "0"} • không trừ thêm tiền mặt):</span>
          <b class="shrink-0">${formatVND(spoiledTotalVal)}</b>
        </div>
        ${savedTotalQty > 0 ? `<div class="text-[10px] font-bold text-emerald-800 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">🧊 Tủ Kính Sạch & Thùng Đá (Cấp ${coolerLvl}) đã bảo quản thành công <b>+${savedTotalQty} phần</b> cận date qua đêm!</div>` : ''}
        ${spoiledTotalVal > 0 && coolerLvl < 5 ? `<div class="text-[10px] font-bold text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200">💡 Mẹo: Nâng cấp <b>🧊 Tủ Kính Sạch & Thùng Đá</b> ở mục Nâng Cấp để cộng tới +3 ngày HSD và bảo toàn 100% nguyên liệu qua đêm!</div>` : ''}
      `;
      document.getElementById("modal-end-day").classList.remove("hidden");
    }

    function closeEndDayModal() {
      document.getElementById("modal-end-day").classList.add("hidden");
      pendingEndDayData = null;
      if (state.clockMinutes >= 22 * 60) {
        manualDismissedClosingAt22 = true;
      }
      playSFX("snip");
      showToast("⬅️ Đã đóng bảng Chốt sổ, tiếp tục bán hàng!");
    }



function startNextDay() {
  ensureV15State(state);
  if (!pendingEndDayData) endDaySummary();
  const d = pendingEndDayData;
  pendingEndDayData = null;
  manualDismissedClosingAt22 = false;

  if (slotPatienceTimer) clearInterval(slotPatienceTimer);
  if (slotSpawnerTimer) clearInterval(slotSpawnerTimer);
  activeCartBuff = null;
  bulkOrderChallenge = null;
  document.getElementById("cart-active-buff-bar").classList.add("hidden");
  document.getElementById("bulk-rush-banner").classList.add("hidden");
  document.getElementById("rain-visual-layer").classList.add("hidden");

  const endedDayNumber = state.day || 1;

  if (d) {
    state.loanDebt = Math.max(0, (state.loanDebt || 0) - d.bankInstallment);
    if (d.bankInstallment > 0 && state.loanDebt === 0) state.hasRepaidAllDebt = true;

    state.stockBatches = d.nextStockBatches;
    syncTotalStockFromBatches();

    state.cumulativeCosts.fixed = (state.cumulativeCosts.fixed || 0) + d.depCost + d.utilCost + d.rentCost;
    state.cumulativeCosts.wages = (state.cumulativeCosts.wages || 0) + d.staffWages;
    state.cumulativeCosts.tax = (state.cumulativeCosts.tax || 0) + d.progressiveTax;
    state.cumulativeCosts.spoiled = (state.cumulativeCosts.spoiled || 0) + d.spoiledTotalVal;

    const franDiv = Number(d.franchiseDividend || 0);
    if (franDiv > 0) {
      state.money += franDiv;
      state.cumulativeFranchiseRev = (state.cumulativeFranchiseRev || 0) + franDiv;
      recordExtraEventRevDetail(franDiv);
    }
    state.money = state.money - d.totalFixed;

    const td = ensureTodayDetail();
    const hiredStaffSnapshot = STAFF_CATALOG.filter(st => state.staff[st.id]).map(st => {
      const star = state.staffStars?.[st.id] || 1;
      const raisePct = state.staffWageRaisePct?.[st.id] || 0;
      let wage = Math.round((st.dailyWage + (star - 1) * 4000) * (1 + raisePct / 100));
      if ((st.id === "anhba" || st.id === "mylan") && state.romanceStageAnhBaMyLan === 3) {
        wage = Math.round(wage * 0.90);
      }
      return { id: st.id, name: st.name, star, wage };
    });

    const dayRecord = {
      day: endedDayNumber,
      dowName: getTodayScheduleInfo(endedDayNumber).dowName,
      sold: state.todaySold,
      revenue: state.todayRevenue || 0,
      cartRev: state.todayRevenue || 0,
      cogs: state.todayCogsSpent || 0,
      fixed: d.totalFixed || 0,
      appFee: state.todayAppFees || 0,
      spoiled: d.spoiledTotalVal || 0,
      startBalance: d.startBalance,
      otherCashDelta: d.otherCashDelta || 0,
      netProfit: d.netProfit,
      endBalance: state.money,
      detail: {
        dishes: JSON.parse(JSON.stringify(td.dishes || {})),
        traTac: { ...(td.traTac || { qty: 0, rev: 0 }) },
        tips: td.tips || 0,
        eventRev: td.eventRev || 0,
        purchases: JSON.parse(JSON.stringify(td.purchases || {})),
        packagingCost: td.packagingCost || 0,
        fixedBreakdown: {
          depAndUtil: (d.depCost || 0) + (d.utilCost || 0),
          streetClean: (!state.licenses.lic_sidewalk && !state.licenses.lic_heritage && state.level >= 5) ? 15000 : 0,
          rentCost: d.rentCost || 0,
          staffWages: d.staffWages || 0,
          staffList: hiredStaffSnapshot,
          tax: d.progressiveTax || 0
        },
        bankAndSpoil: {
          autoInstallment: d.bankInstallment || 0,
          manualPaid: td.manualDebtPaid || 0,
          loansTaken: td.loansTaken || 0,
          remainingDebt: state.loanDebt || 0,
          spoiledVal: d.spoiledTotalVal || 0,
          spoiledItems: d.spoiledSummaryItems || []
        }
      }
    };

    const existingDayIdx = state.ledgerHistory.findIndex(item => item.day === endedDayNumber);
    if (existingDayIdx !== -1) {
      state.ledgerHistory[existingDayIdx] = dayRecord;
    } else {
      state.ledgerHistory.unshift(dayRecord);
    }
    if (state.ledgerHistory.length > MAX_LEDGER_DAYS) {
      state.ledgerHistory.length = MAX_LEDGER_DAYS;
    }
  }

  document.getElementById("modal-end-day").classList.add("hidden");

  // Chuyển sang Ngày Mới
  state.day += 1;
  state.clockMinutes = 13 * 60;
  state.isStreetSelling = false;
  state.levelAtStartOfDay = state.level;
  state.dayStartMoney = Number(state.money || 0);
  state.todaySold = 0; state.todayCartBagsSpawned = 0; state.todayRevenue = 0; state.todayCogsSpent = 0; state.todayAppFees = 0;
  state.featuredSoldToday = 0; state.featuredRewardClaimed = false;
  state.dilemmaTriggeredToday = false;
  state.dailyBargainDone = false;
  state.dailyBargainDiscountPct = 0;
  state.selectedDailySauce = "";
  state.activeSalesStrategy = "";
  state.pendingGuaranteedRushEvent = false;
  state.todayDetail = null;
  ensureTodayDetail();

  // Cộng lãi Sổ Tiết Kiệm qua đêm & Thưởng Cúp Thị Phần Chủ Nhật vào đầu ngày mới
  if ((state.level || 1) >= 20 && (state.savingsBalance || 0) > 0) {
    const maxCap = (state.level || 1) * 15000;
    const interest = Math.min(maxCap, Math.round(state.savingsBalance * 0.015));
    state.savingsBalance += interest;
    showToast(`📗 Sổ Tiết Kiệm sinh lời qua đêm (+1,5%): +${formatVND(interest)}!`);
  }
  if (endedDayNumber % 7 === 0 && (state.marketSharePct || 28) >= 50) {
    const cupReward = 100000 + (state.level || 1) * 15000;
    state.money += cupReward;
    state.creditScore = Math.min(850, (state.creditScore || 520) + 20);
    recordExtraEventRevDetail(cupReward);
    showToast(`🏆 Đạt Top 1 Thị Phần Khu Phố tuần qua! Thưởng +${formatVND(cupReward)} & +20 Điểm Uy Tín!`);
  }

  state.customVoucher.usedToday = 0;
  if (!state.customVoucher.keepTomorrow) {
    state.customVoucher.active = false;
    state.customVoucher.discountPct = 0;
  }
  state.dailyCampaigns = {};
  state.todayLiveUsedCount = 0;
  state.closerBossSpawnedToday = false;

  if (state.activeMultiDayEffects) {
    if (state.activeMultiDayEffects.cheapDryDays > 0) state.activeMultiDayEffects.cheapDryDays--;
    if (state.activeMultiDayEffects.appPartnerDays > 0) state.activeMultiDayEffects.appPartnerDays--;
    if (state.activeMultiDayEffects.streetFestDays > 0) state.activeMultiDayEffects.streetFestDays--;
    if (state.activeMultiDayEffects.freshSurgeDays > 0) state.activeMultiDayEffects.freshSurgeDays--;
  }

  const unlockedPool = state.unlockedDishes.length > 0 ? state.unlockedDishes : ["tron"];
  state.featuredDishKey = unlockedPool[Math.floor(Math.random() * unlockedPool.length)];

  // Kiểm tra Biến cố Nhân sự buổi sáng TRƯỚC khi Mỹ Lan tự động sơ chế
  maybeGenerateMorningStaffEvent();

  if (isStaffWorkingToday("mylan")) {
    state.prepDone = { sate: true, hanhphi: true, trungcut: true };
    state.totalPrepDays = (state.totalPrepDays || 0) + 1;
    const mylanStar = state.staffStars?.mylan || 1;
    const bonusFreshQty = mylanStar * 2;
    addStockBatch("xoai", Math.ceil(bonusFreshQty / 2));
    addStockBatch("trungcut", Math.floor(bonusFreshQty / 2));
  } else {
    state.prepDone = { sate: false, hanhphi: false, trungcut: false };
  }

  switchPrepSubTab("kho");

  if (state.isBankrupt || state.money < 0 || (state.money < 15000 && (state.stock.banhtrang || 0) < 1)) {
    pendingLevelUpQueue = [];
    currentMorningStaffEvent = null;
    updateAllUI();
    saveGameEverywhere(false);
    if (state.isBankrupt) declareTrueBankruptcy(true);
    else checkBankruptcyOrRescueLoan();
    return;
  }

  if (pendingLevelUpQueue.length > 0) {
    const highestNewLvl = Math.max(...pendingLevelUpQueue);
    pendingLevelUpQueue = [];
    showLevelUpModal(highestNewLvl);
    updateAllUI();
    saveGameEverywhere(false);
    return;
  }

  updateAllUI();
  saveGameEverywhere(false);
  const sched = getTodayScheduleInfo(state.day);
  const cap = getActualCartBagDemandCap(state.day);
  showToast(`☀️ Ngày ${state.day} (${sched.dowName})! Sức mua dự kiến: ~${cap} bịch!`);

  if (currentMorningStaffEvent) {
    setTimeout(() => openMorningStaffDramaModal(), 450);
  }
}

