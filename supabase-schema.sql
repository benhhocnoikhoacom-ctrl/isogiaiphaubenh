-- ====================================================================
-- SCHEMA CƠ SỞ DỮ LIỆU ISO 15189 KHOA GIẢI PHẪU BỆNH TRÊN SUPABASE (POSTGRESQL)
-- ====================================================================

-- 1. BẢNG NHÂN VIÊN (iso_users)
CREATE TABLE IF NOT EXISTS public.iso_users (
    id TEXT PRIMARY KEY,                       -- Email nhân viên (ví dụ: nguyethmu@gmail.com)
    full_name TEXT NOT NULL,                  -- Họ và tên
    role TEXT NOT NULL DEFAULT 'USER',        -- ADMIN hoặc USER
    title TEXT,                               -- Chức danh: Trưởng khoa, Bác sĩ, KTV
    email TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL DEFAULT 'isogpb@2026',
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BẢNG 30 ĐẦU VIỆC QUẢN LÝ ISO (iso_work_items)
CREATE TABLE IF NOT EXISTS public.iso_work_items (
    item_id TEXT PRIMARY KEY,                 -- W001 đến W030
    item_code TEXT NOT NULL,                  -- Mã: XN.QL.01, GB.QL.02...
    item_name TEXT NOT NULL,                  -- Tên đầu việc
    assignee_id TEXT REFERENCES public.iso_users(id) ON UPDATE CASCADE,
    assignee_name TEXT NOT NULL,
    reviewer_id TEXT REFERENCES public.iso_users(id) ON UPDATE CASCADE,
    reviewer_name TEXT NOT NULL,
    frequency TEXT NOT NULL,                  -- Daily, Periodic, Annual, Event, Mixed
    due_rule TEXT NOT NULL,                   -- Quy tắc tính hạn
    reminder_days INTEGER NOT NULL DEFAULT 3,
    evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    priority TEXT NOT NULL DEFAULT 'Trung bình',
    operation_note TEXT,
    external_link TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BẢNG NHIỆM VỤ THEO KỲ & PHÁT SINH (iso_tasks)
CREATE TABLE IF NOT EXISTS public.iso_tasks (
    task_id TEXT PRIMARY KEY,                 -- Ví dụ: TSK_W001_2026_09
    item_id TEXT REFERENCES public.iso_work_items(item_id) ON UPDATE CASCADE,
    item_code TEXT NOT NULL,
    item_name TEXT NOT NULL,
    period TEXT NOT NULL,                     -- Ví dụ: 2026-09, 2026-Q3, 2026
    due_date TEXT NOT NULL,                   -- YYYY-MM-DD
    completed_date TEXT,                      -- YYYY-MM-DD
    status TEXT NOT NULL DEFAULT 'NOT_DUE',   -- NOT_DUE, DUE_SOON, PENDING_APPROVAL, COMPLETED, OVERDUE
    assignee_id TEXT REFERENCES public.iso_users(id) ON UPDATE CASCADE,
    assignee_name TEXT NOT NULL,
    reviewer_id TEXT REFERENCES public.iso_users(id) ON UPDATE CASCADE,
    reviewer_name TEXT NOT NULL,
    evidence_url TEXT,
    evidence_file_name TEXT,
    note TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BẢNG NHẬT KÝ KIỂM TOÁN (iso_audit_logs)
CREATE TABLE IF NOT EXISTS public.iso_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,                     -- SUBMIT, APPROVE, REJECT, REASSIGN, RESET_PWD
    entity_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TẠO CHỈ MỤC (INDEXES) TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_iso_tasks_period ON public.iso_tasks(period);
CREATE INDEX IF NOT EXISTS idx_iso_tasks_assignee ON public.iso_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_iso_tasks_status ON public.iso_tasks(status);

-- BẬT ROW LEVEL SECURITY (RLS) & CHO PHÉP TRUY XUẤT
ALTER TABLE public.iso_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_audit_logs ENABLE ROW LEVEL SECURITY;

-- Chính sách đọc ghi toàn quyền cho ứng dụng (sử dụng anon key hoặc service key)
DROP POLICY IF EXISTS "Allow all for authenticated/anon on users" ON public.iso_users;
CREATE POLICY "Allow all for authenticated/anon on users" ON public.iso_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated/anon on work_items" ON public.iso_work_items;
CREATE POLICY "Allow all for authenticated/anon on work_items" ON public.iso_work_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated/anon on tasks" ON public.iso_tasks;
CREATE POLICY "Allow all for authenticated/anon on tasks" ON public.iso_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated/anon on audit_logs" ON public.iso_audit_logs;
CREATE POLICY "Allow all for authenticated/anon on audit_logs" ON public.iso_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- SEED DỮ LIỆU BAN ĐẦU: 9 CÁN BỘ NHÂN VIÊN
-- ====================================================================
INSERT INTO public.iso_users (id, full_name, role, title, email, phone, password, must_change_password, active)
VALUES
    ('nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'ADMIN', 'Trưởng khoa', 'nguyethmu@gmail.com', '0382337010', 'MeoMoon2789', false, true),
    ('bsluongdinhtrung@gmail.com', 'Lương Đình Trung', 'ADMIN', 'Bác sĩ / Quản trị hệ thống', 'bsluongdinhtrung@gmail.com', '0900000000', 'MeoMoon2789', false, true),
    ('drtuananh189@gmail.com', 'Lê Tuấn Anh', 'USER', 'Bác sĩ', 'drtuananh189@gmail.com', '0987372288', 'isogpb@2026', true, true),
    ('nguyenthingan.bsdk@gmail.com', 'Nguyễn Thị Ngân', 'USER', 'Bác sĩ', 'nguyenthingan.bsdk@gmail.com', '0369239809', 'isogpb@2026', true, true),
    ('thuydung71@gmail.com', 'Lương Thị Thùy Dung', 'USER', 'KTV', 'thuydung71@gmail.com', '0916787186', 'isogpb@2026', true, true),
    ('funny.monkeyhn345@gmail.com', 'Nguyễn Thị Thu Hương', 'USER', 'KTV', 'funny.monkeyhn345@gmail.com', '0936099158', 'isogpb@2026', true, true),
    ('tranvanbvdg@gmail.com', 'Trần Thị Vân', 'USER', 'KTV', 'tranvanbvdg@gmail.com', '0399572155', 'isogpb@2026', true, true),
    ('quangvictor@yahoo.com', 'Dương Văn Quang', 'USER', 'KTV', 'quangvictor@yahoo.com', '0835028886', 'isogpb@2026', true, true),
    ('laihaiha92@gmail.com', 'Lại Hải Hà', 'USER', 'KTV', 'laihaiha92@gmail.com', '0988468514', 'isogpb@2026', true, true)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    title = EXCLUDED.title,
    password = EXCLUDED.password;

-- ====================================================================
-- SEED DỮ LIỆU BAN ĐẦU: 30 ĐẦU VIỆC QUẢN LÝ ISO
-- ====================================================================
INSERT INTO public.iso_work_items (item_id, item_code, item_name, assignee_id, assignee_name, reviewer_id, reviewer_name, frequency, due_rule, reminder_days, evidence_required, approval_required, priority, operation_note, external_link, active)
VALUES
    ('W001', 'XN.QL.01', 'Quản lý trang thiết bị', 'quangvictor@yahoo.com', 'Dương Văn Quang', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Chốt rà soát trước ngày 05 của tháng kế tiếp', 3, true, false, 'Cao', 'Theo dõi tình trạng hồ sơ thiết bị/bảo trì/hiệu chuẩn ở cấp tổng hợp, không nhập từng máy.', 'https://quanlithietbi.bstrung.vn', true),
    ('W002', 'XN.QL.02', 'Kiểm soát sự không phù hợp', 'funny.monkeyhn345@gmail.com', 'Nguyễn Thị Thu Hương', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Event', 'Tạo đầu việc ngay trong ngày phát sinh; cập nhật xử lý trong 24 giờ đầu', 0, true, true, 'Cao', 'Trưởng khoa cần nhìn được sự cố đang mở/chưa đóng.', NULL, true),
    ('W003', 'XN.QL.03', 'Hành động khắc phục (CAPA)', 'funny.monkeyhn345@gmail.com', 'Nguyễn Thị Thu Hương', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Event', 'Hạn do người tạo/Trưởng khoa đặt; mặc định 14 ngày sau khi mở CAPA', 3, true, true, 'Cao', 'Cho phép gia hạn có lý do; lưu lịch sử thay đổi hạn.', NULL, true),
    ('W004', 'XN.QL.04', 'Xem xét của lãnh đạo', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Annual', 'Hoàn thành trước 30/11 hằng năm', 14, true, true, 'Cao', 'Nên cấu hình được ngày cố định theo kế hoạch năm của bệnh viện.', NULL, true),
    ('W005', 'XN.QL.05', 'Đào tạo nhân viên', 'thuydung71@gmail.com', 'Lương Thị Thùy Dung', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Chốt cập nhật kế hoạch/minh chứng trước ngày 05 của tháng đầu quý sau', 5, true, false, 'Trung bình', 'Sự kiện đào tạo phát sinh vẫn có thể ghi bổ sung.', NULL, true),
    ('W006', 'XN.QL.06', 'Đánh giá tay nghề / năng lực', 'thuydung71@gmail.com', 'Lương Thị Thùy Dung', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Annual', 'Hoàn thành trước 15/12 hằng năm', 14, true, false, 'Cao', 'Nếu khoa đánh giá theo ngày vào làm thì IT cần hỗ trợ hạn riêng theo nhân viên.', NULL, true),
    ('W007', 'XN.QL.07', 'Xem xét, thỏa thuận dịch vụ', 'laihaiha92@gmail.com', 'Lại Hải Hà', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Mixed', 'Rà soát định kỳ trước 30/11; phát sinh hợp đồng mới thì theo sự việc', 7, true, false, 'Trung bình', 'MVP chỉ theo dõi đã rà soát/chưa rà soát.', NULL, true),
    ('W008', 'XN.QL.08', 'Lựa chọn và đánh giá nhà cung cấp', 'quangvictor@yahoo.com', 'Dương Văn Quang', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Annual', 'Hoàn thành trước 30/11 hằng năm', 14, true, false, 'Trung bình', 'Có thể mở đầu việc phát sinh khi có nhà cung cấp mới.', NULL, true),
    ('W009', 'XN.QL.09', 'Giải quyết khiếu nại khách hàng', 'tranvanbvdg@gmail.com', 'Trần Thị Vân', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Event', 'Tiếp nhận trong ngày; Trưởng khoa đặt hạn xử lý cho từng vụ việc', 0, true, true, 'Cao', 'Không nên cố định 1 hạn cho mọi khiếu nại.', NULL, true),
    ('W010', 'XN.QL.10', 'Kiểm soát môi trường xét nghiệm', 'tranvanbvdg@gmail.com', 'Trần Thị Vân', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Daily', 'Xác nhận đầu mục hoàn thành trước 09:00 mỗi ngày làm việc', 0, false, false, 'Cao', 'Chỉ xác nhận ''đã kiểm tra môi trường''.', NULL, true),
    ('W011', 'XN.QL.12', 'Quản lý thông tin phòng xét nghiệm', 'funny.monkeyhn345@gmail.com', 'Nguyễn Thị Thu Hương', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Rà soát/chốt trước ngày 05 của tháng đầu quý sau', 5, true, false, 'Trung bình', 'Theo dõi ở mức hồ sơ/chính sách, không thay thế LIS/HIS.', NULL, true),
    ('W012', 'XN.QL.18', 'Ngoại kiểm', 'drtuananh189@gmail.com', 'Lê Tuấn Anh', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Event', 'Hạn theo chương trình ngoại kiểm; nhập Due_Date cho từng đợt', 5, true, false, 'Cao', 'Cho phép tạo task theo từng đợt, không hard-code lịch.', NULL, true),
    ('W013', 'XN.QL.19', 'Quản lý sinh phẩm, vật tư, hóa chất', 'quangvictor@yahoo.com', 'Dương Văn Quang', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Chốt rà soát trước ngày 03 của tháng kế tiếp', 3, true, false, 'Cao', 'Tập trung trạng thái hồ sơ, hạn dùng/tồn kho chi tiết vẫn ở sổ hiện hành.', NULL, true),
    ('W014', 'XN.QL.20', 'Đảm bảo tính khách quan', 'drtuananh189@gmail.com', 'Lê Tuấn Anh', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Mixed', 'Rà soát trước 30/11; cập nhật ngay khi có xung đột lợi ích', 14, true, true, 'Trung bình', 'Sự việc xung đột lợi ích cần được đẩy lên Trưởng khoa.', NULL, true),
    ('W015', 'XN.QL.22', 'Bảo mật thông tin', 'drtuananh189@gmail.com', 'Lê Tuấn Anh', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Mixed', 'Rà soát trước 30/11; sự cố bảo mật tạo task ngay trong ngày', 14, true, true, 'Cao', 'Sự cố bảo mật nên được ưu tiên đỏ.', NULL, true),
    ('W016', 'XN.QL.24', 'Quản lý rủi ro', 'tranvanbvdg@gmail.com', 'Trần Thị Vân', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Chốt rà soát rủi ro trước ngày 05 của tháng đầu quý sau', 7, true, true, 'Cao', 'Cho phép ghi chú rủi ro mới và hành động xử lý.', NULL, true),
    ('W017', 'XN.QL.25', 'Cải tiến liên tục', 'laihaiha92@gmail.com', 'Lại Hải Hà', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Chốt tiến độ cải tiến trước ngày 10 của tháng đầu quý sau', 7, true, true, 'Trung bình', 'Nên có ghi chú kết quả/hiệu quả cải tiến.', NULL, true),
    ('W018', 'XN.QL.26', 'Khảo sát sự hài lòng khách hàng', 'drtuananh189@gmail.com', 'Lê Tuấn Anh', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Tổng hợp trước ngày 10 của tháng đầu quý sau', 7, true, false, 'Trung bình', 'Tổng hợp kết quả khảo sát khách hàng định kỳ.', NULL, true),
    ('W019', 'XN.QL.27', 'Quản lý hồ sơ', 'laihaiha92@gmail.com', 'Lại Hải Hà', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Rà soát tình trạng hồ sơ trước ngày 05 của tháng kế tiếp', 3, false, false, 'Trung bình', 'Chỉ theo dõi tình trạng đầy đủ/thiếu, không số hóa toàn bộ.', NULL, true),
    ('W020', 'XN.QL.28', 'Đánh giá nội bộ', 'nguyenthingan.bsdk@gmail.com', 'Nguyễn Thị Ngân', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Annual', 'Hoàn thành trước 31/10 hằng năm', 14, true, true, 'Cao', 'Ngày cụ thể theo kế hoạch đánh giá nội bộ của năm.', NULL, true),
    ('W021', 'XN.QL.29', 'Theo dõi và đánh giá bộ chỉ số chất lượng', 'laihaiha92@gmail.com', 'Lại Hải Hà', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Chốt số liệu trước ngày 05 của tháng kế tiếp', 3, true, false, 'Cao', 'Đầu việc xuất hiện nổi bật trên Dashboard hàng tháng.', NULL, true),
    ('W022', 'XN.QL.30', 'Quản lý nhân sự', 'thuydung71@gmail.com', 'Lương Thị Thùy Dung', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Mixed', 'Rà soát cập nhật trước ngày 05 của tháng kế tiếp', 3, true, false, 'Trung bình', 'Nhân sự mới/nghỉ/đổi vị trí cập nhật ngay khi phát sinh.', NULL, true),
    ('W023', 'XN.QL.31', 'Lựa chọn và chuyển gửi mẫu ngoại viện', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Mixed', 'Sự việc theo hạn từng ca; rà soát tổng hợp trước ngày 05 của tháng đầu quý sau', 3, true, true, 'Trung bình', 'Người phụ trách đã chốt: Đào Thị Nguyệt.', NULL, true),
    ('W024', 'HT.QL.01', 'Kiểm soát tài liệu hệ thống QLCL', 'laihaiha92@gmail.com', 'Lại Hải Hà', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Mixed', 'Rà soát danh mục hiệu lực trước ngày 05 của tháng kế tiếp', 3, true, false, 'Cao', 'Tài liệu mới/sửa đổi cập nhật ngay khi ban hành.', NULL, true),
    ('W025', 'GB.QL.02', 'Tiếp nhận mẫu Giải phẫu bệnh', 'thuydung71@gmail.com', 'Lương Thị Thùy Dung', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Daily', 'Xác nhận kiểm soát đầu mục trước 16:30 ngày làm việc', 0, false, false, 'Trung bình', 'Ghi nhận kiểm soát đầu mục tiếp nhận mẫu hàng ngày.', NULL, true),
    ('W026', 'GB.QL.04', 'Báo cáo kết quả Giải phẫu bệnh', 'thuydung71@gmail.com', 'Lương Thị Thùy Dung', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Rà soát tình trạng/TAT trước ngày 05 của tháng kế tiếp', 3, true, false, 'Cao', 'Không thay thế phần mềm trả kết quả.', NULL, true),
    ('W027', 'GB.QL.05', 'Lưu mẫu và xử lý mẫu hết thời gian lưu', 'thuydung71@gmail.com', 'Lương Thị Thùy Dung', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Rà soát trước ngày 10 của tháng kế tiếp', 5, true, false, 'Trung bình', 'Có thể dùng link tới biên bản/hồ sơ xử lý.', NULL, true),
    ('W028', 'GB.QL.06-07', 'Lưu lam/block và mượn trả', 'thuydung71@gmail.com', 'Lương Thị Thùy Dung', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Rà soát trước ngày 05 của tháng kế tiếp', 3, false, false, 'Trung bình', 'Không quản lý từng lam/block trong MVP.', NULL, true),
    ('W029', 'GB.QL.08', 'Nội kiểm', 'drtuananh189@gmail.com', 'Lê Tuấn Anh', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Periodic', 'Chốt tổng hợp nội kiểm trước ngày 05 của tháng kế tiếp', 3, true, false, 'Cao', 'Kết quả chi tiết lưu theo hồ sơ nội kiểm hiện hành.', 'https://iso-gpb-duc-giang.vercel.app/', true),
    ('W030', 'GB.QL.09', 'Xác nhận giá trị sử dụng / phê duyệt phương pháp', 'nguyenthingan.bsdk@gmail.com', 'Nguyễn Thị Ngân', 'nguyethmu@gmail.com', 'Đào Thị Nguyệt', 'Event', 'Hạn do Trưởng khoa đặt theo kế hoạch triển khai phương pháp', 7, true, true, 'Cao', 'Không tạo task định kỳ nếu không có phương pháp mới.', 'https://iso-gpb-duc-giang.vercel.app/', true)
ON CONFLICT (item_id) DO UPDATE SET
    item_code = EXCLUDED.item_code,
    item_name = EXCLUDED.item_name,
    assignee_id = EXCLUDED.assignee_id,
    assignee_name = EXCLUDED.assignee_name,
    reviewer_id = EXCLUDED.reviewer_id,
    reviewer_name = EXCLUDED.reviewer_name;
