import React, { Suspense } from "react";
import { adminDb } from "@/lib/firebase-admin";
import { LoginForm } from "./LoginForm";

import { FALLBACK_USERS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let staffList: { name: string; email: string; role: string }[] = [];

  try {
    const snap = await adminDb.collection("iso_users").where("active", "==", true).get();
    staffList = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        name: d.fullName || doc.id,
        email: doc.id,
        role: d.role === "ADMIN" ? "Trưởng khoa (Admin)" : (d.title || "Kỹ thuật viên / Bác sĩ"),
      };
    });
  } catch (err) {
    console.error("Error fetching staff list from Firestore (e.g. Quota Exceeded), using fallback:", err);
  }

  // Nếu không tải được từ Firestore (do hết Quota Firebase), sử dụng danh sách nhân viên mặc định
  if (staffList.length === 0) {
    staffList = FALLBACK_USERS.map((u) => ({
      name: u.fullName,
      email: u.email,
      role: u.role === "ADMIN" ? "Trưởng khoa (Admin)" : (u.title || "Kỹ thuật viên / Bác sĩ"),
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
