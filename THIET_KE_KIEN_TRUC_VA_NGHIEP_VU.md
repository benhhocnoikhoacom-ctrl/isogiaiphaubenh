# BẢN MÔ TẢ TOÀN BỘ THIẾT KẾ KIẾN TRÚC VÀ NGHIỆP VỤ
## HỆ THỐNG: e-ISO PATHOLOGY TRACKER – KHOA GIẢI PHẪU BỆNH

---

## 1. TỔNG QUAN HỆ THỐNG & NGUYÊN TẮC CỐT LÕI (CORE PHILOSOPHY)
- **Tên hệ thống:** e-ISO Pathology Tracker – Khoa Giải phẫu bệnh
- **Tên miền hoạt động chính thức:** `https://isogiaiphaubenh.bstrung.vn`
- **Kho lưu trữ GitHub chính:** `https://github.com/benhhocnoikhoacom-ctrl/isogiaiphaubenh.git` (nhánh `main`)
- **Kho lưu trữ GitHub phụ:** `https://github.com/bsluongdinhtrung-hue/ISOGPB.git` (nhánh `main`)
- **Cơ sở dữ liệu:** Supabase PostgreSQL (Project Ref: `fkjmiatwdcgxdkqnwhgn`)
- **Cơ chế Chống Dừng CSDL (Keep-Alive Cron):** Cài đặt GitHub Actions tự động quét định kỳ vào lúc 07:00 sáng hàng ngày (`0 0 * * *`), ngăn ngừa tuyệt đối nguy cơ Supabase tự động tạm dừng (Paused) sau 7 ngày không có tương tác.
- **Nguồn chuẩn nghiệp vụ (Single Source of Truth):** `INPUT_CHO_IT_eISO_MVP_v2_co_email.xlsx` và `Trao đổi ban đầu.txt`.
- **Mục tiêu số 1:** Quản lý **ĐẦU VIỆC** theo tiêu chuẩn **ISO 15189** ở cấp quản lý của Trưởng khoa và cán bộ nhân viên: ai phụ trách, hạn chót, trạng thái, minh chứng thực hiện, cảnh báo chậm trễ, phê duyệt báo cáo.
- **Quy tắc vàng:** Không thay thế hồ sơ ISO chi tiết hay hệ thống LIS/HIS; không nhập chi tiết từng máy móc hay từng ca bệnh phẩm/lam/block. Hệ thống đóng vai trò là **Trung tâm chỉ huy & Điều phối (Hub)**.

---

## 2. THIẾT KẾ TÀI KHOẢN & PHÂN QUYỀN (USERS & ROLES)

### A. Danh sách 8 nhân sự hạt nhân + 1 Admin kỹ thuật chuẩn theo Excel

| Mã NV | Họ và tên | Chức danh | Email (Tên đăng nhập) | Số điện thoại | Vai trò (Role) | Mật khẩu ban đầu | Đổi MK lần đầu? |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **U001** | **Đào Thị Nguyệt** | Trưởng khoa | `Nguyethmu@gmail.com` | `0382337010` | **ADMIN** | `MeoMoon2789` | Không |
| **U002** | **Lê Tuấn Anh** | Bác sĩ | `Drtuananh189@gmail.com` | `0987372288` | **USER** | `isogpb@2026` | **Bắt buộc** |
| **U003** | **Nguyễn Thị Ngân** | Bác sĩ | `nguyenthingan.bsdk@gmail.com` | `0369239809` | **USER** | `isogpb@2026` | **Bắt buộc** |
| **U004** | **Lương Thị Thùy Dung** | Kỹ thuật viên | `thuydung71@gmail.com` | `0916787186` | **USER** | `isogpb@2026` | **Bắt buộc** |
| **U005** | **Nguyễn Thị Thu Hương** | Kỹ thuật viên | `Funny.monkeyhn345@gmail.com` | `0936099158` | **USER** | `isogpb@2026` | **Bắt buộc** |
| **U006** | **Trần Thị Vân** | Kỹ thuật viên | `Tranvanbvdg@gmail.com` | `0399572155` | **USER** | `isogpb@2026` | **Bắt buộc** |
| **U007** | **Dương Văn Quang** | Kỹ thuật viên | `quangvictor@yahoo.com` | `0835028886` | **USER** | `isogpb@2026` | **Bắt buộc** |
| **U008** | **Lại Hải Hà** | Kỹ thuật viên | `laihaiha92@gmail.com` | `0988468514` | **USER** | `isogpb@2026` | **Bắt buộc** |
| **ADMIN**| **Lương Đình Trung** | Bác sĩ / IT Admin | `bsluongdinhtrung@gmail.com` | `0987.654.321` | **ADMIN** | `MeoMoon2789` | Không |

