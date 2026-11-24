/**
 * Danh Mục Dữ Liệu Tĩnh: Lịch Tuần, Thời Tiết, Nguyên Liệu, Thực Đơn, Khách Hàng, Nhân Sự, Nâng Cấp & Sự Kiện
 */
    // ================= 2. BÍ KÍP DÌ TƯ TRUYỀN NGHỀ =================
    const DITU_TUTORIAL_STEPS = [
      {
        badge: "Bí Kíp Truyền Nghề • Phần 1/4",
        title: "Hương Tắc Xanh & Chiếc Xe Đẩy Đầu Hẻm",
        poeticQuote: "“Hương tắc xanh quyện mùi hành phi thơm lừng cả góc phố... Con ơi, mới mở xe trong hẻm nhỏ thì mỗi ngày chỉ có lác đác chục vị khách quen thôi. Con cứ lấy hàng vừa đủ theo dự kiến và làm sẵn 3 món sơ chế đầu ngày nghen!”",
        keyTip: "💡 Mới khai trương khách còn thưa, đừng nhập dư đồ tươi kẻo qua đêm héo úa uổng tiền vốn!"
      },
      {
        badge: "Bí Kíp Truyền Nghề • Phần 2/4",
        title: "Muốn Đông Khách Phải Biết Quảng Bá & Giữ Chân",
        poeticQuote: "“Ngồi im trong hẻm không ai biết tới đâu con! Tích góp được chút vốn, con vào mục [🛠️ Nâng Cấp] để Ghim Google Maps, dựng Bảng Hiệu Đầu Hẻm, chạy Quảng Cáo App và mời TikToker tới quay clip. Rồi sắm thêm Bàn Ghế Nhựa Đỏ, Quạt Phun Sương cho khách ngồi đợi mát mẻ!”",
        keyTip: "💡 Nâng cấp nhánh [📣 Hút Khách] là cách duy nhất để tăng số lượng khách ghé xe mỗi ngày và mở đủ 4 chỗ đứng đợi!"
      },
      {
        badge: "Bí Kíp Truyền Nghề • Phần 3/4",
        title: "Trộn Đều Vừa Thấm & Thuê Phụ Bếp Đỡ Đần",
        poeticQuote: "“Bánh tráng ngon là nhờ rưới sốt đều, trộn vừa thấm gia vị — trộn ít quá thì bánh nhạt, mà trộn mạnh quá tay thì bánh bị nhũn. Khi quán bắt đầu đông khách, con nhớ thuê Bé Tí, Mỹ Lan, Anh Ba phụ cắt bánh, rưới sốt, trộn đều cho kịp tay!”",
        keyTip: "💡 Trong mục [🥙 Thực Đơn], nếu con tăng giá bán cao quá mức chịu chi của khách thì quán sẽ vắng hẳn đó nghen!"
      },
      {
        badge: "Bí Kíp Truyền Nghề • Phần 4/4",
        title: "Hành Trình 6 Chương Đời Xe Đẩy Sài Gòn",
        poeticQuote: "“Từ Đầu Hẻm Quận 4, mình đẩy xe ra Cổng Trường, lên Ngã Tư Quận 3, rồi tiến vào Phố Ẩm Thực Hồ Thị Kỷ và Phố Đi Bộ Nguyễn Huệ... Giữ trọn chữ Tâm 30 năm của Dì để thành Huyền Thoại Bánh Tráng Sài Thành nghen con!”",
        keyTip: "💡 Bấm vào huy hiệu [📍 Chương] trên thẻ Dì Tư hoặc góc trên xe đẩy để xem mục tiêu và nhận thưởng lớn!"
      }
    ];

    let currentTutorialIdx = 0;
    let tutorialWordTimers = [];

    function openDiTuTutorialModal(startIdx = 0) {
      currentTutorialIdx = Math.max(0, Math.min(DITU_TUTORIAL_STEPS.length - 1, startIdx));
      document.getElementById("modal-ditu-tutorial").classList.remove("hidden");
      renderDiTuTutorialStep();
    }

    function closeDiTuTutorialModal() {
      tutorialWordTimers.forEach(t => clearTimeout(t));
      tutorialWordTimers = [];
      document.getElementById("modal-ditu-tutorial").classList.add("hidden");
      if (!state.seenIntroTutorial) {
        state.seenIntroTutorial = true;
        saveToLocalOnly();
      }
    }

    function stepDiTuTutorial(delta) {
      playSFX("snip");
      const next = currentTutorialIdx + delta;
      if (next >= DITU_TUTORIAL_STEPS.length) {
        closeDiTuTutorialModal();
        showToast("🌟 Chúc con buôn may bán đắt, giữ trọn chữ Tâm của Dì Tư!");
        return;
      }
      currentTutorialIdx = Math.max(0, next);
      renderDiTuTutorialStep();
    }

    function renderDiTuTutorialStep() {
      tutorialWordTimers.forEach(t => clearTimeout(t));
      tutorialWordTimers = [];
      const step = DITU_TUTORIAL_STEPS[currentTutorialIdx];
      document.getElementById("tutorial-step-badge").textContent = step.badge;
      document.getElementById("tutorial-step-title").textContent = step.title;
      document.getElementById("tutorial-key-tip").textContent = step.keyTip;

      const prevBtn = document.getElementById("btn-tut-prev");
      const nextBtn = document.getElementById("btn-tut-next");
      if (prevBtn) prevBtn.disabled = (currentTutorialIdx === 0);
      if (nextBtn) nextBtn.textContent = (currentTutorialIdx === DITU_TUTORIAL_STEPS.length - 1) ? "✅ Đã hiểu lời Dì!" : "Tiếp theo ▶";

      const quoteEl = document.getElementById("tutorial-poetic-quote");
      if (quoteEl) quoteEl.textContent = step.poeticQuote;
    }

    function dismissDay1Checklist() {
      state.day1ChecklistDismissed = true;
      const el = document.getElementById("day1-onboarding-checklist");
      if (el) el.classList.add("hidden");
      if (typeof saveToLocalOnly === "function") saveToLocalOnly("checklistDismiss");
    }

    function renderDay1OnboardingChecklist() {
      const box = document.getElementById("day1-onboarding-checklist");
      if (!box) return;
      if (!state || !state.shopName || state.day > 1 || state.day1ChecklistDismissed) {
        box.classList.add("hidden");
        return;
      }
      const prepCount = Object.values(state.prepDone || {}).filter(Boolean).length;
      const step1Done = Boolean(state.day1MarketDone) || (state.todayCogsSpent || 0) > 0;
      const step2Done = prepCount >= 1;
      const step3Done = Boolean(state.isStreetSelling) || (state.todaySold || 0) >= 1;
      const step4Done = (state.todaySold || 0) >= 1;
      if (step1Done && step2Done && step3Done && step4Done) {
        box.classList.add("hidden");
        return;
      }
      const nextStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4;
      const chip = (num, label, done) => {
        const cls = done
          ? "bg-emerald-600 text-white border-emerald-800"
          : (num === nextStep ? "bg-orange-500 text-white border-yellow-300 ring-2 ring-yellow-300 animate-pulse" : "bg-white text-amber-900 border-amber-300");
        return `<span class="px-2 py-0.5 rounded-lg border text-[10px] font-black ${cls}">${done ? "✓ " : ""}${num}. ${label}</span>`;
      };
      const tipText = nextStep === 1
        ? "👉 Bước 1: Kiểm tra kho & bấm '⚡ LẤY ĐỦ HÀNG' (nếu thiếu) ở tab Đi Chợ."
        : nextStep === 2
          ? "👉 Bước 2: Bấm tab '🌶️ Sơ Chế & Pha Sốt' để làm sẵn nguyên liệu (+1.000đ Tip/bịch)."
          : nextStep === 3
            ? "👉 Bước 3: Bấm nút xanh '🚀 MỞ CỬA HÀNG' để đẩy xe ra phố bán!"
            : "👉 Bước 4: Chọn Món + thêm Topping (Rau/Hành/Ớt) TRƯỚC B3 (khách có thể gọi thêm Trà giữa chừng!), rồi bấm B1 ➔ B2 ➔ B3 ➔ Trao Khách!";
      box.classList.remove("hidden");
      box.innerHTML = `
        <div class="flex items-center justify-between gap-1">
          <span class="text-[10px] font-black text-amber-950 uppercase">📋 Hướng Dẫn Ngày Đầu (4 Bước)</span>
          <button type="button" onclick="dismissDay1Checklist()" class="text-[9px] font-bold text-amber-700 underline">Ẩn</button>
        </div>
        <div class="flex flex-wrap gap-1">
          ${chip(1, "Đi chợ", step1Done)}
          ${chip(2, "Sơ chế", step2Done)}
          ${chip(3, "Mở cửa", step3Done)}
          ${chip(4, "B1→B2→B3", step4Done)}
        </div>
        <div class="text-[10px] font-extrabold text-amber-950 leading-snug">${tipText}</div>
      `;
    }


    // ================= 4. LỊCH TUẦN KHỞI ĐẦU VẮNG KHÁCH (6-9 BỊCH) & BẮT BUỘC NÂNG CẤP ĐỂ ĐÔNG KHÁCH =================
    // Khởi đầu xe trong hẻm nhỏ chỉ có 6-9 bịch/ngày và 1 chỗ khách đứng đợi (cách nhau 10-11 giây).
    // Không tự động cộng khách theo Cấp độ hay Chương! Muốn thêm khách và mở chỗ đứng đợi, 100% phải nâng cấp Nhánh Hút Khách!
    const WEEKLY_SCHEDULE = [
      { dow: 1, name: "Thứ Hai", tag: "Đầu tuần vắng vẻ", estBags: 6, traTacChance: 0.30, spawnMs: 10800, desc: "Đầu tuần vắng khách, hãy nâng cấp Hút Khách để kéo khách tới hẻm!" },
      { dow: 2, name: "Thứ Ba", tag: "Trời dịu mát", estBags: 6, traTacChance: 0.32, spawnMs: 10400, desc: "Khách quen trong hẻm ghé lai rai." },
      { dow: 3, name: "Thứ Tư", tag: "Giờ tan tầm", estBags: 7, traTacChance: 0.35, spawnMs: 10000, desc: "Học sinh tan trường ghé mua ăn xế." },
      { dow: 4, name: "Thứ Năm", tag: "Nổ đơn lai rai", estBags: 7, traTacChance: 0.38, spawnMs: 9600, desc: "Dân văn phòng bắt đầu đặt đơn qua App." },
      { dow: 5, name: "Thứ Sáu", tag: "Phố lên đèn", estBags: 8, traTacChance: 0.42, spawnMs: 9200, desc: "Tối Thứ Sáu khách dạo phố ăn vặt." },
      { dow: 6, name: "Thứ Bảy", tag: "Cuối tuần nhộn nhịp", estBags: 9, traTacChance: 0.46, spawnMs: 8600, vipBoost: 0.10, desc: "Cuối tuần khách đi chơi ghé xe ủng hộ!" },
      { dow: 7, name: "Chủ Nhật", tag: "Chiều cuối tuần", estBags: 8, traTacChance: 0.42, spawnMs: 9000, vipBoost: 0.08, desc: "Chủ Nhật thong thả chuẩn bị cho tuần mới." }
    ];

    const SPECIAL_HOLIDAYS = {
      5:  { name: "🎉 Hội Chợ Ẩm Thực Phường", estBags: 11, traTacChance: 0.50, spawnMs: 7800, vipBoost: 0.18, desc: "Hội chợ khu phố đông vui!" },
      10: { name: "⚽ Đêm Chung Kết Bóng Đá", estBags: 12, traTacChance: 0.55, spawnMs: 7400, vipBoost: 0.18, desc: "Khách mua bánh tráng xem đá banh!" },
      15: { name: "💸 Ngày Lương Về", estBags: 11, traTacChance: 0.52, spawnMs: 7600, vipBoost: 0.20, desc: "Lương về khách gọi món ngon!" },
      20: { name: "🌕 Đêm Hội Trăng Rằm", estBags: 13, traTacChance: 0.58, spawnMs: 7200, vipBoost: 0.22, desc: "Phố đèn lồng rộn ràng khách dạo chơi!" },
      25: { name: "🎸 Đêm Nhạc Sinh Viên", estBags: 12, traTacChance: 0.55, spawnMs: 7400, vipBoost: 0.18, desc: "Sinh viên trẩy hội ghé mua bánh!" },
      30: { name: "👑 Kỷ Niệm Tháng Khai Trương", estBags: 14, traTacChance: 0.60, spawnMs: 7000, vipBoost: 0.25, desc: "Khách quen kéo tới mừng tròn tháng!" }
    };

    // ================= 5. DANH MỤC 9 NGUYÊN LIỆU, 10 MÓN, 8 NÂNG CẤP HÚT KHÁCH/GIỮ CHÂN & 6 CHƯƠNG =================
    const INGREDIENTS = [
      { id: "banhtrang", name: "Bánh tráng phơi sương", short: "Bánh tráng", baseCost: 2500, shelfLife: 4, type: "dry", stepGroup: 1 },
      { id: "xoai", name: "Xoài xanh & Tắc tươi", short: "Xoài/Tắc", baseCost: 1500, shelfLife: 1, type: "fresh", stepGroup: 1 },
      { id: "muoitom", name: "Muối tôm Tây Ninh", short: "Muối tôm", baseCost: 1500, shelfLife: 5, type: "dry", stepGroup: 2 },
      { id: "sotbo", name: "Sốt bơ trứng & Me", short: "Sốt bơ", baseCost: 2500, shelfLife: 2, type: "sauce", stepGroup: 2 },
      { id: "dauphong", name: "Đậu phộng & Hành phi", short: "Đậu/Hành", baseCost: 1500, shelfLife: 3, type: "dry", stepGroup: 2 },
      { id: "khobo", name: "Khô bò, Mực, Ruốc", short: "Khô bò", baseCost: 3500, shelfLife: 4, type: "dry", stepGroup: 4 },
      { id: "tepmo", name: "Tép mỡ & Phô mai", short: "Tép mỡ", baseCost: 3000, shelfLife: 2, type: "sauce", stepGroup: 4 },
      { id: "trungcut", name: "Trứng cút & Rau răm", short: "Trứng/Rau", baseCost: 2000, shelfLife: 1, type: "fresh", stepGroup: 4 },
      { id: "tratac", name: "Trà tắc & Đá bi", short: "Trà tắc", baseCost: 3000, shelfLife: 1, type: "fresh", stepGroup: 4 }
    ];

    const DISH_MENU = {
      tron: { id: "tron", name: "Trộn Thập Cẩm", short: "Thập cẩm", vessel: "inox", reqLevel: 1, unlockCost: 0, price: 22000, recipe: { banhtrang: 1, xoai: 1, muoitom: 1, khobo: 1, dauphong: 1, trungcut: 1 } },
      chamme: { id: "chamme", name: "Chấm Sốt Me", short: "Chấm me", vessel: "bamboo", reqLevel: 3, unlockCost: 55000, price: 24000, recipe: { banhtrang: 1, sotbo: 1, muoitom: 1, dauphong: 1, trungcut: 1 } },
      cuon: { id: "cuon", name: "Cuộn Sốt Bơ", short: "Cuộn bơ", vessel: "bamboo", reqLevel: 6, unlockCost: 115000, price: 27000, recipe: { banhtrang: 1, xoai: 1, sotbo: 1, khobo: 1, dauphong: 1, trungcut: 1 } },
      phoisuong: { id: "phoisuong", name: "Phơi Sương Muối", short: "Phơi sương", vessel: "bamboo", reqLevel: 10, unlockCost: 190000, price: 29000, recipe: { banhtrang: 1, muoitom: 1, dauphong: 1, sotbo: 1 } },
      bo: { id: "bo", name: "Bơ Tép Mỡ", short: "Bơ tép mỡ", vessel: "inox", reqLevel: 15, unlockCost: 310000, price: 33000, recipe: { banhtrang: 1, sotbo: 1, tepmo: 1, dauphong: 1, trungcut: 1, muoitom: 1 } },
      nuong: { id: "nuong", name: "Nướng Đà Lạt", short: "Nướng Đ.Lạt", vessel: "grill", reqLevel: 21, unlockCost: 460000, price: 37000, recipe: { banhtrang: 1, tepmo: 1, trungcut: 1, sotbo: 1, muoitom: 1 } },
      xoainon: { id: "xoainon", name: "Xoài Non Khô Bò", short: "Xoài khô bò", vessel: "bamboo", reqLevel: 27, unlockCost: 650000, price: 41000, recipe: { banhtrang: 1, xoai: 1, khobo: 1, muoitom: 1, dauphong: 1 } },
      lacphomai: { id: "lacphomai", name: "Lắc Phô Mai", short: "Lắc phô mai", vessel: "inox", reqLevel: 34, unlockCost: 890000, price: 45000, recipe: { banhtrang: 1, tepmo: 1, sotbo: 1, trungcut: 1 } },
      mamruoc: { id: "mamruoc", name: "Nướng Mắm Ruốc", short: "Mắm ruốc", vessel: "grill", reqLevel: 42, unlockCost: 1250000, price: 52000, recipe: { banhtrang: 1, tepmo: 1, khobo: 1, trungcut: 1, muoitom: 1 } },
      metditu: { id: "metditu", name: "Mẹt Gia Truyền Dì Tư", short: "Mẹt Dì Tư", vessel: "bamboo", reqLevel: 50, unlockCost: 1800000, price: 64000, recipe: { banhtrang: 1, xoai: 1, muoitom: 1, khobo: 1, dauphong: 1, sotbo: 1, tepmo: 1, trungcut: 1 } }
    };

    const CUSTOMERS = [
      { id: "bena", name: "Bé Na", age: 15, job: "Học sinh", avatar: "👧", portrait: CASUAL_2D_ASSETS.cust_bena, arriveMode: "walk" },
      { id: "minhkhoi", name: "Tài", age: 20, job: "Sinh viên", avatar: "👦", portrait: CASUAL_2D_ASSETS.av_chef_boy, arriveMode: "walk" },
      { id: "chithao", name: "Chị Thảo", age: 27, job: "Văn phòng", avatar: "👩‍💼", portrait: CASUAL_2D_ASSETS.cust_chithao, arriveMode: "bike", picky: true },
      { id: "chubay", name: "Chú Hợi", age: 54, job: "Hàng xóm", avatar: "👴", portrait: CASUAL_2D_ASSETS.staff_tunghia, arriveMode: "walk" },
      { id: "phuonglinh", name: "Phương Linh", age: 23, job: "TikToker", avatar: "🤳", portrait: CASUAL_2D_ASSETS.cust_phuonglinh, arriveMode: "bike", vip: true, picky: true },
      { id: "batu", name: "Bà Tư", age: 58, job: "Khách khó tính", avatar: "👵", portrait: CASUAL_2D_ASSETS.cust_batu, arriveMode: "walk", picky: true },
      { id: "anhhoang", name: "Anh Hoàng", age: 35, job: "Quản lý VIP", avatar: "🕵️‍♂️", portrait: CASUAL_2D_ASSETS.cust_anhhoang, arriveMode: "bike", picky: true, vip: true },
      { id: "ship_xanh", name: "Shipper Xanh", age: 26, job: "Đơn App", avatar: "🛵", portrait: CASUAL_2D_ASSETS.cust_ship_xanh, arriveMode: "bike", isShipper: true, shipperBadge: "🛵 Xanh", shipperColor: "bg-emerald-600 text-white" },
      { id: "ship_vang", name: "Shipper Vàng", age: 29, job: "Đơn App", avatar: "🛵", portrait: CASUAL_2D_ASSETS.cust_ship_vang, arriveMode: "bike", isShipper: true, shipperBadge: "🛵 Vàng", shipperColor: "bg-amber-500 text-amber-950" },
      { id: "ship_cam", name: "Shipper Cam", age: 24, job: "Đơn App", avatar: "🛵", portrait: CASUAL_2D_ASSETS.cust_ship_cam, arriveMode: "bike", isShipper: true, shipperBadge: "🛵 Cam", shipperColor: "bg-orange-600 text-white" },
      { id: "david_tay", name: "David Tây Balo", age: 28, job: "Du khách Bùi Viện", avatar: "👱‍♂️", portrait: CASUAL_2D_ASSETS.cust_david, arriveMode: "walk", vip: true },
      { id: "codao", name: "Bảo Ngọc TikTok", age: 21, job: "TikToker Triệu View", avatar: "🤳", portrait: CASUAL_2D_ASSETS.cust_codao, arriveMode: "bike", picky: true, vip: true },
      { id: "nam_streamer", name: "Nam Gaming", age: 22, job: "Phát Trực Tiếp Đêm", avatar: "🎧", portrait: CASUAL_2D_ASSETS.cust_nam, arriveMode: "bike", vip: true },
      { id: "ship_be", name: "Shipper Xanh Biển", age: 25, job: "Đơn App Siêu Tốc", avatar: "🛵", portrait: CASUAL_2D_ASSETS.cust_ship_be, arriveMode: "bike", isShipper: true, shipperBadge: "🛵 Biển", shipperColor: "bg-sky-600 text-white" },
      // 30 KHÁCH HÀNG MỚI ĐA DẠNG (BANANA 2D PORTRAITS)
      { id: "nusinh_aodai", name: "Ngọc Trâm", age: 17, job: "Nữ sinh Áo dài", avatar: "👧", portrait: CASUAL_2D_ASSETS.cust_nusinh_aodai, arriveMode: "walk" },
      { id: "namsinh_chuyen", name: "Gia Huy", age: 16, job: "Nam sinh trường Chuyên", avatar: "👦", portrait: CASUAL_2D_ASSETS.cust_namsinh_chuyen, arriveMode: "walk" },
      { id: "sv_kientruc", name: "Hoàng Khang", age: 21, job: "SV Kiến trúc", avatar: "🎨", portrait: CASUAL_2D_ASSETS.cust_sv_kientruc, arriveMode: "walk" },
      { id: "sv_nhacvien", name: "Khánh Vy", age: 20, job: "SV Nhạc viện", avatar: "🎸", portrait: CASUAL_2D_ASSETS.cust_sv_nhacvien, arriveMode: "walk" },
      { id: "capdoi_hocthem", name: "Minh & Thư", age: 17, job: "Cặp đôi học thêm", avatar: "👫", portrait: CASUAL_2D_ASSETS.cust_capdoi_hocthem, arriveMode: "bike" },
      { id: "clb_hiphop", name: "Ken B-Boy", age: 19, job: "CLB Nhảy Hip-hop", avatar: "🧢", portrait: CASUAL_2D_ASSETS.cust_clb_hiphop, arriveMode: "walk" },
      { id: "ketoan_truong", name: "Chị Mai Kế Toán", age: 36, job: "Kế toán trưởng", avatar: "👩‍💼", portrait: CASUAL_2D_ASSETS.cust_ketoan_truong, arriveMode: "bike", picky: true },
      { id: "anh_it", name: "Tuấn Dev", age: 27, job: "Lập trình viên IT", avatar: "💻", portrait: CASUAL_2D_ASSETS.cust_anh_it, arriveMode: "bike" },
      { id: "nv_nganhang", name: "Thanh Hà", age: 26, job: "Giao dịch viên NH", avatar: "🏦", portrait: CASUAL_2D_ASSETS.cust_nv_nganhang, arriveMode: "bike", picky: true },
      { id: "chuyenvien_bds", name: "Đức Thịnh BĐS", age: 31, job: "Chuyên viên BĐS", avatar: "👔", portrait: CASUAL_2D_ASSETS.cust_chuyenvien_bds, arriveMode: "bike", vip: true },
      { id: "cogiao_mamnon", name: "Cô Thảo Mầm Non", age: 25, job: "Giáo viên mầm non", avatar: "👩‍🏫", portrait: CASUAL_2D_ASSETS.cust_cogiao_mamnon, arriveMode: "walk" },
      { id: "tiepvien_hk", name: "Quỳnh Châu", age: 28, job: "Tiếp viên hàng không", avatar: "✈️", portrait: CASUAL_2D_ASSETS.cust_tiepvien_hk, arriveMode: "bike", vip: true, picky: true },
      { id: "vlogger_amthuc", name: "Hải Đăng Review", age: 24, job: "Nhà Sáng Tạo Ẩm Thực", avatar: "📹", portrait: CASUAL_2D_ASSETS.cust_vlogger_amthuc, arriveMode: "bike", vip: true, picky: true },
      { id: "streamer_game", name: "Linh Caster", age: 23, job: "Người Phát Trực Tiếp", avatar: "🎧", portrait: CASUAL_2D_ASSETS.cust_streamer_game, arriveMode: "bike", vip: true },
      { id: "photographer", name: "Kiệt Photo", age: 29, job: "Nhiếp ảnh dạo phố", avatar: "📷", portrait: CASUAL_2D_ASSETS.cust_photographer, arriveMode: "walk" },
      { id: "dancer_kpop", name: "Yến Nhi Dancer", age: 20, job: "Vũ công K-Pop", avatar: "💃", portrait: CASUAL_2D_ASSETS.cust_dancer_kpop, arriveMode: "walk" },
      { id: "tiktok_mukbang", name: "Béo Hảo Ăn", age: 22, job: "Thánh Ăn Đêm", avatar: "🤩", portrait: CASUAL_2D_ASSETS.cust_tiktok_mukbang, arriveMode: "bike", vip: true },
      { id: "dj_catoi", name: "DJ Mie Sài Gòn", age: 25, job: "DJ Phố đêm", avatar: "🎛️", portrait: CASUAL_2D_ASSETS.cust_dj_catoi, arriveMode: "bike", vip: true },
      { id: "co_veso", name: "Cô Sáu Vé Số", age: 52, job: "Bán vé số dạo", avatar: "👒", portrait: CASUAL_2D_ASSETS.cust_co_veso, arriveMode: "walk" },
      { id: "chu_xeom", name: "Chú Bảy Xe Ôm", age: 56, job: "Tài xế xe ôm", avatar: "🛵", portrait: CASUAL_2D_ASSETS.cust_chu_xeom, arriveMode: "bike" },
      { id: "tho_suaxe", name: "Anh Tùng Sửa Xe", age: 33, job: "Thợ máy đầu hẻm", avatar: "🔧", portrait: CASUAL_2D_ASSETS.cust_tho_suaxe, arriveMode: "walk" },
      { id: "chutiem_nail", name: "Chị Phượng Nail", age: 34, job: "Chủ tiệm Nail", avatar: "💅", portrait: CASUAL_2D_ASSETS.cust_chutiem_nail, arriveMode: "bike", picky: true, vip: true },
      { id: "bac_baove", name: "Bác Năm Bảo Vệ", age: 61, job: "Bảo vệ khu phố", avatar: "👮‍♂️", portrait: CASUAL_2D_ASSETS.cust_bac_baove, arriveMode: "walk" },
      { id: "tieuthuong_bt", name: "Cô Lan Bến Thành", age: 48, job: "Tiểu thương chợ", avatar: "🛍️", portrait: CASUAL_2D_ASSETS.cust_tieuthuong_bt, arriveMode: "bike", picky: true, vip: true },
      { id: "ship_shopeefood", name: "Shipper Đỏ Cam", age: 24, job: "Đơn App Siêu Tốc", avatar: "🛵", portrait: CASUAL_2D_ASSETS.cust_ship_shopeefood, arriveMode: "bike", isShipper: true, shipperBadge: "🛵 Đỏ Cam", shipperColor: "bg-red-600 text-white" },
      { id: "ship_befood", name: "Shipper Vàng Xanh", age: 27, job: "Đơn App Giờ Cao Điểm", avatar: "🛵", portrait: CASUAL_2D_ASSETS.cust_ship_befood, arriveMode: "bike", isShipper: true, shipperBadge: "🛵 BeFood", shipperColor: "bg-yellow-400 text-slate-950" },
      { id: "khach_taybalo", name: "Alex Tây Balo", age: 29, job: "Khách Tây Bùi Viện", avatar: "🎒", portrait: CASUAL_2D_ASSETS.cust_khach_taybalo, arriveMode: "walk", vip: true },
      { id: "dukhach_han", name: "Ji-Hoon Hàn Quốc", age: 26, job: "Du khách Seoul", avatar: "🇰🇷", portrait: CASUAL_2D_ASSETS.cust_dukhach_han, arriveMode: "walk", vip: true },
      { id: "chu_vietkieu", name: "Chú Lý Việt Kiều", age: 59, job: "Việt kiều về thăm quê", avatar: "🕶️", portrait: CASUAL_2D_ASSETS.cust_chu_vietkieu, arriveMode: "bike", vip: true },
      { id: "giadinh_daopho", name: "Gia Đình Bé Bo", age: 32, job: "Gia đình dạo phố", avatar: "👨‍👩‍👦", portrait: CASUAL_2D_ASSETS.cust_giadinh_daopho, arriveMode: "walk", vip: true }
    ];

    const MAX_PLAYER_LEVEL = 80;
    const MAX_LEDGER_DAYS = 7;

    const LEVEL_DATA = Array.from({ length: MAX_PLAYER_LEVEL }, (_, idx) => {
      const lvl = idx + 1;
      const xpNeed = Math.round(110 + (lvl * 52) + Math.pow(lvl, 1.80) * 13);
      let title = "Xe Gỗ Đầu Hẻm Q.4";
      if (lvl >= 71) title = "Truyền Nhân Học Viện Dì Tư";
      else if (lvl >= 61) title = "Đại Gia Bến Bạch Đằng";
      else if (lvl >= 45) title = "Huyền Thoại Sài Thành";
      else if (lvl >= 34) title = "Vua Xe Đẩy Phố Đi Bộ";
      else if (lvl >= 24) title = "Danh Trộn Hồ Thị Kỷ";
      else if (lvl >= 15) title = "Xe Đẩy Ngã Tư Quận 3";
      else if (lvl >= 7) title = "Trùm Ăn Vặt Cổng Trường";
      return { level: lvl, xpNeed, title };
    });

    const STORY_CHAPTERS = [
      {
        id: 1, reqLevel: 1, shortLoc: "Hẻm Q.4",
        img: CASUAL_2D_ASSETS.chap_alley,
        title: "Chương 1: Đầu Hẻm Nhỏ Quận 4 (Cấp 1–6)",
        story: "Khởi nghiệp cùng Dì Tư với chiếc xe gỗ nhỏ nơi đầu hẻm. Tiếng kéo cắt bánh tráng lách cách mỗi chiều gọi đám học trò và bà con lối xóm ghé ủng hộ.",
        goalDesc: "Bán đủ 15 phần bánh tráng cho bà con trong hẻm",
        passiveDesc: "Mở màn khởi nghiệp • Khách hàng xóm thân thiện",
        bagCapBonus: 0, priceTolBonus: 0,
        check: (s) => (s.totalSold || 0) >= 15,
        reward: 25000
      },
      {
        id: 2, reqLevel: 7, shortLoc: "Cổng Trường",
        img: CASUAL_2D_ASSETS.chap_alley,
        title: "Chương 2: Cổng Trường & Khu Nội Trú (Cấp 7–14)",
        story: "Đẩy xe ra cổng trường giờ tan tầm, học sinh ùa ra gọi món liên hồi và những tiếng chuông nổ đơn App Shipper đầu tiên bắt đầu vang lên!",
        goalDesc: "Đạt Cấp 7, mở 3 món trong Thực Đơn & bán 45 phần",
        passiveDesc: "Danh tiếng Cổng Trường: Khách chịu giá +500đ/bịch",
        bagCapBonus: 0, priceTolBonus: 500,
        check: (s) => s.level >= 7 && (s.unlockedDishes || []).length >= 3 && (s.totalSold || 0) >= 45,
        reward: 50000
      },
      {
        id: 3, reqLevel: 15, shortLoc: "Ngã Tư Q.3",
        img: CASUAL_2D_ASSETS.chap_alley,
        title: "Chương 3: Góc Ngã Tư Sầm Uất Quận 3 (Cấp 15–23)",
        story: "Chuyển ra góc ngã tư đông đúc dân văn phòng ăn xế. Quán bắt đầu đối mặt với Đoàn Kiểm Tra VSATTP, Trật tự vỉa hè và cả những xe bánh tráng nhái bảng hiệu!",
        goalDesc: "Đạt Cấp 15, có Giấy phép VSATTP & bán 110 phần",
        passiveDesc: "Danh tiếng Quận 3: Khách chịu giá +1.000đ/bịch",
        bagCapBonus: 0, priceTolBonus: 1000,
        check: (s) => s.level >= 15 && Boolean(s.licenses?.lic_vsattp) && (s.totalSold || 0) >= 110,
        reward: 95000
      },
      {
        id: 4, reqLevel: 24, shortLoc: "Hồ Thị Kỷ",
        img: CASUAL_2D_ASSETS.chap_nightstreet,
        title: "Chương 4: Phố Ẩm Thực Đêm Hồ Thị Kỷ (Cấp 24–33)",
        story: "Giữa rừng đèn lồng và khói nướng thơm lừng của phố ẩm thực đêm, các Food Reviewer và TikToker liên tục ghé quay cận cảnh từng mẻ bánh tráng trộn của bạn!",
        goalDesc: "Đạt Cấp 24, nâng 2 mục Hút Khách lên Cấp 3+ & bán 220 phần",
        passiveDesc: "Danh tiếng Hồ Thị Kỷ: Khách chịu giá +1.500đ/bịch",
        bagCapBonus: 0, priceTolBonus: 1500,
        check: (s) => s.level >= 24 && Object.values(s.equipLevels || {}).filter(v => v >= 3).length >= 2 && (s.totalSold || 0) >= 220,
        reward: 160000
      },
      {
        id: 5, reqLevel: 34, shortLoc: "Phố Đi Bộ",
        img: CASUAL_2D_ASSETS.chap_nightstreet,
        title: "Chương 5: Phố Đi Bộ Nguyễn Huệ Cuối Tuần (Cấp 34–44)",
        story: "Đỉnh cao xe đẩy phố đêm Sài Gòn! Khách du lịch, giới trẻ và các đơn đặt tiệc văn phòng dồn dập tìm đến chiếc xe bánh tráng sáng rực ánh đèn.",
        goalDesc: "Đạt Cấp 34, mở 8 món, thuê đủ 4 Phụ Bếp & bán 380 phần",
        passiveDesc: "Danh tiếng Phố Đi Bộ: Khách chịu giá +2.000đ/bịch",
        bagCapBonus: 0, priceTolBonus: 2000,
        check: (s) => s.level >= 34 && (s.unlockedDishes || []).length >= 8 && s.staff?.beti && s.staff?.mylan && s.staff?.tunghia && s.staff?.anhba && (s.totalSold || 0) >= 380,
        reward: 260000
      },
      {
        id: 6, reqLevel: 45, shortLoc: "Sài Thành",
        img: CASUAL_2D_ASSETS.chap_nightstreet,
        title: "Chương 6: Huyền Thoại Bánh Tráng Sài Thành (Cấp 45–60)",
        story: "30 năm giữ trọn chữ Tâm của Dì Tư, hương vị Mẹt Bánh Tráng Gia Truyền đã trở thành biểu tượng ẩm thực đường phố Sài Gòn!",
        goalDesc: "Đạt Cấp 45, mở 10/10 món, đạt 5/5 một nâng cấp & bán 600 phần",
        passiveDesc: "Danh tiếng Huyền Thoại: Khách chịu giá +2.500đ/bịch",
        bagCapBonus: 0, priceTolBonus: 2500,
        check: (s) => s.level >= 45 && (s.unlockedDishes || []).length >= 10 && Object.values(s.equipLevels || {}).some(v => v >= 5) && (s.totalSold || 0) >= 600,
        reward: 500000
      },
      {
        id: 7, reqLevel: 61, shortLoc: "Bến Bạch Đằng",
        img: CASUAL_2D_ASSETS.chap_bachdang,
        title: "Chương 7: Bến Bạch Đằng & Du Thuyền Sông Sài Gòn (Cấp 61–70)",
        story: "Tiếng thơm bánh tráng Dì Tư lan ra Bến Bạch Đằng lộng gió, phục vụ du khách quốc tế và các buổi tiệc du thuyền đêm!",
        goalDesc: "Đạt Cấp 61, nâng Quy Mô Bậc 3+ & bán 950 phần",
        passiveDesc: "Danh tiếng Bến Bạch Đằng: Khách chịu giá +3.000đ/bịch",
        bagCapBonus: 0, priceTolBonus: 3000,
        check: (s) => s.level >= 61 && Number(s.shopScale || 0) >= 3 && (s.totalSold || 0) >= 950,
        reward: 800000
      },
      {
        id: 8, reqLevel: 71, shortLoc: "Học Viện Dì Tư",
        img: CASUAL_2D_ASSETS.chap_academy,
        title: "Chương 8: Di Sản Ẩm Thực & Học Viện Truyền Nghề Dì Tư (Cấp 71–80)",
        story: "Bạn cùng Dì Tư sáng lập Học Viện Truyền Nghề Bánh Tráng Sài Gòn, đưa thức quà vặt vỉa hè thành di sản ẩm thực!",
        goalDesc: "Đạt Cấp 71, nâng Quy Mô Bậc 5+, mở 2 Chi nhánh & bán 1.400 phần",
        passiveDesc: "Danh tiếng Truyền Nghề: Khách chịu giá +3.500đ/bịch",
        bagCapBonus: 0, priceTolBonus: 3500,
        check: (s) => s.level >= 71 && Number(s.shopScale || 0) >= 5 && Object.values(s.franchises || {}).filter(v => v >= 1).length >= 2 && (s.totalSold || 0) >= 1400,
        reward: 1500000
      }
    ];

    function getCurrentChapterObj(s = state) {
      const lvl = s.level || 1;
      let cur = STORY_CHAPTERS[0];
      for (const ch of STORY_CHAPTERS) {
        if (lvl >= ch.reqLevel) cur = ch;
      }
      return cur;
    }

    // 4 Phụ Bếp chuyên trách tốc độ làm bánh B1 - B2 - B3 & giữ trật tự (Huấn luyện 1⭐ -> 5⭐)
    const STAFF_CATALOG = [
      {
        id: "beti", name: "Phụ Bếp Bé Tí", avatar: "👦", portrait: CASUAL_2D_ASSETS.staff_beti,
        reqLevel: 8, hireCost: 120000, dailyWage: 22000, stepRole: "Bước 1 (Cắt Bánh)",
        role: "Khi bạn chọn đúng Món + Topping, Bé Tí tự cắt bánh Bước 1 & chạy mua bù hàng thiếu!",
        starPerk: (star) => `Tự cắt B1 trong ${Math.max(120, 460 - star * 70)}ms • Mua bù hàng thiếu ${star >= 4 ? 'rẻ hơn chợ -' + ((star - 3) * 8) + '%' : '+' + Math.max(0, 30 - star * 8) + '%'}`
      },
      {
        id: "mylan", name: "Phụ Việc Mỹ Lan", avatar: "👧", portrait: CASUAL_2D_ASSETS.staff_mylan,
        reqLevel: 14, hireCost: 240000, dailyWage: 34000, stepRole: "Sơ Chế & Bước 2",
        role: "Mỗi sáng tự làm xong 3/3 món Sơ Chế (khi đi làm) & tự động rưới sốt Bước 2!",
        starPerk: (star) => `Tự rưới sốt B2 trong ${Math.max(120, 420 - star * 60)}ms • Mỗi sáng tặng miễn phí +${star * 2} phần đồ tươi!`
      },
      {
        id: "tunghia", name: "Bảo Vệ Tư Nghĩa", avatar: "👮‍♂️", portrait: CASUAL_2D_ASSETS.staff_tunghia,
        reqLevel: 20, hireCost: 350000, dailyWage: 32000, stepRole: "Trông Xe & Giữ Khách",
        role: "Giữ trật tự vỉa hè, tăng kiên nhẫn khách đứng đợi & khéo miệng giữ chân khách!",
        starPerk: (star) => `Khách kiên nhẫn +${20 + star * 5}% • Giảm ${star * 12}% tỷ lệ khách bỏ đi khi giá bán cao!`
      },
      {
        id: "kimngan", name: "Thu Ngân Kim Ngân", avatar: "👩‍💼", portrait: CASUAL_2D_ASSETS.staff_kimngan,
        reqLevel: 25, hireCost: 420000, dailyWage: 36000, stepRole: "Thu Ngân & Thuế",
        role: "Kiểm tiền & quét QR: Chặn khách đưa thiếu tiền, thưởng làm tròn & giảm thuế cuối ngày!",
        starPerk: (star) => star < 3
          ? `Chặn ${star === 1 ? 65 : 85}% nguy cơ khách đưa thiếu tiền / lỗi QR`
          : `Chặn 100% khách đưa thiếu tiền${star >= 4 ? ' • Boa +' + formatVND(star === 5 ? 1500 : 1000) + '/đơn 5⭐' : ''}${star >= 5 ? ' • Thuế -15%' : ''}`
      },
      {
        id: "anhba", name: "Đầu Bếp Anh Ba", avatar: "🧑‍🍳", portrait: CASUAL_2D_ASSETS.staff_anhba,
        reqLevel: 29, hireCost: 560000, dailyWage: 48000, stepRole: "Bước 3 (Trộn/Cuộn/Nướng)",
        role: "Thợ chính đứng bếp: Tự làm Bước 3 dừng chuẩn ngay Tâm Chuẩn Vị 5⭐!",
        starPerk: (star) => `Canh chuẩn Tâm 5⭐ 100% • ${star * 15}% cơ hội tạo 'Mẻ Bánh Tuyệt Hảo' khách thưởng +4.000đ!`
      },
      {
        id: "utnhanh", name: "Tổ Trưởng Út Anh", avatar: "⚡", portrait: CASUAL_2D_ASSETS.staff_utnhanh,
        reqLevel: 36, hireCost: 680000, dailyWage: 50000, stepRole: "Điều Phối Món & Topping",
        role: "Khi chọn khách, tự nhận diện đúng Món & bật đủ Topping (Rau/Hành/Ớt/Trà Tắc)!",
        starPerk: (star) => `Tự chọn Món & Topping sau ${Math.max(110, 420 - star * 60)}ms • Tự khớp khi khách đổi ý • Phí sàn -${star}%`
      },
      {
        id: "baoloc", name: "Quản Lý Tiếp Thị Gia Bảo", avatar: "📣", portrait: CASUAL_2D_ASSETS.staff_baoloc,
        reqLevel: 44, hireCost: 820000, dailyWage: 54000, stepRole: "Tối Ưu Quảng Cáo & Voucher",
        role: "Chuyên gia truyền thông: Giảm chi phí chạy Chiến dịch Tiếp thị & tăng khách từ Voucher!",
        starPerk: (star) => `Giảm ${star * 5}% chi phí Chiến dịch Tiếp thị • Tăng +${star} bịch khách/ngày & +${star * 4}% hiệu quả Voucher!`
      }
    ];

    const SALES_STRATEGIES = [
      {
        id: "flyer_tea", name: "Phát Tờ Rơi & Trà Đá Đầu Hẻm", icon: "🎟️", img: CASUAL_2D_ASSETS.strat_flyer,
        reqLevel: 5, cost: 35000,
        shortDesc: "+3 bịch hôm nay • Khách kiên nhẫn +20%",
        bagBonus: 3, patienceBonus: 0.20, featuredWeightMult: 1.0, comboBoost: 0, vipBoost: 0, priceTol: 0, forceRushEvent: false
      },
      {
        id: "flash_featured", name: "Flash Sale Đẩy Top Món Tủ", icon: "🔥", img: CASUAL_2D_ASSETS.strat_combo,
        reqLevel: 12, cost: 60000,
        shortDesc: "60%+ khách gọi Món Nổi Bật • Thưởng mốc 8/8 x2 (+30k)",
        bagBonus: 1, patienceBonus: 0, featuredWeightMult: 3.2, comboBoost: 0.10, vipBoost: 0, priceTol: 0, forceRushEvent: false
      },
      {
        id: "office_combo", name: "Combo Mua Chung Văn Phòng", icon: "🍱", img: CASUAL_2D_ASSETS.strat_combo,
        reqLevel: 20, cost: 90000,
        shortDesc: "Khách mua Combo 2–3 bịch +35% • Phí túi -20%",
        bagBonus: 2, patienceBonus: 0.05, featuredWeightMult: 1.0, comboBoost: 0.35, vipBoost: 0.10, priceTol: 500, forceRushEvent: false
      },
      {
        id: "vip_livestream", name: "Book Đoàn Review & Khách VIP", icon: "🎥", img: CASUAL_2D_ASSETS.strat_flyer,
        reqLevel: 30, cost: 140000,
        shortDesc: "Khách VIP x2 • Chịu giá +1.5k • Nổ 1 Sự Kiện Cao Điểm!",
        bagBonus: 2, patienceBonus: 0.10, featuredWeightMult: 1.2, comboBoost: 0.15, vipBoost: 0.35, priceTol: 1500, forceRushEvent: true
      }
    ];

    // 6 Bậc Tiến Hóa Mặt Bằng Chính (Tặng thưởng Hợp Đồng Đặt Tiệc cuối ngày + Định giá BXH +15%)
    const SHOP_SCALE_TIERS = [
      {
        tier: 0, icon: "🛒", badge: "🛒 Xe Gỗ", img: CASUAL_2D_ASSETS.upg_signbox,
        name: "Xe Đẩy Gỗ Khởi Nghiệp", cost: 0, reqLevel: 1, contractBonus: 0,
        wearFactor: 1.0, priceTol: 0, comboBoost: 0, vipBoost: 0, bulkBonus: 0,
        perkText: "Mặc định khởi nghiệp"
      },
      {
        tier: 1, icon: "🦾", badge: "🦾 Xe Inox Đôi", img: CASUAL_2D_ASSETS.scale_1,
        name: "Bậc 1: Xe Đẩy Inox Gia Cố Đôi", cost: 500000, reqLevel: 12, contractBonus: 10000,
        wearFactor: 0.72, priceTol: 0, comboBoost: 0.03, vipBoost: 0.05, bulkBonus: 0.15,
        perkText: "Chống hao mòn -28% • Định giá BXH +15% • Thưởng +10k/tối"
      },
      {
        tier: 2, icon: "🏪", badge: "🏪 Kiot Góc Phố", img: CASUAL_2D_ASSETS.scale_2,
        name: "Bậc 2: Gian Hàng Kiot Góc Phố", cost: 1500000, reqLevel: 25, contractBonus: 20000,
        wearFactor: 0.52, priceTol: 500, comboBoost: 0.05, vipBoost: 0.10, bulkBonus: 0.25,
        perkText: "Chống hao mòn -48% • Định giá BXH +15% • Thưởng +20k/tối"
      },
      {
        tier: 3, icon: "🏬", badge: "🏬 Tiệm Máy Lạnh", img: CASUAL_2D_ASSETS.scale_3,
        name: "Bậc 3: Tiệm Bánh Tráng Máy Lạnh", cost: 4000000, reqLevel: 40, contractBonus: 32000,
        wearFactor: 0.34, priceTol: 1000, comboBoost: 0.07, vipBoost: 0.15, bulkBonus: 0.35,
        perkText: "Chống hao mòn -66% • Định giá BXH +15% • Thưởng +32k/tối"
      },
      {
        tier: 4, icon: "🏮", badge: "🏮 Nhà Hàng 2 Tầng", img: CASUAL_2D_ASSETS.scale_4,
        name: "Bậc 4: Nhà Hàng Đặc Sản 2 Tầng", cost: 9000000, reqLevel: 52, contractBonus: 45000,
        wearFactor: 0.18, priceTol: 1500, comboBoost: 0.09, vipBoost: 0.20, bulkBonus: 0.50,
        perkText: "Chống hao mòn -82% • Định giá BXH +15% • Thưởng +45k/tối"
      },
      {
        tier: 5, icon: "🏢", badge: "🏢 Tòa Nhà Dì Tư", img: CASUAL_2D_ASSETS.scale_5,
        name: "Bậc 5: Tòa Nhà Ẩm Thực Dì Tư", cost: 20000000, reqLevel: 64, contractBonus: 60000,
        wearFactor: 0.07, priceTol: 2000, comboBoost: 0.11, vipBoost: 0.25, bulkBonus: 0.65,
        perkText: "Chống hao mòn -93% • Định giá BXH +15% • Thưởng +60k/tối"
      },
      {
        tier: 6, icon: "👑", badge: "👑 Tập Đoàn Sài Thành", img: CASUAL_2D_ASSETS.scale_6,
        name: "Bậc 6: Tập Đoàn Bánh Tráng Sài Thành", cost: 45000000, reqLevel: 75, contractBonus: 80000,
        wearFactor: 0, priceTol: 2500, comboBoost: 0.14, vipBoost: 0.32, bulkBonus: 0.85,
        perkText: "Miễn 100% hao mòn • Định giá BXH +15% • Thưởng +80k/tối"
      }
    ];

    const SUPPLY_WORKSHOPS = [
      {
        id: "ws_tayninh", name: "Lò Bánh Tráng Tây Ninh", img: CASUAL_2D_ASSETS.ws_tay_ninh,
        reqLevels: [22, 34, 48], costs: [600000, 1200000, 2400000],
        targetIngs: ["banhtrang", "muoitom", "dauphong"],
        discPcts: [0, 4, 8, 12],
        effectLine: (lvl) => lvl < 3
          ? `Giá Bánh tráng, Muối, Đậu: -${[0,4,8,12][lvl]}% ➔ -${[0,4,8,12][lvl+1]}%`
          : `Đạt đỉnh: -12% giá Bánh tráng, Muối tôm & Đậu phộng`
      },
      {
        id: "ws_tiengiang", name: "Vườn Xoài & Tắc Tiền Giang", img: CASUAL_2D_ASSETS.ws_tien_giang,
        reqLevels: [28, 40, 54], costs: [900000, 1800000, 3600000],
        targetIngs: ["xoai", "tratac", "trungcut"],
        discPcts: [0, 4, 8, 12],
        effectLine: (lvl) => lvl < 3
          ? `Giá Xoài, Trà tắc, Trứng: -${[0,4,8,12][lvl]}% ➔ -${[0,4,8,12][lvl+1]}%${lvl + 1 === 3 ? ' & +1N HSD' : ''}`
          : `Đạt đỉnh: -12% giá đồ tươi & +1 ngày HSD`
      },
      {
        id: "ws_khobo", name: "Xưởng Khô Bò & Tép Mỡ", img: CASUAL_2D_ASSETS.ws_kho_bo,
        reqLevels: [35, 48, 62], costs: [1400000, 2800000, 5500000],
        targetIngs: ["khobo", "tepmo", "sotbo"],
        discPcts: [0, 5, 9, 14],
        effectLine: (lvl) => lvl < 3
          ? `Giá Khô bò, Tép mỡ, Sốt bơ: -${[0,5,9,14][lvl]}% ➔ -${[0,5,9,14][lvl+1]}%`
          : `Đạt đỉnh: -14% giá Khô bò, Tép mỡ & Sốt bơ`
      }
    ];

    const FRANCHISE_BRANCHES = [
      {
        id: "fr_benthanh", name: "Chi Nhánh Chợ Bến Thành", img: CASUAL_2D_ASSETS.fran_benthanh,
        reqLevel: 30, costs: [1200000, 700000, 1100000, 1600000, 2200000],
        dailyPayouts: [0, 15000, 22000, 30000, 40000, 52000]
      },
      {
        id: "fr_buivien", name: "Chi Nhánh Phố Tây Bùi Viện", img: CASUAL_2D_ASSETS.fran_buivien,
        reqLevel: 42, costs: [2400000, 1300000, 2000000, 2800000, 3800000],
        dailyPayouts: [0, 25000, 35000, 48000, 62000, 80000]
      },
      {
        id: "fr_thuthiem", name: "Chi Nhánh Bờ Sông Thủ Thiêm", img: CASUAL_2D_ASSETS.fran_thuthiem,
        reqLevel: 54, costs: [4500000, 2400000, 3600000, 5000000, 6800000],
        dailyPayouts: [0, 38000, 52000, 70000, 90000, 115000]
      },
      {
        id: "fr_landmark", name: "Chi Nhánh Landmark 81", img: CASUAL_2D_ASSETS.fran_landmark,
        reqLevel: 64, costs: [8500000, 4200000, 6200000, 8800000, 12000000],
        dailyPayouts: [0, 55000, 75000, 98000, 125000, 160000]
      },
      {
        id: "fr_airport", name: "Quầy Sân Bay Tân Sơn Nhất", img: CASUAL_2D_ASSETS.fran_airport,
        reqLevel: 72, costs: [15000000, 7500000, 11000000, 15000000, 20000000],
        dailyPayouts: [0, 80000, 110000, 145000, 185000, 230000]
      }
    ];

    const DECOR_CATALOG = [
      { id: "light_lantern", slot: "lights", slotLabel: "1. Dây Đèn Nóc Xe", icon: "🏮", img: CASUAL_2D_ASSETS.dec_lantern, name: "Dây Đèn Lồng Hội An", cost: 180000, desc: "Đèn lồng đỏ vàng đung đưa trên nóc sân khấu", previewEmojis: ["🏮", "✨", "🏮", "✨", "🏮", "✨", "🏮"] },
      { id: "light_firefly", slot: "lights", slotLabel: "1. Dây Đèn Nóc Xe", icon: "✨", img: CASUAL_2D_ASSETS.dec_lantern, name: "Đèn Đom Đóm Đà Lạt", cost: 250000, desc: "Dải đèn vàng ấm áp lấp lánh dọc mái hiên", previewEmojis: ["🌟", "💡", "✨", "🌟", "💡", "✨", "🌟"] },
      { id: "light_neon", slot: "lights", slotLabel: "1. Dây Đèn Nóc Xe", icon: "💜", img: CASUAL_2D_ASSETS.dec_neon, name: "Đèn Ánh Tím Phố Đêm", cost: 320000, desc: "Viền Neon tím hồng phát sáng quanh sân khấu", previewEmojis: ["💜", "⚡", "💙", "💖", "⚡", "💜", "💙"] },
      { id: "light_tet", slot: "lights", slotLabel: "1. Dây Đèn Nóc Xe", icon: "🌸", img: CASUAL_2D_ASSETS.dec_lixi, name: "Dây Pháo & Hoa Mai Tết", cost: 450000, desc: "Dây pháo đỏ và hoa mai vàng rực rỡ lễ hội", previewEmojis: ["🧧", "🌸", "🧨", "🌼", "🧨", "🌸", "🧧"] },

      { id: "sign_retro90", slot: "sign", slotLabel: "2. Bảng Hiệu Quán", icon: "🎨", img: CASUAL_2D_ASSETS.dec_sign_retro, name: "Bảng Hiệu Vẽ Tay 1990", cost: 220000, desc: "Nền xanh chữ vàng viền đỏ hoài cổ", cssClass: "sign-skin-retro90" },
      { id: "sign_wood", slot: "sign", slotLabel: "2. Bảng Hiệu Quán", icon: "🪵", img: CASUAL_2D_ASSETS.dec_sign_retro, name: "Bảng Gỗ Trầm Khắc Nổi", cost: 350000, desc: "Bảng gỗ trầm hương chạm khắc sang trọng", cssClass: "sign-skin-wood" },
      { id: "sign_led", slot: "sign", slotLabel: "2. Bảng Hiệu Quán", icon: "🌈", img: CASUAL_2D_ASSETS.dec_neon, name: "Bảng Điện Tử Ánh Sao", cost: 520000, desc: "Bảng điện tử nền tối phát sáng xanh hồng", cssClass: "sign-skin-led" },
      { id: "sign_royal", slot: "sign", slotLabel: "2. Bảng Hiệu Quán", icon: "👑", img: CASUAL_2D_ASSETS.asset_trophy, name: "Bảng Hiệu Mạ Vàng 24K", cost: 880000, desc: "Bảng hiệu vương giả ánh kim lấp lánh", cssClass: "sign-skin-royal" },

      { id: "prop_cat", slot: "prop", slotLabel: "3. Linh Vật Góc Xe", icon: "🐱", img: CASUAL_2D_ASSETS.dec_cat, name: "Mèo Thần Tài Vẫy Tay", cost: 260000, desc: "Mèo vàng chiêu tài vẫy tay trên bảng hiệu", badgeEmoji: "🐱✨" },
      { id: "prop_mai", slot: "prop", slotLabel: "3. Linh Vật Góc Xe", icon: "🌼", img: CASUAL_2D_ASSETS.dec_mai, name: "Chậu Mai Vàng Đại Lộc", cost: 380000, desc: "Chậu bonsai mai vàng nở rộ đầu xe", badgeEmoji: "🌼🪴" },
      { id: "prop_speaker", slot: "prop", slotLabel: "3. Linh Vật Góc Xe", icon: "🔊", img: CASUAL_2D_ASSETS.dec_speaker, name: "Loa Kẹo Kéo Sài Gòn", cost: 420000, desc: "Thùng loa đường phố phát nốt nhạc vui mắt", badgeEmoji: "🔊🎵" },
      { id: "prop_dragon", slot: "prop", slotLabel: "3. Linh Vật Góc Xe", icon: "🐉", img: CASUAL_2D_ASSETS.dec_dragon, name: "Kỳ Lân Vàng Thịnh Vượng", cost: 750000, desc: "Linh vật phong thủy mạ vàng sang trọng", badgeEmoji: "🐉👑" },

      { id: "table_marble", slot: "table", slotLabel: "4. Bàn & Thau Trộn", icon: "💎", img: CASUAL_2D_ASSETS.dec_marble, name: "Bàn Đá Hoa Cương Trắng", cost: 280000, desc: "Mặt bàn cẩm thạch sáng bóng & thau viền bạc", tableClass: "worktable-skin-marble", rimColor: "#475569" },
      { id: "table_bamboo", slot: "table", slotLabel: "4. Bàn & Thau Trộn", icon: "🎋", img: CASUAL_2D_ASSETS.dec_marble, name: "Bàn Tre & Thau Lá Chuối", cost: 340000, desc: "Mặt bàn tre xanh mộc mạc thanh mát", tableClass: "worktable-skin-bamboo", rimColor: "#15803d" },
      { id: "table_ebony", slot: "table", slotLabel: "4. Bàn & Thau Trộn", icon: "🪵", img: CASUAL_2D_ASSETS.dec_marble, name: "Bàn Gỗ Mun & Thau Đồng", cost: 460000, desc: "Mặt bàn gỗ mun huyền bí & thau đồng cổ", tableClass: "worktable-skin-ebony", rimColor: "#b45309" },
      { id: "table_gold", slot: "table", slotLabel: "4. Bàn & Thau Trộn", icon: "✨", img: CASUAL_2D_ASSETS.dec_marble, name: "Bàn Hoàng Kim & Thau Vàng", cost: 950000, desc: "Bàn trộn ánh vàng & thau trộn viền vàng 24K", tableClass: "worktable-skin-gold", rimColor: "#eab308" },

      { id: "fx_lixi", slot: "particles", slotLabel: "5. Hiệu Ứng Trộn Bánh", icon: "🧧", img: CASUAL_2D_ASSETS.dec_lixi, name: "Mưa Bao Lì Xì & Vàng", cost: 300000, desc: "Bung bao lì xì đỏ và đồng vàng khi trộn bánh", burstEmojis: ["🧧", "🪙", "✨", "🎉"] },
      { id: "fx_sakura", slot: "particles", slotLabel: "5. Hiệu Ứng Trộn Bánh", icon: "🌸", img: CASUAL_2D_ASSETS.dec_mai, name: "Cánh Hoa Đào & Mai Vàng", cost: 360000, desc: "Hiệu ứng cánh hoa bay lượn quanh thau trộn", burstEmojis: ["🌸", "🌼", "💮", "✨"] },
      { id: "fx_star", slot: "particles", slotLabel: "5. Hiệu Ứng Trộn Bánh", icon: "🌈", img: CASUAL_2D_ASSETS.dec_neon, name: "Sao Băng Cầu Vồng", cost: 480000, desc: "Sao băng 7 màu lấp lánh mỗi mẻ bánh", burstEmojis: ["🌈", "🌟", "💫", "💎"] },
      { id: "fx_dragon", slot: "particles", slotLabel: "5. Hiệu Ứng Trộn Bánh", icon: "🔥", img: CASUAL_2D_ASSETS.dec_dragon, name: "Lửa Phượng Hoàng", cost: 680000, desc: "Tia lửa hoàng kim và vương miện khi chốt đơn", burstEmojis: ["🔥", "👑", "⚡", "🌟"] },

      { id: "awn_mint", slot: "awning", slotLabel: "6. Mái Hiên Đỉnh Quán", icon: "🏖️", img: CASUAL_2D_ASSETS.scale_3, name: "Mái Hiên Xanh Bạc Hà", cost: 160000, desc: "Mái hiên sọc Xanh Bạc Hà & Kem Pháp cổ", awningClass: "awning-skin-mint" },
      { id: "awn_cholon", slot: "awning", slotLabel: "6. Mái Hiên Đỉnh Quán", icon: "🏮", img: CASUAL_2D_ASSETS.scale_4, name: "Mái Hiên Tam Sắc Chợ Lớn", cost: 240000, desc: "Mái hiên Đỏ – Vàng – Xanh phố cổ Chợ Lớn", awningClass: "awning-skin-cholon" },
      { id: "awn_cyber", slot: "awning", slotLabel: "6. Mái Hiên Đỉnh Quán", icon: "🔮", img: CASUAL_2D_ASSETS.dec_neon, name: "Mái Hiên Ánh Tím Phố Đêm", cost: 340000, desc: "Mái hiên Tím – Hồng Neon nổi bật phố đêm", awningClass: "awning-skin-cyber" },
      { id: "awn_royal", slot: "awning", slotLabel: "6. Mái Hiên Đỉnh Quán", icon: "👑", img: CASUAL_2D_ASSETS.scale_6, name: "Mái Hiên Lụa Vàng Hoàng Gia", cost: 580000, desc: "Mái hiên sọc Vàng Ròng & Nâu Trầm vương giả", awningClass: "awning-skin-royal" }
    ];

    // 8 Nâng Cấp Hút Khách (marketing) & Giữ Chân Khách (comfort) - Cân bằng lượng khách chặt chẽ (+1 đến +2 bịch/cấp)
    const EQUIP_UPGRADES = [
      {
        id: "upg_maps", branch: "marketing", img: CASUAL_2D_ASSETS.upg_maps, icon: "📍",
        name: "Định Vị Bản Đồ Số & Đóng Gói", baseCost: 55000, maxLvl: 5,
        desc: "Giúp khách ở xa tìm thấy hẻm, tăng lượng khách ghé mỗi ngày.",
        effectLine: (lvl) => lvl < 5
          ? `Lượng khách: +${lvl} ➔ +${lvl + 1} bịch/ngày • Khách đến nhanh +${(lvl + 1) * 6}%`
          : `Đạt tối đa: +5 bịch/ngày • Khách tìm tới nhanh +30%`
      },
      {
        id: "upg_signbox", branch: "marketing", img: CASUAL_2D_ASSETS.upg_signbox, icon: "🪧",
        name: "Bảng Hiệu Hộp Đèn Đầu Hẻm", baseCost: 75000, maxLvl: 5,
        desc: "Mở khóa thêm chỗ khách đứng đợi cùng lúc (từ 1 chỗ lên tối đa 4 chỗ).",
        effectLine: (lvl) => {
          const curSlots = lvl >= 5 ? 4 : lvl >= 3 ? 3 : lvl >= 1 ? 2 : 1;
          const nextSlots = (lvl + 1) >= 5 ? 4 : (lvl + 1) >= 3 ? 3 : 2;
          return lvl < 5
            ? `Chỗ đợi: ${curSlots} ➔ ${nextSlots} khách • Lượng khách: +${lvl} ➔ +${lvl + 1} bịch/ngày`
            : `Đạt tối đa: Mở đủ 4 chỗ khách đợi • +6 bịch/ngày & chống quán nhái`;
        }
      },
      {
        id: "upg_appads", branch: "marketing", img: CASUAL_2D_ASSETS.upg_appads, icon: "📱",
        name: "Quảng Cáo Gian Hàng Trên App", baseCost: 95000, maxLvl: 5,
        desc: "Đẩy quán lên Top đầu ứng dụng giao đồ ăn, thêm đơn Shipper mỗi ngày.",
        effectLine: (lvl) => lvl < 5
          ? `Đơn App: +${lvl} ➔ +${lvl + 1} bịch/ngày • Phí sàn giảm còn ${20 - (lvl + 1) * 1.5}%`
          : `Đạt tối đa: +5 bịch/ngày • Đơn Shipper +35% & Phí sàn chỉ 12.5%`
      },
      {
        id: "upg_tiktoker", branch: "marketing", img: CASUAL_2D_ASSETS.upg_tiktoker, icon: "🤳",
        name: "Thuê TikToker & Food Reviewer", baseCost: 125000, maxLvl: 5,
        desc: "Mời KOC Sài Gòn quay clip review, kéo thêm khách VIP & tăng độ chịu chi.",
        effectLine: (lvl) => lvl < 5
          ? `Khách tăng: +${lvl * 2} ➔ +${(lvl + 1) * 2} bịch/ngày • Chịu giá +${(lvl + 1)}k/bịch`
          : `Đạt tối đa: +10 bịch/ngày • Khách VIP +35% & Chịu giá cao +5.000đ/bịch`
      },
      {
        id: "upg_stool", branch: "comfort", img: CASUAL_2D_ASSETS.upg_stool, icon: "🪑",
        name: "Bàn Ghế Nhựa Đỏ Vỉa Hè", baseCost: 60000, maxLvl: 5,
        desc: "Có ghế ngồi đợi đỡ mỏi chân, khách kiên nhẫn chờ lâu hơn hẳn (dễ đạt 5⭐).",
        effectLine: (lvl) => lvl < 5
          ? `Độ kiên nhẫn: +${lvl * 15}% ➔ +${(lvl + 1) * 15}% thời gian chờ`
          : `Đạt tối đa: Khách kiên nhẫn chờ lâu hơn +75%`
      },
      {
        id: "upg_neon", branch: "comfort", img: CASUAL_2D_ASSETS.upg_neon, icon: "🪭",
        name: "Quạt Phun Sương & Loa Nhạc", baseCost: 80000, maxLvl: 5,
        desc: "Thổi mát khách khó tính, tăng gọi kèm Trà Tắc & thêm điểm kinh nghiệm.",
        effectLine: (lvl) => lvl < 5
          ? `Kiên nhẫn +${(lvl + 1) * 10}% • Gọi kèm Trà Tắc +${(lvl + 1) * 8}% • XP +${(lvl + 1) * 8}%`
          : `Đạt tối đa: Kiên nhẫn +50% • Gọi Trà Tắc +40% & XP +40%`
      },
      {
        id: "upg_awning", branch: "comfort", img: CASUAL_2D_ASSETS.upg_awning, icon: "☂️",
        name: "Mái Hiên Che Mưa Nắng", baseCost: 70000, maxLvl: 5,
        desc: "Che mưa nắng kiên cố (từ Cấp 3 tự động bung bạt ngay khi trời đổ mưa).",
        effectLine: (lvl) => lvl < 5
          ? `Giảm cáu gắt mưa nắng +${(lvl + 1) * 12}% • ${(lvl + 1) >= 3 ? 'Tự động bung bạt mưa!' : 'Cấp 3 tự bung bạt mưa'}`
          : `Đạt tối đa: Tự động che mưa 100% & khách boa thêm +1.500đ ngày mưa`
      },
      {
        id: "upg_comboboard", branch: "marketing", img: CASUAL_2D_ASSETS.upg_comboboard, icon: "🍱",
        name: "Bảng Combo Ăn Vặt & Freeship", baseCost: 85000, maxLvl: 5,
        desc: "Kích thích khách mua 2–3 bịch/lượt và kéo thêm khách sỉ ăn vặt mỗi ngày.",
        effectLine: (lvl) => lvl < 5
          ? `Lượng khách: +${lvl} ➔ +${lvl + 1} bịch/ngày • Tỷ lệ khách mua x2–x3 bịch +${(lvl + 1) * 6}%`
          : `Đạt tối đa: +6 bịch/ngày • Khách rất chuộng mua Combo x2–x3 bịch (+30%)`
      },
      {
        id: "upg_cooler", branch: "comfort", img: CASUAL_2D_ASSETS.upg_cooler, icon: "🧊",
        name: "Tủ Kính Sạch & Thùng Đá", baseCost: 90000, maxLvl: 5,
        desc: "Trưng bày nguyên liệu tươi ngon, kéo dài HSD & mở rộng Tâm Chuẩn Vị 5⭐.",
        effectLine: (lvl) => lvl < 5
          ? `HSD đồ tươi +${(lvl + 1) >= 4 ? 3 : (lvl + 1) >= 2 ? 2 : 1} ngày • Dễ canh trộn 5⭐ +${(lvl + 1) * 3}%`
          : `Đạt tối đa: +3 ngày HSD, giữ 100% hàng qua đêm & dễ trộn 5⭐ +15%`
      },
      {
        id: "upg_icedtea", branch: "comfort", img: CASUAL_2D_ASSETS.upg_icedtea, icon: "🧊",
        name: "Bình Trà Đá Miễn Phí Đầu Xe", baseCost: 65000, maxLvl: 5,
        desc: "Trà đá mát lạnh miễn phí giúp khách Khó Tính & Shipper bớt gắt, tăng thiện cảm & tiền Tip.",
        effectLine: (lvl) => lvl < 5
          ? `Kiên nhẫn +${(lvl + 1) * 10}% • Chịu giá +${(lvl + 1) * 300}đ • Tip 5⭐ +${(lvl + 1) * 500}đ`
          : `Đạt tối đa: Kiên nhẫn +50% • Chịu giá +1.500đ/bịch & Tip 5⭐ +2.500đ`
      }
    ];

    const LICENSES_CATALOG = [
      {
        id: "lic_vsattp", img: CASUAL_2D_ASSETS.lic_vsattp, icon: "🧼",
        name: "Giấy Chứng Nhận VSATTP", reqLevel: 10, cost: 180000, dailyFee: 0,
        desc: "Đạt chuẩn Vệ sinh ATTP: Thưởng nóng +35.000đ & +0.12⭐ mỗi khi Đoàn Kiểm Tra ghé!"
      },
      {
        id: "lic_sidewalk", img: CASUAL_2D_ASSETS.lic_sidewalk, icon: "📐",
        name: "Hợp Đồng Thuê Vỉa Hè Đô Thị", reqLevel: 16, cost: 340000, dailyFee: 25000,
        desc: "Miễn 100% phạt trật tự đô thị, xóa phí vệ sinh lẻ & tăng độ kiên nhẫn khách +15%!"
      },
      {
        id: "lic_nightmarket", img: CASUAL_2D_ASSETS.lic_nightmarket, icon: "🏮",
        name: "Giấy Phép Họp Chợ Đêm & Lễ Hội", reqLevel: 24, cost: 520000, dailyFee: 0,
        desc: "Cho phép bán khung giờ vàng Phố Đêm: Lượng khách +3 bịch/ngày & +15% Khách VIP!"
      },
      {
        id: "lic_brand", img: CASUAL_2D_ASSETS.lic_brand, icon: "📜",
        name: "Bằng Độc Quyền Gia Truyền Dì Tư", reqLevel: 32, cost: 780000, dailyFee: 0,
        desc: "Chống xe bánh tráng nhái & khách chịu giá +1.500đ/bịch"
      },
      {
        id: "lic_app_diamond", img: CASUAL_2D_ASSETS.lic_app_diamond, icon: "🛵",
        name: "Đối Tác Kim Cương Liên Sàn App", reqLevel: 38, cost: 1200000, dailyFee: 0,
        desc: "Phí sàn App -4% & đơn Shipper mua Combo +15%"
      },
      {
        id: "lic_vietgap", img: CASUAL_2D_ASSETS.lic_vietgap, icon: "🌿",
        name: "Chứng Nhận Nguyên Liệu VietGAP", reqLevel: 45, cost: 1850000, dailyFee: 0,
        desc: "+1 ngày HSD nguyên liệu tươi & khách kiên nhẫn +15%"
      },
      {
        id: "lic_michelin", img: CASUAL_2D_ASSETS.lic_michelin, icon: "⭐",
        name: "Cẩm Nang Đường Phố Michelin Bib", reqLevel: 52, cost: 2800000, dailyFee: 0,
        desc: "Khách chịu giá +1.500đ/bịch & tiền Tip 5⭐ +20%"
      },
      {
        id: "lic_franchise", img: CASUAL_2D_ASSETS.lic_franchise, icon: "🏢",
        name: "Giấy Phép Nhượng Quyền Thương Mại", reqLevel: 58, cost: 4200000, dailyFee: 0,
        desc: "Giảm 25% thuế cuối ngày & cổ tức Chi nhánh +15%"
      },
      {
        id: "lic_export", img: CASUAL_2D_ASSETS.lic_export, icon: "✈️",
        name: "Giấy Phép Đóng Gói Xuất Khẩu", reqLevel: 66, cost: 6800000, dailyFee: 0,
        desc: "Lượng khách +2 bịch/ngày & tăng khách mua 3 bịch"
      },
      {
        id: "lic_heritage", img: CASUAL_2D_ASSETS.lic_heritage, icon: "🏛️",
        name: "Bằng Di Sản Ẩm Thực Sài Thành", reqLevel: 74, cost: 12000000, dailyFee: 0,
        desc: "Miễn 100% thuế hàng ngày & khách chịu giá +2.000đ/bịch"
      }
    ];

    const ACHIEVEMENTS_DATA = [
      { id: "ach_mix10", title: "🥇 Đôi Tay Vàng Làng Trộn", desc: "Phục vụ 5⭐ liên tiếp 10 bịch không sai sót", rewardMoney: 15000, rewardXp: 40, check: (s) => (s.maxStreak5Star || 0) >= 10 },
      { id: "ach_prep5", title: "🌶️ Bậc Thầy Sơ Chế", desc: "Hoàn thành đủ 3/3 món Sơ Chế trong 5 ngày", rewardMoney: 20000, rewardXp: 50, check: (s) => (s.totalPrepDays || 0) >= 5 },
      { id: "ach_upg5", title: "📣 Quán Đông Nườm Nượp", desc: "Nâng cấp ít nhất 2 mục Hút Khách / Giữ Chân đạt Cấp 3 trở lên", rewardMoney: 35000, rewardXp: 80, check: (s) => Object.values(s.equipLevels || {}).filter(v => v >= 3).length >= 2 },
      { id: "ach_upg10", title: "👑 Đỉnh Cao Quảng Bá Sài Gòn", desc: "Nâng cấp ít nhất 1 mục Hút Khách / Giữ Chân chạm mốc tối đa Cấp 5", rewardMoney: 75000, rewardXp: 150, check: (s) => Object.values(s.equipLevels || {}).some(v => v >= 5) },
      { id: "ach_staff_star", title: "🌟 Sư Phụ Đào Tạo Phụ Bếp", desc: "Huấn luyện ít nhất 1 Phụ Bếp đạt tay nghề 5 Sao (5⭐)", rewardMoney: 65000, rewardXp: 130, check: (s) => Object.values(s.staffStars || {}).some(v => v >= 5) },
      { id: "ach_menu10", title: "🥙 Bá Chủ Thực Đơn Sài Gòn", desc: "Mở khóa trọn bộ 10/10 món đặc sản Bánh Tráng", rewardMoney: 80000, rewardXp: 150, check: (s) => (s.unlockedDishes || []).length >= 10 },
      { id: "ach_picky10", title: "🕵️‍♂️ Khắc Tinh Khách Khó Tính", desc: "Phục vụ đạt 5⭐ cho 10 vị Khách Khó Tính", rewardMoney: 25000, rewardXp: 60, check: (s) => (s.servedPickyCount || 0) >= 10 },
      { id: "ach_viral100", title: "📱 Tiếng Lành Đồn Xa", desc: "Đạt 80%+ Độ Nổi Tiếng và phản hồi 10 bình luận của khách", rewardMoney: 30000, rewardXp: 70, check: (s) => (s.viralPct || 0) >= 80 && (s.repliedReviewsCount || 0) >= 10 },
      { id: "ach_sold100", title: "🛍️ Trăm Bịch Như Một", desc: "Tổng số phần bánh đã bán cán mốc 150 bịch", rewardMoney: 45000, rewardXp: 100, check: (s) => (s.totalSold || 0) >= 150 },
      { id: "ach_money2m", title: "💼 Triệu Phú Đi Lên Từ Vỉa Hè", desc: "Cán mốc tài sản tiền mặt 2.000.000đ", rewardMoney: 60000, rewardXp: 120, check: (s) => s.money >= 2000000 },
      { id: "ach_staff3", title: "🧑‍🍳 Đội Ngũ Phụ Bếp Hùng Hậu", desc: "Thuê đủ cả 4 nhân viên (Bé Tí, Mỹ Lan, Tư Nghĩa, Anh Ba)", rewardMoney: 45000, rewardXp: 90, check: (s) => s.staff.beti && s.staff.mylan && s.staff.tunghia && s.staff.anhba },
      { id: "ach_legend30", title: "🏆 Huyền Thoại Bánh Tráng Sài Thành", desc: "Đạt Cấp độ 45 & giữ vững đánh giá từ 4.9⭐ trở lên", rewardMoney: 150000, rewardXp: 250, check: (s) => s.level >= 45 && (s.rating || 5.0) >= 4.9 },
      { id: "ach_cashier", title: "👩‍💼 Két Vàng An Toàn Tuyệt Đối", desc: "Thuê Thu Ngân Kim Ngân và đào tạo đạt từ 3⭐ trở lên", rewardMoney: 85000, rewardXp: 140, check: (s) => Boolean(s.staff?.kimngan) && Number(s.staffStars?.kimngan || 1) >= 3 },
      { id: "ach_scale3", title: "🏬 Ông Chủ Tiệm Máy Lạnh", desc: "Nâng cấp Quy Mô Quán đạt từ Bậc 3 trở lên", rewardMoney: 220000, rewardXp: 250, check: (s) => Number(s.shopScale || 0) >= 3 },
      { id: "ach_decor6", title: "🎨 Tuyệt Tác Đường Phố Sài Gòn", desc: "Sưu tầm ít nhất 6 món Trang Trí cho quán", rewardMoney: 140000, rewardXp: 180, check: (s) => Array.isArray(s.ownedDecors) && s.ownedDecors.length >= 6 },
      { id: "ach_empire80", title: "👑 Chủ Tịch Đế Chế Bánh Tráng", desc: "Đạt Cấp 70+, mở 3 Chi nhánh và sở hữu Bằng Di Sản", rewardMoney: 600000, rewardXp: 500, check: (s) => s.level >= 70 && Boolean(s.licenses?.lic_heritage) && Object.values(s.franchises || {}).filter(v => v >= 1).length >= 3 }
    ];


        const SOCIAL_REPLY_TEMPLATES = {
      friendly: [
        "Dạ Dì cảm ơn con nhiều nghen! Lần sau ghé Dì bỏ thêm hành phi giòn rụm nha! 🥰",
        "Nghe con khen mà Dì hết mệt luôn á, mãi yêu khách ruột của quán! 💕"
      ],
      funny: [
        "Bánh tráng trộn bằng cả tính mạng, ngon nhức cái nách luôn phải hôn con! 🔥🤣",
        "Ăn 1 bịch ghiền tới sáng, nhớ rủ hội bạn ghé xe Dì ăn tiếp nha! 👑😂"
      ],
      apology: [
        "Thiệt tình xin lỗi con! Dì đã chỉnh lại khâu pha sốt rồi, mong con ủng hộ tiếp nha! 🙇‍♀️",
        "Dạ giờ cao điểm hơi cập rập, Dì xin ghi nhận góp ý để phục vụ chuẩn 5 sao ạ! 🙏"
      ],
      voucher: [
        "🎁 Dì gửi tặng con Voucher Freeship + 1 ly Trà Tắc miễn phí cho lần ghé sau nghen! 🧋🎉"
      ]
    };

    // ================= 14. 10 KỊCH BẢN SỰ KIỆN ĐỜI THƯỜNG SÀI GÒN & CAO ĐIỂM =================
    const DILEMMA_EVENTS = [
      {
        id: "wholesale_dry_deal", category: "1. Nguồn Hàng (3 Ngày)", icon: "📦", speaker: "Thương Lái Chợ Đầu Mối",
        title: "Chào Lô Đồ Khô Giá Rẻ -30% Trong 3 Ngày!",
        desc: "“Chị chủ ơi, bên em có lô Bánh tráng, Khô bò, Muối tôm rẻ hơn 30% trong 3 ngày tới, nhưng đôi khi có miếng khô bò hơi cứng nha!”",
        canTrigger: (s) => s.day >= 2,
        choiceA: {
          label: "🤝 Nhận lô hàng! (Đồ Khô -30% trong 3 ngày, 20% rủi ro khô bò cứng)",
          effect: (s) => { s.activeMultiDayEffects.cheapDryDays = 3; return "📦 Đã ký hợp đồng Đồ Khô -30% trong 3 ngày!"; }
        },
        choiceB: {
          label: "🛡️ Từ chối, giữ hàng loại 1 (+0.05⭐)",
          effect: (s) => { adjustRating(0.05); return "🛡️ Giữ chuẩn nguyên liệu loại 1 (+0.05⭐)!"; }
        }
      },
      {
        id: "app_exclusive_contract", category: "2. Chiến Lược App (3 Ngày)", icon: "🛵", speaker: "Quản Lý App Giao Đồ Ăn",
        title: "Gói Quán Yêu Thích (Giảm Phí Sàn Còn 10%)!",
        desc: "“Đóng 40.000đ kích hoạt chiến dịch Quán Yêu Thích, bên em giảm Phí Sàn xuống 10% trong 3 ngày!”",
        canTrigger: (s) => s.totalSold >= 8,
        choiceA: {
          label: "✍️ Đóng 40.000đ (Phí sàn giảm còn 10% trong 3 ngày!)",
          reqCheck: (s) => s.money >= 40000,
          lockReason: "🔒 Cần 40.000đ",
          effect: (s) => { s.money -= 40000; s.activeMultiDayEffects.appPartnerDays = 3; adjustViral(15); return "🛵 Phí sàn App giảm còn 10% trong 3 ngày!"; }
        },
        choiceB: {
          label: "😅 Chưa cần lúc này",
          effect: (s) => "Đã từ chối gói quảng cáo App."
        }
      },
      {
        id: "street_food_festival", category: "3. Lễ Hội Đường Phố (2 Ngày)", icon: "🎪", speaker: "Ban Tổ Chức Lễ Hội",
        title: "Tham Gia Phố Đêm Ẩm Thực Sài Gòn!",
        desc: "“Đóng phí gian hàng 50.000đ giúp xe bánh tráng tăng +15% giá bán mọi món và x2 Khách VIP trong 2 ngày!”",
        canTrigger: (s) => s.level >= 3,
        choiceA: {
          label: "🌟 Đóng 50.000đ (+15% giá bán & VIP x2 trong 2 ngày)",
          reqCheck: (s) => s.money >= 50000,
          lockReason: "🔒 Cần 50.000đ",
          effect: (s) => { s.money -= 50000; s.activeMultiDayEffects.streetFestDays = 2; adjustViral(20); return "🎪 Tham gia Phố Đêm! Giá bán +15% trong 2 ngày!"; }
        },
        choiceB: {
          label: "🏠 Đứng bán vị trí cũ",
          effect: (s) => "Giữ nguyên vị trí bán quen thuộc."
        }
      },
      {
        id: "cust_tiktok_storm", category: "4. Xu Hướng Tóp Tóp", icon: "🤳", speaker: "Food TikToker Sài Gòn",
        title: "TikToker Xin Quay Cận Cảnh Pha Trộn Full Topping!",
        desc: "“Dì ơi cho tụi con quay cận cảnh 1 phần full Khô bò & Trứng cút để đăng Tóp Tóp kéo khách tới xe ngay bây giờ nha!”",
        canTrigger: (s) => s.totalSold >= 5,
        choiceA: {
          label: "🌟 Tặng 2 Khô bò & 2 Trứng cút ➔ Nổ 🔥 BÃO ĐƠN TÓP TÓP (45s)",
          reqCheck: (s) => (s.stock.khobo || 0) >= 2 && (s.stock.trungcut || 0) >= 2,
          lockReason: "🔒 Cần 2 Khô bò & 2 Trứng cút",
          effect: (s) => {
            consumeStockFIFO("khobo", 2); consumeStockFIFO("trungcut", 2);
            adjustRating(0.12); adjustViral(25); addXP(25);
            activateCartBuff("tiktok_storm", "🔥 Bão Đơn Tóp Tóp (Kín 4 ô • Tip x1.5)", 45);
            for (let i = 0; i < 4; i++) { if (!customerSlots[i]) spawnCustomerIntoEmptySlot(true); }
            return "🔥 NỔ BÃO ĐƠN TÓP TÓP 45 GIÂY!";
          }
        },
        choiceB: {
          label: "😅 Từ chối để giữ nguyên liệu (-8% Viral)",
          effect: (s) => { adjustViral(-8); return "Đã từ chối quay clip (-8% Viral)."; }
        }
      },
      {
        id: "urban_patrol", category: "5. Kiểm Tra Pháp Lý", icon: "🚓", speaker: "Đoàn Kiểm Tra Liên Ngành",
        title: "Kiểm Tra Vệ Sinh ATTP & Trật Tự Vỉa Hè!",
        desc: "Đoàn kiểm tra đang chấm điểm Vệ sinh An toàn thực phẩm và trật tự vỉa hè dọc tuyến đường!",
        canTrigger: (s) => s.day >= 3,
        choiceA: {
          label: "📋 Xuất trình Giấy VSATTP / Hợp đồng vỉa hè / Bảo vệ Tư Nghĩa",
          reqCheck: (s) => Boolean(s.licenses.lic_vsattp || s.licenses.lic_sidewalk || s.staff.tunghia),
          lockReason: "🔒 Cần Giấy phép VSATTP, Vỉa hè hoặc Chú Tư Nghĩa",
          effect: (s) => { s.money += 35000; adjustRating(0.12); addXP(25); return "✅ Quán đạt chuẩn kiểu mẫu! Thưởng +35.000đ & +0.12⭐!"; }
        },
        choiceB: {
          label: "🏃 Nộp phạt hành chính (-35.000đ, Khách giảm 40s)",
          effect: (s) => { s.money = Math.max(0, s.money - 35000); activateCartBuff("alley_hide", "🚓 Tạm Lùi Vào Hẻm (Khách giảm)", 40); return "🚲 Đã nộp phạt -35.000đ."; }
        }
      },
      {
        id: "bulk_order_rush", category: "6. Thử Thách Đơn Sỉ", icon: "🏢", speaker: "Khách Sỉ Văn Phòng Q.1",
        title: "Đơn Sỉ Giờ Cao Điểm: Giao 4 Phần Trong 25 Giây!",
        desc: "“Phòng mình đặt gấp 4 phần bánh tráng trong 25 giây tới. Giao kịp thưởng nóng +45.000đ, trễ giờ hủy đơn lỗ -30.000đ nha!”",
        canTrigger: (s) => s.totalSold >= 6 && (!bulkOrderChallenge || !bulkOrderChallenge.active),
        choiceA: {
          label: "🔥 Nhận Đơn Sỉ! (25s: Thưởng +45.000đ / Trễ lỗ -30.000đ)",
          reqCheck: (s) => (s.stock.banhtrang || 0) >= 4,
          lockReason: "🔒 Cần ít nhất 4 Bánh tráng",
          effect: (s) => { startBulkOrderChallenge(4, 25, 45000); return "⏱️ ĐỒNG HỒ 25 GIÂY ĐÃ CHẠY!"; }
        },
        choiceB: {
          label: "😅 Từ chối đơn sỉ",
          effect: (s) => "Đã từ chối đơn sỉ để phục vụ khách lẻ."
        }
      },
      {
        id: "film_crew_catering", category: "7. Đoàn Phim Đêm", icon: "🎬", speaker: "Đạo Diễn Đoàn Phim Sài Gòn",
        title: "Đoàn Phim Đặt Gấp 6 Phần Bánh Tráng & Sốt Bơ!",
        desc: "“Đoàn phim đang quay cảnh đêm ở hẻm bên cạnh, cần gấp 6 phần Bánh tráng kèm Sốt bơ. Giao ngay nhận 160.000đ tiền mặt!”",
        canTrigger: (s) => s.level >= 5,
        choiceA: {
          label: "🎬 Giao ngay 6 Bánh tráng & 4 Sốt bơ ➔ Nhận +160.000đ & +15% Viral!",
          reqCheck: (s) => (s.stock.banhtrang || 0) >= 6 && (s.stock.sotbo || 0) >= 4,
          lockReason: "🔒 Cần có sẵn 6 Bánh tráng & 4 Sốt bơ trong kho",
          effect: (s) => {
            consumeStockFIFO("banhtrang", 6);
            consumeStockFIFO("sotbo", 4);
            s.money += 160000;
            s.todayRevenue += 160000;
            s.todaySold += 6;
            s.totalSold += 6;
            adjustViral(15);
            addXP(35);
            return "🎬 Đoàn phim khen nức nở! Nhận +160.000đ!";
          }
        },
        choiceB: {
          label: "😅 Kho không đủ nguyên liệu, hẹn dịp sau",
          effect: (s) => "Đã hẹn đoàn phim dịp khác."
        }
      },
      {
        id: "saigon_rain_storm", category: "8. Thời Tiết Sài Gòn", icon: "🌧️", speaker: "Đài Khí Tượng & Shipper",
        title: "Mưa Rào Sài Gòn Trút Nước Giờ Tan Tầm!",
        desc: "Mưa lớn làm bánh dễ ẩm nếu quên Căng bạt mưa, nhưng đơn Shipper App lại tăng vọt!",
        canTrigger: (s) => s.day >= 2,
        choiceA: {
          label: "☂️ Căng bạt che mưa ngay & đón Shipper (+10% Viral)",
          effect: (s) => { activateCartBuff("rain_flood", "🌧️ Mưa Rào Sài Gòn (Đơn App tăng)", 45); toggleRainTarp(); adjustViral(10); return "☂️ Đã căng bạt che mưa kịp thời!"; }
        },
        choiceB: {
          label: "🌧️ Cứ đứng bán tiếp (Nhớ bấm ☂️ Bạt trên xe!)",
          effect: (s) => { activateCartBuff("rain_flood", "🌧️ Mưa Rào (Bấm Căng Bạt ngay!)", 45); updateSweetSpotUI(); return "🌧️ Nhớ bấm nút ☂️ Bạt ở góc xe nhé!"; }
        }
      },
      {
        id: "night_power_outage", category: "9. Sự Cố Phố Đêm", icon: "🕯️", speaker: "Bà Con Khu Phố Đêm",
        title: "Cả Con Hẻm Cúp Điện Giờ Cao Điểm!",
        desc: "Khu phố tối thui! Khách dồn hết về xe nào có bình ắc-quy và Bảng Hiệu Hộp Đèn sáng rực!",
        canTrigger: (s) => s.day >= 4,
        choiceA: {
          label: "💡 Bật Bảng Hiệu Hộp Đèn & Loa Nhạc ➔ Hút khách (+40.000đ & +15% Viral)",
          reqCheck: (s) => (s.equipLevels?.upg_signbox || 0) >= 1 || (s.equipLevels?.upg_neon || 0) >= 1,
          lockReason: "🔒 Cần nâng cấp Cấp 1 'Bảng Hiệu Hộp Đèn Đầu Hẻm'",
          effect: (s) => { s.money += 40000; adjustViral(15); addXP(25); return "💡 Xe sáng rực cả con hẻm (+40.000đ)!"; }
        },
        choiceB: {
          label: "🔦 Dùng đèn pin điện thoại (Khách giảm 35s)",
          effect: (s) => { activateCartBuff("alley_hide", "🕯️ Cúp Điện (Khách giảm)", 35); return "🔦 Quán hơi tối nên khách giảm tạm thời."; }
        }
      },
      {
        id: "copycat_cart_rival", category: "10. Thương Trường", icon: "🪧", speaker: "Khách Quen Báo Tin",
        title: "Xuất Hiện Xe Bánh Tráng Nhái Bảng Hiệu Đầu Hẻm!",
        desc: "“Dì ơi, đầu hẻm mới có xe làm bảng hiệu màu vàng y hệt quán mình để chèo kéo khách kìa!”",
        canTrigger: (s) => s.level >= 8,
        choiceA: {
          label: "📜 Trưng Bảng Hiệu Hộp Đèn Cấp 3+ hoặc Bằng Độc Quyền ➔ Đánh bật quán nhái!",
          reqCheck: (s) => Boolean(s.licenses?.lic_brand || (s.equipLevels?.upg_signbox || 0) >= 3),
          lockReason: "🔒 Cần 'Bằng Độc Quyền Dì Tư' hoặc 'Bảng Hiệu Hộp Đèn' Cấp 3+",
          effect: (s) => { adjustRating(0.10); adjustViral(20); s.money += 35000; return "👑 Khách nhận ra quán chính chủ (+35.000đ & +0.10⭐)!"; }
        },
        choiceB: {
          label: "😤 Chấp nhận bị chia khách (-0.08⭐ & -10% Viral)",
          effect: (s) => { adjustRating(-0.08); adjustViral(-10); return "⚠️ Bị quán nhái kéo mất một phần khách (-0.08⭐)."; }
        }
      },
      {
        id: "intl_food_youtuber", category: "11. Truyền Thông Quốc Tế", icon: "🎥", img: CASUAL_2D_ASSETS.ev_youtuber, speaker: "YouTuber Ẩm Thực Quốc Tế",
        title: "Kênh Ẩm Thực Đường Phố 5 Triệu Sub Xin Quay Phim!",
        desc: "“Hello Dì Tư! Tụi con muốn quay cận cảnh 1 phần Bánh Tráng Sài Gòn siêu đầy đặn để giới thiệu cho du khách quốc tế!”",
        canTrigger: (s) => s.level >= 4 && s.totalSold >= 12,
        choiceA: {
          label: "🌟 Làm phần Đặc Biệt (2 Bánh tráng, 2 Khô bò, 2 Trứng cút) ➔ +95.000đ, +0.15⭐ & Bão Đơn!",
          reqCheck: (s) => (s.stock.banhtrang || 0) >= 2 && (s.stock.khobo || 0) >= 2 && (s.stock.trungcut || 0) >= 2,
          lockReason: "🔒 Cần 2 Bánh tráng, 2 Khô bò & 2 Trứng cút",
          effect: (s) => {
            consumeStockFIFO("banhtrang", 2); consumeStockFIFO("khobo", 2); consumeStockFIFO("trungcut", 2);
            s.money += 95000; s.todayRevenue += 95000;
            adjustRating(0.15); adjustViral(30); addXP(35);
            activateCartBuff("tiktok_storm", "🌍 Viral Quốc Tế (Kín 4 ô • Tip x1.5)", 45);
            for (let i = 0; i < 4; i++) { if (!customerSlots[i]) spawnCustomerIntoEmptySlot(true); }
            return "🎥 Video lên xu hướng quốc tế! Nhận +95.000đ & +0.15⭐!";
          }
        },
        choiceB: {
          label: "😊 Phục vụ suất tiêu chuẩn (+20.000đ & +5% Viral)",
          effect: (s) => { s.money += 20000; adjustViral(5); return "😊 Khách Tây khen ngon (+20.000đ & +5% Viral)!"; }
        }
      },
      {
        id: "chili_kumquat_storm", category: "12. Biến Động Chợ Sỉ", icon: "🌶️", img: CASUAL_2D_ASSETS.ev_storm, speaker: "Mối Sỉ Rau Quả Chợ Đầu Mối",
        title: "Mưa Bão Miền Trung: Ớt Hiểm & Tắc Tươi Khan Hàng!",
        desc: "“Chị Tư ơi, mưa bão làm xe hàng về trễ, giá đồ tươi sắp tăng vọt! Chị có muốn ôm trước 1 thùng Tắc & Muối Ớt giá gốc không?”",
        canTrigger: (s) => s.day >= 3,
        choiceA: {
          label: "🧺 Chi 45.000đ ôm lô dự trữ (+8 Trà Tắc, +6 Muối Tôm, +4 Xoài & +0.06⭐)",
          reqCheck: (s) => s.money >= 45000,
          lockReason: "🔒 Cần 45.000đ tiền mặt",
          effect: (s) => {
            s.money -= 45000; s.todayCogsSpent += 45000;
            addStockBatch("tratac", 8); addStockBatch("muoitom", 6); addStockBatch("xoai", 4);
            adjustRating(0.06);
            return "🧺 Đã trữ đầy đủ Trà Tắc, Muối Tôm & Xoài tươi giá tốt!";
          }
        },
        choiceB: {
          label: "⏳ Chờ mai tính tiếp (Giá đồ tươi tăng 2 ngày)",
          effect: (s) => { s.activeMultiDayEffects.freshSurgeDays = 2; return "⚠️ Giá nguyên liệu tươi ngoài chợ tăng nhẹ trong 2 ngày tới."; }
        }
      },
      {
        id: "tour_bus_midnight", category: "13. Đoàn Khách Đêm", icon: "🚌", img: CASUAL_2D_ASSETS.ev_tourbus, speaker: "Hướng Dẫn Viên Đoàn Du Lịch",
        title: "Xe Du Lịch Đêm Ghé Mua Gấp 5 Phần Bánh Tráng & Trà Tắc!",
        desc: "“Đoàn khách miền Tây mới tới Sài Gòn thèm bánh tráng trộn Dì Tư quá! Quán làm gấp 5 phần Bánh tráng & 3 ly Trà Tắc kịp trước khi xe lăn bánh không ạ?”",
        canTrigger: (s) => s.level >= 3 && s.totalSold >= 10,
        choiceA: {
          label: "🚌 Giao ngay 5 Bánh tráng & 3 Trà Tắc ➔ Nhận +145.000đ & +15% Viral!",
          reqCheck: (s) => (s.stock.banhtrang || 0) >= 5 && (s.stock.tratac || 0) >= 3,
          lockReason: "🔒 Cần có sẵn 5 Bánh tráng & 3 Trà Tắc trong kho",
          effect: (s) => {
            consumeStockFIFO("banhtrang", 5); consumeStockFIFO("tratac", 3);
            s.money += 145000; s.todayRevenue += 145000;
            s.todaySold += 5; s.totalSold += 5;
            adjustViral(15); addXP(35);
            return "🚌 Cả đoàn khách vỗ tay rần rần! Nhận +145.000đ!";
          }
        },
        choiceB: {
          label: "😅 Bán lẻ 1 phần cho tài xế (+22.000đ)",
          effect: (s) => { s.money += 22000; return "Đã bán nhanh 1 phần cho bác tài (+22.000đ)."; }
        }
      },
      {
        id: "neighborhood_scholarship", category: "14. Tình Làng Nghĩa Xóm", icon: "💝", img: CASUAL_2D_ASSETS.ev_scholarship, speaker: "Tổ Trưởng Khu Phố Quận 4",
        title: "Góp Quỹ Học Bổng & Quà Bánh Cho Trẻ Em Nghèo Đầu Hẻm!",
        desc: "“Chiều nay khu phố phát tập vở cho mấy đứa nhỏ hiếu học trong xóm lao động. Xe bánh tráng Dì Tư có muốn gửi chút quà khích lệ tụi nhỏ không?”",
        canTrigger: (s) => s.day >= 2,
        choiceA: {
          label: "💝 Ủng hộ 30.000đ & 2 Bánh tráng ➔ +0.15⭐, +20% Viral & Khách kế tiếp Tip +10k!",
          reqCheck: (s) => s.money >= 30000 && (s.stock.banhtrang || 0) >= 2,
          lockReason: "🔒 Cần 30.000đ & 2 Bánh tráng",
          effect: (s) => {
            s.money -= 30000; consumeStockFIFO("banhtrang", 2);
            adjustRating(0.15); adjustViral(20); addXP(40);
            s.nextCustomerTipBonus = (s.nextCustomerTipBonus || 0) + 10000;
            return "💝 Bà con cả con hẻm quý mến! (+0.15⭐, +20% Viral & +10k Tip đơn kế)!";
          }
        },
        choiceB: {
          label: "🙏 Gửi tặng tụi nhỏ 5.000đ tiền lẻ (+0.03⭐)",
          effect: (s) => { s.money = Math.max(0, s.money - 5000); adjustRating(0.03); return "🙏 Đã góp 5.000đ ủng hộ quỹ khuyến học (+0.03⭐)."; }
        }
      },
      {
        id: "open_top_bus_event", category: "15. Du Lịch Sài Gòn", icon: "🚌", img: CASUAL_2D_ASSETS.ev_intl_bus, speaker: "Đoàn Xe Buýt 2 Tầng Sài Gòn",
        title: "Xe Buýt 2 Tầng Chở Khách Quốc Tế Xin Dừng Ghé Quán!",
        desc: "“Chào chủ quán! Đoàn khách du lịch trên xe buýt 2 tầng muốn dừng 45 giây trước xe bánh tráng để thưởng thức đặc sản Sài Gòn!”",
        canTrigger: (s) => s.level >= 8,
        choiceA: {
          label: "🚌 Bật đèn đón đoàn ngay! ➔ Kích hoạt 🚌 ĐOÀN DU LỊCH QUỐC TẾ (45s • Tip x2)",
          effect: (s) => {
            adjustViral(20); addXP(35);
            activateCartBuff("intl_bus_rush", "🚌 Đoàn Du Lịch Quốc Tế (Kín 4 ô • Tip x2)", 45);
            for (let i = 0; i < 4; i++) { if (!customerSlots[i]) spawnCustomerIntoEmptySlot(true); }
            return "🚌 Đoàn khách quốc tế ùa xuống quầy! Tiền Tip nhân đôi trong 45s!";
          }
        },
        choiceB: {
          label: "😅 Quán đang bận, hẹn đoàn chuyến sau (+15.000đ)",
          effect: (s) => { s.money += 15000; return "Hướng dẫn viên gửi quà cảm ơn (+15.000đ)."; }
        }
      },
      {
        id: "tv_culinary_report", category: "16. Đài Truyền Hình", icon: "🎥", img: CASUAL_2D_ASSETS.ev_tv_crew, speaker: "Biên Tập Viên Chuyên Mục Ẩm Thực",
        title: "Đài Truyền Hình Quay Trực Tiếp Tay Nghề Trộn Bánh!",
        desc: "“Tụi mình sẽ bấm máy quay cận cảnh 40 giây! Mỗi mẻ bánh bạn trộn trúng Tâm Chuẩn Vị sẽ được thưởng nóng +15.000đ từ nhà tài trợ!”",
        canTrigger: (s) => s.level >= 12,
        choiceA: {
          label: "🎥 Lên sóng! ➔ Kích hoạt 🎥 PHÓNG SỰ TRUYỀN HÌNH (40s • Trộn 5⭐ +15k/mẻ)",
          effect: (s) => {
            adjustRating(0.10); adjustViral(25);
            activateCartBuff("tv_report_rush", "🎥 Phóng Sự Truyền Hình (Trộn 5⭐ +15k & +3% Viral)", 40);
            for (let i = 0; i < 4; i++) { if (!customerSlots[i]) spawnCustomerIntoEmptySlot(true); }
            return "🎥 Đèn máy quay đã bật! Hãy trộn chuẩn Tâm 5⭐ để nhận thưởng liên hoàn!";
          }
        },
        choiceB: {
          label: "😊 Xin phỏng vấn ngắn đầu giờ (+25.000đ & +10% Viral)",
          effect: (s) => { s.money += 25000; adjustViral(10); return "🎙️ Đã trả lời phỏng vấn ngắn (+25.000đ)."; }
        }
      },
      {
        id: "spicy_king_challenge", category: "17. Thử Thách Đường Phố", icon: "🌶️", img: CASUAL_2D_ASSETS.ev_spicy_cup, speaker: "Hội Thánh Ăn Cay Sài Gòn",
        title: "Thử Thách 'Thánh Ăn Cay': Khách Đua Nhau Gọi Siêu Cay!",
        desc: "“Hội mê ăn cay Sài Gòn kéo tới thách đố! Trong 35 giây tới tất cả khách đều gọi mức 🌶️🌶️ Siêu Cay và boa thêm +6.000đ/đơn!”",
        canTrigger: (s) => s.level >= 6,
        choiceA: {
          label: "🌶️ Chấp nhận thử thách! (35s: 100% khách gọi Siêu Cay • Tip +6k/đơn)",
          effect: (s) => {
            addXP(30);
            activateCartBuff("spicy_king_rush", "🌶️ Hội Thánh Ăn Cay (100% Siêu Cay • Tip +6k)", 35);
            for (let i = 0; i < 4; i++) { if (!customerSlots[i]) spawnCustomerIntoEmptySlot(true); }
            return "🌶️ Cơn lốc Siêu Cay bắt đầu! Nhớ bấm 2 Ớt (hoặc để Út Anh tự bật)!";
          }
        },
        choiceB: {
          label: "😅 Giữ mức cay bình thường (+10% Viral)",
          effect: (s) => { adjustViral(10); return "Giữ nhịp bán bình thường."; }
        }
      },
      {
        id: "corporate_afternoon_tea", category: "18. Hợp Đồng Văn Phòng", icon: "🍱", img: CASUAL_2D_ASSETS.strat_combo, speaker: "Trưởng Phòng Nhân Sự Công Ty IT",
        title: "Công Ty Công Nghệ Đặt Tiệc Xế 5 Phần Bánh & Trà Tắc!",
        desc: "“Công ty mình muốn đặt nhanh 5 phần Bánh tráng trộn kèm 4 Trà tắc cho anh em chạy dự án. Thanh toán chuyển khoản ngay 175.000đ!”",
        canTrigger: (s) => s.level >= 10,
        choiceA: {
          label: "🍱 Xuất kho 5 Bánh tráng & 4 Trà tắc ➔ Nhận +175.000đ & +0.10⭐!",
          reqCheck: (s) => (s.stock.banhtrang || 0) >= 5 && (s.stock.tratac || 0) >= 4,
          lockReason: "🔒 Cần 5 Bánh tráng & 4 Trà tắc trong kho",
          effect: (s) => {
            consumeStockFIFO("banhtrang", 5); consumeStockFIFO("tratac", 4);
            s.money += 175000; s.todayRevenue += 175000;
            s.todaySold += 5; s.totalSold += 5;
            adjustRating(0.10); addXP(40);
            return "🍱 Đã giao đơn tiệc văn phòng (+175.000đ & +0.10⭐)!";
          }
        },
        choiceB: {
          label: "😅 Gửi voucher giảm giá hẹn ngày mai (+10% Viral)",
          effect: (s) => { adjustViral(10); return "Đã tặng voucher hẹn dịp sau."; }
        }
      },
      {
        id: "lost_wallet_red_stool", category: "19. Chuyện Tử Tế Sài Gòn", icon: "👛", img: CASUAL_2D_ASSETS.strat_shield, speaker: "Khách Quen Ghế Nhựa Đỏ",
        title: "Khách Bỏ Quên Ví Tiền Trên Ghế Nhựa Đỏ!",
        desc: "Dọn ghế sau lượt khách đông, bạn phát hiện một chiếc ví dày cộp khách vô tình đánh rơi cạnh xe bánh tráng!",
        canTrigger: (s) => s.day >= 3,
        choiceA: {
          label: "🛡️ Cất giữ cẩn thận & đăng bài tìm chủ nhân ➔ Khách quay lại hậu tạ +65.000đ & +0.15⭐!",
          effect: (s) => {
            s.money += 65000;
            adjustRating(0.15); adjustViral(25); addXP(45);
            return "💖 Vị khách xúc động cảm ơn tấm lòng người Sài Gòn (+65.000đ & +0.15⭐)!";
          }
        },
        choiceB: {
          label: "👮 Nhờ Chú Bảo Vệ Tư Nghĩa mang ra phường trình báo (+0.12⭐ & +50 XP)",
          effect: (s) => { adjustRating(0.12); addXP(50); return "👮 Đã bàn giao ví thất lạc (+0.12⭐ & +50 XP)!"; }
        }
      }
    ];


    const ND147_PLAYTIME_KEY = "btt_saigon_nd147_playtime_v15";
    const BANNED_PROFANITY_WORDS = ["đụ", "địt", "lồn", "cặc", "đéo", "chó đẻ", "fuck", "shit", "sex", "18+"];

    function sanitizeVietnameseDisplayName(rawText) {
      let s = String(rawText || "").trim();
      BANNED_PROFANITY_WORDS.forEach(w => {
        const reg = new RegExp(w, "gi");
        s = s.replace(reg, "***");
      });
      return s.slice(0, 28) || "Bánh Tráng Sài Gòn";
    }

    // --- 1. ĐỊNH NGHĨA 6 BỘ CHỦ ĐỀ PHONG CÁCH QUÁN (THAY CHO 24 MÓN LẺ RỐI MẮT) ---
    const DECOR_THEME_SETS = [
      {
        id: "theme_retro",
        name: "🌿 Bộ Sài Gòn Xưa 1990",
        icon: "🌿",
        imgKey: "dec_sign_retro",
        costPerStep: 180000,
        pieces: ["awn_mint", "sign_retro90", "table_bamboo", "prop_speaker"],
        pieceNames: ["Mái Hiên Xanh Cổ", "Bảng Vẽ Tay 1990", "Bàn Tre Lá Chuối", "Loa Kẹo Kéo Xưa"],
        equipMap: { awning: "awn_mint", sign: "sign_retro90", table: "table_bamboo", prop: "prop_speaker", lights: "light_firefly", particles: "fx_sakura" },
        perkDesc: "Khách hàng xóm & người lớn tuổi cực thích: Kiên nhẫn +25% • Đơn 5⭐ thưởng +1.500đ Tip hoài niệm"
      },
      {
        id: "theme_school",
        name: "🎒 Bộ Quán Ăn Vặt Cổng Trường",
        icon: "🎒",
        imgKey: "dec_cat",
        costPerStep: 240000,
        pieces: ["light_firefly", "sign_wood", "table_marble", "prop_cat"],
        pieceNames: ["Đèn Đom Đóm Ấm", "Bảng Gỗ Chạm Nổi", "Bàn Đá Trắng Sạch", "Mèo Thần Tài Vẫy Tay"],
        equipMap: { lights: "light_firefly", sign: "sign_wood", table: "table_marble", prop: "prop_cat", awning: "awn_mint", particles: "fx_star" },
        perkDesc: "Hút mạnh Học sinh – Sinh viên: Tăng +25% tỷ lệ khách mua gộp 2–3 bịch/lượt"
      },
      {
        id: "theme_cholon",
        name: "🏮 Bộ Phố Đèn Lồng Chợ Lớn",
        icon: "🏮",
        imgKey: "dec_lantern",
        costPerStep: 320000,
        pieces: ["light_lantern", "awn_cholon", "table_ebony", "fx_sakura"],
        pieceNames: ["Dây Đèn Lồng Đỏ", "Mái Tam Sắc Chợ Lớn", "Bàn Gỗ Mun Thau Đồng", "Hoa Đào & Mai Bay"],
        equipMap: { lights: "light_lantern", awning: "awn_cholon", table: "table_ebony", particles: "fx_sakura", sign: "sign_wood", prop: "prop_mai" },
        perkDesc: "Đậm chất phố cổ đêm: Tăng +30% nhu cầu món Hệ Cuộn & Nướng • Gọi kèm Trà Tắc +20%"
      },
      {
        id: "theme_neon",
        name: "💜 Bộ Phố Đêm Ánh Tím Hiện Đại",
        icon: "💜",
        imgKey: "dec_neon",
        costPerStep: 440000,
        pieces: ["light_neon", "sign_led", "awn_cyber", "fx_star"],
        pieceNames: ["Viền Đèn Ánh Tím", "Bảng Điện Tử Ánh Sao", "Mái Hiên Phố Đêm", "Sao Băng 7 Màu"],
        equipMap: { lights: "light_neon", sign: "sign_led", awning: "awn_cyber", particles: "fx_star", table: "table_marble", prop: "prop_speaker" },
        perkDesc: "Hút giới trẻ & Khách VIP (+20%) • Tăng +30% mắt xem khi bật Phát Trực Tiếp tại quầy"
      },
      {
        id: "theme_tet",
        name: "🧧 Bộ Lễ Hội Tết Phương Nam",
        icon: "🧧",
        imgKey: "dec_lixi",
        costPerStep: 580000,
        pieces: ["light_tet", "prop_mai", "fx_lixi", "sign_royal"],
        pieceNames: ["Dây Pháo Đỏ Tết", "Chậu Mai Vàng Đại Lộc", "Mưa Bao Lì Xì Vàng", "Bảng Hiệu Lễ Hội"],
        equipMap: { lights: "light_tet", prop: "prop_mai", particles: "fx_lixi", sign: "sign_royal", awning: "awn_cholon", table: "table_gold" },
        perkDesc: "Không khí Tết rộn ràng: Mỗi đơn 5⭐ có 35% cơ hội khách mừng tuổi Bao Lì Xì (+6.000đ)"
      },
      {
        id: "theme_royal",
        name: "👑 Bộ Hoàng Gia Dì Tư Mạ Vàng",
        icon: "👑",
        imgKey: "dec_dragon",
        costPerStep: 880000,
        pieces: ["awn_royal", "table_gold", "prop_dragon", "fx_dragon"],
        pieceNames: ["Mái Lụa Vàng Hoàng Gia", "Bàn Hoàng Kim 24K", "Kỳ Lân Vàng Thịnh Vượng", "Lửa Phượng Hoàng"],
        equipMap: { awning: "awn_royal", table: "table_gold", prop: "prop_dragon", particles: "fx_dragon", sign: "sign_royal", lights: "light_tet" },
        perkDesc: "Đỉnh cao danh vọng: Khách toàn quán chịu giá cao thêm +2.500đ/bịch & +25% Định giá Đế chế"
      }
    ];

    // Bản đồ ghép Giấy phép bắt buộc vào từng Bậc Mặt Bằng (1 ➔ 6) để gộp chung trên Thẻ Tiến Hóa Đời Quán
    const SCALE_REQUIRED_LICENSES = {
      1: "lic_vsattp",       // Bậc 1 (Xe Inox Đôi - Cấp 12) gắn với Giấy VSATTP
      2: "lic_sidewalk",     // Bậc 2 (Kiot Góc Phố - Cấp 25) gắn với Hợp đồng Vỉa hè
      3: "lic_brand",        // Bậc 3 (Tiệm Máy Lạnh - Cấp 40) gắn với Bằng Độc quyền Dì Tư
      4: "lic_vietgap",      // Bậc 4 (Nhà Hàng 2 Tầng - Cấp 52) gắn với Chứng nhận VietGAP
      5: "lic_franchise",    // Bậc 5 (Tòa Nhà Ẩm Thực - Cấp 64) gắn với Giấy phép Nhượng quyền
      6: "lic_heritage"      // Bậc 6 (Tập Đoàn Sài Thành - Cấp 75) gắn với Bằng Di sản Ẩm thực
    };

    (function bindAll16ChibiIconsAndStreamlineUpgrades() {
      if (typeof SUPPLY_WORKSHOPS !== "undefined" && Array.isArray(SUPPLY_WORKSHOPS) && CASUAL_2D_ASSETS.fn_workshop) {
        SUPPLY_WORKSHOPS.forEach(ws => { ws.img = CASUAL_2D_ASSETS.fn_workshop; });
      }
      if (typeof LICENSES_CATALOG !== "undefined" && Array.isArray(LICENSES_CATALOG)) {
        LICENSES_CATALOG.forEach(lic => {
          if (lic.id === "lic_vsattp" && CASUAL_2D_ASSETS.ev_inspect) lic.img = CASUAL_2D_ASSETS.ev_inspect;
          if ((lic.id === "lic_sidewalk" || lic.id === "lic_franchise") && CASUAL_2D_ASSETS.fn_deed) lic.img = CASUAL_2D_ASSETS.fn_deed;
        });
      }
      // Tinh gọn EQUIP_UPGRADES thành 6 Đồ Nghề & Thiết Bị Cốt Lõi (Đầy đủ cả Dụng cụ Bếp Tam Hệ lẫn Tiện nghi Quán)
      if (typeof EQUIP_UPGRADES !== "undefined" && Array.isArray(EQUIP_UPGRADES)) {
        const keptIds = ["upg_cooler", "upg_signbox", "upg_stool", "upg_neon", "upg_awning", "upg_maps"];
        const filtered = [];
        keptIds.forEach(id => {
          const found = EQUIP_UPGRADES.find(x => x.id === id);
          if (found) filtered.push(found);
        });
        filtered.forEach(eq => {
          eq.branch = "marketing";
          if (eq.id === "upg_cooler") {
            eq.name = "Bộ Đồ Nghề Bếp Tam Hệ & Tủ Kính";
            eq.baseCost = 65000;
            if (CASUAL_2D_ASSETS.st_tron) eq.img = CASUAL_2D_ASSETS.st_tron;
            eq.effectLine = (lvl) => lvl < 5
              ? `Vùng Tâm 5⭐ (Trộn/Cuộn/Nướng) +${(lvl + 1) * 3}% • HSD đồ tươi +${(lvl + 1) >= 4 ? 3 : (lvl + 1) >= 2 ? 2 : 1} ngày`
              : `Đạt đỉnh: Vùng Tâm 5⭐ rộng +15%, +3 ngày HSD & Chịu giá +1.500đ`;
          } else if (eq.id === "upg_signbox") {
            eq.name = "Bảng Hiệu Hộp Đèn & Khu Đợi Khách";
            eq.baseCost = 70000;
            if (CASUAL_2D_ASSETS.mk_ads) eq.img = CASUAL_2D_ASSETS.mk_ads;
          } else if (eq.id === "upg_stool") {
            eq.name = "Bàn Ghế Nhựa Đỏ Vỉa Hè";
            eq.baseCost = 55000;
          } else if (eq.id === "upg_neon") {
            eq.name = "Quạt Phun Sương & Bình Trà Đá";
            eq.baseCost = 75000;
            eq.effectLine = (lvl) => lvl < 5
              ? `Khách gọi kèm Trà Tắc +${(lvl + 1) * 8}% • Kiên nhẫn +${(lvl + 1) * 10}% • XP +${(lvl + 1) * 8}%`
              : `Đạt đỉnh: Gọi Trà Tắc +40%, Kiên nhẫn +50% & XP +40%`;
          } else if (eq.id === "upg_awning") {
            eq.name = "Mái Hiên Che Mưa Nắng Tự Động";
            eq.baseCost = 65000;
            if (CASUAL_2D_ASSETS.ev_rain) eq.img = CASUAL_2D_ASSETS.ev_rain;
          } else if (eq.id === "upg_maps") {
            eq.name = "Định Vị Bản Đồ Số & Máy Ép Túi";
            eq.baseCost = 50000;
            eq.effectLine = (lvl) => lvl < 5
              ? `Khách nền: +${lvl} ➔ +${lvl + 1} bịch/ngày • Phí sàn ứng dụng -${lvl + 1}%`
              : `Đạt đỉnh: +5 bịch/ngày • Giảm 5% phí sàn ứng dụng & giữ giòn bánh`;
          }
        });
        EQUIP_UPGRADES.length = 0;
        filtered.forEach(item => EQUIP_UPGRADES.push(item));
      }
      if (typeof SALES_STRATEGIES !== "undefined" && Array.isArray(SALES_STRATEGIES)) {
        SALES_STRATEGIES.length = 0;
      }
    })();


    const SAIGON_WEATHER_TYPES = [
      { id: "sunny_nice", icon: "☀️", name: "Nắng Đẹp Dịu Mát", bagMult: 1.0, traTacChance: 0.35, shipperBoost: 0, preferredVessel: "all", tipNote: "Thời tiết đẹp, khách dạo phố đông đều các món." },
      { id: "hot_peak", icon: "🔥", name: "Nắng Gắt 38°C", bagMult: 0.90, traTacChance: 0.80, shipperBoost: 0.20, preferredVessel: "bamboo", tipNote: "Trời nắng gắt! 80% khách gọi kèm Trà Tắc & chuộng món Cuộn/Xoài chua mát." },
      { id: "rain_shower", icon: "🌧️", name: "Mưa Rào Chiều Tà", bagMult: 0.85, traTacChance: 0.18, shipperBoost: 0.35, preferredVessel: "grill", tipNote: "Trời đổ mưa rào! Món Bánh Tráng Nướng nóng hổi tăng gấp đôi nhu cầu & đơn Giao hàng tăng mạnh." },
      { id: "storm_tide", icon: "⛈️", name: "Mưa Giông & Triều Cường", bagMult: 0.72, traTacChance: 0.15, shipperBoost: 0.45, preferredVessel: "grill", tipNote: "Mưa ngập đường! Khách vãng lai giảm nhưng đơn Shipper mua gộp 2–3 phần & thưởng Tip vượt mưa!" },
      { id: "cool_breeze", icon: "🍃", name: "Gió Chiều Se Lạnh", bagMult: 1.18, traTacChance: 0.38, shipperBoost: 0.05, preferredVessel: "inox", tipNote: "Trời se lạnh! Khách đi dạo đông (+18%), cực chuộng bánh tráng Siêu Cay & Nướng Mắm Ruốc." }
    ];

    const EXTENDED_FESTIVALS = {
      5:  { name: "🎉 Hội Chợ Ẩm Thực Phường", bagMult: 1.35, desc: "Bà con đi hội chợ nườm nượp (+35% sức mua)!" },
      8:  { name: "🎒 Ngày Hội Học Sinh Cổng Trường", bagMult: 1.40, desc: "Học sinh đi theo nhóm mua 2–3 bịch (+40% sức mua)!" },
      12: { name: "⚽ Đêm Chung Kết Bóng Đá Việt Nam", bagMult: 1.50, desc: "Khách đặt bánh tráng & Trà tắc xem bóng đá (+50% sức mua)!" },
      15: { name: "💸 Ngày Lương Về Giữa Tháng", bagMult: 1.40, desc: "Dân văn phòng & Khách VIP chi tiêu hào phóng, chịu giá +2.000đ!" },
      18: { name: "🕵️ Đoàn Thanh Tra Liên Ngành VSATTP", bagMult: 1.15, desc: "Đoàn kiểm tra Giấy phép VSATTP & Hợp đồng Vỉa hè ghé quán!" },
      21: { name: "💝 Đêm Hẹn Hò Phố Đi Bộ", bagMult: 1.45, desc: "Các cặp đôi đi dạo gọi cặp 2 phần bánh + 2 Trà Tắc (+45% sức mua)!" },
      25: { name: "🏮 Đêm Hội Phố Đèn Lồng", bagMult: 1.55, desc: "Du khách trẩy hội gọi Mẹt Gia Truyền Dì Tư & Nướng Đà Lạt (+55%)!" },
      28: { name: "📦 Biến Động Giá Chợ Đầu Mối", bagMult: 1.10, desc: "Nguồn cung chợ khan hiếm (Có Xưởng Nguyên Liệu sẽ giữ nguyên giá gốc)!" },
      30: { name: "👑 Lễ Kỷ Niệm Tròn Tháng & Trao Cúp Khu Phố", bagMult: 1.65, desc: "Tổng kết Thị phần Khu phố & thưởng lớn cuối tháng (+65% sức mua)!" }
    };

    let LEVEL_GATED_CAMPAIGNS = [
      { id: "flyer_alley", reqLevel: 8, name: "Phát Tờ Rơi & Trà Đá Đầu Hẻm", cost: 20000, bagBonus: 3, viralGain: 3, assetKey: "mk_ads", desc: "Kéo học sinh & hàng xóm (+3 bịch • Kiên nhẫn +15%)" },
      { id: "combo_student", reqLevel: 16, name: "Bảng Gói Mua Chung 2–3 Phần", cost: 35000, bagBonus: 4, viralGain: 4, assetKey: "mk_voucher", desc: "Khách mua gộp 2–3 bịch +25% • Giảm 20% phí túi" },
      { id: "app_top_push", reqLevel: 19, name: "Đẩy Top Ứng Dụng Giao Đồ Ăn", cost: 45000, bagBonus: 6, viralGain: 6, assetKey: "mk_shipper", desc: "+6 bịch đơn Shipper • Phí chiết khấu sàn giảm còn 14%" },
      { id: "district_group", reqLevel: 24, name: "Bài Đăng Hội Ẩm Thực Quận", cost: 60000, bagBonus: 7, viralGain: 8, assetKey: "mk_ads", desc: "+7 bịch khách mới • Hút dân văn phòng & khách sỉ" },
      { id: "kol_review", reqLevel: 35, name: "Mời Chuyên Gia / Thánh Ăn Đánh Giá", cost: 95000, bagBonus: 10, viralGain: 12, assetKey: "mk_live", desc: "+10 bịch • Khách VIP +20% & Chịu giá cao +1.500đ/bịch" },
      { id: "city_festival_sponsor", reqLevel: 55, name: "Tài Trợ Lễ Hội Ẩm Thực Sài Gòn", cost: 160000, bagBonus: 15, viralGain: 18, assetKey: "ev_trophy", desc: "+15 bịch • Bùng nổ khách du lịch & Chịu giá +2.500đ" }
    ];

    let SAIGON_BANK_LOAN_TIERS = [
      { tier: 1, name: "Hạng 1 • Vay Tiểu Thương", principal: 500000, dailyInterestRate: 0.014, reqCredit: 480, reqLevel: 20, reqLic: null },
      { tier: 2, name: "Hạng 2 • Vay Mở Kiot Góc Phố", principal: 2000000, dailyInterestRate: 0.012, reqCredit: 550, reqLevel: 24, reqLic: "lic_vsattp" },
      { tier: 3, name: "Hạng 3 • Vay Nâng Cấp Tiệm Lớn", principal: 6000000, dailyInterestRate: 0.010, reqCredit: 630, reqLevel: 32, reqLic: "lic_sidewalk" },
      { tier: 4, name: "Hạng 4 • Vay Mở Nhà Hàng & Xưởng", principal: 20000000, dailyInterestRate: 0.008, reqCredit: 710, reqLevel: 45, reqLic: "lic_brand" },
      { tier: 5, name: "Hạng 5 • Tín Dụng Tập Đoàn", principal: 60000000, dailyInterestRate: 0.006, reqCredit: 780, reqLevel: 60, reqLic: "lic_franchise" }
    ];

    const RIVAL_SHOPS_DATA = [
      { id: "rival_cotu", name: "Xe Bánh Tráng Cô Tư Đầu Ngõ", style: "Chuyên giá rẻ hút học sinh", basePower: 22, icon: "🛒" },
      { id: "rival_anhhao", name: "Bánh Tráng Trộn Anh Hào Ngã Tư", style: "Chuyên chạy quảng cáo & đơn App", basePower: 38, icon: "🛵" },
      { id: "rival_basau", name: "Tiệm Bánh Tráng Bà Sáu Gia Truyền", style: "Chuyên món nướng & khách VIP", basePower: 55, icon: "🏮" }
    ];


