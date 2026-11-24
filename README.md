# Vua Bánh Tráng Sài Gòn — Ver 18.0 (Offline 100% PWA)

Game mô phỏng khởi nghiệp xe bánh tráng Sài Gòn chơi hoàn toàn Offline trên trình duyệt & điện thoại (PWA).

## Điểm mới ở Ver 18.0 — Nâng Cấp Toàn Diện Giao Diện
- **G1 — Bố cục đáp ứng rộng & dễ đọc:** 1 cột gọn trên điện thoại, 2 cột rộng tới 1120px trên máy tính bảng/desktop; tăng cỡ chữ ở các nhãn nhỏ; nút **Mở Cửa Hàng** cố định ở chân trang không che nội dung.
- **G2 — Điều hướng gọn & Màn Hành Trình:** Gộp Hồi Ký 8 Chương, 16 Thành Tựu và Lộ Trình Cấp Độ (1–80) vào 1 màn **Hành Trình**; mở modal mới tự đóng modal cũ.
- **G3 — Nhãn trực quan:** Nút Ớt hiện rõ mức cay & số lần bấm; thanh trộn hiện % mỗi lần bấm & luật nới vùng chuẩn sau combo 3; bảng kê tiền chi tiết sau mỗi bịch bán; giải thích công thức tính sao; chuẩn hóa toàn bộ nhãn viết tắt.
- **G4 — Màn Hồ Sơ Quán:** Đưa 5 hệ sâu (Truyền Nghề, Tín Dụng/Vay, Sổ Tiết Kiệm +1,5%/đêm, Tinh Thần Nhân Viên, Thị Phần) ra 1 màn duy nhất kèm gợi ý việc tiếp theo.
- **G5 — Màn Bán Hàng rõ ràng:** Thẻ to nổi bật khi khách gọi thêm giữa chừng, cảnh báo khóa topping trước khi bấm B3, nút topping dạng nút bấm thật.
- **G6 — Màn Đăng Nhập:** Hiện rõ số phiên bản `Ver 18.0` và mục **Có gì mới**, giữ nguyên 2 nút `📋 Quán Đã Lưu` / `🆕 Tạo Quán Mới`.
- **G7 — Tăng tốc 2x & Tải ảnh lười:** Thêm nút tăng tốc `1x / ⚡ 2x` cho ca bán hàng; tách 137 ảnh sprite ra `assets/sprites/*.jpg` kèm `loading="lazy"` giúp mở game nhanh hơn.
- **G8 — Gọn nhẹ triệt để:** Xóa `admin.html`, đổi tên các module lưu trữ local, gọn dữ liệu 105 quán mẫu, ẩn khung log dev sau thao tác debug.

## Lưu trữ & Khôi phục Offline
- Dữ liệu lưu 100% trên `localStorage` của máy, hỗ trợ nhiều quán độc lập, khóa con trỏ quán theo từng tab bằng `sessionStorage`, sao lưu bằng Mã Đổi Máy (`BTT1-...`) hoặc file `.json`.
