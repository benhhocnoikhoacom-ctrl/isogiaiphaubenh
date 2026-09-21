"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Percent, 
  ExternalLink, 
  FileText, 
  Check, 
  RotateCcw, 
  Filter,
  HardDrive,
  Calendar,
  User,
  Search,
  CheckSquare
} from "lucide-react";
import { TaskRecord, DashboardStats, StaffPerformance, TaskStatusCode, ISO_DRIVE_FOLDER_URL } from "@/types/iso";
import { approveTask, rejectTask } from "@/app/actions/task-actions";
import { useSession } from "next-auth/react";
import { getVietnamToday, parseDateToYMD } from "@/lib/date-utils";

interface Props {
  initialTasks: TaskRecord[];
  initialStats: DashboardStats;
  staffPerformance: StaffPerformance[];
  currentPeriod: string;
}

export function ExecutiveDashboard({ initialTasks, initialStats, staffPerformance, currentPeriod }: Props) {
  const { data: session } = useSession();
  const today = getVietnamToday();
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [activeFilter, setActiveFilter] = useState<"ALL" | TaskStatusCode>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [rejectionModalTask, setRejectionModalTask] = useState<TaskRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";
  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || "Trưởng khoa";

  // Lọc danh sách task
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = activeFilter === "ALL" ? true : task.status === activeFilter;
    const matchesSearch = 
      task.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStaff = selectedStaff
      ? (task.assigneeName.toLowerCase() === selectedStaff.toLowerCase() || task.assigneeId === selectedStaff)
      : true;
    return matchesFilter && matchesSearch && matchesStaff;
  });

  // Bảng điểm nghẽn: Chỉ OVERDUE và DUE_SOON (Ưu tiên Quá hạn lên đầu, hạn sớm nhất xếp trước)
  const bottleneckTasks = tasks
    .filter(t => t.status === "OVERDUE" || t.status === "DUE_SOON")
    .sort((a, b) => {
      if (a.status === "OVERDUE" && b.status !== "OVERDUE") return -1;
      if (a.status !== "OVERDUE" && b.status === "OVERDUE") return 1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  // Danh sách chờ duyệt
  const pendingTasks = tasks.filter(t => t.status === "PENDING_APPROVAL");

  async function handleApprove(taskId: string) {
    if (!isAdmin) return;
    setProcessingTaskId(taskId);
    const res = await approveTask(taskId, userEmail, userName);
    if (res.success) {
      setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: "COMPLETED", approvedAt: new Date().toISOString() } : t));
      // Cập nhật stats
      setStats(prev => ({
        ...prev,
        pendingApprovalCount: Math.max(0, prev.pendingApprovalCount - 1),
        completedCount: prev.completedCount + 1,
        completionRate: prev.totalDueCount > 0 ? Math.round(((prev.completedCount + 1) / prev.totalDueCount) * 100) : 100
      }));
    } else {
      alert(res.error || "Có lỗi khi duyệt công việc.");
    }
    setProcessingTaskId(null);
  }

  async function handleRejectSubmit() {
    if (!rejectionModalTask || !rejectionReason.trim()) return;
    const taskId = rejectionModalTask.taskId;
    setProcessingTaskId(taskId);
    const res = await rejectTask(taskId, rejectionReason, userEmail, userName);
    if (res.success) {
      setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: "OVERDUE", completedDate: undefined, rejectionReason } : t));
      setStats(prev => ({
        ...prev,
        pendingApprovalCount: Math.max(0, prev.pendingApprovalCount - 1),
        overdueCount: prev.overdueCount + 1
      }));
      setRejectionModalTask(null);
      setRejectionReason("");
    } else {
      alert(res.error || "Có lỗi khi gửi yêu cầu làm lại.");
    }
    setProcessingTaskId(null);
  }

  function getStatusBadge(status: TaskStatusCode) {
    switch (status) {
      case "COMPLETED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold badge-completed font-mono">ĐÃ HOÀN THÀNH</span>;
      case "PENDING_APPROVAL":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold badge-pending font-mono">CHỜ DUYỆT</span>;
      case "DUE_SOON":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold badge-due-soon font-mono">SẮP ĐẾN HẠN</span>;
      case "OVERDUE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold badge-overdue font-mono">QUÁ HẠN</span>;
      case "NOT_DUE":
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold badge-not-due font-mono">CHƯA ĐẾN HẠN</span>;
    }
  }

  return (
    <div className="space-y-8">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DDE3E0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F5C55] bg-[#E3EFEC] px-2 py-0.5 rounded font-mono">
              ISO 15189 • GIẢI PHẪU BỆNH
            </span>
            <span className="text-xs text-[#5C6B68] font-mono">Kỳ: {currentPeriod}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12211F]">
            Dashboard Điều hành Trưởng khoa
          </h1>
          <p className="text-sm text-[#5C6B68] mt-1">
            Giám sát 30 đầu việc quản lý chất lượng, kiểm soát điểm nghẽn và tiến độ nhân sự theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={ISO_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-white border border-[#DDE3E0] text-xs font-semibold text-[#12211F] hover:bg-[#F7F8F6] hover:border-[#1F5C55] transition-colors shadow-2xs"
          >
            <HardDrive className="h-4 w-4 text-[#1F5C55]" />
            <span>Thư mục Minh chứng Drive</span>
            <ExternalLink className="h-3 w-3 text-[#5C6B68]" />
          </a>
        </div>
      </div>

      {/* 4 Thẻ KPI Chuẩn Medical Precision */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Quá hạn (OVERDUE) */}
        <button
          onClick={() => setActiveFilter(activeFilter === "OVERDUE" ? "ALL" : "OVERDUE")}
          className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden ${
            activeFilter === "OVERDUE" 
              ? "ring-2 ring-[#B3261E] bg-[#FBE6E4] border-[#F0BDB8]" 
              : "bg-white border-[#DDE3E0] hover:border-[#F0BDB8] hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-[#B3261E] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">QUÁ HẠN (MỤC TIÊU: 0)</span>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#B3261E] font-mono">
              {stats.overdueCount}
            </span>
            <span className="text-xs text-[#5C6B68]">đầu việc trễ hạn</span>
          </div>
          <p className="text-[11px] text-[#5C6B68] mt-2">Bấm để lọc các việc cần xử lý gấp</p>
        </button>

        {/* KPI 2: Sắp đến hạn (DUE_SOON) */}
        <button
          onClick={() => setActiveFilter(activeFilter === "DUE_SOON" ? "ALL" : "DUE_SOON")}
          className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden ${
            activeFilter === "DUE_SOON" 
              ? "ring-2 ring-[#8A5108] bg-[#FDF0DC] border-[#EFD3A3]" 
              : "bg-white border-[#DDE3E0] hover:border-[#EFD3A3] hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-[#8A5108] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">SẮP ĐẾN HẠN</span>
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#8A5108] font-mono">
              {stats.dueSoonCount}
            </span>
            <span className="text-xs text-[#5C6B68]">cần đôn đốc</span>
          </div>
          <p className="text-[11px] text-[#5C6B68] mt-2">Theo số ngày nhắc cấu hình</p>
        </button>

        {/* KPI 3: Đã hoàn thành (COMPLETED) */}
        <button
          onClick={() => setActiveFilter(activeFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
          className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden ${
            activeFilter === "COMPLETED" 
              ? "ring-2 ring-[#1F5C55] bg-[#E3EFEC] border-[#B8D5CE]" 
              : "bg-white border-[#DDE3E0] hover:border-[#B8D5CE] hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-[#1F5C55] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">ĐÃ HOÀN THÀNH</span>
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#1F5C55] font-mono">
              {stats.completedCount}
            </span>
            <span className="text-xs text-[#5C6B68]">/ {stats.totalDueCount} đầu việc</span>
          </div>
          <p className="text-[11px] text-[#5C6B68] mt-2">Đã có minh chứng & phê duyệt</p>
        </button>

        {/* KPI 4: Tỷ lệ tuân thủ (%) */}
        <div className="p-5 rounded-xl border border-[#DDE3E0] bg-white text-left shadow-2xs">
          <div className="flex items-center justify-between text-[#1F5C55] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">TỶ LỆ TUÂN THỦ</span>
            <Percent className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#12211F] font-mono">
              {stats.completionRate}%
            </span>
            <span className="text-xs text-[#5C6B68]">mục tiêu 100%</span>
          </div>
          <div className="w-full bg-[#EEF0EF] h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-[#1F5C55] h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Thông báo Chờ duyệt cho Trưởng khoa (nếu có) */}
      {pendingTasks.length > 0 && (
        <div className="rounded-xl border border-[#B9D0E8] bg-[#E4EEF8] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#1F4E79] animate-pulse" />
              <h2 className="text-base font-bold text-[#1F4E79]">
                Có {pendingTasks.length} đầu việc nhân viên đã nộp đang chờ phê duyệt
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#1F4E79] font-mono uppercase">Cần Trưởng khoa duyệt</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {pendingTasks.map(task => (
              <div key={task.taskId} className="bg-white p-4 rounded-lg border border-[#DDE3E0] flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold font-mono text-[#1F5C55] bg-[#E3EFEC] px-2 py-0.5 rounded">
                      {task.itemCode}
                    </span>
                    <span className="text-xs text-[#5C6B68]">Người làm: <strong className="text-[#12211F]">{task.assigneeName}</strong></span>
                  </div>
                  <h4 className="font-semibold text-sm text-[#12211F]">{task.itemName}</h4>
                  {task.note && (
                    <p className="text-xs text-[#5C6B68] mt-1 italic bg-[#F7F8F6] p-2 rounded border border-[#DDE3E0]">
                      "{task.note}"
                    </p>
                  )}
                  {task.evidenceUrl && (
                    <div className="mt-2">
                      <a
                        href={task.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#1F5C55] hover:underline font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Xem minh chứng ({task.evidenceFileName || "Tài liệu Drive"})</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#DDE3E0]">
                    <button
                      onClick={() => handleApprove(task.taskId)}
                      disabled={processingTaskId === task.taskId}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1F5C55] text-white text-xs font-semibold hover:bg-[#16443F] transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {processingTaskId === task.taskId ? "Đang duyệt..." : "Phê duyệt"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectionModalTask(task);
                        setRejectionReason("");
                      }}
                      disabled={processingTaskId === task.taskId}
                      className="px-3 py-1.5 rounded-md border border-[#DDE3E0] text-xs font-semibold text-[#B3261E] hover:bg-[#FBE6E4] transition-colors disabled:opacity-50"
                    >
                      Yêu cầu bổ sung
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bảng Điểm nghẽn (Bottleneck List) */}
      <div className="bg-white rounded-xl border border-[#DDE3E0] p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#DDE3E0] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#B3261E]" />
            <h2 className="text-base font-bold text-[#12211F]">
              Bảng Điểm nghẽn của Khoa (Quá hạn & Sắp đến hạn)
            </h2>
          </div>
          <span className="text-xs text-[#5C6B68] font-mono">
            {bottleneckTasks.length} đầu việc cần can thiệp
          </span>
        </div>

        {bottleneckTasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#1F5C55] font-medium bg-[#E3EFEC] rounded-lg">
            🎉 Tuyệt vời! Hiện tại khoa không có đầu việc nào bị quá hạn hoặc sắp trễ hạn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F6] text-[#5C6B68] border-b border-[#DDE3E0] font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3">Mã</th>
                  <th className="py-2.5 px-3">Đầu việc quản lý</th>
                  <th className="py-2.5 px-3">Phụ trách</th>
                  <th className="py-2.5 px-3">Hạn hoàn thành</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3E0]">
                {bottleneckTasks.map(t => (
                  <tr key={t.taskId} className="hover:bg-[#F7F8F6] transition-colors">
                    {/* 1. Mã */}
                    <td className="py-3 px-3 font-mono font-bold text-[#1F5C55]">{t.itemCode}</td>
                    
                    {/* 2. Đầu việc quản lý */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#12211F]">{t.itemName}</div>
                      <div className="text-[11px] text-[#5C6B68]">Kỳ: {t.period}</div>
                    </td>

                    {/* 3. Phụ trách */}
                    <td className="py-3 px-3 font-medium text-[#12211F]">{t.assigneeName}</td>

                    {/* 4. Hạn hoàn thành */}
                    <td className="py-3 px-3 font-mono">
                      <div className={t.status === "OVERDUE" ? "font-bold text-[#B3261E]" : "font-semibold text-[#8A5108]"}>
                        {t.dueDate}
                      </div>
                      {t.status === "OVERDUE" && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-[#B3261E] bg-[#FBE6E4] px-1.5 py-0.5 rounded border border-[#F0BDB8]">
                          Trễ {Math.max(1, Math.floor((new Date(today).getTime() - new Date(parseDateToYMD(t.dueDate)).getTime()) / (24 * 3600 * 1000)))} ngày
                        </span>
                      )}
                    </td>

                    {/* 5. Trạng thái */}
                    <td className="py-3 px-3">{getStatusBadge(t.status)}</td>

                    {/* 6. Thao tác */}
                    <td className="py-3 px-3 text-right">
                      {t.externalLink ? (
                        <a
                          href={t.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#1F5C55] hover:underline font-semibold"
                        >
                          Mở hệ thống <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#5C6B68]">Đôn đốc NV</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bảng Tiến độ theo Nhân sự (Staff Performance) */}
      <div className="bg-white rounded-xl border border-[#DDE3E0] p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#DDE3E0] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#1F5C55]" />
            <h2 className="text-base font-bold text-[#12211F]">
              Tiến độ Tuân thủ theo Nhân sự (8 Nhân viên Khoa)
            </h2>
          </div>
          <span className="text-xs text-[#5C6B68]">Đánh giá khối lượng & độ chậm trễ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {staffPerformance.map(staff => {
            const isSelected = selectedStaff === staff.fullName;
            return (
              <button
                key={staff.userId}
                onClick={() => setSelectedStaff(isSelected ? null : staff.fullName)}
                className={`p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected 
                    ? "ring-2 ring-[#1F5C55] bg-[#E3EFEC] border-[#1F5C55] shadow-xs" 
                    : "border-[#DDE3E0] bg-[#F7F8F6] hover:bg-white hover:border-[#1F5C55] hover:shadow-2xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold text-sm ${isSelected ? "text-[#1F5C55]" : "text-[#12211F]"}`}>{staff.fullName}</span>
                    <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#DDE3E0] text-[#5C6B68]">
                      {staff.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5C6B68] mt-0.5">{staff.email}</div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#DDE3E0] text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#5C6B68]">Được giao:</span>
                    <span className="font-mono font-semibold">{staff.assignedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1F5C55]">Đã xong:</span>
                    <span className="font-mono font-semibold text-[#1F5C55]">{staff.completedCount}</span>
                  </div>
                  {staff.overdueCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#B3261E]">Quá hạn:</span>
                      <span className="font-mono font-bold text-[#B3261E]">{staff.overdueCount}</span>
                    </div>
                  )}
                  {staff.pendingCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#1F4E79]">Chờ duyệt:</span>
                      <span className="font-mono font-semibold text-[#1F4E79]">{staff.pendingCount}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span>Hoàn thành</span>
                    <span className="font-mono">{staff.rate}%</span>
                  </div>
                  <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-[#DDE3E0]">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${staff.overdueCount > 0 ? "bg-[#B3261E]" : "bg-[#1F5C55]"}`}
                      style={{ width: `${staff.rate}%` }}
                    />
                  </div>
                </div>
                {isSelected && (
                  <div className="text-[10px] font-semibold text-[#1F5C55] mt-1 text-center bg-white py-0.5 rounded border border-[#B8D5CE]">
                    ✓ Đang lọc theo nhân sự này (Bấm để hủy)
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh sách toàn bộ 30 Đầu việc Quản lý */}
      <div className="bg-white rounded-xl border border-[#DDE3E0] p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#DDE3E0] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-[#1F5C55]" />
            <h2 className="text-base font-bold text-[#12211F]">
              Danh mục 30 Đầu việc Quản lý Chất lượng (ISO 15189)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5C6B68]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã việc, tên việc, nhân viên..."
                className="pl-8 pr-3 py-1.5 rounded-md border border-[#DDE3E0] text-xs w-60 focus:outline-none focus:border-[#1F5C55]"
              />
            </div>

            <div className="flex items-center rounded-md border border-[#DDE3E0] p-0.5 bg-[#F7F8F6] text-xs">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeFilter === "ALL" ? "bg-white text-[#12211F] shadow-2xs font-semibold" : "text-[#5C6B68]"}`}
              >
                Tất cả ({tasks.length})
              </button>
              <button
                onClick={() => setActiveFilter("OVERDUE")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeFilter === "OVERDUE" ? "bg-[#FBE6E4] text-[#B3261E] font-bold" : "text-[#5C6B68]"}`}
              >
                Quá hạn ({stats.overdueCount})
              </button>
              <button
                onClick={() => setActiveFilter("DUE_SOON")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeFilter === "DUE_SOON" ? "bg-[#FDF0DC] text-[#8A5108] font-bold" : "text-[#5C6B68]"}`}
              >
                Sắp đến hạn ({stats.dueSoonCount})
              </button>
              <button
                onClick={() => setActiveFilter("PENDING_APPROVAL")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeFilter === "PENDING_APPROVAL" ? "bg-[#E4EEF8] text-[#1F4E79] font-bold" : "text-[#5C6B68]"}`}
              >
                Chờ duyệt ({stats.pendingApprovalCount})
              </button>
              <button
                onClick={() => setActiveFilter("COMPLETED")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeFilter === "COMPLETED" ? "bg-[#E3EFEC] text-[#1F5C55] font-bold" : "text-[#5C6B68]"}`}
              >
                Đã xong ({stats.completedCount})
              </button>
            </div>
          </div>
        </div>

        {selectedStaff && (
          <div className="flex items-center justify-between bg-[#E3EFEC] border border-[#B8D5CE] px-3.5 py-2 rounded-lg mb-4 text-xs">
            <span className="text-[#1F5C55]">
              Đang lọc theo nhân sự: <strong className="font-bold text-[#12211F]">{selectedStaff}</strong> (Có {filteredTasks.length} đầu việc)
            </span>
            <button
              onClick={() => setSelectedStaff(null)}
              className="text-[#B3261E] font-semibold hover:underline cursor-pointer"
            >
              ✕ Bỏ lọc (Hiện toàn bộ khoa)
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8F6] text-[#5C6B68] border-b border-[#DDE3E0] font-mono uppercase">
              <tr>
                <th className="py-2.5 px-3">Mã</th>
                <th className="py-2.5 px-3">Đầu việc quản lý</th>
                <th className="py-2.5 px-3">Phụ trách</th>
                <th className="py-2.5 px-3">Hạn hoàn thành</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">Minh chứng</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E0]">
              {filteredTasks.map(t => (
                <tr key={t.taskId} className="hover:bg-[#F7F8F6] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#1F5C55]">{t.itemCode}</td>
                  <td className="py-3 px-3 max-w-xs sm:max-w-md">
                    <div className="font-semibold text-[#12211F]">{t.itemName}</div>
                    {t.rejectionReason && (
                      <div className="text-[11px] text-[#B3261E] bg-[#FBE6E4] px-2 py-0.5 rounded mt-1">
                        Yêu cầu làm lại: {t.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#5C6B68]">
                    <div>{t.dueDate}</div>
                    {t.status === "OVERDUE" && (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#B3261E]">
                        (Trễ {Math.max(1, Math.floor((new Date(today).getTime() - new Date(parseDateToYMD(t.dueDate)).getTime()) / (24 * 3600 * 1000)))} ngày)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(t.status)}</td>
                  <td className="py-3 px-3">
                    {t.evidenceUrl ? (
                      <a
                        href={t.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#1F5C55] hover:underline font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Xem file</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#5C6B68]">Chưa có</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {t.externalLink ? (
                      <a
                        href={t.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#E3EFEC] text-[#1F5C55] text-xs font-semibold hover:bg-[#1F5C55] hover:text-white transition-colors"
                      >
                        Mở link <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : t.status === "PENDING_APPROVAL" && isAdmin ? (
                      <button
                        onClick={() => handleApprove(t.taskId)}
                        disabled={processingTaskId === t.taskId}
                        className="px-2.5 py-1 rounded bg-[#1F5C55] text-white text-xs font-semibold hover:bg-[#16443F] transition-colors"
                      >
                        Duyệt
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#5C6B68]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Yêu cầu làm lại / Bổ sung minh chứng */}
      {rejectionModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#DDE3E0] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#12211F]">
              Yêu cầu bổ sung: {rejectionModalTask.itemCode}
            </h3>
            <p className="text-xs text-[#5C6B68]">
              Nhập lý do hoặc yêu cầu cụ thể để nhân viên ({rejectionModalTask.assigneeName}) nắm được và cập nhật lại minh chứng.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ví dụ: Thiếu chữ ký xác nhận của ca trực / Ảnh mờ cần chụp lại..."
              className="w-full p-2.5 text-xs rounded-md border border-[#DDE3E0] focus:outline-none focus:border-[#1F5C55]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalTask(null)}
                className="px-4 py-2 text-xs font-medium text-[#5C6B68] hover:bg-[#F7F8F6] rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#B3261E] hover:bg-[#8F1D17] rounded-md disabled:opacity-50"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
