# Báo Cáo Kiểm Nghiệm, Tối Ưu Modular PWA & Hướng Dẫn Kết Nối Firebase — Vua Bánh Tráng Sài Gòn (Ver 16)

## 1. Phân Tích Toàn Diện File Gốc (`index (1).html`) & Các Vấn Đề Đã Khắc Phục

### 1.1. Điểm nghẽn dung lượng & kiến trúc Monolithic (3.18 MB / 63.121 dòng)
| Thành phần trong file gốc | Dòng | Dung lượng cũ | Nguyên nhân gây nặng & lỗi | Giải pháp tối ưu đã thực hiện |
| :--- | :--- | :--- | :--- | :--- |
| **`EMBEDDED_SERVER_SHOPS_SNAPSHOT`** | 1.698 – 52.814 (51.117 dòng) | ~1.89 MB | Nhúng cứng bản dump của 105 quán cũ ngay trong HTML; 4 quán (`quan`, `banh_trang_gau`, `siuu`, `khangvy`) chứa chuỗi ảnh Avatar Base64 thô nặng ~180 KB/quán. | Tách khỏi `index.html`, chuẩn hóa Avatar và nén gọn thành `js/seed-shops.js` (**chỉ còn ~105 KB**, giảm **94.5%**) kèm file `data/firebase-seed-105-shops.json` để đẩy lên Firebase 1 chạm. |
| **HTML Giao diện & 13 Modals** | 1 – 1.690 | ~165 KB | Gộp chung toàn bộ CSS và JS trong 1 file khiến trình duyệt di động tốn RAM khi parse DOM & AST. | Tách riêng `index.html` (**160 KB**, giảm **95%** so với 3.18 MB ban đầu) và bổ sung 2 Modal mới (`#modal-firebase-config`, `#modal-rival-profile`). |
| **CSS & Hoạt ảnh 2D** | 17 – 506 | ~14 KB | Nằm inline trong `<head>`, không tận dụng được bộ nhớ đệm độc lập của Service Worker. | Tách thành `css/styles.css` và bổ sung style cho Thanh Dock 6 Tab, Bộ lọc BXH V2.0 và Thẻ Ghim Thứ Hạng. |
| **Bộ 90+ Sprite 2D (`CASUAL_2D_ASSETS`)** | 52.817 – 53.142 | ~904 KB | Nằm lẫn với code xử lý logic và bị ghi đè hàm `getDishSvgIcon` ở cuối file. | Tách riêng thành `js/assets.js`, tích hợp trực tiếp icon `metditu` vào `getDishSvgIcon` không cần monkey-patch. |
| **Logic Game & Lớp Vá V11 ➔ V13 ➔ V15.5** | 53.143 – 63.120 | ~360 KB | Ghi đè hàm chồng chéo (`_origUpdateAllUI`, `_origDoStep4Serve`, `_origStartNextDay`...), 2 listener `DOMContentLoaded` trùng nhau. | Tái cấu trúc sạch thành 9 module JS chuyên biệt, xóa toàn bộ monkey-patching và hợp nhất luồng khởi tạo. |

### 1.2. Các lỗi nghiêm trọng về Firebase, Bảng Xếp Hạng & Gameplay đã được sửa triệt để

