---
version: alpha
name: QuanLyThietBi
description: Hệ thống Quản lý Thiết bị Y tế & CNTT Bệnh viện (quanlithietbi.bstrung.vn)
colors:
  primary: "#1F5C55"
  primary-tint: "#E3EFEC"
  primary-deep: "#16443F"
  secondary: "#5C6B68"
  ink: "#12211F"
  surface: "#F7F8F6"
  card: "#FFFFFF"
  line: "#DDE3E0"
  muted: "#5C6B68"
  status-dang-su-dung-bg: "#E3EFEC"
  status-dang-su-dung-fg: "#1F5C55"
  status-dang-su-dung-border: "#B8D5CE"
  status-dang-sua-bg: "#FDF0DC"
  status-dang-sua-fg: "#8A5108"
  status-dang-sua-border: "#EFD3A3"
  status-hu-hong-bg: "#FBE6E4"
  status-hu-hong-fg: "#B3261E"
  status-hu-hong-border: "#F0BDB8"
  status-ngung-su-dung-bg: "#EEF0EF"
  status-ngung-su-dung-fg: "#59665F"
  status-ngung-su-dung-border: "#D6DBD8"
  status-bv-thu-hoi-bg: "#EAE7F5"
  status-bv-thu-hoi-fg: "#453687"
  status-bv-thu-hoi-border: "#C9C1E8"
  status-chua-kiem-tra-bg: "#E4EEF8"
  status-chua-kiem-tra-fg: "#1F4E79"
  status-chua-kiem-tra-border: "#B9D0E8"
typography:
  h1:
    fontFamily: Be Vietnam Pro
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: Be Vietnam Pro
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  data-mono:
    fontFamily: IBM Plex Mono
    fontSize: 0.8125rem
    fontWeight: 500
rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 8px 16px
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  badge-asset-code:
    backgroundColor: "{colors.primary-deep}"
    textColor: "#FFFFFF"
    typography: "{typography.data-mono}"
    rounded: "{rounded.sm}"
    padding: 2px 6px
---

# TÀI LIỆU THIẾT KẾ HỆ THỐNG: QUẢN LÝ THIẾT BỊ Y TẾ & CNTT
**Dự án:** Quản lý thiết bị y tế & CNTT Bệnh viện đa khoa Đức Giang  
**Tên miền:** `quanlithietbi.bstrung.vn` (DNS Mắt Bão)  
**Kho mã nguồn:** GitHub `luonghaianh1208/quanlithietbi`  
**Triển khai:** Vercel (Frontend & Server Actions) · **Dữ liệu & Xác thực:** Supabase Postgres + Auth + Storage  

---

## 1. Bối cảnh & Mục tiêu Hệ thống

Bệnh viện cần một **sổ tài sản điện tử** cho thiết bị y tế (máy siêu âm, máy nội soi, máy xét nghiệm, kính hiển vi...) và thiết bị công nghệ thông tin (máy tính, máy in, switch...).  
Mỗi thiết bị là một **tài sản cá thể riêng biệt** có mã máy duy nhất, lý lịch vận hành và tình trạng kỹ thuật — **không phải** vật tư tiêu hao đếm theo số lượng.

### 4 câu hỏi cốt lõi hệ thống giải quyết:
1. **Khoa tôi đang giữ những máy nào, tình trạng ra sao?**
2. **Máy này đã sửa những lần nào, luân chuyển qua những khoa nào?**
3. **Máy này còn giá trị sử dụng bao nhiêu, khi nào hết khấu hao?**
4. **Hồ sơ pháp lý, chứng từ mua sắm và biên bản sửa chữa máy ở đâu?**

---

## 2. Kiến trúc Công nghệ & Hạ tầng

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions).
- **Styling:** Tailwind CSS v4 (inline theme, CSS variables cho design tokens).
- **Cơ sở dữ liệu:** PostgreSQL (Supabase) cưỡng chế bảo mật dữ liệu đa tầng bằng **Row Level Security (RLS)**.
- **Xác thực:** Supabase Auth (Email + Password), quản lý phiên qua HTTP-only cookies (`@supabase/ssr`).
- **File Storage:** Supabase Storage (Bucket bảo mật lưu trữ ảnh, hợp đồng mua sắm, hồ sơ kỹ thuật).
- **Mã QR:** Sinh vector QR trực tiếp từ mã máy, hỗ trợ in hàng loạt tem nhãn A4 (3x8 hoặc 4x10 nhãn/trang) và quét nhanh bằng camera điện thoại.
- **Xử lý Excel:** `exceljs` phục vụ xuất báo cáo động và nhập dữ liệu hàng loạt (người dùng & thiết bị) từ file Excel chuẩn bệnh viện.

