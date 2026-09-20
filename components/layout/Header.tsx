"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  ExternalLink, 
  LogOut, 
  Menu, 
  X,
  HardDrive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { ISO_DRIVE_FOLDER_URL } from "@/types/iso";

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const navigation = [
    { name: "Dashboard Trưởng khoa", href: "/", icon: LayoutDashboard },
    { name: "Đầu việc của tôi", href: "/my-tasks", icon: CheckSquare },
    ...(isAdmin ? [{ name: "Bảng phân công", href: "/assignment", icon: Users }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#DDE3E0] bg-white/95 backdrop-blur shadow-xs">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F5C55] text-white shadow-xs group-hover:bg-[#16443F] transition-colors">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[#12211F] leading-tight">
                e-ISO Pathology Tracker
              </span>
              <span className="text-[11px] font-medium text-[#5C6B68]">
                Khoa Giải phẫu bệnh
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#E3EFEC] text-[#1F5C55] font-semibold"
                      : "text-[#5C6B68] hover:text-[#12211F] hover:bg-[#F7F8F6]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Quick links to External Systems */}
            <a
              href={ISO_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-[#5C6B68] hover:text-[#1F5C55] hover:bg-[#F7F8F6] transition-colors"
              title="Mở thư mục Google Drive lưu trữ minh chứng"
            >
              <HardDrive className="h-4 w-4 text-[#1F5C55]" />
              <span>Drive Minh chứng</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            <a
              href="https://iso-gpb-duc-giang.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium text-[#5C6B68] hover:text-[#1F5C55] hover:bg-[#F7F8F6] transition-colors"
              title="GB.QL.08 (Nội kiểm) & GB.QL.09 (Thẩm định phương pháp)"
            >
              <span>GB.QL.08/09</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </nav>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 text-sm mr-1">
            {status === "loading" ? (
              <span className="text-xs text-[#5C6B68]">Đang tải...</span>
            ) : session?.user ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-xs text-[#12211F]">
                    {session.user.name || session.user.email}
                  </span>
                  <span className="text-[11px] text-[#5C6B68]">
                    {session.user.title || (isAdmin ? "Trưởng khoa / Admin" : "Nhân viên")}
                  </span>
                </div>
                {isAdmin ? (
                  <span className="inline-flex items-center rounded-sm bg-[#16443F] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                    ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-sm bg-[#E3EFEC] px-1.5 py-0.5 text-[10px] font-medium text-[#1F5C55] uppercase tracking-wider font-mono">
                    KHOA
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-[#5C6B68]">Chưa đăng nhập</span>
            )}
          </div>

          {session ? (
            <button
              onClick={() => signOut()}
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#DDE3E0] bg-white px-3 py-1.5 text-xs font-medium text-[#12211F] hover:bg-[#F7F8F6] transition-colors shadow-2xs"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5 text-[#5C6B68]" />
              Đăng xuất
            </button>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="inline-flex h-9 items-center justify-center rounded-md bg-[#1F5C55] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#16443F] transition-colors shadow-2xs"
            >
              Đăng nhập Gmail
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-[#5C6B68] hover:text-[#12211F] hover:bg-[#F7F8F6]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DDE3E0] bg-white px-4 py-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium",
                  isActive ? "bg-[#E3EFEC] text-[#1F5C55] font-semibold" : "text-[#5C6B68] hover:bg-[#F7F8F6]"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          <a
            href={ISO_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-[#1F5C55] hover:bg-[#F7F8F6]"
          >
            <div className="flex items-center gap-3">
              <HardDrive className="h-4 w-4" />
              <span>Thư mục Drive Minh chứng</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://iso-gpb-duc-giang.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-[#5C6B68] hover:bg-[#F7F8F6]"
          >
            <span>Hệ thống GB.QL.08 / GB.QL.09</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://quanlithietbi.bstrung.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-[#5C6B68] hover:bg-[#F7F8F6]"
          >
            <span>XN.QL.01 - Quản lý Thiết bị</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </header>
  );
}