1. **Lỗi ngắt cứng máy chủ Firebase & Dead Code (`ReferenceError`)**:
   - **Hiện trạng cũ**: Dòng 1692 gán cứng `const FIREBASE_DB_URL = "";`. Toàn bộ các hàm `fetchCloudLeaderboard()`, `syncAdminLiveOpsAndMail()`, `handleRedeemGiftcode()`, `persistBankruptcyLockToCloud()`, `joinOrSyncPvpRoom()`, `syncRemoteGameConfigV15()` đều bị chặn bằng lệnh `return;` ngay đầu hàm. Hàm lưu dữ liệu Cloud bị tách thành `async function _unusedCloudSave()` không bao giờ được gọi và chứa lỗi `ReferenceError` do dùng biến `key`, `nowTs` nằm ngoài phạm vi hàm.
   - **Đã khắc phục**: Xây dựng hệ thống **Cloud-First Firebase Engine** (`js/firebase-config.js` & `js/firebase-cloud.js`). Khi có kết nối Firebase, mọi thao tác **Đăng nhập (`handleLoginOrRegister`)**, **Chơi tiếp (`quickResumeGame`)**, **Khôi phục bằng Mã (`handleRecoverByCode`)**, **Lưu tiến độ (`saveGameEverywhere`)**, **Nhập Giftcode**, **Hộp thư Admin** và **Phòng PvP** đều đọc/ghi trực tiếp trên Firebase Realtime Database (`/shops`, `/leaderboard`, `/recoveryCodes`, `/pvp_rooms`, `/shops/npc_admin_registry`), đồng thời tự động lưu dự phòng xuống `localStorage` khi rớt mạng.

2. **Lỗi mất lối vào Bảng Xếp Hạng (Leaderboard) & lỗi điều hướng Tab**:
   - **Hiện trạng cũ**: Trong HTML có `#prep-panel-leaderboard` nhưng trên Thanh Dock 5 Tab dưới đáy, Thanh Header và Menu Tiện Ích `☰` hoàn toàn không có nút mở Bảng Xếp Hạng. Ngoài ra, hàm `switchPrepSubTab('leaderboard')` ở dòng 55535 tự đá người chơi ngược về tab `'kho'`, còn ở bản vá dòng 63012 chỉ gọi `fetchCloudLeaderboard(false)` (vốn bị `return;` sớm mà không gọi `renderLeaderboardTab()`), khiến khung BXH trống rỗng.
   - **Đã khắc phục**:
     - Nâng cấp Thanh Dock dưới đáy lên **6 Tab** với nút **`🏆 Xếp Hạng`** cố định, thêm nút **`🏆`** ngay trên Thanh Header và trong `☰ Menu Tiện Ích Quán`.
     - Nâng cấp **Bảng Xếp Hạng Đế Chế V2.0** (`js/leaderboard-social.js`) với **4 Chế độ xếp hạng** (`💎 Định Giá`, `👑 Cấp & Bịch`, `⭐ Danh Tiếng`, `⚔️ Phòng PvP`), **Thẻ Ghim Thứ Hạng Của Bạn (Sticky Rank Card)**, **Ô tìm kiếm quán** và **Pop-up Xem Hồ Sơ Chi Tiết Đối Thủ** khi chạm vào bất kỳ quán nào.

3. **Lỗi lệch tiền Sổ Thu Chi & Bản lưu Cloud khi dùng Voucher và Bộ Phong Cách (`doStep4Serve`)**:
   - **Hiện trạng cũ**: Hàm `_origDoStep4Serve()` ghi nhận doanh thu vào Sổ Thu Chi (`recordDishSaleDetail`) và gọi `saveGameEverywhere()` **trước khi** lớp bọc V15.5 trừ tiền giảm giá Voucher và cộng tiền thưởng Bộ Phong Cách (`theme_retro` +1.5k, `theme_tet` +6k, mưa bão +2.5k). Ngoài ra, bộ chọn Phạm vi Voucher (`Toàn Thực Đơn`, `Món Đinh`, `Cuộn & Nướng`, `Đơn Giao Hàng`) và gói `Mua 2 Tặng Trà Tắc` không được kiểm tra khi tính tiền.
   - **Đã khắc phục**: Hợp nhất toàn bộ phép tính Voucher (kiểm tra chính xác `isVoucherApplicableForOrder` theo phạm vi và loại ưu đãi) cùng thưởng Bộ Phong Cách vào trước bước ghi `recordDishSaleDetail` và `saveGameEverywhere()` trong `js/gameplay-street.js`.

