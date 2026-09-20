"use server";

import { adminDb } from "@/lib/firebase-admin";
import { uploadFileToDrive } from "@/lib/google-drive";
import { calculateTaskStatus, getVietnamToday } from "@/lib/task-engine";
import { TaskRecord, WorkItem } from "@/types/iso";
import { revalidatePath } from "next/cache";

/**
 * Nhân viên nộp báo cáo hoàn thành công việc
 */
export async function submitTaskCompletion(formData: FormData) {
  try {
    const taskId = formData.get("taskId") as string;
    const completedDate = (formData.get("completedDate") as string) || getVietnamToday();
    const note = (formData.get("note") as string) || "";
    let evidenceUrl = (formData.get("evidenceUrl") as string) || "";
    const evidenceFile = formData.get("evidenceFile") as File | null;
    const userEmail = (formData.get("userEmail") as string) || "system";
    const userName = (formData.get("userName") as string) || "Nhân viên";

    if (!taskId) {
      return { success: false, error: "Thiếu mã công việc (taskId)" };
    }

    const taskRef = adminDb.collection("iso_tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) {
      return { success: false, error: "Không tìm thấy công việc này trong hệ thống." };
    }

    const taskData = taskSnap.data() as TaskRecord;

    // Lấy cấu hình của đầu việc để biết có cần duyệt không
    const itemRef = adminDb.collection("iso_work_items").doc(taskData.itemId);
    const itemSnap = await itemRef.get();
    const itemData = itemSnap.exists ? (itemSnap.data() as WorkItem) : null;
    const approvalRequired = itemData?.approvalRequired ?? false;
    const reminderDays = itemData?.reminderDays ?? 3;

    let evidenceFileName = "";

    // Nếu người dùng tải file lên
    if (evidenceFile && evidenceFile.size > 0) {
      try {
        const arrayBuffer = await evidenceFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${taskData.itemCode}_${taskData.period}_${evidenceFile.name}`;
        const uploadResult = await uploadFileToDrive(buffer, fileName, evidenceFile.type);
        evidenceUrl = uploadResult.webViewLink;
        evidenceFileName = evidenceFile.name;
      } catch (uploadErr: any) {
        console.warn("Upload file to drive warning:", uploadErr?.message);
        // Nếu Drive API chưa bật, vẫn cho lưu với ghi chú thông báo
        if (!evidenceUrl) {
          evidenceFileName = `${evidenceFile.name} (Chưa đồng bộ Drive)`;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const newStatus = calculateTaskStatus(
      taskData.dueDate,
      completedDate,
      reminderDays,
      approvalRequired,
      taskData.approvedAt
    );

    const updatePayload: Partial<TaskRecord> = {
      completedDate,
      note,
      status: newStatus,
      updatedAt: nowIso
    };

    if (evidenceUrl) {
      updatePayload.evidenceUrl = evidenceUrl;
    }
    if (evidenceFileName) {
      updatePayload.evidenceFileName = evidenceFileName;
    }

    await taskRef.update(updatePayload);

    // Ghi nhật ký Audit Log
    await adminDb.collection("iso_audit_logs").add({
      userId: userEmail,
      userName: userName,
      userEmail: userEmail,
      action: "COMPLETE",
      targetId: taskId,
      targetName: `${taskData.itemCode} - ${taskData.itemName}`,
      details: `Nộp hoàn thành ngày ${completedDate}. Trạng thái: ${newStatus}`,
      timestamp: nowIso
    });

    revalidatePath("/");
    revalidatePath("/my-tasks");
    return { success: true, status: newStatus };
  } catch (error: any) {
    console.error("Lỗi submitTaskCompletion:", error);
    return { success: false, error: error.message || "Có lỗi xảy ra khi nộp báo cáo." };
  }
}

/**
 * Trưởng khoa hoặc người giám sát phê duyệt công việc
 */
export async function approveTask(taskId: string, approverEmail: string, approverName: string) {
  try {
    const taskRef = adminDb.collection("iso_tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) {
      return { success: false, error: "Không tìm thấy công việc này." };
    }

    const taskData = taskSnap.data() as TaskRecord;
    const nowIso = new Date().toISOString();

    await taskRef.update({
      status: "COMPLETED",
      approvedBy: approverEmail,
      approvedByName: approverName,
      approvedAt: nowIso,
      rejectionReason: null,
      updatedAt: nowIso
    });

    await adminDb.collection("iso_audit_logs").add({
      userId: approverEmail,
      userName: approverName,
      userEmail: approverEmail,
      action: "APPROVE",
      targetId: taskId,
      targetName: `${taskData.itemCode} - ${taskData.itemName}`,
      details: "Đã phê duyệt hoàn thành",
      timestamp: nowIso
    });

    revalidatePath("/");
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi approveTask:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Trưởng khoa yêu cầu bổ sung / làm lại
 */
export async function rejectTask(taskId: string, reason: string, approverEmail: string, approverName: string) {
  try {
    const taskRef = adminDb.collection("iso_tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) {
      return { success: false, error: "Không tìm thấy công việc này." };
    }

    const taskData = taskSnap.data() as TaskRecord;
    const nowIso = new Date().toISOString();

    // Reset lại completedDate và tính lại status (thường sẽ về DUE_SOON hoặc OVERDUE)
    const itemRef = adminDb.collection("iso_work_items").doc(taskData.itemId);
    const itemSnap = await itemRef.get();
    const itemData = itemSnap.exists ? (itemSnap.data() as WorkItem) : null;
    const reminderDays = itemData?.reminderDays ?? 3;

    const revertedStatus = calculateTaskStatus(taskData.dueDate, undefined, reminderDays, false, undefined);

    await taskRef.update({
      completedDate: null,
      status: revertedStatus,
      rejectionReason: reason,
      updatedAt: nowIso
    });

    await adminDb.collection("iso_audit_logs").add({
      userId: approverEmail,
      userName: approverName,
      userEmail: approverEmail,
      action: "REJECT",
      targetId: taskId,
      targetName: `${taskData.itemCode} - ${taskData.itemName}`,
      details: `Yêu cầu làm lại. Lý do: ${reason}`,
      timestamp: nowIso
    });

    revalidatePath("/");
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi rejectTask:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Trưởng khoa thay đổi phân công người phụ trách / người duyệt / hạn chót
 */
export async function updateWorkItemAssignment(
  itemId: string,
  assigneeName: string,
  assigneeEmail: string,
  reviewerName: string,
  reviewerEmail: string,
  reminderDays: number,
  dueRule: string,
  adminEmail: string,
  adminName: string
) {
  try {
    const itemRef = adminDb.collection("iso_work_items").doc(itemId);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) {
      return { success: false, error: "Không tìm thấy đầu việc." };
    }

    const nowIso = new Date().toISOString();
    await itemRef.update({
      assigneeName,
      assigneeEmail,
      reviewerName,
      reviewerEmail,
      reminderDays: Number(reminderDays),
      dueRule,
      updatedAt: nowIso
    });

    // Cập nhật cả các task chưa hoàn thành của đầu việc này
    const tasksQuery = await adminDb.collection("iso_tasks")
      .where("itemId", "==", itemId)
      .where("status", "in", ["NOT_DUE", "DUE_SOON", "OVERDUE", "PENDING_APPROVAL"])
      .get();

    const batch = adminDb.batch();
    tasksQuery.docs.forEach(doc => {
      batch.update(doc.ref, {
        assigneeName,
        reviewerName,
        updatedAt: nowIso
      });
    });
    await batch.commit();

    await adminDb.collection("iso_audit_logs").add({
      userId: adminEmail,
      userName: adminName,
      userEmail: adminEmail,
      action: "REASSIGN",
      targetId: itemId,
      targetName: itemId,
      details: `Đổi phụ trách: ${assigneeName}, Người duyệt: ${reviewerName}`,
      timestamp: nowIso
    });

    revalidatePath("/");
    revalidatePath("/assignment");
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi updateWorkItemAssignment:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Tạo đầu việc phát sinh (Sự không phù hợp, CAPA, Khiếu nại, Ngoại kiểm đợt...)
 */
export async function createEventTask(
  itemId: string,
  eventDescription: string,
  dueDate: string,
  creatorEmail: string,
  creatorName: string
) {
  try {
    const itemRef = adminDb.collection("iso_work_items").doc(itemId);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) {
      return { success: false, error: "Không tìm thấy đầu việc mẫu." };
    }

    const item = itemSnap.data() as WorkItem;
    const nowIso = new Date().toISOString();
    const period = getVietnamToday();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const taskId = `EVT_${itemId}_${period.replace(/-/g, "")}_${randomSuffix}`;

    const status = calculateTaskStatus(dueDate, undefined, item.reminderDays, item.approvalRequired, undefined);

    const newTask: TaskRecord = {
      taskId,
      itemId: item.itemId,
      itemCode: item.itemCode,
      itemName: `${item.itemName} - ${eventDescription}`,
      period,
      dueDate,
      status,
      assigneeId: item.assigneeId,
      assigneeName: item.assigneeName,
      reviewerId: item.reviewerId,
      reviewerName: item.reviewerName,
      note: eventDescription,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await adminDb.collection("iso_tasks").doc(taskId).set(newTask);

    await adminDb.collection("iso_audit_logs").add({
      userId: creatorEmail,
      userName: creatorName,
      userEmail: creatorEmail,
      action: "CREATE_EVENT",
      targetId: taskId,
      targetName: newTask.itemName,
      details: `Tạo công việc phát sinh với hạn ${dueDate}`,
      timestamp: nowIso
    });

    revalidatePath("/");
    revalidatePath("/my-tasks");
    return { success: true, taskId };
  } catch (error: any) {
    console.error("Lỗi createEventTask:", error);
    return { success: false, error: error.message };
  }
}
