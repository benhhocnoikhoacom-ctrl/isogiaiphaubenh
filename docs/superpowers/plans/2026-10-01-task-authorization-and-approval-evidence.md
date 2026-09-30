# Kế Hoạch Nâng Cấp Khóa Quyền Nộp Việc & Trực Quan Hóa Phê Duyệt Trưởng Khoa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khóa mờ nút nộp báo cáo đối với các công việc không thuộc phân công của người dùng, nâng cấp giao diện phê duyệt của Trưởng khoa trực quan (xem ảnh/link minh chứng trực tiếp thay vì hình thức), và giữ nguyên toàn bộ cơ chế đăng nhập.

**Architecture:** 
1. Client-side Authorization State: Xác định quyền thực hiện công việc (`isMyTask || isAdmin`). Nếu không thuộc quyền, làm mờ nút "Báo cáo hoàn thành" (disabled, opacity-40, cursor-not-allowed) kèm nhãn nhắc nhở rõ ràng.
2. Trưởng khoa Evidence Viewer: Bổ sung khung xem trước ảnh (Thumbnail) trực tiếp trên thẻ duyệt của Trưởng khoa kèm Modal Lightbox phóng to ảnh sắc nét khi bấm vào, hiển thị thẻ liên kết Drive nổi bật, và hiện cảnh báo đỏ nếu nhân viên nộp trống.
3. Ràng buộc minh chứng khi nộp: Yêu cầu nhân viên phải có ít nhất 1 hình thức minh chứng (Ảnh/File, Link, hoặc Ghi chú cụ thể) trước khi gửi.
4. Giữ nguyên 100% phần Đăng nhập theo đúng chỉ đạo của người dùng.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons, Supabase PostgreSQL, NextAuth.js.

