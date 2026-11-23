/**
 * Quản Lý State, Lô Hàng FIFO, Bảo Mật Anti-Cheat & Công Thức Kinh Tế Thống Nhất
 */
    // ================= 6. HỆ THỐNG BIẾN TRẠNG THÁI V13 (THAU TRỐNG CHỦ ĐỘNG, CHẤM SAO GẮT GAO) =================
    const INITIAL_STARTER_STOCK = {
      banhtrang: 8, xoai: 8, muoitom: 8, sotbo: 0, dauphong: 8, khobo: 8, tepmo: 0, trungcut: 8, tratac: 5
    };

    function createInitialBatches() {
      const batches = {};
      INGREDIENTS.forEach(ing => {
        const initQty = INITIAL_STARTER_STOCK[ing.id] || 0;
        batches[ing.id] = initQty > 0 ? [{ qty: initQty, daysLeft: ing.shelfLife }] : [];
      });
      return batches;
    }

    function getInitialDefaultState() {
      return {
        shopKey: "", recoveryCode: "", shopName: "", pin: "", avatar: "av_ditu",
        offlineMode: true,
        seenIntroTutorial: false,
        v13MarketingReset: true,
        money: 350000,
        dayStartMoney: 350000,
        rating: 4.3,
        viralPct: 15,
        level: 1, levelAtStartOfDay: 1,
        xp: 0, day: 1,
        clockMinutes: 13 * 60,
        isStreetSelling: false,
        featuredDishKey: "tron",
        featuredSoldToday: 0,
        featuredRewardClaimed: false,
        appPriceMarkup: false,
        totalSold: 0, todaySold: 0, todayCartBagsSpawned: 0, todayRevenue: 0, todayCogsSpent: 0, todayAppFees: 0,
        stock: { ...INITIAL_STARTER_STOCK },
        stockBatches: createInitialBatches(),
        prepDone: { sate: false, hanhphi: false, trungcut: false },
        unlockedDishes: ["tron"],
        priceOffsets: { tron: 0, chamme: 0, cuon: 0, phoisuong: 0, bo: 0, nuong: 0, xoainon: 0, lacphomai: 0, mamruoc: 0, metditu: 0 },
        dishSalesRevenue: { tron: 0, chamme: 0, cuon: 0, phoisuong: 0, bo: 0, nuong: 0, xoainon: 0, lacphomai: 0, mamruoc: 0, metditu: 0 },
        cumulativeCosts: { cogs: 0, fixed: 0, wages: 0, tax: 0, spoiled: 0, appFee: 0 },
        staff: { beti: false, mylan: false, tunghia: false, anhba: false, baoloc: false, kimngan: false, utnhanh: false },
        staffStars: { beti: 1, mylan: 1, tunghia: 1, anhba: 1, baoloc: 1, kimngan: 1, utnhanh: 1 },
        equipLevels: {
          upg_maps: 0, upg_signbox: 0, upg_appads: 0, upg_tiktoker: 0, upg_comboboard: 0,
          upg_stool: 0, upg_neon: 0, upg_awning: 0, upg_cooler: 0, upg_icedtea: 0
        },
        licenses: {
          lic_vsattp: false, lic_sidewalk: false, lic_nightmarket: false, lic_brand: false,
          lic_app_diamond: false, lic_vietgap: false, lic_michelin: false, lic_franchise: false, lic_export: false, lic_heritage: false
        },
        shopScale: 0,
        workshops: { ws_tayninh: 0, ws_tiengiang: 0, ws_khobo: 0 },
        franchises: { fr_benthanh: 0, fr_buivien: 0, fr_thuthiem: 0, fr_landmark: 0, fr_airport: 0 },
        cumulativeFranchiseRev: 0,
        activeSalesStrategy: "",
        pendingGuaranteedRushEvent: false,
        ownedDecors: [],
        equippedDecors: { lights: "", sign: "", prop: "", table: "", particles: "", awning: "" },
        usedDilemmaIds: [],
        dilemmaTriggeredToday: false,
        activeMultiDayEffects: {
          cheapDryDays: 0,
          appPartnerDays: 0,
          streetFestDays: 0,
          freshSurgeDays: 0
        },
        reviews: [], nextCustomerTipBonus: 0,
        claimedChapters: [], ledgerHistory: [],
        cartDurability: 100,
        loanDebt: 0, rescueLoanCount: 0, hasRepaidAllDebt: false,
        maxStreak5Star: 0, totalPrepDays: 0, servedPickyCount: 0, repliedReviewsCount: 0, resolvedDilemmasCount: 0,
        claimedAchievements: [],
        redeemedGiftcodes: [],
        dailyBargainDone: false,
        dailyBargainDiscountPct: 0,
        selectedDailySauce: "bo_toi",
        customerLoyaltyCounts: {},
        claimedLoyaltyRewards: [],
        todayDetail: null,
        claimedBroadcasts: [],
        claimedMailIds: [],
        adminGrantedMoney: 0,
        adminOverrideAt: 0,
        lastAppliedAdminOverrideAt: 0,
        isBanned: false,
        isBankrupt: false,
        bankruptcyAt: 0,
        bankruptcyResetAt: 0,
        bankruptcyCount: 0,
        bankruptRecoveryCode: "",
        securitySeal: "",
        updatedAt: 0
      };
    }

    let state = getInitialDefaultState();

    let customerSlots = [null, null, null, null];
    let selectedSlotIndex = 0;
    let slotPatienceTimer = null, slotSpawnerTimer = null, clockTimer = null;
    let activeCartBuff = null;
    let rainTarpCovered = false;
    let bulkOrderChallenge = null;
    let pendingLevelUpQueue = [];

    let currentPrepSubTab = "kho", currentUpgradeSubTab = "marketing", loginSelectedAvatar = "av_ditu";
    let cloudLeaderboardCache = [];
    // Đầu mỗi mẻ bánh, thau hoàn toàn trống (selectedDish = null, toàn bộ topping = false/0)
    let bowl = { selectedDish: null, rau: false, hanh: false, spice: 0, tratac: false, step1Done: false, step2Done: false, mixProgress: 0, step3Done: false, lockedBagQty: null, lateToppingsAdded: false };
    let activePrepKey = null, activePrepProgress = 0, pendingOosMissingList = [], oosMinigameProgress = 0, pendingOosBoughtQty = 0;
    let currentComboStreak = 0;

    function getActiveCustomer() { return customerSlots[selectedSlotIndex] || null; }
    function formatShortK(num) {
      const n = Number(num || 0);
      if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(2).replace(".", ",") + "Tr";
      if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
      return n.toLocaleString("vi-VN") + "đ";
    }
    function formatVND(num) { return Number(num || 0).toLocaleString("vi-VN") + "đ"; }

    function isAnyBlockingModalOpen() {
      const modalIds = [
        "modal-out-of-stock", "modal-dilemma", "modal-prep",
        "modal-reviews", "modal-end-day", "modal-bankruptcy", "modal-level-up", "modal-ditu-tutorial", "modal-quick-menu", "modal-pwa-install", "modal-story", "modal-giftcode", "modal-bargain", "modal-codex", "modal-firebase-config", "modal-rival-profile", "modal-nd147-legal", "modal-staff-drama-v15"
      ];
      return modalIds.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains("hidden");
      });
    }

    // ================= 7. CÔNG THỨC HÚT KHÁCH CHẶT CHẼ (6 ➔ 30 BỊCH/NGÀY THEO NÂNG CẤP) =================
    function getActiveSalesStrategyObj() {
      if (!state.activeSalesStrategy) return null;
      return SALES_STRATEGIES.find(x => x.id === state.activeSalesStrategy) || null;
    }

    function getCurrentShopScaleObj(s = state) {
      const idx = Math.min(SHOP_SCALE_TIERS.length - 1, Math.max(0, Number(s?.shopScale || 0)));
      return SHOP_SCALE_TIERS[idx] || SHOP_SCALE_TIERS[0];
    }

    function getExpectedShopScaleForLevel(lvl = state.level) {
      if (lvl >= 75) return 6;
      if (lvl >= 64) return 5;
      if (lvl >= 52) return 4;
      if (lvl >= 40) return 3;
      if (lvl >= 25) return 2;
      if (lvl >= 15) return 1;
      return 0;
    }

    // Định giá Đế Chế trên BXH = Tiền mặt + 100% Tài sản Nâng cấp/Nhân sự/Giấy phép/Trang trí + 115% Vốn Quy mô/Xưởng/Chi nhánh
    function computeShopNetWorth(s = state) {
      if (!s) return 0;
      let cash = Math.max(0, Number(s.money || 0));
      let baseAssets = 0;
      let empireAssets = 0;

      // 1. Nâng cấp Hút khách & Giữ chân
      const eqLvls = s.equipLevels || {};
      EQUIP_UPGRADES.forEach(eq => {
        const l = Math.min(5, Math.max(0, Number(eqLvls[eq.id] || 0)));
        for (let i = 0; i < l; i++) {
          baseAssets += Math.round((eq.baseCost * Math.pow(1.55, i)) / 1000) * 1000;
        }
      });

      // 2. Nhân sự & Đào tạo sao
      const stMap = s.staff || {};
      const stStars = s.staffStars || {};
      STAFF_CATALOG.forEach(st => {
        if (stMap[st.id]) {
          baseAssets += st.hireCost;
          const star = Math.min(5, Math.max(1, Number(stStars[st.id] || 1)));
          for (let k = 1; k < star; k++) {
            baseAssets += Math.round((st.hireCost * (0.65 + k * 0.35)) / 5000) * 5000;
          }
        }
      });

      // 3. Giấy phép & Công thức món
      const licMap = s.licenses || {};
      LICENSES_CATALOG.forEach(lic => {
        if (licMap[lic.id]) baseAssets += lic.cost;
      });
      const unlDishes = Array.isArray(s.unlockedDishes) ? s.unlockedDishes : [];
      unlDishes.forEach(dId => {
        if (DISH_MENU[dId]?.unlockCost) baseAssets += DISH_MENU[dId].unlockCost;
      });

      // 4. Trang trí (Giữ 100% giá trị vào Tổng Tài Sản để người chơi mua Trang trí không bị tụt hạng BXH!)
      const decList = Array.isArray(s.ownedDecors) ? s.ownedDecors : [];
      decList.forEach(decId => {
        const dObj = DECOR_CATALOG.find(x => x.id === decId);
        if (dObj) baseAssets += dObj.cost;
      });

      // 5. Đầu tư Quy mô, Xưởng & Chi nhánh (Được nhân hệ số Thặng dư Thương hiệu x1.15 trên BXH!)
      const scLvl = Math.min(6, Math.max(0, Number(s.shopScale || 0)));
      for (let t = 1; t <= scLvl; t++) {
        empireAssets += (SHOP_SCALE_TIERS[t]?.cost || 0);
      }
      const wsMap = s.workshops || {};
      SUPPLY_WORKSHOPS.forEach(ws => {
        const wl = Math.min(3, Math.max(0, Number(wsMap[ws.id] || 0)));
        for (let i = 0; i < wl; i++) empireAssets += (ws.costs[i] || 0);
      });
      const frMap = s.franchises || {};
      FRANCHISE_BRANCHES.forEach(fr => {
        const fl = Math.min(5, Math.max(0, Number(frMap[fr.id] || 0)));
        for (let i = 0; i < fl; i++) empireAssets += (fr.costs[i] || 0);
      });

      return Math.round(cash + baseAssets + (empireAssets * 1.15));
    }

    function getPriceToleranceBonus() {
      const tiktokLvl = state.equipLevels?.upg_tiktoker || 0;
      const coolerLvl = state.equipLevels?.upg_cooler || 0;
      const chapObj = getCurrentChapterObj();
      const chapBonus = chapObj ? (chapObj.priceTolBonus || 0) : 0;
      const brandBonus = state.licenses?.lic_brand ? 1500 : 0;
      const michelinBonus = state.licenses?.lic_michelin ? 1500 : 0;
      const heritageBonus = state.licenses?.lic_heritage ? 2000 : 0;
      const scaleBonus = getCurrentShopScaleObj().priceTol || 0;
      const stratBonus = getActiveSalesStrategyObj()?.priceTol || 0;
      const icedTeaLvl = state.equipLevels?.upg_icedtea || 0;
      const festBonus = (state.activeMultiDayEffects?.streetFestDays || 0) > 0 ? 1500 : 0;
      const r = typeof state.rating === "number" ? state.rating : 4.3;
      const ratingTolBonus = r >= 4.8 ? 1000 : (r >= 4.4 ? 500 : (r < 3.6 ? -1000 : 0));
      const rawTol = (tiktokLvl * 800) + (coolerLvl * 250) + (icedTeaLvl * 250) + chapBonus + brandBonus + michelinBonus + heritageBonus + scaleBonus + stratBonus + festBonus + ratingTolBonus;
      return Math.min(12000, Math.max(0, rawTol));
    }

    // Số chỗ khách đứng đợi cùng lúc hoàn toàn phụ thuộc vào nâng cấp 🪧 Bảng Hiệu Đầu Hẻm (từ 1 chỗ lên 4 chỗ)
    function getMaxActiveCustomerSlots() {
      const signLvl = state.equipLevels?.upg_signbox || 0;
      if (signLvl >= 5) return 4;
      if (signLvl >= 3) return 3;
      if (signLvl >= 1) return 2;
      return 1;
    }

    // Lượng khách tăng thêm mỗi ngày hoàn toàn phụ thuộc vào 4 nâng cấp nhánh 📣 Hút Khách (+1..+2 bịch/cấp)
    function getMarketingDailyBagBonus() {
      const mapsLvl = state.equipLevels?.upg_maps || 0;
      const signLvl = state.equipLevels?.upg_signbox || 0;
      const appLvl = state.equipLevels?.upg_appads || 0;
      const tiktokLvl = state.equipLevels?.upg_tiktoker || 0;
      const comboLvl = state.equipLevels?.upg_comboboard || 0;
      const mapsBags = mapsLvl * 1;
      const signBags = signLvl * 1 + (signLvl >= 5 ? 1 : 0);
      const appBags = appLvl * 1;
      const tiktokBags = tiktokLvl * 2;
      const comboBags = comboLvl * 1 + (comboLvl >= 5 ? 1 : 0);
      const baolocBags = state.staff?.baoloc ? (1 + (state.staffStars?.baoloc || 1)) : 0;
      return mapsBags + signBags + appBags + tiktokBags + comboBags + baolocBags;
    }

    function getTodayScheduleInfo(dayNum = state.day) {
      const mktBags = getMarketingDailyBagBonus();
      const stratBags = getActiveSalesStrategyObj()?.bagBonus || 0;
      const licBags = (state.licenses?.lic_nightmarket ? 3 : 0) + (state.licenses?.lic_export ? 2 : 0) + stratBags;

      if (SPECIAL_HOLIDAYS[dayNum]) {
        const dowObj = WEEKLY_SCHEDULE[(dayNum - 1) % 7];
        const totalEst = SPECIAL_HOLIDAYS[dayNum].estBags + mktBags + licBags;
        return { ...SPECIAL_HOLIDAYS[dayNum], estBags: totalEst, dowName: dowObj.name, isHoliday: true };
      }
      const base = WEEKLY_SCHEDULE[(dayNum - 1) % 7];
      const dynamicBags = base.estBags + mktBags + licBags;
      return {
        ...base,
        dowName: base.name,
        estBags: dynamicBags,
        isHoliday: false
      };
    }

    function getActualCartBagDemandCap(dayNum = state.day) {
      const sched = getTodayScheduleInfo(dayNum);
      const priceImp = getPricingCustomerImpact();
      const r = typeof state.rating === "number" ? state.rating : 4.3;
      const ratingFactor = r >= 4.8 ? 1.15 : (r >= 4.4 ? 1.08 : (r >= 4.0 ? 1.0 : (r >= 3.5 ? 0.85 : 0.65)));
      const weatherFactors = [0.95, 0.98, 1.0, 0.96, 1.0, 1.04, 0.98];
      const wFactor = sched.isHoliday ? 1.05 : weatherFactors[(dayNum - 1) % weatherFactors.length];
      const liveCustMult = (window.serverLiveConfig && window.serverLiveConfig.enabled) ? Math.max(0.5, Math.min(3.0, Number(window.serverLiveConfig.customerMult || 1.0))) : 1.0;
      return Math.max(4, Math.round(sched.estBags * wFactor * priceImp.demandCapMult * ratingFactor * liveCustMult));
    }

    // ================= 8. HỆ THỐNG LÔ HẠN SỬ DỤNG FIFO & TỦ KÍNH GIỮ TƯƠI =================
    // ================= 8. HỆ THỐNG LÔ HẠN SỬ DỤNG FIFO & TỦ KÍNH GIỮ TƯƠI =================
    function getEffectiveShelfLife(ing) {
      const coolerLvl = state.equipLevels?.upg_cooler || 0;
      let bonusDays = 0;
      if (ing.type === "fresh" || ing.type === "sauce") {
        if (coolerLvl >= 4) bonusDays = 3;
        else if (coolerLvl >= 2) bonusDays = 2;
        else if (coolerLvl >= 1) bonusDays = 1;
        if (state.licenses?.lic_vietgap) bonusDays += 1;
        if (Number(state.workshops?.ws_tiengiang || 0) >= 3) bonusDays += 1;
      }
      return ing.shelfLife + bonusDays;
    }

    function ensureValidStockBatches() {
      if (!state.stockBatches || typeof state.stockBatches !== "object") {
        state.stockBatches = {};
      }
      INGREDIENTS.forEach(ing => {
        const currentTotal = Math.max(0, Number(state.stock[ing.id] || 0));
        if (!Array.isArray(state.stockBatches[ing.id])) {
          state.stockBatches[ing.id] = currentTotal > 0 ? [{ qty: currentTotal, daysLeft: getEffectiveShelfLife(ing) }] : [];
        } else {
          const sumBatch = state.stockBatches[ing.id].reduce((acc, b) => acc + (b.qty || 0), 0);
          if (sumBatch !== currentTotal) {
            if (currentTotal > sumBatch) {
              state.stockBatches[ing.id].push({ qty: currentTotal - sumBatch, daysLeft: getEffectiveShelfLife(ing) });
            } else {
              let diff = sumBatch - currentTotal;
              for (let b of state.stockBatches[ing.id]) {
                const take = Math.min(b.qty, diff);
                b.qty -= take;
                diff -= take;
                if (diff <= 0) break;
              }
              state.stockBatches[ing.id] = state.stockBatches[ing.id].filter(b => b.qty > 0);
            }
          }
        }
      });
      syncTotalStockFromBatches();
    }

    function syncTotalStockFromBatches() {
      INGREDIENTS.forEach(ing => {
        const list = state.stockBatches[ing.id] || [];
        state.stock[ing.id] = list.reduce((sum, b) => sum + Math.max(0, b.qty || 0), 0);
      });
    }

    function addStockBatch(ingId, qty) {
      if (qty <= 0) return;
      ensureValidStockBatches();
      const ing = INGREDIENTS.find(x => x.id === ingId);
      const maxLife = ing ? getEffectiveShelfLife(ing) : 2;
      const list = state.stockBatches[ingId] || [];
      const existingSameLife = list.find(b => b.daysLeft === maxLife);
      if (existingSameLife) existingSameLife.qty += qty;
      else list.push({ qty, daysLeft: maxLife });
      list.sort((a, b) => a.daysLeft - b.daysLeft);
      state.stockBatches[ingId] = list;
      syncTotalStockFromBatches();
    }

    function consumeStockFIFO(ingId, qtyNeeded) {
      if (qtyNeeded <= 0) return;
      ensureValidStockBatches();
      const list = state.stockBatches[ingId] || [];
      list.sort((a, b) => a.daysLeft - b.daysLeft);
      let rem = qtyNeeded;
      for (let b of list) {
        if (rem <= 0) break;
        const take = Math.min(b.qty, rem);
        b.qty -= take;
        rem -= take;
      }
      state.stockBatches[ingId] = list.filter(b => b.qty > 0);
      syncTotalStockFromBatches();
    }

    function getExpiringTodayInfo(ingId) {
      ensureValidStockBatches();
      const list = state.stockBatches[ingId] || [];
      const expTodayQty = list.filter(b => b.daysLeft <= 1).reduce((s, b) => s + b.qty, 0);
      const minDays = list.length > 0 ? Math.min(...list.map(b => b.daysLeft)) : null;
      return { expTodayQty, minDays };
    }


    // ================= 9. BẢO MẬT, ĐĂNG NHẬP & CLOUD FIREBASE =================
    function computeSecuritySeal(s) {
      const sc = Math.min(6, Math.max(0, Number(s.shopScale || 0)));
      const wsSum = Object.values(s.workshops || {}).reduce((a, b) => a + Number(b || 0), 0);
      const frSum = Object.values(s.franchises || {}).reduce((a, b) => a + Number(b || 0), 0);
      const decCnt = Array.isArray(s.ownedDecors) ? s.ownedDecors.length : 0;
      const admGrant = Math.round(Number(s.adminGrantedMoney || 0));
      const raw = `${s.shopKey || "init"}|${Math.round(s.money || 0)}|${s.totalSold || 0}|${s.level || 1}|${s.day || 1}|${sc}|${wsSum}|${frSum}|${decCnt}|${admGrant}|DITU_V6_SECRET_2026`;
      let hash = 2166136261;
      for (let i = 0; i < raw.length; i++) {
        hash ^= raw.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return "SEAL_" + (hash >>> 0).toString(36);
    }

    function isStateLegitimate(s) {
      if (!s || typeof s !== "object") return false;
      if (s.isBanned) return false;
      const lvl = Number(s.level || 1);
      if (lvl < 1 || lvl > MAX_PLAYER_LEVEL) return false;
      if (Number(s.rating) < 1 || Number(s.rating) > 5) return false;
      const hasAdminOvr = Number(s.adminOverrideAt || 0) > 0;
      const sc = Math.min(6, Math.max(0, Number(s.shopScale || 0)));
      if (!hasAdminOvr && sc > 0 && lvl < (SHOP_SCALE_TIERS[sc]?.reqLevel || 1)) return false;
      const sold = Math.max(0, Number(s.totalSold || 0));
      const achBonus = Array.isArray(s.claimedAchievements) ? s.claimedAchievements.length * 250000 : 0;
      const storyBonus = Array.isArray(s.claimedChapters) ? s.claimedChapters.length * 600000 : 0;
      const loanAllowance = 2000000;
      const dayAllowance = Math.max(1, Number(s.day || 1)) * 1500000;
      const levelAllowance = lvl * 1000000;
      const rawAdminGrant = Math.max(0, Number(s.adminGrantedMoney || 0));
      const adminAllowance = (hasAdminOvr || (Array.isArray(s.redeemedGiftcodes) && s.redeemedGiftcodes.length > 0) || (Array.isArray(s.claimedMailIds) && s.claimedMailIds.length > 0) || (Array.isArray(s.claimedBroadcasts) && s.claimedBroadcasts.length > 0))
        ? rawAdminGrant
        : Math.min(5000000, rawAdminGrant);
      const franBonus = Math.max(0, Number(s.cumulativeFranchiseRev || 0)) + (Object.values(s.franchises || {}).reduce((a, b) => a + Number(b || 0), 0) * 2500000);
      const maxAllowedMoney = 10000000 + loanAllowance + achBonus + storyBonus + dayAllowance + levelAllowance + (sold * 350000) + franBonus + adminAllowance;
      if (Number(s.money) > maxAllowedMoney || Number(s.money) < -2000000) return false;
      return true;
    }

    function sanitizeShopKey(name) {
      return String(name || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    }
    async function fetchWithTimeout(url, options = {}, timeoutMs = 2600) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try { const res = await fetch(url, { ...options, signal: controller.signal }); clearTimeout(timer); return res; }
      catch (e) { clearTimeout(timer); throw e; }
    }
    function adjustRating(delta) {
      const current = typeof state.rating === "number" ? state.rating : 5.0;
      state.rating = Math.max(1.0, Math.min(5.0, Math.round((current + delta) * 100) / 100));
      state.reputation = Math.round(state.rating * 20);
    }
    function launchViralStormNow() {
      state.viralPct = 20;
      activateCartBuff("tiktok_storm", "🔥 Bão Đơn Tóp Tóp (Kín 4 ô • Tip x1.5)", 45);
      for (let i = 0; i < 4; i++) {
        if (!customerSlots[i]) spawnCustomerIntoEmptySlot(true);
      }
      showToast("🔥 NỔ BÃO ĐƠN TÓP TÓP 45 GIÂY! Kín 4 ô khách & Tip x1.5!");
    }

    function adjustViral(delta) {
      state.viralPct = Math.max(0, Math.min(100, Math.round((state.viralPct || 0) + delta)));
      if (state.viralPct >= 80 && state.isStreetSelling && (!activeCartBuff || activeCartBuff.id !== "tiktok_storm")) {
        launchViralStormNow();
      }
    }

    function getRatingTierInfo(r) {
      if (r >= 4.8) return {
        text: "Đỉnh Nóc", full: "Quán Đỉnh Nóc Kịch Trần", color: "bg-emerald-600 text-white",
        impactDesc: "🌟 Hiệu ứng Sao: Khách tối đa +15% • Khách VIP +20% • Chịu giá +1.000đ • Phí App -2%"
      };
      if (r >= 4.2) return {
        text: "Đông Khách", full: "Quán Ngon Đông Khách", color: "bg-amber-500 text-white",
        impactDesc: "🟢 Hiệu ứng Sao: Lượng khách +8% • Khách VIP +8% • Chịu giá +500đ/bịch"
      };
      if (r >= 3.5) return {
        text: "Tạm Ổn", full: "Cần Cải Thiện Tay Nghề", color: "bg-orange-600 text-white",
        impactDesc: "🟠 Hiệu ứng Sao: Lượng khách giảm -15% • Cần phục vụ 5⭐ hoặc phản hồi Tóp Tóp để gỡ Sao"
      };
      return {
        text: "Báo Động", full: "Nguy Cơ Tẩy Chay!", color: "bg-red-600 text-white",
        impactDesc: "🔴 Báo động: Lượng khách giảm -35% • Khách VIP tạm ngưng ghé • Chịu giá -1.000đ"
      };
    }


    function mergeLoadedState(loaded) {
      if (!loaded) return;
      const def = getInitialDefaultState();

      const rawEq = loaded.equipLevels || {};
      const clamp5 = (val) => Math.min(5, Math.max(0, Number(val || 0)));
      const hasV13Reset = Boolean(loaded.v13MarketingReset);

      // Nếu bản lưu cũ từ thời nâng cấp Kéo/Bình xịt tự ánh xạ sang Hút Khách làm lượng khách bị vọt lên 46 bịch,
      // đặt lại 4 nhánh Hút Khách về 0 (và hoàn 120k tiền mặt) để người chơi chủ động nâng cấp từ 1 ô khách!
      const migratedEquip = hasV13Reset ? {
        upg_maps: clamp5(rawEq.upg_maps),
        upg_signbox: clamp5(rawEq.upg_signbox),
        upg_appads: clamp5(rawEq.upg_appads),
        upg_tiktoker: clamp5(rawEq.upg_tiktoker),
        upg_comboboard: clamp5(rawEq.upg_comboboard),
        upg_stool: clamp5(rawEq.upg_stool),
        upg_neon: clamp5(rawEq.upg_neon),
        upg_awning: clamp5(rawEq.upg_awning),
        upg_cooler: clamp5(rawEq.upg_cooler),
        upg_icedtea: clamp5(rawEq.upg_icedtea)
      } : {
        upg_maps: 0,
        upg_signbox: 0,
        upg_appads: 0,
        upg_tiktoker: 0,
        upg_comboboard: 0,
        upg_stool: clamp5(rawEq.upg_stool || rawEq.decor_stool || 0),
        upg_neon: clamp5(rawEq.upg_neon || rawEq.decor_speaker || 0),
        upg_awning: clamp5(rawEq.upg_awning || rawEq.decor_lantern || 0),
        upg_cooler: clamp5(rawEq.upg_cooler || rawEq.tool_cooler || 0),
        upg_icedtea: 0
      };

      const oldMktSum = (rawEq.upg_maps || 0) + (rawEq.upg_signbox || 0) + (rawEq.upg_appads || 0) + (rawEq.upg_tiktoker || 0);
      const refundBonus = (!hasV13Reset && oldMktSum > 0) ? 120000 : 0;

      state = {
        ...def, ...loaded,
        v13MarketingReset: true,
        money: Number(loaded.money || 350000) + refundBonus,
        level: Math.min(MAX_PLAYER_LEVEL, Math.max(1, Number(loaded.level || 1))),
        levelAtStartOfDay: loaded.levelAtStartOfDay || loaded.level || 1,
        priceOffsets: { ...def.priceOffsets, ...(loaded.priceOffsets || {}) },
        rating: !hasV13Reset && Number(loaded.rating || 5.0) >= 4.95 ? 4.6 : (typeof loaded.rating === "number" ? loaded.rating : 4.3),
        cartDurability: typeof loaded.cartDurability === "number" ? loaded.cartDurability : 100,
        viralPct: typeof loaded.viralPct === "number" ? loaded.viralPct : 15,
        stock: { ...def.stock, ...(loaded.stock || {}) },
        stockBatches: loaded.stockBatches || null,
        prepDone: { ...def.prepDone, ...(loaded.prepDone || {}) },
        unlockedDishes: Array.isArray(loaded.unlockedDishes) && loaded.unlockedDishes.length > 0 ? loaded.unlockedDishes : ["tron"],
        dishSalesRevenue: { ...def.dishSalesRevenue, ...(loaded.dishSalesRevenue || {}) },
        cumulativeCosts: { ...def.cumulativeCosts, ...(loaded.cumulativeCosts || {}) },
        staff: { ...def.staff, ...(loaded.staff || {}) },
        staffStars: { ...def.staffStars, ...(loaded.staffStars || {}) },
        equipLevels: migratedEquip,
        licenses: { ...def.licenses, ...(loaded.licenses || {}) },
        shopScale: Math.min(6, Math.max(0, Number(loaded.shopScale || 0))),
        workshops: { ...def.workshops, ...(loaded.workshops || {}) },
        franchises: { ...def.franchises, ...(loaded.franchises || {}) },
        cumulativeFranchiseRev: Math.max(0, Number(loaded.cumulativeFranchiseRev || 0)),
        activeSalesStrategy: String(loaded.activeSalesStrategy || ""),
        pendingGuaranteedRushEvent: Boolean(loaded.pendingGuaranteedRushEvent),
        ownedDecors: Array.isArray(loaded.ownedDecors) ? loaded.ownedDecors : [],
        equippedDecors: { ...def.equippedDecors, ...(loaded.equippedDecors || {}) },
        activeMultiDayEffects: { ...def.activeMultiDayEffects, ...(loaded.activeMultiDayEffects || {}) },
        usedDilemmaIds: Array.isArray(loaded.usedDilemmaIds) ? loaded.usedDilemmaIds : [],
        reviews: normalizeAndRepairReviews(Array.isArray(loaded.reviews) ? loaded.reviews : []),
        claimedChapters: Array.isArray(loaded.claimedChapters) ? loaded.claimedChapters : [],
        ledgerHistory: Array.isArray(loaded.ledgerHistory) ? loaded.ledgerHistory : [],
        claimedAchievements: Array.isArray(loaded.claimedAchievements) ? loaded.claimedAchievements : [],
        redeemedGiftcodes: Array.isArray(loaded.redeemedGiftcodes) ? loaded.redeemedGiftcodes : [],
        dailyBargainDone: Boolean(loaded.dailyBargainDone),
        dailyBargainDiscountPct: Number(loaded.dailyBargainDiscountPct || 0),
        dayStartMoney: Number.isFinite(Number(loaded.dayStartMoney)) ? Number(loaded.dayStartMoney) : (Number(loaded.money ?? 350000) - (Number(loaded.todayRevenue || 0) - Number(loaded.todayCogsSpent || 0))),
        selectedDailySauce: loaded.selectedDailySauce !== undefined ? loaded.selectedDailySauce : "bo_toi",
        customerLoyaltyCounts: (loaded.customerLoyaltyCounts && typeof loaded.customerLoyaltyCounts === "object") ? loaded.customerLoyaltyCounts : {},
        claimedLoyaltyRewards: Array.isArray(loaded.claimedLoyaltyRewards) ? loaded.claimedLoyaltyRewards : [],
        todayDetail: (loaded.todayDetail && typeof loaded.todayDetail === "object") ? loaded.todayDetail : null,
        claimedBroadcasts: Array.isArray(loaded.claimedBroadcasts) ? loaded.claimedBroadcasts : [],
        claimedMailIds: Array.isArray(loaded.claimedMailIds) ? loaded.claimedMailIds : [],
        adminGrantedMoney: Math.max(0, Number(loaded.adminGrantedMoney || 0)),
        adminOverrideAt: Number(loaded.adminOverrideAt || 0),
        lastAppliedAdminOverrideAt: Number(loaded.lastAppliedAdminOverrideAt || loaded.adminOverrideAt || 0),
        isBanned: Boolean(loaded.isBanned),
        isBankrupt: Boolean(loaded.isBankrupt),
        bankruptcyAt: Number(loaded.bankruptcyAt || 0),
        bankruptcyResetAt: Number(loaded.bankruptcyResetAt || 0),
        bankruptcyCount: Number(loaded.bankruptcyCount || 0),
        bankruptRecoveryCode: String(loaded.bankruptRecoveryCode || "")
      };

      delete state.empire;
      delete state.dishStars;
      delete state.reputation;
      delete state.appCommissionRate;

      if (loaded.securitySeal && loaded.securitySeal !== computeSecuritySeal(loaded) && !loaded.adminOverrideAt) {
        state.adminGrantedMoney = Math.min(1000000, Math.max(0, Number(state.adminGrantedMoney || 0)));
        state.money = Math.min(state.money, 450000 + (Number(state.totalSold || 0) * 45000) + state.adminGrantedMoney);
        if (state.shopScale > 0 && state.level < (SHOP_SCALE_TIERS[state.shopScale]?.reqLevel || 1)) {
          state.shopScale = 0;
        }
      }

      if (state.staff.mylan) state.prepDone = { sate: true, hanhphi: true, trungcut: true };
      ensureValidStockBatches();

      if (Array.isArray(state.ledgerHistory)) {
        const seenDays = new Set();
        state.ledgerHistory = state.ledgerHistory.filter(item => {
          if (!item || seenDays.has(item.day)) return false;
          seenDays.add(item.day);
          return true;
        }).slice(0, MAX_LEDGER_DAYS);
      }
    }
    function saveToLocalOnly() {
      try {
        if (!isStateLegitimate(state) && !state.isBanned) {
          const adminAllowance = Math.max(0, Number(state.adminGrantedMoney || 0));
          const franBonus = Math.max(0, Number(state.cumulativeFranchiseRev || 0));
          const maxCap = 10000000 + (Number(state.totalSold || 0) * 350000) + (Number(state.day || 1) * 1500000) + (Number(state.level || 1) * 1000000) + franBonus + adminAllowance;
          state.money = Math.min(state.money, maxCap);
          state.level = Math.min(MAX_PLAYER_LEVEL, Math.max(1, state.level));
        }
        ensureRecoveryCode();
        if (state.stockBatches && typeof state.stockBatches === "object") {
          syncTotalStockFromBatches();
        }
        state.shopKey = state.shopKey || sanitizeShopKey(state.shopName || "");
        const meta = typeof getMaxKnownSaveMeta === "function" ? getMaxKnownSaveMeta(state.shopKey) : { maxSeq: 0, maxTs: 0 };
        state.saveSeq = Math.max(Number(state.saveSeq || 0), meta.maxSeq) + 1;
        state.offlineMode = true;
        state.saveMode = "local";
        state.updatedAt = Math.max(Date.now(), meta.maxTs + 1);
        state.securitySeal = computeSecuritySeal(state);
        const persistObj = { ...state, localCustomAvatar: null };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistObj));
        saveShopToLocalVault(persistObj);
        if (typeof lastDisplayedResumeSave !== "undefined") {
          lastDisplayedResumeSave = persistObj;
        }
      } catch (e) {
        console.warn("[SaveLocal] Lỗi lưu localStorage:", e);
      }
    }


    // ================= 10. GIÁ VỐN, ĐỘ NHẠY GIÁ 2 TẦNG & TÍCH HỢP THỰC ĐƠN =================
    function getWorkshopDiscountPctForIng(ingId) {
      for (const ws of SUPPLY_WORKSHOPS) {
        if (ws.targetIngs.includes(ingId)) {
          const lvl = Math.min(3, Math.max(0, Number(state.workshops?.[ws.id] || 0)));
          return ws.discPcts[lvl] || 0;
        }
      }
      return 0;
    }

    function getIngredientCost(ing) {
      const chapId = getCurrentChapterObj()?.id || 1;
      let mult = 1.0 + Math.max(0, chapId - 1) * 0.045;
      if ((state.activeMultiDayEffects?.freshSurgeDays || 0) > 0 && ing.type === "fresh") mult *= 1.45;
      if ((state.activeMultiDayEffects?.cheapDryDays || 0) > 0 && ing.type === "dry") mult *= 0.75;
      if ((state.equipLevels?.upg_cooler || 0) >= 5) mult *= 0.88;
      const wsDisc = getWorkshopDiscountPctForIng(ing.id);
      if (wsDisc > 0) mult *= (1 - wsDisc / 100);
      if ((state.dailyBargainDiscountPct || 0) > 0) mult *= Math.max(0.85, 1 - Number(state.dailyBargainDiscountPct) / 100);
      if (window.serverLiveConfig && window.serverLiveConfig.enabled && Number(window.serverLiveConfig.marketDiscountPct || 0) > 0) {
        mult *= Math.max(0.65, 1 - Number(window.serverLiveConfig.marketDiscountPct) / 100);
      }
      mult = Math.max(0.65, mult);
      return Math.max(500, Math.round((ing.baseCost * mult) / 100) * 100);
    }

    function getDishRecipeCost(dishKey) {
      const recipe = DISH_MENU[dishKey]?.recipe || {};
      let cost = 1000; // Túi + xiên + hộp đựng
      for (const [ingId, qty] of Object.entries(recipe)) {
        const ingObj = INGREDIENTS.find(x => x.id === ingId);
        if (ingObj) cost += qty * getIngredientCost(ingObj);
      }
      return cost;
    }

    function getDishStandardPrice(dishKey) {
      const base = DISH_MENU[dishKey]?.price || 22000;
      const featuredBonus = (dishKey === state.featuredDishKey) ? 1.10 : 1.0;
      const festBonus = (state.activeMultiDayEffects?.streetFestDays || 0) > 0 ? 1.15 : 1.0;
      return Math.round((base * featuredBonus * festBonus) / 1000) * 1000;
    }

    function getDishEffectivePrice(dishKey) {
      const stdPrice = getDishStandardPrice(dishKey);
      const offset = (state.priceOffsets && state.priceOffsets[dishKey]) || 0;
      return Math.max(10000, stdPrice + offset);
    }

    // Độ lệch giá thực tế của 1 món sau khi trừ đi Ngưỡng Chấp Nhận Giá (nhờ Thuê TikToker & Địa Điểm)
    function getDishPerceivedOverprice(dishKey) {
      const rawOffset = (state.priceOffsets && state.priceOffsets[dishKey]) || 0;
      const tol = getPriceToleranceBonus();
      if (rawOffset <= 0) return rawOffset;
      return Math.max(0, rawOffset - tol);
    }

    function getDishDemandInfo(dishKey) {
      const rawOffset = (state.priceOffsets && state.priceOffsets[dishKey]) || 0;
      const over = getDishPerceivedOverprice(dishKey);
      if (rawOffset <= -2000) {
        return { weight: 1.45, walkAway: 0, badge: "🟢 Hút khách +45%", badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-400" };
      } else if (over <= 0) {
        return { weight: 1.0, walkAway: 0, badge: "⚖️ Khách ưng bụng", badgeClass: "bg-amber-100 text-amber-900 border-amber-300" };
      } else if (over <= 2000) {
        return { weight: 0.65, walkAway: 0.18, badge: "🟠 Kén khách (-35%)", badgeClass: "bg-orange-100 text-orange-900 border-orange-400" };
      } else if (over <= 4000) {
        return { weight: 0.30, walkAway: 0.45, badge: "🔴 Giá cao (Vắng -70%)", badgeClass: "bg-red-100 text-red-900 border-red-400" };
      } else {
        return { weight: 0.12, walkAway: 0.72, badge: "💀 Cắt cổ (Khách né!)", badgeClass: "bg-rose-950 text-yellow-200 border-rose-700" };
      }
    }

    function getCurrentAppCommissionRate() {
      if ((state.activeMultiDayEffects?.appPartnerDays || 0) > 0) return 0.10;
      const appAdsLvl = state.equipLevels?.upg_appads || 0;
      const utNhanhDisc = (typeof isStaffWorkingToday === 'function' ? isStaffWorkingToday('utnhanh') : state.staff?.utnhanh) ? ((state.staffStars?.utnhanh || 1) * 0.01) : 0;
      const ratingDisc = (typeof state.rating === "number" && state.rating >= 4.8) ? 0.02 : 0;
      const diamondDisc = state.licenses?.lic_app_diamond ? 0.04 : 0;
      const baseRate = Math.max(0.04, 0.20 - appAdsLvl * 0.015 - utNhanhDisc - ratingDisc - diamondDisc);
      return state.licenses?.lic_brand ? Math.min(0.10, baseRate) : baseRate;
    }

    function toggleAppPriceMarkup() {
      state.appPriceMarkup = !state.appPriceMarkup;
      playSFX("snip");
      updateAllUI();
      saveGameEverywhere();
      showToast(state.appPriceMarkup
        ? "📱 BẬT Phụ thu App (+10% giá đơn Shipper)!"
        : "📱 TẮT Phụ thu App (Shipper kiên nhẫn hơn)!");
    }

    function getPricingCustomerImpact() {
      const unlocked = state.unlockedDishes || ["tron"];
      const tol = getPriceToleranceBonus();
      const rawTotal = unlocked.reduce((sum, k) => sum + ((state.priceOffsets && state.priceOffsets[k]) || 0), 0);
      const avgRawOffset = Math.round(rawTotal / Math.max(1, unlocked.length));
      const effectiveOver = avgRawOffset > 0 ? Math.max(0, avgRawOffset - tol) : avgRawOffset;

      // Chú Tư Nghĩa (1⭐ -> 5⭐) khéo miệng giữ chân khách giảm tỷ lệ bỏ đi
      const tuNghiaKeepFactor = (typeof isStaffWorkingToday === 'function' ? isStaffWorkingToday('tunghia') : state.staff?.tunghia) ? Math.max(0.30, 1 - (state.staffStars?.tunghia || 1) * 0.12) : 1.0;

      if (effectiveOver <= -2000) {
        return {
          tier: "cheap", avgRawOffset, effectiveOver, tol,
          badge: "🟢 Giá bình dân • Khách +25%",
          colorClass: "bg-emerald-50 border-emerald-400 text-emerald-950",
          desc: "Giá mềm hợp túi tiền! Lượng khách trong ngày +25%, khách kiên nhẫn chờ lâu hơn +20%!",
          demandCapMult: 1.25, spawnMult: 0.78, patienceDecayMult: 0.80, walkAwayChance: 0, sweetSpotBonus: 3
        };
      } else if (effectiveOver <= 500) {
        return {
          tier: "normal", avgRawOffset, effectiveOver, tol,
          badge: "⚖️ Giá hợp lý • Khách ổn định",
          colorClass: "bg-amber-50 border-amber-300 text-amber-950",
          desc: `Khách hài lòng với danh tiếng quán (Chịu giá cộng thêm: +${formatShortK(tol)}/bịch).`,
          demandCapMult: 1.0, spawnMult: 1.0, patienceDecayMult: 1.0, walkAwayChance: 0, sweetSpotBonus: 0
        };
      } else if (effectiveOver <= 2500) {
        return {
          tier: "high", avgRawOffset, effectiveOver, tol,
          badge: "🟠 Giá hơi cao • Khách -28%",
          colorClass: "bg-orange-50 border-orange-400 text-orange-950",
          desc: "Giá vượt ngưỡng chịu chi! Lượng khách ghé giảm -28%, khách lưỡng lự dễ bỏ đi!",
          demandCapMult: 0.72, spawnMult: 1.30, patienceDecayMult: 1.25, walkAwayChance: 0.22 * tuNghiaKeepFactor, sweetSpotBonus: -2
        };
      } else {
        return {
          tier: "expensive", avgRawOffset, effectiveOver, tol,
          badge: "🔴 Giá quá đắt • Khách -60%!",
          colorClass: "bg-red-50 border-red-500 text-red-950",
          desc: "Cảnh báo: Giá quá cao khiến quán vắng khách (-60% lượt mua), khách dòm bảng giá bỏ đi hàng loạt!",
          demandCapMult: 0.40, spawnMult: 1.65, patienceDecayMult: 1.50, walkAwayChance: 0.52 * tuNghiaKeepFactor, sweetSpotBonus: -4
        };
      }
    }

    function adjustDishPrice(dishKey, delta) {
      if (!state.priceOffsets) state.priceOffsets = {};
      const cur = state.priceOffsets[dishKey] || 0;
      state.priceOffsets[dishKey] = Math.max(-5000, Math.min(12000, cur + delta));
      playSFX("snip");
      updateAllUI();
      saveGameEverywhere();
    }

    function resetAllDishPrices() {
      Object.keys(DISH_MENU).forEach(k => { state.priceOffsets[k] = 0; });
      playSFX("cash");
      updateAllUI();
      saveGameEverywhere();
      showToast("⚖️ Đã đưa toàn bộ Thực Đơn về mức giá chuẩn!");
    }

    // Render Tab Thực Đơn & Giá Bán Tích Hợp (Không còn Nâng Sao món ăn, chỉnh giá trực tiếp trên từng món)

    function getEquipLevelGate(eq, targetLvl) {
      if (targetLvl <= 1) return 1;
      if (targetLvl === 2) return 4;
      if (targetLvl === 3) return 9;
      if (targetLvl === 4) return 16;
      return 24;
    }

    function getEquipCost(eq) {
      const cur = state.equipLevels[eq.id] || 0;
      return Math.round((eq.baseCost * Math.pow(1.65, cur)) / 1000) * 1000;
    }

    function getStaffTrainCost(st) {
      const curStar = state.staffStars?.[st.id] || 1;
      return Math.round((st.hireCost * 0.85 * Math.pow(1.55, curStar - 1)) / 1000) * 1000;
    }

    function getStaffTrainReqLevel(st, nextStar) {
      return st.reqLevel + (nextStar - 1) * 5;
    }

    function getDailyStaffWages() {
      let sum = 0;
      STAFF_CATALOG.forEach(st => {
        if (state.staff[st.id]) {
          const star = state.staffStars?.[st.id] || 1;
          sum += st.dailyWage + (star - 1) * 4000;
        }
      });
      return sum;
    }

    function getDailyOperatingFixedCost() {
      const baseUtilAndWear = 15000 + (state.level * 3200);
      const streetCleanFee = (!state.licenses.lic_sidewalk && !state.licenses.lic_heritage && state.level >= 5) ? 15000 : 0;
      return baseUtilAndWear + streetCleanFee;
    }

    function getUnpurchasedEligibleDishes(forShiftPenalty = false) {
      const checkLvl = forShiftPenalty ? (state.levelAtStartOfDay || state.level) : state.level;
      return Object.values(DISH_MENU).filter(d => d.reqLevel <= checkLvl && !state.unlockedDishes.includes(d.id));
    }

    function getActiveUsedIngredientSet() {
      const used = new Set(["tratac"]);
      (state.unlockedDishes || ["tron"]).forEach(dishKey => {
        const recipe = DISH_MENU[dishKey]?.recipe || {};
        Object.keys(recipe).forEach(ingId => used.add(ingId));
      });
      return used;
    }

    function handleTopLeftButtonClick() {
      if (state.isStreetSelling) endDaySummary();
      else openDiTuTutorialModal(0);
    }


function getBetiDelayMs() {
  const star = state.staffStars?.beti || 1;
  return Math.max(120, 460 - star * 70);
}
function getMylanDelayMs() {
  const star = state.staffStars?.mylan || 1;
  return Math.max(120, 420 - star * 60);
}
function getUtAnhDelayMs() {
  const star = state.staffStars?.utnhanh || 1;
  return Math.max(110, 420 - star * 60);
}
    let activeMarketingSubTab = "campaigns";
    let activeBankSubTab = "savings";
    let streetLivestreamRemainingSec = 0;
    let streetFlashDropRemainingSec = 0;
    let streetLiveViewers = 0;
    let staffActiveSkillCooldownSec = 0;

    function ensureV15State(st) {
      if (!st || typeof st !== "object") return;
      st.offlineMode = !isFirebaseConfigured();
      if (!st.customVoucher || typeof st.customVoucher !== "object") {
        st.customVoucher = {
          discountPct: 0,
          promoType: "percent",
          targetScope: "all",
          quotaMax: 20,
          usedToday: 0,
          active: false,
          keepTomorrow: true
        };
      }
      if (!st.dailyCampaigns || typeof st.dailyCampaigns !== "object") st.dailyCampaigns = {};
      if (!st.staffMorale || typeof st.staffMorale !== "object") {
        st.staffMorale = { beti: 90, mylan: 90, tunghia: 90, kimngan: 90, anhba: 90, utnhanh: 90, baoloc: 90 };
      }
      if (!st.staffAbsentToday || typeof st.staffAbsentToday !== "object") st.staffAbsentToday = {};
      if (!st.staffTempReplacedToday || typeof st.staffTempReplacedToday !== "object") st.staffTempReplacedToday = {};
      if (!st.staffWageRaisePct || typeof st.staffWageRaisePct !== "object") st.staffWageRaisePct = {};
      if (typeof st.romanceStageAnhBaMyLan !== "number") st.romanceStageAnhBaMyLan = 0;
      if (typeof st.lastStaffEventDay !== "number") st.lastStaffEventDay = 0;
      if (typeof st.creditScore !== "number") st.creditScore = 520;
      st.creditScore = Math.min(850, Math.max(300, Math.round(st.creditScore)));
      if (typeof st.savingsBalance !== "number") st.savingsBalance = 0;
      if (typeof st.bankLoanTier !== "number") st.bankLoanTier = 0;
      if (typeof st.prestigeGen !== "number") st.prestigeGen = 0;
      if (typeof st.marketSharePct !== "number") st.marketSharePct = 28;
      if (typeof st.pvpRoomCode !== "string") st.pvpRoomCode = "SAIGON01";
      if (typeof st.todayLiveUsedCount !== "number") st.todayLiveUsedCount = 0;
      if (typeof st.closerBossSpawnedToday !== "boolean") st.closerBossSpawnedToday = false;
      if (typeof st.activeDecorThemeId !== "string") st.activeDecorThemeId = "";
    }

    function getThemeSetOwnedSteps(themeObj, st = state) {
      const owned = Array.isArray(st.ownedDecors) ? st.ownedDecors : [];
      return themeObj.pieces.filter(p => owned.includes(p)).length;
    }

    function getTodayWeatherObj(dayNum = state.day) {
      const idx = ((dayNum || 1) * 3 + (dayNum % 2)) % SAIGON_WEATHER_TYPES.length;
      return SAIGON_WEATHER_TYPES[idx] || SAIGON_WEATHER_TYPES[0];
    }

    function isStaffWorkingToday(staffId) {
      ensureV15State(state);
      if (!state.staff || !state.staff[staffId]) return false;
      if (state.staffAbsentToday && state.staffAbsentToday[staffId]) {
        return Boolean(state.staffTempReplacedToday && state.staffTempReplacedToday[staffId]);
      }
      return true;
    }

    const _origGetBetiDelayMs = getBetiDelayMs;
    getBetiDelayMs = function() {
      ensureV15State(state);
      if (state.staffAbsentToday?.beti && state.staffTempReplacedToday?.beti) return 420;
      const base = _origGetBetiDelayMs();
      const morale = state.staffMorale?.beti ?? 90;
      const factor = morale >= 85 ? 0.88 : (morale < 55 ? 1.35 : 1.0);
      return Math.round(base * factor);
    };

    const _origGetMylanDelayMs = getMylanDelayMs;
    getMylanDelayMs = function() {
      ensureV15State(state);
      if (state.staffAbsentToday?.mylan && state.staffTempReplacedToday?.mylan) return 400;
      const base = _origGetMylanDelayMs();
      const morale = state.staffMorale?.mylan ?? 90;
      let factor = morale >= 85 ? 0.88 : (morale < 55 ? 1.35 : 1.0);
      if (state.staff?.anhba && state.romanceStageAnhBaMyLan === 1) factor *= 0.80;
      else if (state.staff?.anhba && state.romanceStageAnhBaMyLan === 2) factor *= 1.30;
      else if (state.staff?.anhba && state.romanceStageAnhBaMyLan === 3) factor *= 0.72;
      return Math.round(base * factor);
    };

    if (typeof getDailyStaffWages === "function") {
      getDailyStaffWages = function() {
        ensureV15State(state);
        let total = 0;
        STAFF_CATALOG.forEach(st => {
          if (state.staff && state.staff[st.id]) {
            const star = state.staffStars?.[st.id] || 1;
            let w = st.dailyWage + (star - 1) * 4000;
            const raisePct = state.staffWageRaisePct?.[st.id] || 0;
            if (raisePct > 0) w = Math.round(w * (1 + raisePct / 100));
            if ((st.id === "anhba" || st.id === "mylan") && state.romanceStageAnhBaMyLan === 3) {
              w = Math.round(w * 0.90);
            }
            total += w;
          }
        });
        return Math.round(total / 500) * 500;
      };
    }

    // --- 4. BIẾN CỐ NHÂN VIÊN ĐỜI THỰC ---
    let currentMorningStaffEvent = null;

    function maybeGenerateMorningStaffEvent() {
      ensureV15State(state);
      state.staffAbsentToday = {};
      state.staffTempReplacedToday = {};
      currentMorningStaffEvent = null;

      const hiredList = STAFF_CATALOG.filter(st => state.staff && state.staff[st.id]);
      if (hiredList.length === 0) return;

      if (isStaffWorkingToday("mylan")) {
        state.prepDone = { sate: true, hanhphi: true, trungcut: true };
      }

      if ((state.day || 1) - (state.lastStaffEventDay || 0) < 3) return;

      if (state.staff.anhba && state.staff.mylan) {
        if (state.romanceStageAnhBaMyLan === 0 && Math.random() < 0.45) {
          state.romanceStageAnhBaMyLan = 1;
          state.lastStaffEventDay = state.day;
          currentMorningStaffEvent = {
            type: "romance_stage1",
            title: "💘 Chuyện Tình Nơi Quầy Bánh: Anh Ba & Mỹ Lan!",
            desc: "Dạo này bà con trong hẻm để ý thấy Đầu bếp Anh Ba và Mỹ Lan hay lén nhìn nhau cười lúc chuyền thau bánh tráng. Khi đứng chung ca, cả hai phối hợp Bước 2 ➔ Bước 3 nhanh hơn +20%!",
            choices: [
              { label: "🥰 Mỉm cười ủng hộ đôi trẻ (+15% Tinh thần cả hai)", action: "support_romance_1" },
              { label: "📋 Nhắc nhở tập trung làm việc cho chuẩn", action: "strict_romance_1" }
            ]
          };
          return;
        } else if (state.romanceStageAnhBaMyLan === 1 && Math.random() < 0.50) {
          state.romanceStageAnhBaMyLan = 2;
          state.lastStaffEventDay = state.day;
          currentMorningStaffEvent = {
            type: "romance_stage2",
            title: "💔 Anh Ba & Mỹ Lan Giận Hờn Vu Vơ Tại Quầy!",
            desc: "Sáng nay mở hàng thấy Mỹ Lan và Anh Ba mặt nặng mày nhẹ không nói với nhau câu nào vì hiểu lầm tối qua. Không khí quầy bánh căng thẳng làm tốc độ bếp giảm -25%!",
            choices: [
              { label: "🧋 Bao chầu Trà sữa & Lẩu giảng hòa (80.000đ ➔ Thành Cặp Đôi Vàng)", action: "resolve_romance_gift" },
              { label: "😤 Mặc kệ chuyện riêng tư (Hôm nay tốc độ bếp giảm -25%)", action: "ignore_romance_quarrel" }
            ]
          };
          return;
        }
      }

      const roll = Math.random();
      const target = hiredList[Math.floor(Math.random() * hiredList.length)];
      if (roll < 0.40) {
        state.lastStaffEventDay = state.day;
        state.staffAbsentToday[target.id] = true;
        if (target.id === "mylan") {
          state.prepDone = { sate: false, hanhphi: false, trungcut: false };
        }
        currentMorningStaffEvent = {
          type: "sick_leave",
          staffId: target.id,
          staffName: target.name,
          title: `🤒 ${target.name} Xin Nghỉ Phép Đột Xuất Hôm Nay!`,
          desc: `Sáng sớm ${target.name} (${target.stepRole}) nhắn tin báo bị cảm sốt sau trận mưa chiều qua, xin phép nghỉ 1 ngày. Hôm nay khâu "${target.stepRole}" đang trống người phụ trách!`,
          choices: [
            { label: `👨‍🍳 Duyệt nghỉ có lương, hôm nay Chủ quán tự làm thay (+15% Tinh thần)`, action: "approve_leave_self" },
            { label: `🛵 Thuê thợ thời vụ thế chỗ trong ngày (Tốn 55.000đ • Tự động 1⭐)`, action: "hire_temp_replacement" },
            { label: `😠 Không duyệt, bắt ra đứng quầy (-30% Tinh thần • Làm chậm)`, action: "force_work_sick" }
          ]
        };
      } else if (roll < 0.72) {
        state.lastStaffEventDay = state.day;
        const curStar = state.staffStars?.[target.id] || 1;
        const bonusAsk = 45000 + curStar * 20000;
        currentMorningStaffEvent = {
          type: "ask_raise",
          staffId: target.id,
          staffName: target.name,
          bonusAsk,
          title: `💼 ${target.name} Đề Xuất Tăng Lương / Thưởng Nóng!`,
          desc: `“Chủ quán ơi, dạo này quán mình khách đông nườm nượp mà việc ở khâu ${target.stepRole} ngày càng nặng. Chủ quán xem xét tăng phụ cấp hoặc thưởng nóng cho em có sức cống hiến nghen!”`,
          choices: [
            { label: `📈 Tăng lương ngày +15% (Tinh thần 100% • Tốc độ +10%)`, action: "grant_wage_raise" },
            { label: `🧧 Thưởng nóng 1 lần ${formatVND(bonusAsk)} (Giữ nguyên lương ngày)`, action: "grant_one_time_bonus" },
            { label: `✋ Từ chối, hẹn dịp khác (-25% Tinh thần)`, action: "deny_wage_raise" }
          ]
        };
      } else {
        state.lastStaffEventDay = state.day;
        const poachCost = 90000;
        currentMorningStaffEvent = {
          type: "rival_poach",
          staffId: target.id,
          staffName: target.name,
          poachCost,
          title: `🕵️ Quán Đối Thủ Sang Chèo Kéo ${target.name}!`,
          desc: `Chủ quán "Bánh Tráng Anh Hào Ngã Tư" vừa lén gặp ${target.name}, hứa trả lương cao gấp rưỡi nếu chịu bỏ quán bạn sang bên đó đứng bếp!`,
          choices: [
            { label: `💎 Thưởng giữ chân ${formatVND(poachCost)} & Tăng gắn bó (Tinh thần 100%)`, action: "counter_poach_keep" },
            { label: `🗣️ Dùng tình nghĩa thuyết phục ở lại (50% thành công theo Tinh thần)`, action: "persuade_stay" }
          ]
        };
      }
    }

    function handleMorningStaffEventChoice(actionKey) {
      ensureV15State(state);
      const ev = currentMorningStaffEvent;
      if (!ev) return;
      const sid = ev.staffId;
      playSFX("cash");

      if (actionKey === "support_romance_1") {
        state.staffMorale.anhba = Math.min(100, (state.staffMorale.anhba || 90) + 15);
        state.staffMorale.mylan = Math.min(100, (state.staffMorale.mylan || 90) + 15);
        showToast("💘 Anh Ba & Mỹ Lan phấn khởi, tốc độ phối hợp Bước 2–3 tăng +20%!");
      } else if (actionKey === "strict_romance_1") {
        state.romanceStageAnhBaMyLan = 0;
        showToast("📋 Đã nhắc nhở Anh Ba & Mỹ Lan tập trung tối đa khi đứng bếp!");
      } else if (actionKey === "resolve_romance_gift") {
        if (state.money < 80000) {
          showToast("⚠️ Cần 80.000đ để bao chầu giảng hòa cho đôi trẻ!");
          return;
        }
        state.money -= 80000;
        state.todayCogsSpent = (state.todayCogsSpent || 0) + 80000;
        state.romanceStageAnhBaMyLan = 3;
        state.staffMorale.anhba = 100;
        state.staffMorale.mylan = 100;
        showToast("💍 Anh Ba & Mỹ Lan đã làm lành và trở thành Cặp Đôi Vàng gắn bó trọn đời với quán (+30% tốc độ, -10% lương)!");
      } else if (actionKey === "ignore_romance_quarrel") {
        showToast("⚠️ Anh Ba & Mỹ Lan vẫn còn giận dỗi, hôm nay tốc độ bếp giảm nhẹ!");
      } else if (actionKey === "approve_leave_self") {
        state.staffMorale[sid] = Math.min(100, (state.staffMorale[sid] || 85) + 15);
        showToast(`👨‍🍳 Đã duyệt cho ${ev.staffName} nghỉ ngơi! Hôm nay bạn nhớ trực tiếp làm thay khâu của ${ev.staffName} nhé!`);
      } else if (actionKey === "hire_temp_replacement") {
        if (state.money < 55000) {
          showToast("⚠️ Không đủ 55.000đ thuê thợ thời vụ, hôm nay bạn chịu khó tự đứng bếp thay nhé!");
          return;
        }
        state.money -= 55000;
        state.todayCogsSpent = (state.todayCogsSpent || 0) + 55000;
        state.staffTempReplacedToday[sid] = true;
        if (sid === "mylan") state.prepDone = { sate: true, hanhphi: true, trungcut: true };
        showToast(`🛵 Đã thuê thợ thời vụ thế chỗ ${ev.staffName} trong ngày hôm nay!`);
      } else if (actionKey === "force_work_sick") {
        delete state.staffAbsentToday[sid];
        state.staffMorale[sid] = Math.max(20, (state.staffMorale[sid] || 85) - 30);
        if (sid === "mylan") state.prepDone = { sate: true, hanhphi: true, trungcut: true };
        showToast(`⚠️ ${ev.staffName} miễn cưỡng đi làm nhưng tinh thần giảm mạnh (-30%)!`);
      } else if (actionKey === "grant_wage_raise") {
        state.staffWageRaisePct[sid] = (state.staffWageRaisePct[sid] || 0) + 15;
        state.staffMorale[sid] = 100;
        showToast(`📈 Đã tăng +15% lương ngày cho ${ev.staffName}! Tinh thần đạt 100%!`);
      } else if (actionKey === "grant_one_time_bonus") {
        const amt = ev.bonusAsk || 60000;
        if (state.money < amt) {
          showToast(`⚠️ Không đủ ${formatVND(amt)} tiền mặt để thưởng nóng!`);
          return;
        }
        state.money -= amt;
        state.todayCogsSpent = (state.todayCogsSpent || 0) + amt;
        state.staffMorale[sid] = Math.min(100, (state.staffMorale[sid] || 80) + 20);
        showToast(`🧧 Đã thưởng nóng ${formatVND(amt)} cho ${ev.staffName}!`);
      } else if (actionKey === "deny_wage_raise") {
        state.staffMorale[sid] = Math.max(25, (state.staffMorale[sid] || 80) - 25);
        showToast(`⚠️ ${ev.staffName} hơi buồn vì chưa được duyệt tăng lương (-25% Tinh thần).`);
      } else if (actionKey === "counter_poach_keep") {
        const amt = ev.poachCost || 90000;
        if (state.money < amt) {
          showToast(`⚠️ Cần ${formatVND(amt)} để thưởng giữ chân nhân viên!`);
          return;
        }
        state.money -= amt;
        state.todayCogsSpent = (state.todayCogsSpent || 0) + amt;
        state.staffMorale[sid] = 100;
        showToast(`💎 Đã giữ chân thành công ${ev.staffName} ở lại gắn bó với quán!`);
      } else if (actionKey === "persuade_stay") {
        const morale = state.staffMorale[sid] || 75;
        if (morale >= 65 || Math.random() < 0.65) {
          showToast(`🤝 Nhờ tình cảm gắn bó, ${ev.staffName} đã từ chối lời mời của quán đối thủ!`);
        } else {
          state.staff[sid] = false;
          showToast(`💔 Rất tiếc! Vì tinh thần thấp nên ${ev.staffName} đã sang quán đối thủ. Bạn có thể thuê lại ở mục Nhân Sự!`);
        }
      }

      currentMorningStaffEvent = null;
      const modal = document.getElementById("modal-staff-drama-v15");
      if (modal) modal.classList.add("hidden");
      updateAllUI();
      saveGameEverywhere();
    }

    function openMorningStaffDramaModal() {
      if (!currentMorningStaffEvent) return;
      let modal = document.getElementById("modal-staff-drama-v15");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-staff-drama-v15";
        modal.className = "fixed inset-0 z-[75] flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm";
        document.body.appendChild(modal);
      }
      const ev = currentMorningStaffEvent;
      modal.classList.remove("hidden");
      modal.innerHTML = `
        <div class="w-full max-w-md wooden-clipboard-frame">
          <div class="clipboard-paper-inner p-3.5 space-y-2.5 text-xs text-amber-950">
            <div class="flex items-center justify-between border-b border-amber-300 pb-2">
              <span class="px-2 py-0.5 rounded-full bg-orange-600 text-white font-black text-[10px] uppercase">🧑‍🍳 Biến Cố Nhân Sự Buổi Sáng</span>
              <span class="text-[10px] font-bold text-amber-800">Ngày ${state.day || 1}</span>
            </div>
            <h3 class="font-black text-sm text-amber-950 leading-snug">${ev.title}</h3>
            <p class="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 font-semibold leading-relaxed">${ev.desc}</p>
            <div class="space-y-1.5 pt-1">
              ${ev.choices.map(ch => `
                <button type="button" onclick="handleMorningStaffEventChoice('${ch.action}')" class="soft-btn w-full p-2.5 rounded-xl bg-white hover:bg-amber-100 border-2 border-amber-400 text-left font-black text-amber-950 text-[11px] shadow-sm">
                  ${ch.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }

    function encourageStaffMorale(staffId) {
      ensureV15State(state);
      const st = STAFF_CATALOG.find(x => x.id === staffId);
      if (!st || !state.staff?.[staffId]) return;
      const curM = state.staffMorale?.[staffId] ?? 90;
      if (curM >= 100) {
        showToast(`🌟 Tinh thần của ${st.name} đang đạt đỉnh 100% rồi!`);
        return;
      }
      const cost = 25000;
      if (state.money < cost) {
        showToast("⚠️ Cần 25.000đ mua trà sữa / quà khích lệ tinh thần nhân viên!");
        return;
      }
      state.money -= cost;
      state.todayCogsSpent = (state.todayCogsSpent || 0) + cost;
      state.staffMorale[staffId] = Math.min(100, curM + 20);
      if (state.romanceStageAnhBaMyLan === 2 && (staffId === "anhba" || staffId === "mylan")) {
        state.romanceStageAnhBaMyLan = 3;
        showToast("💍 Anh Ba & Mỹ Lan đã hết giận và trở thành Cặp Đôi Vàng gắn bó trọn đời!");
      } else {
        showToast(`💝 Đã thưởng khích lệ ${st.name}! Tinh thần tăng lên ${state.staffMorale[staffId]}%!`);
      }
      playSFX("cash");
      renderUpgradesTab();
      updateAllUI();
      saveGameEverywhere();
    }

    // --- 5. CÔNG THỨC SỨC BÁN TỔNG HỢP ---
    function getActiveCampaignBagBonus() {
      ensureV15State(state);
      if ((state.level || 1) < 8) return 0;
      let bags = 0;
      LEVEL_GATED_CAMPAIGNS.forEach(c => {
        if ((state.level || 1) >= c.reqLevel && state.dailyCampaigns?.[c.id]) {
          bags += c.bagBonus;
        }
      });
      if (isStaffWorkingToday("baoloc")) {
        bags += (state.staffStars?.baoloc || 1);
      }
      return bags;
    }

    function getVoucherCustomerMult() {
      ensureV15State(state);
      if ((state.level || 1) < 12) return 1.0;
      const v = state.customVoucher;
      if (!v || !v.active || v.usedToday >= v.quotaMax) return 1.0;
      if (v.promoType === "free_tea") return 1.28;
      if (v.discountPct <= 0) return 1.0;
      const map = { 10: 1.14, 15: 1.22, 20: 1.30, 30: 1.45 };
      const scopeFactor = v.targetScope === "all" ? 1.0 : 0.75;
      const managerBoost = isStaffWorkingToday("baoloc") ? (1 + (state.staffStars?.baoloc || 1) * 0.04) : 1.0;
      return 1.0 + ((map[v.discountPct] || 1.0) - 1.0) * scopeFactor * managerBoost;
    }

    getMarketingDailyBagBonus = function() {
      ensureV15State(state);
      const mapsLvl = state.equipLevels?.upg_maps || 0;
      const signLvl = state.equipLevels?.upg_signbox || 0;
      const equipBags = mapsLvl + signLvl + (signLvl >= 5 ? 1 : 0);
      const campBags = getActiveCampaignBagBonus();
      const prestigeBags = (state.prestigeGen || 0) * 3;
      return equipBags + campBags + prestigeBags;
    };

    const _origGetActualCartBagDemandCap = getActualCartBagDemandCap;
    getActualCartBagDemandCap = function(dayNum = state.day) {
      const baseCap = _origGetActualCartBagDemandCap(dayNum);
      const weather = getTodayWeatherObj(dayNum);
      const fest = EXTENDED_FESTIVALS[dayNum % 31] || EXTENDED_FESTIVALS[dayNum];
      const festMult = fest ? fest.bagMult : 1.0;
      const vMult = getVoucherCustomerMult();
      const prestigeMult = 1 + (state.prestigeGen || 0) * 0.12;
      return Math.min(78, Math.max(5, Math.round(baseCap * weather.bagMult * festMult * vMult * prestigeMult)));
    };

    const _origGetPriceToleranceBonus = getPriceToleranceBonus;
    getPriceToleranceBonus = function() {
      ensureV15State(state);
      const baseTol = _origGetPriceToleranceBonus();
      const dow = ((state.day || 1) - 1) % 7 + 1;
      const weekendBonus = (dow === 6 ? 2000 : dow === 7 ? 1500 : dow === 5 ? 1000 : dow <= 2 ? -500 : 500);
      const kolBonus = (state.dailyCampaigns?.kol_review) ? 1500 : 0;
      const sponsorBonus = (state.dailyCampaigns?.city_festival_sponsor) ? 2500 : 0;
      const coolerBonus = (state.equipLevels?.upg_cooler || 0) * 300;
      const royalThemeBonus = (state.activeDecorThemeId === "theme_royal") ? 2500 : 0;
      return Math.min(15000, Math.max(0, baseTol + weekendBonus + kolBonus + sponsorBonus + coolerBonus + royalThemeBonus));
    };

    if (typeof getCurrentAppCommissionRate === "function") {
      const _origGetCurrentAppCommissionRate = getCurrentAppCommissionRate;
      getCurrentAppCommissionRate = function() {
        ensureV15State(state);
        let rate = _origGetCurrentAppCommissionRate();
        rate -= (state.equipLevels?.upg_maps || 0) * 0.01;
        if (state.dailyCampaigns?.app_top_push) rate -= 0.06;
        return Math.max(0.05, rate);
      };
    }

    // --- 6. BẢNG ĐIỂM BÁO SÁNG SỚM & CHUYỂN NHANH ĐI CHỢ / SƠ CHẾ ---

    function recalcNeighborhoodMarketShare() {
      ensureV15State(state);
      const r = typeof state.rating === "number" ? state.rating : 4.3;
      const lvl = state.level || 1;
      const campCount = Object.values(state.dailyCampaigns || {}).filter(Boolean).length;
      const vActive = (state.customVoucher?.active && state.level >= 12) ? 8 : 0;
      const scaleBonus = (state.shopScale || 0) * 5;
      const rawShare = 18 + Math.round((r - 3.5) * 14) + Math.min(25, Math.round(lvl * 0.4)) + campCount * 6 + vActive + scaleBonus;
      state.marketSharePct = Math.min(85, Math.max(8, rawShare));
    }


