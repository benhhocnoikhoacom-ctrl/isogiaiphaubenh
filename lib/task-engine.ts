import { TaskRecord, TaskStatusCode, WorkItem, DashboardStats, StaffPerformance, UserProfile } from "@/types/iso";
import { supabaseAdmin } from "./supabase-admin";
import { FALLBACK_WORK_ITEMS, generateFallbackTasks } from "./fallback-data";

let memoryTasksCache: { data: TaskRecord[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 10 * 1000; // 10 giây bộ nhớ đệm

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
 * Ánh xạ dòng từ bảng iso_work_items của Supabase sang đối tượng WorkItem
 */
export function mapSupabaseWorkItem(row: any): WorkItem {
  return {
    itemId: row.item_id,
    itemCode: row.item_code,
    itemName: row.item_name,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    frequency: row.frequency,
    dueRule: row.due_rule,
    reminderDays: row.reminder_days ?? 3,
    evidenceRequired: row.evidence_required ?? false,
    approvalRequired: row.approval_required ?? false,
    priority: row.priority || "Trung bình",
    operationNote: row.operation_note || "",
    externalLink: row.external_link || undefined,
    active: row.active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Ánh xạ dòng từ bảng iso_tasks của Supabase sang đối tượng TaskRecord
 */
export function mapSupabaseTask(row: any): TaskRecord {
  return {
    taskId: row.task_id,
    itemId: row.item_id,
    itemCode: row.item_code,
    itemName: row.item_name,
    period: row.period,
    dueDate: row.due_date,
    completedDate: row.completed_date || undefined,
    status: row.status as TaskStatusCode,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    evidenceUrl: row.evidence_url || undefined,
    evidenceFileName: row.evidence_file_name || undefined,
    note: row.note || undefined,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
    rejectionReason: row.rejection_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Tự động đồng bộ và sinh các task định kỳ cho kỳ hiện tại nếu chưa tồn tại
 */
export async function syncTasksForCurrentPeriod(): Promise<TaskRecord[]> {
  const currentMonth = getCurrentMonthPeriod();

  // Kiểm tra bộ nhớ đệm
  if (memoryTasksCache && Date.now() - memoryTasksCache.timestamp < CACHE_TTL_MS) {
    return memoryTasksCache.data;
  }

  const dayOfWeek = new Date().getDay(); // 0 = Chủ nhật, 6 = Thứ 7

  try {
    // 1. Lấy tất cả danh mục work_items đang hoạt động từ Supabase
    const { data: workItemRows, error: wiError } = await supabaseAdmin
      .from("iso_work_items")
      .select("*")
      .eq("active", true);

    if (wiError || !workItemRows || workItemRows.length === 0) {
      throw wiError || new Error("No active work items found in Supabase");
    }

    const workItems = workItemRows.map(mapSupabaseWorkItem);

    // 2. Lấy tất cả task hiện có từ Supabase
    const { data: taskRows, error: taskError } = await supabaseAdmin
      .from("iso_tasks")
      .select("*");

    if (taskError) {
      throw taskError;
    }

    const existingTasks = (taskRows || []).map(mapSupabaseTask);
    const taskMap = new Map<string, TaskRecord>();
    existingTasks.forEach((t) => {
      taskMap.set(`${t.itemId}_${t.period}`, t);
    });

    const tasksToInsert: any[] = [];
    const tasksToUpdate: { task_id: string; status: string; updated_at: string }[] = [];
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
          updatedAt: nowIso,
        };

        tasksToInsert.push({
          task_id: taskId,
          item_id: item.itemId,
          item_code: item.itemCode,
          item_name: item.itemName,
          period,
          due_date: dueDate,
          status,
          assignee_id: item.assigneeId,
          assignee_name: item.assigneeName,
          reviewer_id: item.reviewerId,
          reviewer_name: item.reviewerName,
          created_at: nowIso,
          updated_at: nowIso,
        });

        taskMap.set(key, newTask);
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
            tasksToUpdate.push({
              task_id: currentTask.taskId,
              status: freshStatus,
              updated_at: nowIso,
            });
          }
        }
      }
    }

    // Ghi các task mới vào Supabase
    if (tasksToInsert.length > 0) {
      await supabaseAdmin.from("iso_tasks").upsert(tasksToInsert);
    }

    // Cập nhật các task có status thay đổi
    for (const u of tasksToUpdate) {
      await supabaseAdmin
        .from("iso_tasks")
        .update({ status: u.status, updated_at: u.updated_at })
        .eq("task_id", u.task_id);
    }

    const result = Array.from(taskMap.values());
    memoryTasksCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error("Supabase sync error. Returning resilient fallback:", error);
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
    completionRate,
  };
}

/**
 * Thống kê tiến độ theo nhân sự
 */
export function computeStaffPerformance(tasks: TaskRecord[], users: UserProfile[]): StaffPerformance[] {
  const result: StaffPerformance[] = [];

  for (const user of users) {
    const userTasks = tasks.filter(
      (t) =>
        t.assigneeName.toLowerCase() === user.fullName.toLowerCase() ||
        t.assigneeId.toLowerCase() === user.id.toLowerCase() ||
        (user.email && t.assigneeId.toLowerCase() === user.email.toLowerCase())
    );
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
      rate,
    });
  }

  return result.sort((a, b) => b.assignedCount - a.assignedCount);
}
