"use client";

import React, { useState } from "react";
import { UserProfile, UserRole } from "@/types/iso";
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Search,
  Phone,
  Mail,
  UserCheck
} from "lucide-react";
import { 
  createUser, 
  updateUser, 
  toggleUserStatus, 
  resetUserPassword, 
  deleteUser 
} from "@/app/actions/user-actions";
import { useRouter } from "next/navigation";

interface StaffManagementProps {
  initialUsers: UserProfile[];
  currentAdminEmail: string;
}

export function StaffManagement({ initialUsers, currentAdminEmail }: StaffManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    title: "Kỹ thuật viên",
    role: "USER" as UserRole,
    phone: "",
    initialPassword: "isogpb@2026",
  });
  const [resetPasswordVal, setResetPasswordVal] = useState("isogpb@2026");
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchQuery = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === "ALL" ? true : u.role === filterRole;
    return matchQuery && matchRole;
  });

  const activeCount = users.filter((u) => u.active !== false).length;
  const inactiveCount = users.length - activeCount;

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      fullName: "",
      email: "",
      title: "Kỹ thuật viên",
      role: "USER",
      phone: "",
      initialPassword: "isogpb@2026",
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      title: user.title,
      role: user.role,
      phone: user.phone || "",
      initialPassword: "",
    });
    setShowEditModal(true);
  };

  const handleOpenReset = (user: UserProfile) => {
    setSelectedUser(user);
    setResetPasswordVal("isogpb@2026");
    setShowResetModal(true);
  };

  const handleOpenDelete = (user: UserProfile) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await createUser(formData);
    setIsLoading(false);

    if (res.success) {
      showNotification("success", res.message);
      setShowAddModal(false);
      router.refresh();
      // Optimistic update
      const newUser: UserProfile = {
        id: formData.email.toLowerCase(),
        email: formData.email.toLowerCase(),
        fullName: formData.fullName,
        title: formData.title,
        role: formData.role,
        phone: formData.phone,
        active: true,
      };
      setUsers([...users, newUser]);
    } else {
      showNotification("error", res.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);
    const res = await updateUser(selectedUser.email, {
      fullName: formData.fullName,
      title: formData.title,
      role: formData.role,
      phone: formData.phone,
    });
    setIsLoading(false);

    if (res.success) {
      showNotification("success", res.message);
      setShowEditModal(false);
      router.refresh();
      setUsers(users.map((u) => u.email === selectedUser.email ? { ...u, ...formData } : u));
    } else {
      showNotification("error", res.message);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus = user.active === false ? true : false;
    setIsLoading(true);
    const res = await toggleUserStatus(user.email, nextStatus);
    setIsLoading(false);

    if (res.success) {
      showNotification("success", res.message);
      router.refresh();
      setUsers(users.map((u) => u.email === user.email ? { ...u, active: nextStatus } : u));
    } else {
      showNotification("error", res.message);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);
    const res = await resetUserPassword(selectedUser.email, resetPasswordVal);
    setIsLoading(false);

    if (res.success) {
      showNotification("success", res.message);
      setShowResetModal(false);
      router.refresh();
    } else {
      showNotification("error", res.message);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    const res = await deleteUser(selectedUser.email);
    setIsLoading(false);

    if (res.success) {
      showNotification("success", res.message);
      setShowDeleteModal(false);
      router.refresh();
      setUsers(users.filter((u) => u.email !== selectedUser.email));
    } else {
      showNotification("error", res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DDE3E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#12211F] tracking-tight">
              Quản lý Cán bộ & Nhân viên Khoa
            </h1>
            <span className="rounded bg-[#E3EFEC] px-2 py-0.5 text-[11px] font-bold text-[#1F5C55] font-mono">
              {users.length} CÁN BỘ
            </span>
          </div>
          <p className="text-xs text-[#5C6B68] mt-1">
            Thêm mới, sửa thông tin, đặt lại mật khẩu và kiểm soát quyền truy cập hệ thống e-ISO.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F5C55] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#16443F] transition-colors shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Thêm nhân viên mới</span>
        </button>
      </div>

      {/* Notification toast */}
      {actionMessage && (
        <div
          className={`flex items-center gap-2.5 rounded-lg border p-3.5 text-xs transition-all ${
            actionMessage.type === "success"
              ? "border-[#A2D9D1] bg-[#EBF7F5] text-[#16443F]"
              : "border-[#F5C4B8] bg-[#FDF3F1] text-[#99281A]"
          }`}
        >
          {actionMessage.type === "success" ? (
            <UserCheck className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{actionMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#DDE3E0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6B68]">Tổng cán bộ</span>
            <Users className="h-4 w-4 text-[#1F5C55]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#12211F] font-mono">{users.length}</p>
          <p className="text-[11px] text-[#5C6B68] mt-1">Bao gồm Trưởng khoa, Bác sĩ & KTV</p>
        </div>

        <div className="rounded-xl border border-[#DDE3E0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6B68]">Đang hoạt động</span>
            <ShieldCheck className="h-4 w-4 text-[#1F5C55]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1F5C55] font-mono">{activeCount}</p>
          <p className="text-[11px] text-[#5C6B68] mt-1">Được phép đăng nhập & nhận việc</p>
        </div>

        <div className="rounded-xl border border-[#DDE3E0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6B68]">Đã vô hiệu hóa</span>
            <ShieldAlert className="h-4 w-4 text-[#99281A]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#99281A] font-mono">{inactiveCount}</p>
          <p className="text-[11px] text-[#5C6B68] mt-1">Tài khoản tạm khóa không vào được</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-[#DDE3E0]">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6B68]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, email, chức vụ..."
            className="w-full rounded-md border border-[#DDE3E0] bg-[#F7F8F6] pl-9 pr-3 py-1.5 text-xs text-[#12211F] placeholder:text-[#5C6B68] focus:bg-white focus:border-[#1F5C55] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#5C6B68] shrink-0 font-medium">Vai trò:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-md border border-[#DDE3E0] bg-[#F7F8F6] px-3 py-1.5 text-xs text-[#12211F] focus:bg-white focus:border-[#1F5C55] focus:outline-none"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Trưởng khoa / Admin</option>
            <option value="USER">Bác sĩ & KTV</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-xl border border-[#DDE3E0] bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DDE3E0] bg-[#F7F8F6] text-[11px] font-semibold text-[#5C6B68] uppercase tracking-wider">
                <th className="py-3 px-4">Cán bộ nhân viên</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E0] text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5C6B68]">
                    Không tìm thấy cán bộ nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentAdmin = user.email.toLowerCase() === currentAdminEmail.toLowerCase();
                  const isActive = user.active !== false;

                  return (
                    <tr 
                      key={user.email} 
                      className={`hover:bg-[#F7F8F6]/80 transition-colors ${!isActive ? "opacity-60 bg-gray-50/50" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            user.role === "ADMIN" ? "bg-[#1F5C55] text-white" : "bg-[#E3EFEC] text-[#1F5C55]"
                          }`}>
                            {user.fullName.split(" ").pop()?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-[#12211F] flex items-center gap-1.5">
                              {user.fullName}
                              {isCurrentAdmin && (
                                <span className="text-[10px] text-[#1F5C55] font-normal bg-[#E3EFEC] px-1.5 py-0.2 rounded">
                                  Bạn
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#5C6B68] font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#12211F] font-medium">
                        {user.title || "Kỹ thuật viên"}
                      </td>

                      <td className="py-3 px-4">
                        {user.role === "ADMIN" ? (
                          <span className="inline-flex items-center rounded bg-[#16443F] px-2 py-0.5 text-[10px] font-bold text-white uppercase font-mono">
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-[#E3EFEC] px-2 py-0.5 text-[10px] font-medium text-[#1F5C55] uppercase font-mono">
                            USER
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#5C6B68] font-mono">
                        {user.phone || "--"}
                      </td>

                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF7F5] px-2 py-0.5 text-[11px] font-medium text-[#1F5C55]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1F5C55]" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF3F1] px-2 py-0.5 text-[11px] font-medium text-[#99281A]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#99281A]" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Đặt lại mật khẩu */}
                          <button
                            onClick={() => handleOpenReset(user)}
                            title="Đặt lại mật khẩu"
                            className="p-1.5 rounded text-[#5C6B68] hover:text-[#1F5C55] hover:bg-[#E3EFEC] transition-colors"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          {/* Sửa thông tin */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Sửa thông tin"
                            className="p-1.5 rounded text-[#5C6B68] hover:text-[#12211F] hover:bg-[#F7F8F6] transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Khóa / Mở khóa */}
                          {!isCurrentAdmin && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                              className={`p-1.5 rounded transition-colors ${
                                isActive 
                                  ? "text-[#5C6B68] hover:text-[#99281A] hover:bg-[#FDF3F1]" 
                                  : "text-[#1F5C55] hover:bg-[#E3EFEC]"
                              }`}
                            >
                              {isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </button>
                          )}

                          {/* Xóa tài khoản */}
                          {!isCurrentAdmin && (
                            <button
                              onClick={() => handleOpenDelete(user)}
                              title="Xóa nhân viên"
                              className="p-1.5 rounded text-[#5C6B68] hover:text-[#99281A] hover:bg-[#FDF3F1] transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: THÊM NHÂN VIÊN MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#DDE3E0]">
            <div className="flex items-center justify-between border-b border-[#DDE3E0] pb-3">
              <h3 className="text-base font-bold text-[#12211F]">Thêm nhân viên mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#5C6B68] hover:text-[#12211F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="ví dụ: Nguyễn Văn A"
                  required
                  className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Địa chỉ Email (dùng để đăng nhập) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ví dụ: nguyenvana@gmail.com"
                  required
                  className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#12211F] mb-1">
                    Chức danh
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Bác sĩ, KTV..."
                    className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12211F] mb-1">
                    Vai trò hệ thống
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none"
                  >
                    <option value="USER">USER (Bác sĩ / KTV)</option>
                    <option value="ADMIN">ADMIN (Trưởng / Phó khoa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09xx xxx xxx"
                  className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Mật khẩu ban đầu cấp cho nhân viên
                </label>
                <input
                  type="text"
                  value={formData.initialPassword}
                  onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                  required
                  className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none font-mono bg-[#F7F8F6]"
                />
                <p className="text-[11px] text-[#5C6B68] mt-1">
                  Nhân viên sẽ được yêu cầu đổi mật khẩu mới ngay trong lần đăng nhập đầu tiên.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#DDE3E0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs font-medium text-[#5C6B68] hover:bg-[#F7F8F6]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-md bg-[#1F5C55] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#16443F] disabled:opacity-50"
                >
                  {isLoading ? "Đang tạo..." : "Tạo nhân viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SỬA THÔNG TIN NHÂN VIÊN */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#DDE3E0]">
            <div className="flex items-center justify-between border-b border-[#DDE3E0] pb-3">
              <h3 className="text-base font-bold text-[#12211F]">Sửa thông tin cán bộ</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 text-[#5C6B68] hover:text-[#12211F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Email (Cố định)
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full rounded-md border border-[#DDE3E0] bg-[#F7F8F6] px-3 py-1.5 text-xs text-[#5C6B68] font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#12211F] mb-1">
                    Chức danh
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12211F] mb-1">
                    Vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none"
                  >
                    <option value="USER">USER (Bác sĩ / KTV)</option>
                    <option value="ADMIN">ADMIN (Trưởng / Phó khoa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#DDE3E0]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs font-medium text-[#5C6B68] hover:bg-[#F7F8F6]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-md bg-[#1F5C55] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#16443F] disabled:opacity-50"
                >
                  {isLoading ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ĐẶT LẠI MẬT KHẨU */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#DDE3E0]">
            <div className="flex items-center justify-between border-b border-[#DDE3E0] pb-3">
              <h3 className="text-base font-bold text-[#12211F]">Đặt lại mật khẩu</h3>
              <button 
                onClick={() => setShowResetModal(false)}
                className="p-1 text-[#5C6B68] hover:text-[#12211F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="mt-4 space-y-4">
              <div className="rounded-lg bg-[#F7F8F6] p-3 text-xs text-[#5C6B68]">
                Đặt lại mật khẩu cho cán bộ: <span className="font-semibold text-[#12211F]">{selectedUser.fullName}</span> ({selectedUser.email})
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12211F] mb-1.5">
                  Mật khẩu tạm thời mới
                </label>
                <input
                  type="text"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu tạm"
                  className="w-full rounded-md border border-[#DDE3E0] px-3 py-2 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none font-mono"
                />
                <p className="text-[11px] text-[#5C6B68] mt-1.5">
                  * Sau khi đặt lại, nhân viên đăng nhập bằng mật khẩu tạm này và sẽ bắt buộc phải tự đổi mật khẩu mới.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#DDE3E0]">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs font-medium text-[#5C6B68] hover:bg-[#F7F8F6]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-md bg-[#1F5C55] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#16443F] disabled:opacity-50"
                >
                  {isLoading ? "Đang xử lý..." : "Xác nhận đặt lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: XÁC NHẬN XÓA NHÂN VIÊN */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-[#DDE3E0]">
            <div className="flex items-center gap-3 text-[#99281A] mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDF3F1]">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#12211F]">Xác nhận xóa</h3>
            </div>

            <p className="text-xs text-[#5C6B68] leading-relaxed">
              Bạn có chắc chắn muốn xóa cán bộ <span className="font-semibold text-[#12211F]">{selectedUser.fullName}</span> ({selectedUser.email}) khỏi hệ thống? 
            </p>
            <p className="text-[11px] text-[#99281A] mt-2 font-medium">
              Lưu ý: Nếu cán bộ chỉ nghỉ phép hoặc luân chuyển tạm thời, bạn nên chọn chức năng "Khóa tài khoản" thay vì xóa hẳn.
            </p>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[#DDE3E0]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-[#DDE3E0] px-3 py-1.5 text-xs font-medium text-[#5C6B68] hover:bg-[#F7F8F6]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isLoading}
                className="rounded-md bg-[#99281A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#7D2115] disabled:opacity-50"
              >
                {isLoading ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
