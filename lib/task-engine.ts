import { TaskRecord, TaskStatusCode, WorkItem, DashboardStats, StaffPerformance, UserProfile } from "@/types/iso";
import { adminDb } from "./firebase-admin";
import { FALLBACK_WORK_ITEMS, generateFallbackTasks } from "./fallback-data";

let memoryTasksCache: { data: TaskRecord[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 giây bộ nhớ đệm chống quá tải Firestore

export function clearTasksCache() {
  memoryTasksCache = null;
}

/**
 * Lấy ngày hôm nay theo múi giờ Việt Nam (UTC+7) định dạng YYYY-MM-DD
 */
export function getVietnamToday(): string {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, "0");
  const d = String(vnTime.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthPeriod(): string {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Tính toán trạng thái 4 cờ chuẩn ISO:
 * NOT_DUE / DUE_SOON / PENDING_APPROVAL / COMPLETED / OVERDUE
 */
export function calculateTaskStatus(
  dueDate: string,
  completedDate?: string,
  reminderDays: number = 3,
  approvalRequired: boolean = false,
  approvedAt?: string
): TaskStatusCode {
  if (completedDate) {
    if (approvalRequired) {
      return approvedAt ? "COMPLETED" : "PENDING_APPROVAL";
    }
    return "COMPLETED";
  }

  const today = getVietnamToday();
  const due = dueDate.slice(0, 10);

  if (today > due) {
    return "OVERDUE";
  }

  // Tính ngày nhắc trước: dueDate - reminderDays
  const dueTime = new Date(due).getTime();
  const reminderTime = dueTime - reminderDays * 24 * 60 * 60 * 1000;
  const reminderDateStr = new Date(reminderTime).toISOString().slice(0, 10);

  if (today >= reminderDateStr) {
    return "DUE_SOON";
  }

  return "NOT_DUE";
}

/**
 * Tính ngày đến hạn mặc định theo quy tắc trong WORK_ITEMS
 */
export function calculateDefaultDueDate(item: WorkItem, currentMonthPeriod: string): { period: string; dueDate: string } {
  const [yearStr, monthStr] = currentMonthPeriod.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  if (item.frequency === "Daily") {
    const today = getVietnamToday();
    return {
      period: today,
      dueDate: today
    };
  }

  if (item.frequency === "Annual") {
    let dueMonth = 11;
    let dueDay = 30;
    if (item.dueRule.includes("31/10")) {
      dueMonth = 10;
      dueDay = 31;
    } else if (item.dueRule.includes("15/12")) {
      dueMonth = 12;
      dueDay = 15;
    }
    const dueStr = `${year}-${String(dueMonth).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;
    return {
      period: `${year}`,
      dueDate: dueStr
    };
  }

  if (item.frequency === "Periodic") {
    // Nếu là theo quý
    if (item.dueRule.includes("quý")) {
      const currentQuarter = Math.ceil(month / 3);
      const nextQuarterFirstMonth = currentQuarter * 3 + 1;
      const targetYear = nextQuarterFirstMonth > 12 ? year + 1 : year;
      const targetMonth = nextQuarterFirstMonth > 12 ? 1 : nextQuarterFirstMonth;
      const targetDay = item.dueRule.includes("10") ? 10 : 5;

      return {
        period: `${year}-Q${currentQuarter}`,
        dueDate: `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`
      };
    }

    // Nếu là hàng tháng: chốt rà soát trước ngày 03 hoặc 05 của tháng kế tiếp
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const targetDay = item.dueRule.includes("03") ? 3 : (item.dueRule.includes("10") ? 10 : 5);
    return {
      period: currentMonthPeriod,
      dueDate: `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`
    };
  }

  // Mixed hoặc Event
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  return {
    period: currentMonthPeriod,
    dueDate: `${nextYear}-${String(nextMonth).padStart(2, "0")}-05`
  };
}

/**
 * Tự động đồng bộ và sinh các task định kỳ cho kỳ hiện tại nếu chưa tồn tại
 */
export async function syncTasksForCurrentPeriod(): Promise<TaskRecord[]> {
  const currentMonth = getCurrentMonthPeriod();

  // Kiểm tra bộ nhớ đệm chống tốn quota Firestore
  if (memoryTasksCache && Date.now() - memoryTasksCache.timestamp < CACHE_TTL_MS) {
    return memoryTasksCache.data;
  }

  const today = getVietnamToday();
  const dayOfWeek = new Date().getDay(); // 0 = Chủ nhật, 6 = Thứ 7

  try {
    // 1. Lấy tất cả danh mục work_items đang hoạt động
    const workItemsSnap = await adminDb.collection("iso_work_items").where("active", "==", true).get();
    const workItems = workItemsSnap.docs.map(d => d.data() as WorkItem);

    // 2. Lấy tất cả task hiện có trong Firestore
    const tasksSnap = await adminDb.collection("iso_tasks").get();
    const existingTasks = tasksSnap.docs.map(d => d.data() as TaskRecord);
    const taskMap = new Map<string, TaskRecord>();
    existingTasks.forEach(t => {
      taskMap.set(`${t.itemId}_${t.period}`, t);
    });

    const batch = adminDb.batch();
    let createdCount = 0;
    const nowIso = new Date().toISOString();

    for (const item of workItems) {
      // Bỏ qua task Daily nếu hôm nay là Thứ 7 hoặc Chủ Nhật
      if (item.frequency === "Daily" && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }

      const { period, dueDate } = calculateDefaultDueDate(item, currentMonth);
      const key = `${item.itemId}_${period}`;

      if (!taskMap.has(key)) {
        const taskId = `TSK_${item.itemId}_${period.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const status = calculateTaskStatus(dueDate, undefined, item.reminderDays, item.approvalRequired, undefined);

        const newTask: TaskRecord = {
          taskId,
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          period,
          dueDate,
          status,
          assigneeId: item.assigneeId,
          assigneeName: item.assigneeName,
          reviewerId: item.reviewerId,
          reviewerName: item.reviewerName,
          externalLink: item.externalLink,
          createdAt: nowIso,
          updatedAt: nowIso
        };

        const ref = adminDb.collection("iso_tasks").doc(taskId);
        batch.set(ref, newTask);
        taskMap.set(key, newTask);
        createdCount++;
      } else {
        // Cập nhật lại status theo thời gian thực nếu chưa hoàn thành
        const currentTask = taskMap.get(key)!;
        if (currentTask.status !== "COMPLETED") {
          const freshStatus = calculateTaskStatus(
            currentTask.dueDate,
            currentTask.completedDate,
            item.reminderDays,
            item.approvalRequired,
            currentTask.approvedAt
          );

          if (freshStatus !== currentTask.status) {
            currentTask.status = freshStatus;
            currentTask.updatedAt = nowIso;
            const ref = adminDb.collection("iso_tasks").doc(currentTask.taskId);
            batch.update(ref, { status: freshStatus, updatedAt: nowIso });
          }
        }
      }
    }

    if (createdCount > 0) {
      await batch.commit();
    }

    const result = Array.from(taskMap.values());
    memoryTasksCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error("Firestore sync error (e.g. Quota Exceeded). Returning resilient fallback:", error);
    if (memoryTasksCache?.data && memoryTasksCache.data.length > 0) {
      return memoryTasksCache.data;
    }
    const fallbackTasks = generateFallbackTasks(currentMonth);
    memoryTasksCache = { data: fallbackTasks, timestamp: Date.now() };
    return fallbackTasks;
  }
}

/**
 * Tính toán số liệu thống kê Dashboard
 */
export function computeDashboardStats(tasks: TaskRecord[]): DashboardStats {
  let overdueCount = 0;
  let dueSoonCount = 0;
  let completedCount = 0;
  let pendingApprovalCount = 0;

  for (const t of tasks) {
    if (t.status === "OVERDUE") overdueCount++;
    else if (t.status === "DUE_SOON") dueSoonCount++;
    else if (t.status === "PENDING_APPROVAL") pendingApprovalCount++;
    else if (t.status === "COMPLETED") completedCount++;
  }

  const totalDueCount = overdueCount + dueSoonCount + completedCount + pendingApprovalCount;
  const completionRate = totalDueCount > 0 ? Math.round((completedCount / totalDueCount) * 100) : 100;

  return {
    overdueCount,
    dueSoonCount,
    completedCount,
    pendingApprovalCount,
    totalDueCount,
    completionRate
  };
}

/**
 * Thống kê tiến độ theo 8 nhân sự
 */
export function computeStaffPerformance(tasks: TaskRecord[], users: UserProfile[]): StaffPerformance[] {
  const result: StaffPerformance[] = [];

  for (const user of users) {
    const userTasks = tasks.filter(t => t.assigneeName.toLowerCase() === user.fullName.toLowerCase() || t.assigneeId === user.id);
    let completedCount = 0;
    let overdueCount = 0;
    let pendingCount = 0;

    for (const t of userTasks) {
      if (t.status === "COMPLETED") completedCount++;
      else if (t.status === "OVERDUE") overdueCount++;
      else if (t.status === "PENDING_APPROVAL") pendingCount++;
    }

    const assignedCount = userTasks.length;
    const rate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 100;

    result.push({
      userId: user.id,
      fullName: user.fullName,
      title: user.title,
      email: user.email,
      assignedCount,
      completedCount,
      overdueCount,
      pendingCount,
      rate
    });
  }

  return result.sort((a, b) => b.assignedCount - a.assignedCount);
}