---

## 3. Hệ thống Thiết kế Giao diện (Design System & UI Tokens)

Triết lý thiết kế: **Flat, Quiet & Medical Precision**.  
Mọi yếu tố giao diện giữ sự trang nhã, nghiêm túc, tập trung vào dữ liệu. Điểm neo thị giác duy nhất là **khối nhãn máy** đồng nhất giữa màn hình và tem in dán ngoài đời thực.

### 3.1 Bảng màu đặc trưng (Color Tokens)
- `--drape` (`#1F5C55`): Xanh vải mổ — màu chủ đạo của phòng phẫu thuật, bù màu đỏ của máu, tạo cảm giác thư giãn thị giác cho nhân viên y tế.
- `--drape-tint` (`#E3EFEC`): Nền nhạt đồng điệu.
- `--drape-deep` (`#16443F`): Nền khối nhãn máy và điểm nhấn cao.
- `--ink` (`#12211F`): Màu chữ chính gần đen, ám xanh sâu.
- `--surface` (`#F7F8F6`): Nền trang web, sạch sẽ, không ngả vàng.
- `--card` (`#FFFFFF`): Nền card và bảng dữ liệu.
- `--line` (`#DDE3E0`): Đường phân cách hairline 1px.
- `--muted` (`#5C6B68`): Chữ phụ, nhãn ô (đạt chuẩn tương phản WCAG AA ≥ 4.5:1).

### 3.2 Nhận diện 06 Tình trạng Thiết bị (Status Badges)
Mỗi tình trạng được mã hóa bằng chữ kèm bộ màu độc lập (nền, chữ, viền) để người mù màu vẫn nhận biết rõ ràng:
1. **Đang sử dụng:** Nền `#E3EFEC`, chữ `#1F5C55`, viền `#B8D5CE` (xanh mổ êm dịu).
2. **Đang sửa:** Nền `#FDF0DC`, chữ `#8A5108`, viền `#EFD3A3` (vàng hổ phách cảnh báo nhẹ).
3. **Hư hỏng:** Nền `#FBE6E4`, chữ `#B3261E`, viền `#F0BDB8` (đỏ y tế báo động).
4. **Ngừng sử dụng:** Nền `#EEF0EF`, chữ `#59665F`, viền `#D6DBD8` (xám tĩnh).
5. **BV đã thu hồi:** Nền `#EAE7F5`, chữ `#453687`, viền `#C9C1E8` (tím hành chính).
6. **Chưa kiểm tra:** Nền `#E4EEF8`, chữ `#1F4E79`, viền `#B9D0E8` (xanh dương trung tính nhập từ Excel).

### 3.3 Kiểu chữ (Typography)
- **Be Vietnam Pro:** Bộ font giao diện được thiết kế tối ưu riêng cho dấu thanh và dấu mũ tiếng Việt (`ế`, `ộ`, `ữ` không bị bẹp/chồng).
- **IBM Plex Mono:** Bộ font đơn cách cho mã máy, số serial, ngày tháng, tiền tệ, phần trăm (`tabular-nums`), đảm bảo tính chuẩn xác, tránh nhầm lẫn ký tự `0`/`O`, `1`/`l`.

---

## 4. Mô hình Dữ liệu Database (PostgreSQL Schema)

### 4.1 Bảng `departments` (Khoa / Phòng ban)
- `id` (uuid, PK)
- `code` (text, UNIQUE NOT NULL) — VD: `CDHA`, `NOI`, `HSTC_CD`, `CNTT`, `KHO-TAM`.
- `name` (text, NOT NULL)
- `is_central` (boolean, DEFAULT false) — Duy nhất 1 bản ghi `true` đánh dấu **Kho tạm chung bệnh viện**.
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamptz, DEFAULT now())

### 4.2 Bảng `profiles` (Hồ sơ người dùng & Phân quyền)
- `id` (uuid, PK, liên kết `auth.users(id)` ON DELETE CASCADE)
- `full_name` (text, NOT NULL)
- `role` (text, NOT NULL) — CHECK `role IN ('admin', 'truong_khoa', 'pho_khoa', 'staff')`.
- `department_id` (uuid, FK → `departments(id)`) — Bắt buộc đối với `staff`, `truong_khoa`, `pho_khoa`; NULL đối với `admin`.
- `must_change_password` (boolean, DEFAULT false) — Bắt buộc đổi mật khẩu khi nhập tài khoản từ Excel.
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamptz)

