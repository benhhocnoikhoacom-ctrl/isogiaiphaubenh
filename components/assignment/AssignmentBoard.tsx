"use client";

import { useState } from "react";
import { 
  Users, 
  Save, 
  Edit3, 
  Check, 
  ExternalLink, 
  Search, 
  ShieldAlert, 
  CheckCircle2,
  Calendar,
  HardDrive
} from "lucide-react";
import { WorkItem, UserProfile } from "@/types/iso";
import { updateWorkItemAssignment } from "@/app/actions/task-actions";
import { useSession } from "next-auth/react";

interface Props {
  initialWorkItems: WorkItem[];
  users: UserProfile[];
}

export function AssignmentBoard({ initialWorkItems, users }: Props) {
  const { data: session } = useSession();
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialWorkItems);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Form state khi sửa 1 đầu việc
  const [editAssigneeEmail, setEditAssigneeEmail] = useState("");
  const [editReviewerEmail, setEditReviewerEmail] = useState("");
  const [editReminderDays, setEditReminderDays] = useState(3);
  const [editDueRule, setEditDueRule] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";
  const adminEmail = session?.user?.email || "admin";
  const adminName = session?.user?.name || "Trưởng khoa";

  const filteredItems = workItems.filter(item => 
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.assigneeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function startEdit(item: WorkItem) {
    setEditingItemId(item.itemId);
    // Tìm user theo assigneeName hoặc email
    const currentAssignee = users.find(u => u.fullName.toLowerCase() === item.assigneeName.toLowerCase());
    setEditAssigneeEmail(currentAssignee ? currentAssignee.email : users[0].email);

    const currentReviewer = users.find(u => u.fullName.toLowerCase() === item.reviewerName.toLowerCase());
    setEditReviewerEmail(currentReviewer ? currentReviewer.email : "nguyethmu@gmail.com");

    setEditReminderDays(item.reminderDays);
    setEditDueRule(item.dueRule);
  }

  async function handleSave(item: WorkItem) {
    setSavingId(item.itemId);
    const assignedUser = users.find(u => u.email.toLowerCase() === editAssigneeEmail.toLowerCase()) || users[0];
    const reviewerUser = users.find(u => u.email.toLowerCase() === editReviewerEmail.toLowerCase()) || users[0];

    const res = await updateWorkItemAssignment(
      item.itemId,
      assignedUser.fullName,
      assignedUser.email,
      reviewerUser.fullName,
      reviewerUser.email,
      editReminderDays,
      editDueRule,
      adminEmail,
      adminName
    );

    if (res.success) {
      setWorkItems(prev => prev.map(w => w.itemId === item.itemId ? {
        ...w,
        assigneeName: assignedUser.fullName,
        reviewerName: reviewerUser.fullName,
        reminderDays: Number(editReminderDays),
        dueRule: editDueRule
      } : w));
      setEditingItemId(null);
    } else {
      alert(res.error || "Có lỗi khi lưu phân công.");
    }
    setSavingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DDE3E0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F5C55] bg-[#E3EFEC] px-2 py-0.5 rounded font-mono">
              QUẢN TRỊ PHÂN CÔNG
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12211F]">
            Bảng Phân công & Giám sát Công việc ISO
          </h1>
          <p className="text-sm text-[#5C6B68] mt-1">
            Trưởng khoa có toàn quyền thay đổi người thực hiện và người giám sát/phê duyệt cho từng đầu việc mà không cần sửa code.
          </p>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6B68]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã, tên việc, nhân sự..."
            className="pl-9 pr-4 py-2 rounded-md border border-[#DDE3E0] bg-white text-xs w-64 focus:outline-none focus:border-[#1F5C55]"
          />
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-xl border border-[#EFD3A3] bg-[#FDF0DC] flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-[#8A5108] shrink-0" />
          <p className="text-xs text-[#8A5108]">
            Bạn đang xem bảng phân công ở chế độ chỉ đọc. Chỉ <strong>Trưởng khoa / Quản trị viên</strong> mới có quyền chỉnh sửa phân công và người phê duyệt.
          </p>
        </div>
      )}

      {/* Bảng phân công */}
      <div className="bg-white rounded-xl border border-[#DDE3E0] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8F6] text-[#5C6B68] border-b border-[#DDE3E0] font-mono uppercase">
              <tr>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-3">Mã</th>
                <th className="py-3 px-3">Đầu việc quản lý</th>
                <th className="py-3 px-3">Tần suất</th>
                <th className="py-3 px-3">Người phụ trách</th>
                <th className="py-3 px-3">Người duyệt</th>
                <th className="py-3 px-3">Nhắc trước</th>
                <th className="py-3 px-3">Quy tắc hạn</th>
                {isAdmin && <th className="py-3 px-3 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E0]">
              {filteredItems.map((item, index) => {
                const isEditing = editingItemId === item.itemId;

                return (
                  <tr key={item.itemId} className={isEditing ? "bg-[#E3EFEC]/30" : "hover:bg-[#F7F8F6] transition-colors"}>
                    <td className="py-3 px-3 text-center font-mono text-[#5C6B68] font-medium">{index + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#1F5C55]">{item.itemCode}</td>
                    
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-[#12211F]">{item.itemName}</div>
                      <div className="text-[11px] text-[#5C6B68] mt-0.5 line-clamp-1" title={item.operationNote}>
                        {item.operationNote}
                      </div>
                      {item.externalLink && (
                        <a
                          href={item.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#1F5C55] hover:underline font-medium mt-1"
                        >
                          <span>Hệ thống chuyên biệt</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#EEF0EF] text-[#59665F] text-[11px] font-medium">
                        {item.frequency}
                      </span>
                    </td>

                    {/* Người phụ trách */}
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <select
                          value={editAssigneeEmail}
                          onChange={(e) => setEditAssigneeEmail(e.target.value)}
                          className="p-1.5 text-xs rounded border border-[#1F5C55] bg-white focus:outline-none"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.email}>
                              {u.fullName} ({u.title})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-semibold text-[#12211F]">{item.assigneeName}</span>
                      )}
                    </td>

                    {/* Người duyệt */}
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <select
                          value={editReviewerEmail}
                          onChange={(e) => setEditReviewerEmail(e.target.value)}
                          className="p-1.5 text-xs rounded border border-[#1F5C55] bg-white focus:outline-none"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.email}>
                              {u.fullName} ({u.title})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[#5C6B68]">{item.reviewerName || "Trưởng khoa"}</span>
                      )}
                    </td>

                    {/* Nhắc trước */}
                    <td className="py-3 px-3 font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={editReminderDays}
                          onChange={(e) => setEditReminderDays(Number(e.target.value))}
                          className="w-16 p-1.5 text-xs rounded border border-[#1F5C55] bg-white font-mono text-center"
                        />
                      ) : (
                        <span>{item.reminderDays} ngày</span>
                      )}
                    </td>

                    {/* Quy tắc hạn */}
                    <td className="py-3 px-3 text-[#5C6B68] max-w-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDueRule}
                          onChange={(e) => setEditDueRule(e.target.value)}
                          className="w-full p-1.5 text-xs rounded border border-[#1F5C55] bg-white"
                        />
                      ) : (
                        <span className="text-[11px]">{item.dueRule}</span>
                      )}
                    </td>

                    {/* Nút hành động */}
                    {isAdmin && (
                      <td className="py-3 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="px-2.5 py-1 text-xs text-[#5C6B68] hover:bg-[#EEF0EF] rounded"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSave(item)}
                              disabled={savingId === item.itemId}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-[#1F5C55] text-white text-xs font-semibold rounded hover:bg-[#16443F] disabled:opacity-50"
                            >
                              <Save className="h-3.5 w-3.5" />
                              {savingId === item.itemId ? "Lưu..." : "Lưu"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#1F5C55] hover:bg-[#E3EFEC] rounded transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                            Đổi phân công
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
