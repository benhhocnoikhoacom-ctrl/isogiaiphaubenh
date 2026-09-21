import { TaskRecord, TaskStatusCode, WorkItem, DashboardStats, StaffPerformance, UserProfile } from "@/types/iso";
import { adminDb } from "./firebase-admin";
import { FALLBACK_WORK_ITEMS, generateFallbackTasks } from "./fallback-data";

let memoryTasksCache: { data: TaskRecord[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 giây bộ nhớ đệm chống quá tải Firestore

export function clearTasksCache() {
  memoryTasksCache = null;
}

export {
  getVietnamToday,
  getCurrentMonthPeriod,
  parseDateToYMD,
  calculateTaskStatus,
  calculateDefaultDueDate,
} from "./date-utils";

import {
  getVietnamToday,
  getCurrentMonthPeriod,
  calculateTaskStatus,
  calculateDefaultDueDate,
} from "./date-utils";

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