### 4.3 Bảng `asset_categories` (Phân loại thiết bị)
- `id` (uuid, PK)
- `name` (text, UNIQUE NOT NULL) — VD: Siêu âm, X-Quang, Kính hiển vi, Máy vi tính, Máy in...
- `group` (text, NOT NULL) — CHECK `group IN ('y_te', 'cntt', 'noi_that', 'dien_lanh', 'van_chuyen')`.
- `default_useful_life_years` (smallint, CHECK > 0) — Số năm khấu hao mặc định.
- `is_active` (boolean, DEFAULT true)

### 4.4 Bảng `assets` (Sổ tài sản thiết bị)
- `id` (uuid, PK)
- `asset_code` (text, UNIQUE NOT NULL) — Mã máy định danh duy nhất. CHECK regex `^[A-Z0-9][A-Z0-9._-]{1,31}$`.
- `name` (text, NOT NULL) — Tên thiết bị.
- `category_id` (uuid, FK → `asset_categories`)
- `model`, `serial_number`, `manufacturer`, `origin_country` (text)
- `year_manufactured`, `purchase_year`, `in_service_year` (smallint, 1900–2100)
- `original_cost` (numeric(15,2), CHECK ≥ 0) — Nguyên giá (VND).
- `useful_life_years` (smallint, CHECK > 0) — Thời gian tính hao mòn (năm).
- `status` (text, NOT NULL) — CHECK 6 trạng thái kỹ thuật.
- `status_note` (text) — Bắt buộc có lý do khi `status = 'bv_thu_hoi'`.
- `department_id` (uuid, FK → `departments`) — Khoa hiện đang quản lý máy.
- `location` (text) — Vị trí thực tế (phòng khám, phòng mổ...).
- `specs` (text) — Thông số kỹ thuật chi tiết.
- `notes` (text) — Ghi chú bổ sung.
- `original_code` (text) — Mã gốc trước khi chuẩn hóa (dùng khi import Excel phát sinh mã lạ).
- `import_batch_id` (uuid, FK → `import_batches`) — Đợt nhập khẩu Excel.
- `created_at`, `updated_at` (timestamptz)
- `created_by`, `updated_by` (uuid → `profiles`)

### 4.5 Bảng `asset_events` (Lý lịch & Lịch sử vận hành)
Hợp nhất 3 loại biến động tài sản trên một timeline duy nhất:
- `id` (uuid, PK)
- `asset_id` (uuid, FK → `assets` ON DELETE CASCADE)
- `type` (text, NOT NULL) — CHECK `type IN ('sua_chua', 'dieu_chuyen', 'doi_tinh_trang')`.
- `event_date` (date, NOT NULL DEFAULT current_date)
- `note` (text)
- `performed_by` (uuid → `profiles`)
- **Trường Sửa chữa:** `vendor` (đơn vị sửa), `cost` (chi phí sửa), `result` (kết quả khắc phục).
- **Trường Điều chuyển:** `from_department_id`, `to_department_id` (FK → `departments`), `to_external` (nơi nhận ngoài viện).
- **Trường Đổi tình trạng:** `from_status`, `to_status`.

### 4.6 Bảng `attachments` (File đính kèm & Minh chứng)
- `id` (uuid, PK)
- `asset_id` (uuid, FK → `assets`)
- `event_id` (uuid, NULL, FK → `asset_events`) — Gắn minh chứng hóa đơn/biên bản vào từng lần sửa chữa.
- `kind` (text) — CHECK `kind IN ('anh', 'chung_tu_mua', 'ho_so_sua', 'tai_lieu_ky_thuat')`.
- `storage_path` (text, UNIQUE NOT NULL)
- `file_name`, `mime_type`, `size_bytes` (thông tin tệp)
- `uploaded_by` (uuid → `profiles`)

### 4.7 Bảng `import_batches` & Sequence sinh mã tự động
- Bảng lưu vết lịch sử các lần tải lên file Excel: người nhập, tên file, số lượng bản ghi thành công/bỏ qua/lỗi.
- Sequence `asset_code_seq` phục vụ sinh mã định dạng chuẩn `{mã khoa}-{5 số}` (ví dụ: `KBTYC-00001`) cho các thiết bị thiếu mã hoặc mã không đúng quy cách.

---

## 5. Ma trận Phân quyền & Chính sách Bảo mật (RLS Matrix)