*(Ghi chú: Email `luongdinhtrunghue@gmail.com` cũng là alias của BS. Lương Đình Trung).*

### B. Ma trận phân quyền
- **Admin (Trưởng khoa Đào Thị Nguyệt & BS. Lương Đình Trung):**
  - Xem toàn cảnh Dashboard khoa.
  - Phê duyệt / Yêu cầu làm lại các báo cáo của nhân viên.
  - Điều chỉnh phân công người phụ trách, chu kỳ, hạn chót, số ngày nhắc trước.
  - Quản lý danh sách nhân sự: Thêm, sửa, vô hiệu hóa, xóa, đặt lại mật khẩu cho nhân viên.
  - Xem lịch sử nhật ký kiểm toán (Audit Log).
- **User (Bác sĩ, Kỹ thuật viên):**
  - **Được xem toàn cảnh Dashboard** để nắm tiến độ chung của toàn khoa.
  - Xem danh sách công việc được giao của chính mình tại trang "Đầu việc của tôi".
  - Nộp báo cáo hoàn thành, ghi chú và đính kèm minh chứng cho công việc của mình.
  - Tự đổi mật khẩu cá nhân. Không được duyệt bài của người khác, không được sửa cấu hình hệ thống.

---

## 3. DANH MỤC 30 ĐẦU VIỆC QUẢN LÝ ISO & GẮN LINK NGOÀI

