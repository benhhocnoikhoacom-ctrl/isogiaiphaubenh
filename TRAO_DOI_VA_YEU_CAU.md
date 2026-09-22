# NHẬT KÝ TRAO ĐỔI & YÊU CẦU NGHIỆP VỤ (e-ISO PHÒNG GIẢI PHẪU BỆNH)

Tài liệu này ghi lại toàn bộ các trao đổi, quyết định kiến trúc và yêu cầu nghiệp vụ giữa **Bác sĩ (Người dùng)** và **Trợ lý AI**.  
Mọi thay đổi mã nguồn trong tương lai **BẮT BUỘC PHẢI TUÂN THỦ THEO TÀI LIỆU NÀY**.  
**NGUYÊN TẮC CỐT LÕI:** Chỉ sửa đúng phần được yêu cầu, tất cả các phần khác phải giữ nguyên vẹn.

---

## 1. Thông tin Dự án & Môi trường
- **Tên ứng dụng:** e-ISO Pathology Tracker – Khoa Giải phẫu bệnh
- **Tên miền hoạt động chính thức:** `https://isogiaiphaubenh.bstrung.vn`
- **Kho lưu trữ GitHub mới:** `https://github.com/benhhocnoikhoacom-ctrl/isogiaiphaubenh.git` (nhánh `main`)
- **Kho lưu trữ GitHub phụ:** `https://github.com/bsluongdinhtrung-hue/ISOGPB.git` (nhánh `main`)
- **Nền tảng triển khai:** Vercel
- **Cơ sở dữ liệu:** Supabase PostgreSQL (Project Ref: `fkjmiatwdcgxdkqnwhgn`)
- **Thư mục Drive minh chứng:** `1uBf67edEbYouq4828r9QDx38IqpH4gNY`
- **File quy chuẩn nghiệp vụ (Single Source of Truth):** `INPUT_CHO_IT_eISO_MVP_v2_co_email.xlsx`

---

## 2. Lịch sử Yêu cầu & Quyết định Kỹ thuật

### A. Phương thức Đăng nhập & Xác thực Tài khoản
1. **Chuyển từ Google Sign-In sang Đăng nhập Mật khẩu:**
   - Lý do: Google thông báo chặn ứng dụng nội bộ chưa qua xác minh thương mại của Google.
   - Cơ chế: Đăng nhập nội bộ theo danh sách cán bộ nhân viên trong file Excel.
2. **Quy định Mật khẩu:**
   - **BS. Lương Đình Trung** (Admin / IT): `MeoMoon2789` (không bắt đổi mật khẩu ban đầu).
   - **BS. Đào Thị Nguyệt** (Trưởng khoa / Admin): `MeoMoon2789` (không bắt đổi mật khẩu ban đầu).
   - **6 Kỹ thuật viên & Bác sĩ còn lại:** Mật khẩu ban đầu `isogpb@2026`. Khi đăng nhập lần đầu, hệ thống bắt buộc chuyển sang màn hình đổi mật khẩu (`/change-password`).
3. **Bảo mật giao diện Đăng nhập:**
   - Không tự động điền sẵn mật khẩu hoặc gợi ý mật khẩu.
   - Chưa đăng nhập thì **tuyệt đối không được xem Dashboard**; tự động chuyển hướng về `/login`.
   - Có thể thêm, bớt, vô hiệu hoá, đặt lại mật khẩu cho nhân viên trong màn hình Quản lý nhân viên (`/admin/users`).

### B. Chống Sập Hệ thống & Quản lý Hạn mức Firebase
- Firebase gói Spark (miễn phí) có giới hạn **50.000 lượt đọc/ngày**.
- Áp dụng **In-Memory Caching (60 giây)** trên máy chủ để giảm 99% lượt đọc lặp lại.
- Tích hợp **Cơ chế Dự phòng (Resilient Fallback Data)** tại `lib/fallback-data.ts`: Khi Firebase gặp sự cố mạng hoặc vượt hạn mức, hệ thống tự động chuyển sang dùng dữ liệu dự phòng chuẩn, đảm bảo website hoạt động 100% không bao giờ bị trắng trang hay báo lỗi.

### C. Logic Tính Hạn & Trạng thái Công việc (Theo Sheet `STATUS_DICTIONARY`)
Hệ thống sử dụng đúng 4 trạng thái chuẩn ISO:
1. **`OVERDUE` (Quá hạn - Thẻ đỏ):**
   - Điều kiện: `Today > Due_Date` VÀ chưa hoàn thành.
   - Ngày hôm nay lấy theo múi giờ Việt Nam (UTC+7).
   - Định dạng ngày được chuẩn hóa cả `DD/MM/YYYY` và `YYYY-MM-DD`.