**Spec:** [THIET_KE_KIEN_TRUC_VA_NGHIEP_VU_ISO_GIAI_PHAU_BENH.md](file:///c:/Users/hi/Desktop/MyApp/my-medical-app/THIET_KE_KIEN_TRUC_VA_NGHIEP_VU_ISO_GIAI_PHAU_BENH.md)

## Global Constraints
- Tuyệt đối không chỉnh sửa mã nguồn phần Đăng nhập (`auth.ts`, `app/login/`).
- Tuân thủ quy chuẩn y khoa, giao diện hiện đại xu hướng 2026.
- Đảm bảo kiểm thử biên dịch `npm.cmd run build` đạt 0 lỗi trước khi bàn giao.

---

### Task 1: Khóa mờ nút "Báo cáo hoàn thành" trên các công việc không được phân công

**Files:**
- Modify: `components/tasks/MyTasksView.tsx`

**Interfaces:**
- Input: `session.user.email`, `session.user.role`, `task.assigneeId`, `task.assigneeName`
- Output: Nút "Báo cáo hoàn thành" ở trạng thái disabled, mờ đi kèm thông báo khi `!isMyTask && !isAdmin`.

- [x] **Step 1: Cập nhật hàm kiểm tra quyền và trạng thái nút trên từng thẻ công việc**
  - Trong `MyTasksView.tsx`, xác định biến `canSubmit = isMyTask(task) || session?.user?.role === "ADMIN"`.
  - Nếu `canSubmit === false`:
    - Thay thế nút bấm xanh bằng nút mờ (`bg-[#EDF2F0] text-[#718581] border border-[#D5DFDC] opacity-60 cursor-not-allowed`).
    - Hiển thị biểu tượng `<Lock className="h-3.5 w-3.5" />` và nhãn: `"Chỉ phân công cho ${task.assigneeName}"`.
    - Thuộc tính `disabled={true}` ngăn chặn hoàn toàn sự kiện bấm chuột.

- [x] **Step 2: Thêm lớp bảo vệ tại Backend Server Action**
  - Trong `app/actions/task-actions.ts` (hàm `submitTaskCompletion`):
    - Lấy thông tin phiên làm việc từ `auth()`.
    - Nếu người gửi không phải người được giao việc và không phải Admin -> Trả về `{ success: false, error: "Bạn không được phân công đầu việc này." }`.

- [x] **Step 3: Kiểm tra giao diện và hành vi**
  - Chạy `npm.cmd run build` để kiểm tra TypeScript (đã vượt qua 0 lỗi).
  - Xác nhận rằng khi xem tab "Toàn khoa", các công việc của người khác đều bị khóa mờ nút nộp.

---

### Task 2: Nâng cấp Giao diện Phê duyệt của Trưởng khoa (Hiển thị Ảnh & Link Trực quan)

**Files:**
- Modify: `components/dashboard/ExecutiveDashboard.tsx`

**Interfaces:**
- Input: `pendingTasks` với các trường `evidenceUrl`, `evidenceFileName`, `note`, `completedDate`, `assigneeName`.
- Output: Thẻ phê duyệt trực quan có khung hiển thị ảnh (Thumbnail), nút phóng to toàn màn hình (Lightbox Modal), nút mở liên kết Drive, và thẻ cảnh báo khi thiếu minh chứng.

- [x] **Step 1: Xây dựng Modal Lightbox phóng to ảnh minh chứng**
  - Tạo state `previewImage` để mở modal xem ảnh độ phân giải cao khi Trưởng khoa bấm vào ảnh thu nhỏ.
  - Thêm nút đóng modal và nút mở trong tab mới.

- [x] **Step 2: Nâng cấp khối hiển thị minh chứng trên từng thẻ chờ duyệt**
  - Nhận diện loại minh chứng:
    - Nếu `evidenceUrl` là ảnh: Hiển thị ảnh thu nhỏ với bo góc mềm mại, độ nét cao, nhãn `"Ảnh minh chứng sổ ghi / tài liệu"`, bấm vào phóng to xem chi tiết.
    - Nếu `evidenceUrl` là link Drive: Hiển thị thẻ nút bấm xanh lá nổi bật mở tài liệu Drive.
    - Nếu `note` có nội dung: Đặt trong khối trích dẫn rõ ràng, hiển thị ngày nhân viên hoàn thành thực tế.
    - Nếu hoàn toàn KHÔNG có file và KHÔNG có link: Hiển thị hộp cảnh báo màu vàng/đỏ: `"⚠️ Không có ảnh/link minh chứng: Nhân viên nộp trống..."` để Trưởng khoa bấm Yêu cầu bổ sung ngay.

---

### Task 3: Bổ sung ràng buộc tối thiểu khi nộp báo cáo (Chống nộp trống)

**Files:**
- Modify: `components/tasks/MyTasksView.tsx`

- [x] **Step 1: Kiểm tra ràng buộc hợp lệ trước khi gửi form**
  - Khi nhân viên bấm "Gửi báo cáo", kiểm tra:
    - Phải có file tải lên (`evidenceFile`), HOẶC
    - Phải có link Drive (`evidenceUrl`), HOẶC
    - Phải có ghi chú kết quả cụ thể (`note.trim().length >= 6`).
  - Nếu bỏ trống cả 3 trường: Hiển thị thông báo đỏ ngay trên form: *"Vui lòng đính kèm ít nhất 1 ảnh chụp sổ ghi/file, HOẶC dán link Drive, HOẶC ghi chú kết quả cụ thể (tối thiểu 6 ký tự)."* và không cho gửi form trống.

---

### Task 4: Kiểm thử toàn diện & Cập nhật Hồ sơ Thiết kế

**Files:**
- Test & Verify: `npm.cmd run build`
- Document: `THIET_KE_KIEN_TRUC_VA_NGHIEP_VU_ISO_GIAI_PHAU_BENH.md`

- [x] **Step 1: Chạy kiểm thử Build toàn bộ hệ thống**
  - Chạy `npm.cmd run build` đảm bảo không có bất kỳ lỗi biên dịch nào.

- [x] **Step 2: Cập nhật tài liệu thiết kế dự án**
  - Cập nhật quy tắc khóa nút nộp và cơ chế duyệt trực quan vào file [THIET_KE_KIEN_TRUC_VA_NGHIEP_VU_ISO_GIAI_PHAU_BENH.md](file:///c:/Users/hi/Desktop/MyApp/my-medical-app/THIET_KE_KIEN_TRUC_VA_NGHIEP_VU_ISO_GIAI_PHAU_BENH.md).
  - Báo cáo rõ ràng cho Bác sĩ sau khi hoàn thành.