| Mã | Mã ISO | Tên đầu việc quản lý | Người phụ trách | Tần suất | Quy tắc hạn hoàn thành | Trưởng khoa duyệt? | Nhắc trước | Link hệ thống ngoài gắn sẵn |
| :---: | :---: | :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| **W001** | `XN.QL.01` | Quản lý trang thiết bị | **Dương Văn Quang** | Hàng tháng | Chốt rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | 👉 `https://quanlithietbi.bstrung.vn` |
| **W002** | `XN.QL.02` | Kiểm soát sự không phù hợp (NC) | **Nguyễn Thị Thu Hương** | Phát sinh | Cập nhật xử lý trong 24 giờ đầu | **Có** | 0 ngày | |
| **W003** | `XN.QL.03` | Hành động khắc phục (CAPA) | **Nguyễn Thị Thu Hương** | Phát sinh | Mặc định 14 ngày sau khi mở CAPA | **Có** | 3 ngày | |
| **W004** | `XN.QL.04` | Xem xét của lãnh đạo | **Đào Thị Nguyệt** | Hàng năm | Hoàn thành trước ngày 30/11 hàng năm | **Có** | 14 ngày | |
| **W005** | `XN.QL.05` | Đào tạo nhân viên | **Lương Thị Thùy Dung** | Hàng quý | Trước ngày 05 của tháng đầu quý sau | Không | 5 ngày | |
| **W006** | `XN.QL.06` | Đánh giá tay nghề / năng lực | **Lương Thị Thùy Dung** | Hàng năm | Hoàn thành trước ngày 15/12 hàng năm | Không | 14 ngày | |
| **W007** | `XN.QL.07` | Xem xét, thỏa thuận dịch vụ | **Lại Hải Hà** | Hàng năm / Đổi | Rà soát định kỳ trước 30/11 | Không | 7 ngày | |
| **W008** | `XN.QL.08` | Lựa chọn và đánh giá nhà cung cấp | **Dương Văn Quang** | Hàng năm | Hoàn thành trước ngày 30/11 hàng năm | Không | 14 ngày | |
| **W009** | `XN.QL.09` | Giải quyết khiếu nại khách hàng | **Trần Thị Vân** | Phát sinh | Tiếp nhận trong ngày; Trưởng khoa đặt hạn | **Có** | 0 ngày | |
| **W010** | `XN.QL.10` | Kiểm soát môi trường xét nghiệm | **Trần Thị Vân** | Hàng ngày | Hoàn thành trước 09:00 ngày làm việc | Không | 0 ngày | |
| **W011** | `XN.QL.12` | Quản lý thông tin phòng xét nghiệm | **Nguyễn Thị Thu Hương** | Hàng quý | Rà soát trước ngày 05 tháng đầu quý sau | Không | 5 ngày | |
| **W012** | `XN.QL.18` | Ngoại kiểm | **Lê Tuấn Anh** | Theo đợt | Hạn theo đợt chương trình ngoại kiểm | Không | 5 ngày | |
| **W013** | `XN.QL.19` | Quản lý sinh phẩm, vật tư, hóa chất | **Dương Văn Quang** | Hàng tháng | Chốt rà soát trước ngày 03 tháng kế tiếp | Không | 3 ngày | |
| **W014** | `XN.QL.20` | Đảm bảo tính khách quan | **Lê Tuấn Anh** | Hàng năm / Đổi | Rà soát trước 30/11; cập nhật khi có vụ việc | **Có** | 14 ngày | |
| **W015** | `XN.QL.22` | Bảo mật thông tin | **Lê Tuấn Anh** | Hàng năm / Đổi | Rà soát trước 30/11; sự cố tạo ngay trong ngày| **Có** | 14 ngày | |
| **W016** | `XN.QL.24` | Quản lý rủi ro | **Trần Thị Vân** | Hàng quý | Rà soát trước ngày 05 tháng đầu quý sau | **Có** | 7 ngày | |
| **W017** | `XN.QL.25` | Cải tiến liên tục | **Lại Hải Hà** | Hàng quý | Chốt tiến độ trước ngày 10 tháng đầu quý sau | **Có** | 7 ngày | |
| **W018** | `XN.QL.26` | Khảo sát sự hài lòng khách hàng | **Lê Tuấn Anh** | Hàng quý | Tổng hợp trước ngày 10 tháng đầu quý sau | Không | 7 ngày | |
| **W019** | `XN.QL.27` | Quản lý hồ sơ | **Lại Hải Hà** | Hàng tháng | Rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W020** | `XN.QL.28` | Đánh giá nội bộ | **Nguyễn Thị Ngân** | Hàng năm | Hoàn thành trước ngày 31/10 hàng năm | **Có** | 14 ngày | |
| **W021** | `XN.QL.29` | Theo dõi & đánh giá bộ chỉ số CL | **Lại Hải Hà** | Hàng tháng | Chốt số liệu trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W022** | `XN.QL.30` | Quản lý nhân sự | **Lương Thị Thùy Dung** | Hàng tháng / Đổi | Rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W023** | `XN.QL.31` | Lựa chọn & chuyển gửi mẫu ngoại viện | **Đào Thị Nguyệt** | Phát sinh / Quý | Rà soát trước ngày 05 tháng đầu quý sau | **Có** | 3 ngày | |
| **W024** | `HT.QL.01` | Kiểm soát tài liệu hệ thống QLCL | **Lại Hải Hà** | Hàng tháng / Đổi | Rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W025** | `GB.QL.02` | Tiếp nhận mẫu Giải phẫu bệnh | **Lương Thị Thùy Dung** | Hàng ngày | Hoàn thành trước 16:30 ngày làm việc | Không | 0 ngày | |
| **W026** | `GB.QL.04` | Báo cáo kết quả Giải phẫu bệnh | **Lương Thị Thùy Dung** | Hàng tháng | Rà soát TAT trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W027** | `GB.QL.05` | Lưu mẫu & xử lý mẫu hết hạn lưu | **Lương Thị Thùy Dung** | Hàng tháng | Rà soát trước ngày 10 tháng kế tiếp | Không | 5 ngày | |
| **W028** | `GB.QL.06-07`| Lưu lam/block và mượn trả | **Lương Thị Thùy Dung** | Hàng tháng | Rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W029** | `GB.QL.08` | Nội kiểm | **Lê Tuấn Anh** | Hàng tháng | Chốt tổng hợp trước ngày 05 tháng kế tiếp | Không | 3 ngày | 👉 `https://iso-gpb-duc-giang.vercel.app/` |
| **W030** | `GB.QL.09` | Xác nhận giá trị SD / duyệt phương pháp | **Nguyễn Thị Ngân** | Phát sinh | Hạn do Trưởng khoa đặt theo kế hoạch | **Có** | 7 ngày | 👉 `https://iso-gpb-duc-giang.vercel.app/` |

