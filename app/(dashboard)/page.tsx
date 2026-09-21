import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { adminDb } from "@/lib/firebase-admin";
import { computeDashboardStats, computeStaffPerformance, getCurrentMonthPeriod, syncTasksForCurrentPeriod } from "@/lib/task-engine";
import { UserProfile } from "@/types/iso";

import { FALLBACK_USERS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentPeriod = getCurrentMonthPeriod();

  // 1. Tự động đồng bộ và sinh các task định kỳ cho kỳ hiện tại
  const tasks = await syncTasksForCurrentPeriod();

  // 2. Lấy danh sách nhân viên an toàn
  let users: UserProfile[] = [];
  try {
    const usersSnap = await adminDb.collection("iso_users").where("active", "==", true).get();
    users = usersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserProfile));
  } catch (error) {
    console.error("Error loading users from Firestore, using fallback:", error);
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
