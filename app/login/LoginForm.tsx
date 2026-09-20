"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Hospital
} from "lucide-react";

interface StaffOption {
  name: string;
  email: string;
  role: string;
}

export function LoginForm({ staffList }: { staffList: StaffOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelectStaff = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập hoặc chọn email tài khoản.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Vui lòng nhập mật khẩu.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMsg("Email hoặc mật khẩu không chính xác, hoặc tài khoản đã bị vô hiệu hóa.");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setErrorMsg("Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F5C55] text-white shadow-md shadow-[#1F5C55]/15 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#12211F] tracking-tight">
            e-ISO Pathology Tracker
          </h2>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#5C6B68] font-medium">
            <Hospital className="h-3.5 w-3.5 text-[#1F5C55]" />
            <span>Khoa Giải phẫu bệnh - BVĐK Đức Giang</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#DDE3E0] rounded-xl shadow-xs">
          <div className="mb-6 pb-4 border-b border-[#E3EFEC]">
            <h3 className="text-base font-bold text-[#12211F]">Đăng nhập hệ thống</h3>
            <p className="text-xs text-[#5C6B68] mt-0.5">
              Nhập email và mật khẩu được cấp để truy cập báo cáo ISO.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#F5C4B8] bg-[#FDF3F1] p-3 text-xs text-[#99281A]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#12211F] mb-1.5">
                Email nhân viên
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-[#5C6B68]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ví dụ: drtuananh189@gmail.com"
                  className="block w-full rounded-md border border-[#DDE3E0] bg-[#F7F8F6] pl-9 pr-3 py-2 text-sm text-[#12211F] placeholder:text-[#5C6B68]/60 focus:bg-white focus:border-[#1F5C55] focus:outline-none focus:ring-1 focus:ring-[#1F5C55] transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Quick staff select */}
            {staffList && staffList.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium text-[#5C6B68] mb-1">
                  Hoặc chọn nhanh cán bộ khoa:
                </label>
                <select
                  value={email}
                  onChange={(e) => handleSelectStaff(e.target.value)}
                  className="block w-full rounded-md border border-[#DDE3E0] bg-white px-3 py-1.5 text-xs text-[#12211F] focus:border-[#1F5C55] focus:outline-none"
                >
                  <option value="">-- Bấm chọn cán bộ nhân viên --</option>
                  {staffList.map((staff) => (
                    <option key={staff.email} value={staff.email}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#12211F]">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-[#5C6B68]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  autoComplete="current-password"
                  className="block w-full rounded-md border border-[#DDE3E0] bg-[#F7F8F6] pl-9 pr-10 py-2 text-sm text-[#12211F] focus:bg-white focus:border-[#1F5C55] focus:outline-none focus:ring-1 focus:ring-[#1F5C55] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5C6B68] hover:text-[#12211F]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-[#1F5C55] py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#16443F] focus:outline-none focus:ring-2 focus:ring-[#1F5C55] focus:ring-offset-1 disabled:opacity-60 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Department Footer Info */}
          <div className="mt-6 pt-4 border-t border-[#DDE3E0] text-center">
            <p className="text-[11px] text-[#5C6B68]">
              Khoa Giải phẫu bệnh • Hệ thống ISO 15189:2022
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