2. **`DUE_SOON` (Sắp đến hạn - Thẻ vàng):**
   - Điều kiện: `Today >= Due_Date - Reminder_Days` VÀ chưa hoàn thành.
   - `Reminder_Days`: Theo cấu hình từng đầu việc trong Excel (từ 0 đến 14 ngày).
3. **`NOT_DUE` (Chưa đến hạn - Thẻ xám):**
   - Điều kiện: `Today < Due_Date - Reminder_Days`.
4. **`COMPLETED` (Đã hoàn thành - Thẻ xanh):**
   - Điều kiện: Đã có ngày hoàn thành (`Completed_Date`) và đã được phê duyệt (nếu đầu việc yêu cầu duyệt).

### D. Quy tắc Tính Ngày Hạn (`calculateDefaultDueDate`) theo Sheet `WORK_ITEMS`
- **Hàng ngày (Daily):** Hạn là ngày làm việc hiện tại (09:00 hoặc 16:30).
- **Hàng tháng (Periodic - Monthly):** *"Chốt rà soát trước ngày 03/05/10 của tháng kế tiếp"*.
  - Kỳ tháng `M/YYYY` $\rightarrow$ Hạn chốt là ngày 03, 05 hoặc 10 của tháng `(M + 1)/YYYY`.
- **Hàng quý (Periodic - Quarterly):** *"Chốt trước ngày 05 hoặc 10 của tháng đầu quý sau"*.
  - Q1 (T1-T3) $\rightarrow$ Hạn 05/04; Q2 (T4-T6) $\rightarrow$ Hạn 05/07; Q3 (T7-T9) $\rightarrow$ Hạn 05/10; Q4 (T10-T12) $\rightarrow$ Hạn 05/01 năm sau.
- **Hàng năm (Annual):** Hoàn thành trước ngày 31/10, 30/11 hoặc 15/12 hàng năm.
- **Khi phát sinh (Event):** Khởi tạo khi có sự việc (CAPA, sự cố, khiếu nại, ngoại kiểm, phương pháp mới).

### E. Phân công Công việc của Trưởng khoa Đào Thị Nguyệt
Trong danh mục 30 đầu việc của khoa, **BS. Đào Thị Nguyệt** trực tiếp phụ trách **2 đầu việc**:
1. `W004` (XN.QL.04): **Xem xét của lãnh đạo** (Tần suất: Hàng năm, Hạn: 30/11 hàng năm).
2. `W023` (XN.QL.31): **Lựa chọn và chuyển gửi mẫu ngoại viện** (Tần suất: Khi phát sinh / hàng quý, Hạn: trước ngày 05 của tháng đầu quý sau).

**Yêu cầu hiển thị nhất quán:**
- Phần Thống kê Nhân sự trên Dashboard: Thẻ của BS. Đào Thị Nguyệt hiển thị **Được giao: 2**.
- Khi bấm vào thẻ của BS. Đào Thị Nguyệt trên Dashboard: Danh sách bảng công việc bên dưới phải lọc ra đúng **2 đầu việc này**.
- Khi BS. Đào Thị Nguyệt đăng nhập vào trang "Đầu việc của tôi" (`/my-tasks`): Mục "Việc của tôi" phải hiển thị đúng **2 đầu việc**, tuyệt đối không được hiện 0.

### F. Quy cách Bảng Điểm nghẽn (Bottleneck List - Quá hạn & Sắp đến hạn)
- **Đúng 6 cột hiển thị chuẩn:**
  1. `Mã` (Mã đầu việc)
  2. `Đầu việc quản lý` (Tên việc + Kỳ)
  3. `Phụ trách` (Tên người phụ trách)
  4. `Hạn hoàn thành` (Ngày hạn + Nhãn `(Trễ X ngày)` đỏ nếu Quá hạn)
  5. `Trạng thái` (Huy hiệu Quá hạn / Sắp đến hạn)
  6. `Thao tác` (Nút Mở hệ thống / Đôn đốc NV)
- **Quy tắc sắp xếp (Sorting):** Ưu tiên công việc Quá hạn (`OVERDUE`) lên trên đầu, trong cùng trạng thái thì công việc có hạn sớm nhất (trễ nhiều nhất) đứng trước.

---

## 3. Nguyên tắc Lập trình & Sửa Code Bắt buộc
1. **Sửa đúng chỗ, phạm vi tối thiểu (Surgical Edit):** Không sửa lan man, không viết lại những thành phần đang chạy tốt.
2. **Kiểm tra trước khi đẩy code:** Phải chạy `npm run build` và kiểm thử chức năng tự động để đảm bảo 0 lỗi trước khi commit.
3. **Đồng bộ GitHub:** Chỉ đẩy lên nhánh `main` của repository `ISOGPB`.