4. **Lỗi xung đột thứ tự qua ngày mới (`startNextDay`) & Nhân viên nghỉ ốm (`isStaffWorkingToday`)**:
   - **Hiện trạng cũ**:
     - Lớp bọc `startNextDay` cộng lãi Sổ Tiết Kiệm (+1.5%) và thưởng Cúp Khu Phố vào `state.money` **trước khi** `_origStartNextDay()` chốt số dư cuối ngày (`endBalance`) của ngày cũ.
     - `_origStartNextDay()` cho Mỹ Lan tự động làm xong 3/3 món Sơ chế và tặng nguyên liệu tươi **trước khi** `maybeGenerateMorningStaffEvent()` quay sự kiện xem hôm đó Mỹ Lan có xin nghỉ ốm hay không.
     - Các hàm `applyUtAnhAutoSelectDishAndToppings`, `maybeTriggerCustomerMidOrderWhim`, `doStep3Mix`, `doStep4Serve` (Kim Ngân, Gia Bảo, Anh Ba) kiểm tra `state.staff[id]` thay vì `isStaffWorkingToday(id)`, khiến nhân viên đang nghỉ ốm vẫn tự động làm việc.
     - Món Nướng (`vessel === "grill"`) bị tuột nhiệt `-4%/giây` sau Bước 3 nhưng không cập nhật lại chữ nhắc trên thau khi tuột khỏi vùng Tâm 5⭐.
   - **Đã khắc phục**: Sắp xếp lại chuẩn xác luồng `startNextDay()` (Chốt sổ ngày cũ ➔ Sang ngày mới ➔ Cộng lãi đêm & cúp tuần ➔ Quay biến cố nhân sự buổi sáng ➔ Kiểm tra `isStaffWorkingToday('mylan')` mới tự động sơ chế), thay toàn bộ kiểm tra nhân viên bằng `isStaffWorkingToday(id)`, và cập nhật cảnh báo nhiệt độ vỉ nướng theo thời gian thực.

## 2. Cấu Trúc Thư Mục Bộ File PWA Modular (`vua_banh_trang_sai_gon_pwa_full.zip`)

```text
vua_banh_trang_sai_gon_pwa/
├── index.html                        # Giao diện chính gọn nhẹ (~160 KB, giảm 95% từ 3.18 MB)
├── manifest.json                     # Cấu hình Web App Manifest chuẩn cài đặt PWA
├── sw.js                             # Service Worker (Cache tĩnh + Network-Only cho Firebase API)
├── icon-192.png & icon-512.png       # Biểu tượng PWA ở thư mục gốc & thư mục icons/
├── icons/
│   ├── icon-192.png                  # Icon PWA 192x192 chuẩn Android/iOS
│   └── icon-512.png                  # Icon PWA 512x512 chuẩn Splash Screen
├── css/
│   └── styles.css                    # Toàn bộ giao diện gỗ 2D Casual, 6 skin trang trí & BXH V2.0
├── js/
│   ├── firebase-config.js            # Cấu hình URL Firebase Realtime Database tập trung
│   ├── assets.js                     # Bộ 90+ Sprite 2D Base64, Avatar & mã hóa PIN 4 số
│   ├── seed-shops.js                 # Dữ liệu 105 quán đã nén gọn (~105 KB thay vì 1.89 MB)
│   ├── audio-fx.js                   # Nhạc nền Web Audio Lo-fi Chill, SFX, hạt bay & Toast
│   ├── catalog-data.js               # Danh mục 9 nguyên liệu, 10 món, 44 khách, 7 nhân sự, 8 chương
│   ├── state-economy.js              # Quản lý State, hạn sử dụng FIFO, bảo mật Seal & công thức kinh tế
│   ├── firebase-cloud.js             # Động cơ đồng bộ Firebase Cloud-First, Giftcode, Live-Ops & Migration
│   ├── leaderboard-social.js         # Bảng Xếp Hạng V2.0 (4 chế độ), Hồ sơ đối thủ, Sổ tay VIP & Tóp Tóp
│   ├── gameplay-prep.js              # Đi chợ, Trả giá, Sơ chế, Thực đơn, Tiếp thị, Xây quán & Ngân hàng
│   ├── gameplay-street.js            # Hàng đợi 4 ô khách, Chế biến Tam Hệ, Chấm sao 5⭐ & Chốt sổ
│   └── main.js                       # Khởi chạy ứng dụng, đăng ký Service Worker & Auto-Sync
└── data/
    └── firebase-seed-105-shops.json  # File JSON chuẩn cấu trúc (/shops, /leaderboard, /recoveryCodes) để Import lên Firebase
```