Hệ thống cưỡng chế phân quyền tại mức cơ sở dữ liệu PostgreSQL (Row Level Security):

| Hành động / Dữ liệu | `admin` (Quản trị viên) | `truong_khoa` / `pho_khoa` | `staff` (Nhân viên khoa) |
|---|---|---|---|
| **Xem danh mục thiết bị** | Toàn bộ các khoa + Kho tạm | Chỉ thiết bị thuộc khoa mình | Chỉ thiết bị thuộc khoa mình |
| **Thêm / Cập nhật thiết bị** | Toàn quyền trên mọi khoa | Thiết bị thuộc khoa mình | Thiết bị thuộc khoa mình |
| **Đổi tình trạng / Ghi sửa chữa** | Toàn quyền | Máy thuộc khoa mình | Máy thuộc khoa mình |
| **Điều chuyển thiết bị** | Bất kỳ khoa nào (kể cả Kho tạm) | Chuyển máy khoa mình sang khoa khác | Chuyển máy khoa mình sang khoa khác |
| **Xóa thiết bị vĩnh viễn** | Có quyền | Không có quyền | Không có quyền |
| **Xem lịch sử sự kiện máy** | Toàn viện | Khoa mình | Khoa mình |
| **Sửa / Xóa bản ghi lịch sử** | Chỉ Admin | Không được sửa lịch sử | Không được sửa lịch sử |
| **Quản lý người dùng trong khoa**| Toàn viện (tạo, sửa, khóa, đổi role)| Tạo/sửa/reset mật khẩu nhân viên khoa| Chỉ xem hồ sơ chính mình |
| **Nhập thiết bị từ Excel** | Toàn quyền | Không có quyền | Không có quyền |
| **Cấu hình cột báo cáo, khoa, loại**| Toàn quyền | Không có quyền | Không có quyền |

---

## 6. Luồng Nghiệp vụ Trọng tâm

### 6.1 Tính Hao mòn / Khấu hao Đường thẳng (On-the-fly)
Hệ thống tính toán giá trị còn lại theo công thức khấu hao đường thẳng trực tiếp lúc hiển thị (không sinh dòng dữ liệu định kỳ gây rác database):
$$\text{Mức hao mòn hàng năm} = \frac{\text{Nguyên giá}}{\text{Số năm tính hao mòn}}$$
$$\text{Thời gian đã sử dụng (năm)} = \max\left(0, \, \text{Năm hiện tại} - \text{Năm đưa vào sử dụng}\right)$$
$$\text{Giá trị còn lại} = \max\left(0, \, \text{Nguyên giá} - (\text{Mức hao mòn hàng năm} \times \text{Thời gian đã dùng})\right)$$

### 6.2 Quản lý Mã QR & Tem Nhãn Thiết bị
- Tự động sinh mã QR trỏ về URL định danh thiết bị: `https://quanlithietbi.bstrung.vn/thiet-bi/{asset_code}`.
- Bác sĩ, kỹ sư quét mã bằng camera điện thoại hoặc Zalo để mở ngay thẻ lý lịch máy, báo hỏng hoặc cập nhật sửa chữa tại chỗ.
- Module in tem nhãn chuẩn A4: Tùy chọn in hàng loạt theo khoa hoặc danh sách chọn, bố cục chuẩn kích thước tem decal dán thiết bị y tế.

### 6.3 Nhập Dữ liệu Thiết bị Hàng loạt từ Excel
- Hỗ trợ định dạng file thực tế của bệnh viện (file danh mục chuẩn 23 cột `Danh muc thiet bi KBTYC`).
- Thuật toán nhận diện cột tự động theo tiêu đề tiếng Việt.
- Cơ chế phát hiện mã trùng thông minh: Bỏ qua thiết bị đã tồn tại trong hệ thống, không ghi đè mất dữ liệu lịch sử.
- Cơ chế sinh mã tự động cho thiết bị không có mã hoặc mã chứa ký tự đặc biệt không hợp lệ.

---

## 7. Triển khai & Vận hành

- **Domain:** `quanlithietbi.bstrung.vn` cấu hình CNAME về Vercel edge network.
- **SSL / HTTPS:** Tự động qua Let's Encrypt / Vercel Managed Certificates.
- **Biến môi trường bắt buộc:**
  - `NEXT_PUBLIC_SUPABASE_URL`: Endpoint kết nối Supabase project.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key cho client Supabase.
  - `SUPABASE_SERVICE_ROLE_KEY`: Secret service role key cho các tác vụ quản trị server-side (tạo tài khoản, import hàng loạt).