---

## 4. THIẾT KẾ LOGIC TÍNH HẠN & TRẠNG THÁI VẬN HÀNH

### A. 4 Trạng thái chuẩn ISO (Theo Sheet `STATUS_DICTIONARY`)
- `OVERDUE` (Quá hạn - Thẻ đỏ): `Hôm nay > Due_Date` VÀ chưa có `Completed_Date`. Hiển thị nhãn số ngày trễ `(Trễ X ngày)`.
- `DUE_SOON` (Sắp đến hạn - Thẻ vàng): `Hôm nay >= Due_Date - Reminder_Days` VÀ chưa hoàn thành.
- `NOT_DUE` (Chưa đến hạn - Thẻ xám): `Hôm nay < Due_Date - Reminder_Days`.
- `COMPLETED` (Đã hoàn thành - Thẻ xanh lá): Đã có `Completed_Date` và được Trưởng khoa phê duyệt (nếu có yêu cầu duyệt).
- `PENDING_APPROVAL` (Chờ duyệt - Thẻ xanh lơ): Nhân viên đã nộp báo cáo, đang chờ Trưởng khoa duyệt.

### B. Quy tắc sinh hạn tự động & Quét quá hạn toàn diện
- **Công việc hàng ngày (Daily):** Tính các ngày làm việc Thứ 2 – Thứ 6 (tự động bỏ qua Thứ 7, Chủ nhật). Nếu nhân viên không làm ngày hôm trước hoặc các ngày trước đó, các task cũ đó sẽ được giữ nguyên và tự động chuyển thành `OVERDUE` (Quá hạn) khi bước sang ngày mới để kiểm soát nợ việc theo tiêu chuẩn ISO 15189.
- **Cơ chế Quét Quá hạn Tự động (Comprehensive Overdue Sweep):** Mỗi khi hệ thống được nạp (hoặc khi cron keep-alive chạy lúc 07:00 sáng), hệ thống quét toàn bộ các task chưa hoàn thành (`status !== 'COMPLETED'`) trong CSDL Supabase. Nếu `Hôm nay > due_date`, hệ thống tự động đổi trạng thái sang `OVERDUE` và cập nhật tức thời vào Supabase, loại bỏ triệt để hiện tượng task cũ bị kẹt ở trạng thái `DUE_SOON`.
- **Công việc hàng tháng kỳ `M/YYYY`:** Hạn là ngày 03, 05 hoặc 10 của tháng `(M+1)/YYYY`.
- **Công việc hàng quý:** Hạn là ngày 05 hoặc 10 của tháng đầu quý kế tiếp.
- **Công việc hàng năm:** Hạn cố định theo lịch khoa (31/10, 30/11, 15/12).
- **Công việc phát sinh:** Khởi tạo linh hoạt khi có sự cố, CAPA, khiếu nại...

---

## 5. THIẾT KẾ CÁC MÀN HÌNH CHỨC NĂNG

