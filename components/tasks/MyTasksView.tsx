"use client";

import { useState } from "react";
import { 
  CheckSquare, 
  UploadCloud, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Plus, 
  HardDrive,
  Check,
  Calendar,
  Info
} from "lucide-react";
import { TaskRecord, TaskStatusCode, WorkItem, ISO_DRIVE_FOLDER_URL } from "@/types/iso";
import { submitTaskCompletion, createEventTask } from "@/app/actions/task-actions";
import { compressImage } from "@/lib/image-compress";
import { useSession, signIn } from "next-auth/react";

interface Props {
  allTasks: TaskRecord[];
  allWorkItems: WorkItem[];
}

export function MyTasksView({ allTasks, allWorkItems }: Props) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<TaskRecord[]>(allTasks);
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<TaskRecord | null>(null);
  const [completedDate, setCompletedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal tạo việc phát sinh
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [selectedEventItemId, setSelectedEventItemId] = useState("W002");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDueDate, setEventDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Tab lọc: Việc của tôi / Tất cả việc
  const [viewScope, setViewScope] = useState<"MY" | "ALL">("MY");

  const userEmail = session?.user?.email?.toLowerCase() || "";
  const userName = session?.user?.name || "Nhân viên";

  // Kiểm tra công việc thuộc về người dùng đang đăng nhập
  const isMyTask = (t: TaskRecord) => {
    if (userEmail && t.assigneeId && t.assigneeId.toLowerCase() === userEmail) {
      return true;
    }
    const cleanAssignee = (t.assigneeName || "").toLowerCase().replace(/^(bs\.|ktv\.|bác sĩ|trưởng khoa)\s*/i, "").trim();
    const cleanUser = (userName || "").toLowerCase().replace(/^(bs\.|ktv\.|bác sĩ|trưởng khoa)\s*/i, "").trim();
    return cleanAssignee.length > 0 && (cleanAssignee.includes(cleanUser) || cleanUser.includes(cleanAssignee));
  };

  // Lọc việc của tôi
  const myTasks = tasks.filter(t => {
    if (viewScope === "ALL") return true;
    if (!userEmail) return true; // Chưa đăng nhập thì xem tất cả
    return isMyTask(t);
  });

  async function handleSubmitCompletion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTaskForSubmit) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("taskId", selectedTaskForSubmit.taskId);
    formData.append("completedDate", completedDate);
    formData.append("note", note);
    formData.append("evidenceUrl", evidenceUrl);
    formData.append("userEmail", userEmail);
    formData.append("userName", userName);
    if (evidenceFile) {
      formData.append("evidenceFile", evidenceFile);
    }

    const res = await submitTaskCompletion(formData);
    if (res.success) {
      const newStatus = res.status as TaskStatusCode;
      setTasks(prev => prev.map(t => t.taskId === selectedTaskForSubmit.taskId ? {
        ...t,
        status: newStatus,
        completedDate,
        note,
        evidenceUrl: evidenceUrl || t.evidenceUrl,
        evidenceFileName: evidenceFile ? evidenceFile.name : t.evidenceFileName
      } : t));
      setSelectedTaskForSubmit(null);
      setNote("");
      setEvidenceUrl("");
      setEvidenceFile(null);
    } else {
      alert(res.error || "Có lỗi xảy ra khi nộp báo cáo.");
    }
    setIsSubmitting(false);
  }

  async function handleCreateEventSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventDescription.trim()) return;

    setIsCreatingEvent(true);
    const res = await createEventTask(selectedEventItemId, eventDescription, eventDueDate, userEmail, userName);
    if (res.success) {
      alert("Đã tạo đầu việc phát sinh thành công!");
      window.location.reload();
    } else {
      alert(res.error || "Có lỗi khi tạo đầu việc phát sinh.");
    }
    setIsCreatingEvent(false);
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

  const eventWorkItems = allWorkItems.filter(w => w.frequency === "Event" || w.frequency === "Mixed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DDE3E0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F5C55] bg-[#E3EFEC] px-2 py-0.5 rounded font-mono">
              BÁO CÁO CÔNG VIỆC ISO
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12211F]">
            Đầu việc của tôi
          </h1>
          <p className="text-sm text-[#5C6B68] mt-1">
            Báo cáo tiến độ 1 chạm, đính kèm minh chứng ảnh chụp sổ ghi/file Drive để gửi Trưởng khoa duyệt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCreateEventModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#1F5C55] text-white text-xs font-semibold hover:bg-[#16443F] transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo việc phát sinh (CAPA/Sự cố)</span>
          </button>

          <a
            href={ISO_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white border border-[#DDE3E0] text-xs font-semibold text-[#12211F] hover:bg-[#F7F8F6] transition-colors shadow-2xs"
          >
            <HardDrive className="h-4 w-4 text-[#1F5C55]" />
            <span>Drive Minh chứng Khoa</span>
            <ExternalLink className="h-3 w-3 text-[#5C6B68]" />
          </a>
        </div>
      </div>

      {/* Scope Switcher & Login hint */}
      {!session ? (
        <div className="p-4 rounded-xl border border-[#EFD3A3] bg-[#FDF0DC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="h-5 w-5 text-[#8A5108] shrink-0" />
            <p className="text-xs text-[#8A5108]">
              Bạn đang xem ở chế độ Khách. Hãy <strong>Đăng nhập</strong> để hệ thống tự lọc danh sách việc của riêng bạn.
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/login"}
            className="px-3.5 py-1.5 rounded-md bg-[#1F5C55] text-white text-xs font-semibold hover:bg-[#16443F] shrink-0"
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#DDE3E0]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewScope("MY")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewScope === "MY" 
                  ? "bg-[#1F5C55] text-white" 
                  : "text-[#5C6B68] hover:bg-[#F7F8F6]"
              }`}
            >
              Việc của tôi ({tasks.filter(isMyTask).length})
            </button>
            <button
              onClick={() => setViewScope("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewScope === "ALL" 
                  ? "bg-[#1F5C55] text-white" 
                  : "text-[#5C6B68] hover:bg-[#F7F8F6]"
              }`}
            >
              Toàn khoa ({tasks.length})
            </button>
          </div>

          <span className="text-xs text-[#5C6B68] font-mono hidden sm:inline-block">
            Nhân viên: <strong className="text-[#12211F]">{userName}</strong>
          </span>
        </div>
      )}

      {/* Danh sách Thẻ Công việc Mobile-First */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myTasks.map(task => {
          const isDone = task.status === "COMPLETED";
          const isPending = task.status === "PENDING_APPROVAL";

          return (
            <div 
              key={task.taskId}
              className={`p-5 rounded-xl border bg-white flex flex-col justify-between gap-4 transition-all shadow-2xs ${
                task.status === "OVERDUE" 
                  ? "border-[#F0BDB8] border-l-4 border-l-[#B3261E]" 
                  : task.status === "DUE_SOON"
                  ? "border-[#EFD3A3] border-l-4 border-l-[#8A5108]"
                  : "border-[#DDE3E0]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-xs text-[#1F5C55] bg-[#E3EFEC] px-2 py-0.5 rounded">
                    {task.itemCode}
                  </span>
                  {getStatusBadge(task.status)}
                </div>

                <h3 className="text-sm font-bold text-[#12211F] leading-snug">
                  {task.itemName}
                </h3>

                <div className="mt-2.5 space-y-1 text-xs text-[#5C6B68]">
                  <div className="flex items-center justify-between">
                    <span>Hạn hoàn thành:</span>
                    <span className="font-mono font-semibold text-[#12211F]">{task.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kỳ theo dõi:</span>
                    <span className="font-mono text-[#12211F]">{task.period}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Người phụ trách:</span>
                    <span className="font-medium text-[#12211F]">{task.assigneeName}</span>
                  </div>
                </div>

                {task.rejectionReason && (
                  <div className="mt-3 p-2 rounded bg-[#FBE6E4] border border-[#F0BDB8] text-[11px] text-[#B3261E]">
                    <strong>⚠️ Yêu cầu làm lại:</strong> {task.rejectionReason}
                  </div>
                )}

                {task.evidenceUrl && (
                  <div className="mt-2 pt-2 border-t border-[#DDE3E0]">
                    <a
                      href={task.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#1F5C55] hover:underline font-medium"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Minh chứng: {task.evidenceFileName || "Xem tài liệu Drive"}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Nút hành động */}
              <div className="pt-3 border-t border-[#DDE3E0]">
                {task.externalLink ? (
                  <a
                    href={task.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[#E3EFEC] text-[#1F5C55] text-xs font-semibold hover:bg-[#1F5C55] hover:text-white transition-colors"
                  >
                    <span>Mở hệ thống chuyên biệt</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : isDone ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1F5C55] bg-[#E3EFEC] py-1.5 rounded-md">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Đã hoàn thành</span>
                  </div>
                ) : isPending ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1F4E79] bg-[#E4EEF8] py-1.5 rounded-md">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Đã nộp • Chờ Trưởng khoa duyệt</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedTaskForSubmit(task);
                      setCompletedDate(new Date().toISOString().slice(0, 10));
                      setNote("");
                      setEvidenceUrl("");
                      setEvidenceFile(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#1F5C55] text-white text-xs font-semibold hover:bg-[#16443F] transition-colors shadow-2xs"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Báo cáo hoàn thành</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nộp báo cáo hoàn thành */}
      {selectedTaskForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#DDE3E0] shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-[#DDE3E0] pb-3">
              <span className="text-xs font-bold font-mono text-[#1F5C55] bg-[#E3EFEC] px-2 py-0.5 rounded">
                {selectedTaskForSubmit.itemCode}
              </span>
              <h3 className="text-base font-bold text-[#12211F] mt-1">
                Báo cáo: {selectedTaskForSubmit.itemName}
              </h3>
              <p className="text-xs text-[#5C6B68] mt-0.5">
                Kỳ theo dõi: {selectedTaskForSubmit.period} • Hạn chốt: {selectedTaskForSubmit.dueDate}
              </p>
            </div>

            <form onSubmit={handleSubmitCompletion} className="space-y-4">
              {/* Ngày hoàn thành */}
              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Ngày thực hiện / Hoàn thành
                </label>
                <input
                  type="date"
                  required
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-md border border-[#DDE3E0] font-mono focus:outline-none focus:border-[#1F5C55]"
                />
              </div>

              {/* Tải file minh chứng */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#12211F]">
                  Tài liệu đính kèm / Ảnh minh chứng (Ảnh sổ ghi, Excel, Word, PDF)
                </label>
                
                <div className="border-2 border-dashed border-[#DDE3E0] hover:border-[#1F5C55] rounded-lg p-4 text-center cursor-pointer transition-colors bg-[#F7F8F6]">
                  <input
                    type="file"
                    id="evidenceFileInput"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const rawFile = e.target.files[0];
                        if (rawFile.type.startsWith("image/")) {
                          const compressed = await compressImage(rawFile);
                          setEvidenceFile(compressed);
                        } else {
                          setEvidenceFile(rawFile);
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="evidenceFileInput" className="cursor-pointer block">
                    <UploadCloud className="h-8 w-8 text-[#1F5C55] mx-auto mb-1.5" />
                    {evidenceFile ? (
                      <p className="text-xs font-semibold text-[#1F5C55]">
                        Đã chọn: {evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(1)} KB)
                      </p>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-[#12211F]">
                          Bấm để tải ảnh chụp sổ ghi chép hoặc file tài liệu
                        </p>
                        <p className="text-[11px] text-[#5C6B68] mt-0.5">
                          File sẽ được tự động lưu trữ trên Google Drive của khoa
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* HOẶC dán link Google Drive */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#12211F]">
                    HOẶC Dán link Google Drive / SharePoint
                  </label>
                  <a
                    href={ISO_DRIVE_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#1F5C55] hover:underline flex items-center gap-1"
                  >
                    <span>Mở Drive Khoa</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full p-2.5 text-xs rounded-md border border-[#DDE3E0] font-mono focus:outline-none focus:border-[#1F5C55]"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Ghi chú kết quả / Diễn giải
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Đã kiểm tra nhiệt độ 22.5°C, độ ẩm 65% lúc 08:30..."
                  className="w-full p-2.5 text-xs rounded-md border border-[#DDE3E0] focus:outline-none focus:border-[#1F5C55]"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DDE3E0]">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForSubmit(null)}
                  className="px-4 py-2 text-xs font-medium text-[#5C6B68] hover:bg-[#F7F8F6] rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1F5C55] hover:bg-[#16443F] rounded-md disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="h-4 w-4" />
                  {isSubmitting ? "Đang gửi báo cáo..." : "Nộp báo cáo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo đầu việc phát sinh */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#DDE3E0] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="border-b border-[#DDE3E0] pb-3">
              <h3 className="text-base font-bold text-[#12211F]">
                Tạo Đầu việc Phát sinh Mới
              </h3>
              <p className="text-xs text-[#5C6B68] mt-0.5">
                Dành cho các sự vụ phát sinh ngoài lịch: Sự không phù hợp, CAPA, Khiếu nại, Ngoại kiểm đợt...
              </p>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Chọn Loại công việc
                </label>
                <select
                  value={selectedEventItemId}
                  onChange={(e) => setSelectedEventItemId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-md border border-[#DDE3E0] focus:outline-none focus:border-[#1F5C55]"
                >
                  {eventWorkItems.map(item => (
                    <option key={item.itemId} value={item.itemId}>
                      [{item.itemCode}] {item.itemName} (Phụ trách: {item.assigneeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Nội dung sự việc / Mô tả ca phát sinh
                </label>
                <textarea
                  required
                  rows={3}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Ví dụ: Sự cố mẫu bệnh phẩm thiếu thông tin lâm sàng ca số 123 / Đợt ngoại kiểm mô bệnh học đợt 2..."
                  className="w-full p-2.5 text-xs rounded-md border border-[#DDE3E0] focus:outline-none focus:border-[#1F5C55]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Hạn hoàn thành xử lý
                </label>
                <input
                  type="date"
                  required
                  value={eventDueDate}
                  onChange={(e) => setEventDueDate(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-md border border-[#DDE3E0] font-mono focus:outline-none focus:border-[#1F5C55]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DDE3E0]">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5C6B68] hover:bg-[#F7F8F6] rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEvent}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1F5C55] hover:bg-[#16443F] rounded-md disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isCreatingEvent ? "Đang tạo..." : "Tạo công việc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
