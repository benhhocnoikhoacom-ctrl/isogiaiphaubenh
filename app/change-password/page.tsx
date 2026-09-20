"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  LogOut,
  Hospital
} from "lucide-react";
import { changeMyPassword } from "@/app/actions/user-actions";

export default function ChangePasswordPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword.trim()) {
      setErrorMsg("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (newPassword.trim().length < 6) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp với mật khẩu mới.");
      return;
    }

    if (newPassword.trim() === currentPassword.trim()) {
      setErrorMsg("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await changeMyPassword(currentPassword, newPassword);

      if (!result.success) {
        setErrorMsg(result.message);
        setIsLoading(false);
      } else {
        setSuccessMsg("Đổi mật khẩu thành công! Đang chuyển hướng vào hệ thống...");
        // Cập nhật session token client-side
        if (update) {
          await update({ mustChangePassword: false });
        }
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      setErrorMsg("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F5C55] text-white shadow-md shadow-[#1F5C55]/15 mb-4">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#12211F] tracking-tight">
            Đổi mật khẩu tài khoản
          </h2>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#5C6B68] font-medium">
            <Hospital className="h-3.5 w-3.5 text-[#1F5C55]" />
            <span>Khoa Giải phẫu bệnh - BVĐK Đức Giang</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#DDE3E0] rounded-xl shadow-xs">
          {/* Thông báo bắt buộc đổi mật khẩu */}
          <div className="mb-6 rounded-lg bg-[#E3EFEC] border border-[#1F5C55]/20 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#1F5C55] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#1F5C55]">
                  Yêu cầu bảo mật tài khoản
                </h4>
                <p className="text-[12px] text-[#12211F]/80 mt-1 leading-relaxed">
                  Để đảm bảo an toàn thông tin cá nhân và dữ liệu khoa phòng, bạn vui lòng thiết lập mật khẩu mới trước khi tiếp tục truy cập.
                </p>
                {session?.user?.name && (
                  <p className="text-[11px] text-[#5C6B68] mt-1.5 font-medium">
                    Tài khoản: <span className="text-[#12211F] font-semibold">{session.user.name}</span> ({session.user.email})
                  </p>
                )}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#F5C4B8] bg-[#FDF3F1] p-3 text-xs text-[#99281A]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#A2D9D1] bg-[#EBF7F5] p-3 text-xs text-[#16443F]">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mật khẩu hiện tại */}
            <div>
              <label className="block text-xs font-semibold text-[#12211F] mb-1.5">
                Mật khẩu hiện tại (ban đầu được cấp)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-[#5C6B68]" />
                </div>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu được cấp"
                  className="block w-full rounded-md border border-[#DDE3E0] bg-[#F7F8F6] pl-9 pr-10 py-2 text-sm text-[#12211F] focus:bg-white focus:border-[#1F5C55] focus:outline-none focus:ring-1 focus:ring-[#1F5C55] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5C6B68] hover:text-[#12211F]"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-xs font-semibold text-[#12211F] mb-1.5">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyRound className="h-4 w-4 text-[#5C6B68]" />
                </div>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới tự chọn"
                  className="block w-full rounded-md border border-[#DDE3E0] bg-[#F7F8F6] pl-9 pr-10 py-2 text-sm text-[#12211F] focus:bg-white focus:border-[#1F5C55] focus:outline-none focus:ring-1 focus:ring-[#1F5C55] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5C6B68] hover:text-[#12211F]"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="block text-xs font-semibold text-[#12211F] mb-1.5">
                Nhập lại mật khẩu mới
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-[#5C6B68]" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu mới"
                  className="block w-full rounded-md border border-[#DDE3E0] bg-[#F7F8F6] pl-9 pr-3 py-2 text-sm text-[#12211F] focus:bg-white focus:border-[#1F5C55] focus:outline-none focus:ring-1 focus:ring-[#1F5C55] transition-all"
                  required
                />
              </div>
            </div>

            {/* Nút gửi */}
            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-[#1F5C55] py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#16443F] focus:outline-none focus:ring-2 focus:ring-[#1F5C55] focus:ring-offset-1 disabled:opacity-60 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu mật khẩu...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận & Vào hệ thống</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Đăng xuất */}
          <div className="mt-6 pt-4 border-t border-[#DDE3E0] flex items-center justify-between">
            <span className="text-[11px] text-[#5C6B68]">
              Không phải tài khoản của bạn?
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#99281A] hover:underline"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
