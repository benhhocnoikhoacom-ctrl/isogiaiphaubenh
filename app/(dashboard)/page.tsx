import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { computeDashboardStats, computeStaffPerformance, getCurrentMonthPeriod, syncTasksForCurrentPeriod } from "@/lib/task-engine";
import { UserProfile } from "@/types/iso";
import { FALLBACK_USERS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentPeriod = getCurrentMonthPeriod();

  // 1. Tự động đồng bộ và sinh các task định kỳ cho kỳ hiện tại
  const tasks = await syncTasksForCurrentPeriod();

  // 2. Lấy danh sách nhân viên an toàn từ Supabase
  let users: UserProfile[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("iso_users")
      .select("*")
      .eq("active", true);

    if (error || !data) {
      throw error || new Error("Cannot fetch users");
    }

    users = data.map((d: any) => ({
      id: d.id,
      email: d.email,
      fullName: d.full_name,
      role: d.role,
      title: d.title,
      phone: d.phone || "",
      active: d.active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch (error) {
    console.error("Error loading users from Supabase, using fallback:", error);
    users = FALLBACK_USERS;
  }

  // 3. Tính toán stats và performance
  const stats = computeDashboardStats(tasks);
  const staffPerformance = computeStaffPerformance(tasks, users);

  return (
    <ExecutiveDashboard
      initialTasks={tasks}
      initialStats={stats}
      staffPerformance={staffPerformance}
      currentPeriod={currentPeriod}
    />
  );
}
