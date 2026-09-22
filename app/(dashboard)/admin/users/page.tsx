import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { UserProfile } from "@/types/iso";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { FALLBACK_USERS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  let users: UserProfile[] = [];
  try {
    const { data, error } = await supabaseAdmin.from("iso_users").select("*");
    if (error || !data) throw error || new Error("Failed to fetch users");

    users = data.map((d: any) => ({
      id: d.id,
      email: d.email || d.id,
      fullName: d.full_name || d.id,
      role: d.role || "USER",
      title: d.title || "Kỹ thuật viên",
      phone: d.phone || "",
      active: d.active !== false,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch (error) {
    console.error("Error loading users in AdminUsersPage, using fallback:", error);
    users = FALLBACK_USERS;
  }

  return (
    <StaffManagement
      initialUsers={users}
      currentAdminEmail={session.user.email || ""}
    />
  );
}