## 3. Hướng Dẫn Kết Nối Lại Dữ Liệu Lên Firebase Realtime Database (Chi Tiết Từng Bước)

### Bước 1: Tạo hoặc mở Realtime Database trên Firebase Console
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập tài khoản Google của bạn.
2. Bấm **Add project** (Tạo dự án mới) hoặc chọn Project cũ của bạn.
3. Ở thanh menu bên trái, vào mục **Build ➔ Realtime Database** rồi bấm **Create Database**.
4. Chọn cụm máy chủ gần Việt Nam nhất: **Singapore (`asia-southeast1`)** ➔ Chọn **Start in test mode** ➔ Bấm **Enable**.

### Bước 2: Thiết lập Quy tắc Truy cập (Database Rules)
Chuyển sang tab **Rules** trong mục Realtime Database, dán cấu hình bên dưới và bấm **Publish** để cho phép game đọc/ghi dữ liệu quán và bảng xếp hạng:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "leaderboard": {
      ".indexOn": ["netWorth", "level", "totalSold", "updatedAt"]
    },
    "shops": {
      ".indexOn": ["recoveryCode", "updatedAt"]
    }
  }
}
```

### Bước 3: Lấy đường dẫn URL Firebase gắn vào Game (2 Cách)
Ở đầu tab **Data** của Realtime Database, copy đường dẫn URL của bạn (ví dụ: `https://vua-banh-trang-default-rtdb.asia-southeast1.firebasedatabase.app`):

- **Cách 1 — Gắn cố định trong code cho toàn bộ người chơi**:
  Mở file `js/firebase-config.js`, dán URL vào dòng `DEFAULT_FIREBASE_DB_URL`:
  ```javascript
  const DEFAULT_FIREBASE_DB_URL = "https://vua-banh-trang-default-rtdb.asia-southeast1.firebasedatabase.app";
  ```
- **Cách 2 — Gắn trực tiếp ngay trên giao diện Game (không cần sửa code)**:
  Tại màn hình Đăng nhập hoặc trong `☰ Menu Tiện Ích Quán` (hoặc ngay đầu tab `🏆 Xếp Hạng`), bấm nút **`☁️ Kết Nối Firebase`** ➔ Dán URL vào ô số 1 ➔ Bấm **`🔍 Kiểm Tra & Lưu Kết Nối`**.

### Bước 4: Khôi phục / Đẩy 105 Quán Cũ Lên Firebase (2 Cách)
Để toàn bộ 105 quán cũ có mặt ngay trên Firebase Realtime Database:
- **Cách A (1 chạm ngay trong Game)**: Mở bảng **`☁️ Kết Nối Firebase`** trong game ➔ Bấm nút **`📤 Đẩy 105 Quán Lên Firebase`**. Game sẽ tự động đẩy toàn bộ 105 quán lên đủ 3 nhánh `/shops`, `/leaderboard`, và `/recoveryCodes` trên Firebase.
- **Cách B (Import trực tiếp trên Firebase Console)**: Mở Realtime Database trên Firebase Console ➔ Bấm biểu tượng **3 chấm (`⋮`)** ở góc phải tab **Data** ➔ Chọn **Import JSON** ➔ Chọn file `data/firebase-seed-105-shops.json` nằm trong bộ file PWA.