### 1. Dashboard Tổng quan (`/`)
- Mọi thành viên đều xem được.
- **Top Bar:** 4 thẻ KPI (Quá hạn, Sắp đến hạn, Đã hoàn thành, Tỷ lệ tuân thủ %). Thanh Header trên cùng được dọn sạch, loại bỏ hoàn toàn các link module lẻ để giữ giao diện chuẩn mực, tinh gọn.
- **Bảng Điểm nghẽn:** Đúng 7 cột chuẩn (`STT`, `Mã`, `Đầu việc quản lý`, `Phụ trách`, `Hạn hoàn thành (kèm số ngày trễ)`, `Trạng thái`, `Thao tác` có nút xem minh chứng trực tiếp). Ưu tiên việc Quá hạn lên trên đầu. Mọi ngày trễ của công việc hàng ngày đều được liệt kê chi tiết tại đây để Trưởng khoa đôn đốc.
- **Thẻ Tiến độ Nhân sự:** Thống kê khối lượng từng người, bấm vào lọc ra ngay công việc của người đó (BS. Đào Thị Nguyệt ra đúng 2 việc).
- **Bảng 30 Đầu việc Quản lý Chất lượng (ISO 15189):**
  - **Cơ chế giữ chuẩn 30 dòng (Anti-clutter):** Gom nhóm theo từng đầu việc để bảng luôn duy trì đúng 30 dòng đại diện chuẩn (W001 – W030), không bị phình to khi công việc hàng ngày tích lũy qua nhiều ngày. Bộ nút lọc phía trên bảng (`Tất cả`, `Quá hạn`, `Sắp đến hạn`, `Chờ duyệt`, `Đã xong`) tính toán chính xác trên danh mục 30 đầu việc này, đảm bảo nhãn "Tất cả" luôn hiển thị đúng chuẩn `Tất cả (30)`.
  - **Cảnh báo nợ việc hàng ngày:** Nếu đầu việc hàng ngày có các ngày cũ chưa làm, hệ thống hiển thị nhãn cảnh báo đỏ trực tiếp dưới tên đầu việc: `⚠️ Còn nợ X ngày trước chưa kiểm soát`.
  - Cấu trúc các cột: **`STT` (đánh số thứ tự 1-30)**, `Mã`, `Đầu việc quản lý`, `Phụ trách`, `Hạn hoàn thành`, `Trạng thái`, `Minh chứng`, `Thao tác`, và **cột cuối cùng là `Link ngoài`**.
  - **Cột Link ngoài (Cơ chế bền vững - Single Source of Truth):**
    - Link ngoài được lưu trữ tập trung tại bảng danh mục gốc `iso_work_items` trong CSDL Supabase và tự động ánh xạ sang danh sách task khi hiển thị.
    - **Không bị mất khi F5 / reset:** Dù người dùng tải lại trang, đổi thiết bị hay reset phiên làm việc, link đã gắn luôn được nạp chính xác 100%.
    - Đầu việc đã có link: Hiển thị nút **"Mở link"** chuyển đến hệ thống chuyên dụng (tab mới).
    - Với tài khoản Admin: Có nút **Sửa link (✏️)** và **Xóa link (🗑️)** trực tiếp trên từng dòng.
    - Đầu việc chưa có link: Admin thấy nút **`+ Gắn link`**.
    - **Cơ chế Module động (Zero Code Change):** Khi khoa có thêm bất kỳ module/phần mềm mới nào (như LIS/HIS, quản lý sự cố mới), Trưởng khoa chỉ cần bấm nút gắn link để dán URL mới và lưu trực tiếp vào CSDL Supabase, hoặc bấm xóa link để nạp lại khi có thay đổi.

### 2. Trang "Đầu việc của tôi" & Báo cáo (`/my-tasks`)
- Lọc chính xác chỉ hiển thị các công việc được giao cho cá nhân đang đăng nhập.
- Thao tác nộp báo cáo: Chọn ngày hoàn thành, viết ghi chú, dán link hoặc tải minh chứng.
- **Hỗ trợ đầy đủ các nguồn tải ảnh trên điện thoại (Mobile Upload Options):**
  - Cho phép người dùng tùy chọn: Chụp ảnh trực tiếp bằng Camera, chọn ảnh có sẵn từ Thư viện ảnh (Photo Library), hoặc chọn tệp PDF/Word/Excel. Không ép buộc chỉ mở Camera.
- **Nén ảnh tự động ngay trên trình duyệt điện thoại** trước khi tải lên (Client-side compression: từ 5-15MB còn 200-500KB).
- **Nút bấm xem minh chứng trực tiếp** (cho cả nhân viên và Trưởng khoa mở xem ngay ảnh/PDF/link ngoài).
- Tab "Phê duyệt" dành riêng cho Trưởng khoa để duyệt hoặc yêu cầu làm lại.

### 3. Trang Bảng phân công & Điều hành (`/assignment`)
- Dành cho Trưởng khoa / Admin.
- Cho phép đổi người phụ trách, đổi hạn, đổi chu kỳ mà không cần can thiệp mã nguồn.
- Tạo nhanh công việc phát sinh (Sự không phù hợp, CAPA, Khiếu nại...).

### 4. Trang Quản lý Nhân sự (`/admin/users`)
- Thêm nhân viên mới, chỉnh sửa thông tin nhân viên.
- Đặt lại mật khẩu tạm `isogpb@2026` khi nhân viên quên mật khẩu.
- Vô hiệu hóa hoặc kích hoạt lại tài khoản.
