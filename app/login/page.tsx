import React, { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { LoginForm } from "./LoginForm";
import { FALLBACK_USERS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let staffList: { name: string; email: string; role: string }[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from("iso_users")
      .select("*")
      .eq("active", true);

    if (error || !data) throw error || new Error("Failed to fetch staff");

    staffList = data.map((d: any) => ({
      name: d.full_name || d.id,
      email: d.id,
      role: d.role === "ADMIN" ? "Trưởng khoa (Admin)" : d.title || "Kỹ thuật viên / Bác sĩ",
    }));
  } catch (err) {
    console.error("Error fetching staff list from Supabase, using fallback:", err);
  }

  // Fallback an toàn nếu có sự cố
  if (staffList.length === 0) {
    staffList = FALLBACK_USERS.map((u) => ({
      name: u.fullName,
      email: u.email,
      role: u.role === "ADMIN" ? "Trưởng khoa (Admin)" : u.title || "Kỹ thuật viên / Bác sĩ",
    }));
  }

  // Sắp xếp: Admin trước, sau đó đến nhân viên
  staffList.sort((a, b) => {
    if (a.role.includes("Admin") && !b.role.includes("Admin")) return -1;
    if (!a.role.includes("Admin") && b.role.includes("Admin")) return 1;
    return a.name.localeCompare(b.name, "vi");
  });

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8F6] flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-[#1F5C55] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm staffList={staffList} />
    </Suspense>
  );
}
