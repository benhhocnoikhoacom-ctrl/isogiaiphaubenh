"use server";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { uploadFileToDrive } from "@/lib/google-drive";
import { calculateTaskStatus, getVietnamToday, clearTasksCache } from "@/lib/task-engine";
import { revalidatePath } from "next/cache";

/**
 * Nhân viên nộp báo cáo hoàn thành công việc
 */
export async function submitTaskCompletion(formData: FormData) {
  try {
    const taskId = formData.get("taskId") as string;
    const completedDate = (formData.get("completedDate") as string) || getVietnamToday();
    const note = ((formData.get("note") as string) || "").trim();
    let evidenceUrl = ((formData.get("evidenceUrl") as string) || "").trim();
    const evidenceFile = formData.get("evidenceFile") as File | null;
    const userEmail = (formData.get("userEmail") as string) || "system";
    const userName = (formData.get("userName") as string) || "Nhân viên";

    if (!taskId) {
      return { success: false, error: "Thiếu mã công việc (taskId)" };
    }

    const { data: taskData, error: taskFetchError } = await supabaseAdmin
      .from("iso_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (taskFetchError || !taskData) {
      return { success: false, error: "Không tìm thấy công việc này trong hệ thống." };
    }

    // Kiểm tra phân quyền máy chủ: Chỉ người được giao hoặc Trưởng khoa/Admin mới được nộp
    const session = await auth();
    const sessionEmail = session?.user?.email?.toLowerCase();
    const sessionRole = session?.user?.role;
    const sessionName = session?.user?.name;

    const isAssignee = sessionEmail && taskData.assignee_id && taskData.assignee_id.toLowerCase() === sessionEmail;
    const isAdmin = sessionRole === "ADMIN" || sessionEmail === "bsluongdinhtrung@gmail.com" || sessionEmail === "nguyethmu@gmail.com";

    const cleanAssignee = (taskData.assignee_name || "").toLowerCase().replace(/^(bs\.|ktv\.|bác sĩ|trưởng khoa)\s*/i, "").trim();
    const cleanUser = (sessionName || userName || "").toLowerCase().replace(/^(bs\.|ktv\.|bác sĩ|trưởng khoa)\s*/i, "").trim();
    const isNameMatch = cleanAssignee.length > 0 && (cleanAssignee.includes(cleanUser) || cleanUser.includes(cleanAssignee));

    if (!isAssignee && !isAdmin && !isNameMatch) {
      return { 
        success: false, 
        error: `Bạn không được phân công thực hiện đầu việc này. Đầu việc được giao cho: ${taskData.assignee_name}.` 
      };
    }

    // Bắt buộc có ít nhất 1 minh chứng thực chất
    const hasFile = evidenceFile && evidenceFile.size > 0;
    const hasLink = Boolean(evidenceUrl);
    const hasNote = note.length >= 6;

    if (!hasFile && !hasLink && !hasNote) {
      return {
        success: false,
        error: "Vui lòng đính kèm ít nhất 1 ảnh chụp sổ ghi/tài liệu, hoặc dán link Drive, hoặc ghi chú diễn giải (tối thiểu 6 ký tự)."
      };
    }

    // Lấy cấu hình của đầu việc để biết có cần duyệt không
    const { data: itemData } = await supabaseAdmin
      .from("iso_work_items")
      .select("approval_required, reminder_days")
      .eq("item_id", taskData.item_id)
      .single();

    const approvalRequired = itemData?.approval_required ?? false;
    const reminderDays = itemData?.reminder_days ?? 3;

    let evidenceFileName = "";

    // Nếu người dùng tải file lên
    if (evidenceFile && evidenceFile.size > 0) {
      const arrayBuffer = await evidenceFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      evidenceFileName = evidenceFile.name;

      try {
        const fileName = `${taskData.item_code}_${taskData.period}_${evidenceFile.name}`;
        const uploadResult = await uploadFileToDrive(buffer, fileName, evidenceFile.type);
        evidenceUrl = uploadResult.webViewLink;
      } catch (uploadErr: any) {
        console.warn("Upload file to drive warning, using direct inline fallback:", uploadErr?.message);
        // Lưu trữ fallback trực tiếp (base64 Data URL) để Trưởng khoa xem được ngay
        if (evidenceFile.type.startsWith("image/")) {
          evidenceUrl = `data:${evidenceFile.type};base64,${buffer.toString("base64")}`;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const newStatus = calculateTaskStatus(
      taskData.due_date,
      completedDate,
      reminderDays,
      approvalRequired,
      taskData.approved_at
    );

    const updatePayload: any = {
      completed_date: completedDate,
      note,
      status: newStatus,
      updated_at: nowIso,
    };

    if (evidenceUrl) {
      updatePayload.evidence_url = evidenceUrl;
    }
    if (evidenceFileName) {
      updatePayload.evidence_file_name = evidenceFileName;
    }

    const { error: updateError } = await supabaseAdmin
      .from("iso_tasks")
      .update(updatePayload)
      .eq("task_id", taskId);

    if (updateError) {
      throw updateError;
    }

    // Ghi nhật ký Audit Log
    await supabaseAdmin.from("iso_audit_logs").insert({
      user_id: userEmail,
      action: "SUBMIT",
      entity_id: taskId,
      details: `Nộp hoàn thành ngày ${completedDate}. Trạng thái: ${newStatus}`,
      created_at: nowIso,
    });

    clearTasksCache();
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
    const { data: taskData, error: fetchErr } = await supabaseAdmin
      .from("iso_tasks")
      .select("item_code, item_name")
      .eq("task_id", taskId)
      .single();

    if (fetchErr || !taskData) {
      return { success: false, error: "Không tìm thấy công việc này." };
    }

    const nowIso = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from("iso_tasks")
      .update({
        status: "COMPLETED",
        approved_by: approverEmail,
        approved_at: nowIso,
        rejection_reason: null,
        updated_at: nowIso,
      })
      .eq("task_id", taskId);

    if (updateErr) throw updateErr;

    await supabaseAdmin.from("iso_audit_logs").insert({
      user_id: approverEmail,
      action: "APPROVE",
      entity_id: taskId,
      details: `Đã phê duyệt hoàn thành cho ${taskData.item_code} - ${taskData.item_name}`,
      created_at: nowIso,
    });

    clearTasksCache();
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
    const { data: taskData, error: fetchErr } = await supabaseAdmin
      .from("iso_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (fetchErr || !taskData) {
      return { success: false, error: "Không tìm thấy công việc này." };
    }

    const nowIso = new Date().toISOString();

    const { data: itemData } = await supabaseAdmin
      .from("iso_work_items")
      .select("reminder_days")
      .eq("item_id", taskData.item_id)
      .single();

    const reminderDays = itemData?.reminder_days ?? 3;
    const revertedStatus = calculateTaskStatus(taskData.due_date, undefined, reminderDays, false, undefined);

    const { error: updateErr } = await supabaseAdmin
      .from("iso_tasks")
      .update({
        completed_date: null,
        status: revertedStatus,
        rejection_reason: reason,
        updated_at: nowIso,
      })
      .eq("task_id", taskId);

    if (updateErr) throw updateErr;

    await supabaseAdmin.from("iso_audit_logs").insert({
      user_id: approverEmail,
      action: "REJECT",
      entity_id: taskId,
      details: `Yêu cầu làm lại. Lý do: ${reason}`,
      created_at: nowIso,
    });

    clearTasksCache();
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
    const nowIso = new Date().toISOString();

    const { error: updateWiErr } = await supabaseAdmin
      .from("iso_work_items")
      .update({
        assignee_id: assigneeEmail,
        assignee_name: assigneeName,
        reviewer_id: reviewerEmail,
        reviewer_name: reviewerName,
        reminder_days: Number(reminderDays),
        due_rule: dueRule,
        updated_at: nowIso,
      })
      .eq("item_id", itemId);

    if (updateWiErr) throw updateWiErr;

    // Cập nhật các task chưa hoàn thành của đầu việc này
    await supabaseAdmin
      .from("iso_tasks")
      .update({
        assignee_id: assigneeEmail,
        assignee_name: assigneeName,
        reviewer_id: reviewerEmail,
        reviewer_name: reviewerName,
        updated_at: nowIso,
      })
      .eq("item_id", itemId)
      .in("status", ["NOT_DUE", "DUE_SOON", "OVERDUE", "PENDING_APPROVAL"]);

    await supabaseAdmin.from("iso_audit_logs").insert({
      user_id: adminEmail,
      action: "REASSIGN",
      entity_id: itemId,
      details: `Đổi phụ trách: ${assigneeName}, Người duyệt: ${reviewerName}`,
      created_at: nowIso,
    });

    clearTasksCache();
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
    const { data: item, error: fetchErr } = await supabaseAdmin
      .from("iso_work_items")
      .select("*")
      .eq("item_id", itemId)
      .single();

    if (fetchErr || !item) {
      return { success: false, error: "Không tìm thấy đầu việc mẫu." };
    }

    const nowIso = new Date().toISOString();
    const period = getVietnamToday();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const taskId = `EVT_${itemId}_${period.replace(/-/g, "")}_${randomSuffix}`;

    const status = calculateTaskStatus(dueDate, undefined, item.reminder_days, item.approval_required, undefined);

    const { error: insertErr } = await supabaseAdmin.from("iso_tasks").insert({
      task_id: taskId,
      item_id: item.item_id,
      item_code: item.item_code,
      item_name: `${item.item_name} - ${eventDescription}`,
      period,
      due_date: dueDate,
      status,
      assignee_id: item.assignee_id,
      assignee_name: item.assignee_name,
      reviewer_id: item.reviewer_id,
      reviewer_name: item.reviewer_name,
      note: eventDescription,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (insertErr) throw insertErr;

    await supabaseAdmin.from("iso_audit_logs").insert({
      user_id: creatorEmail,
      action: "CREATE_EVENT",
      entity_id: taskId,
      details: `Tạo công việc phát sinh: ${item.item_name} - ${eventDescription} với hạn ${dueDate}`,
      created_at: nowIso,
    });

    clearTasksCache();
    revalidatePath("/");
    revalidatePath("/my-tasks");
    return { success: true, taskId };
  } catch (error: any) {
    console.error("Lỗi createEventTask:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Trưởng khoa / Admin cập nhật hoặc xóa link ngoài gắn cho đầu việc
 */
export async function updateWorkItemExternalLink(itemId: string, newLink: string | null) {
  try {
    const linkValue = newLink && newLink.trim() !== "" ? newLink.trim() : null;
    const nowIso = new Date().toISOString();

    const { error: wiErr } = await supabaseAdmin
      .from("iso_work_items")
      .update({ external_link: linkValue, updated_at: nowIso })
      .eq("item_id", itemId);

    if (wiErr) throw wiErr;

    clearTasksCache();
    revalidatePath("/");
    revalidatePath("/assignment");
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi updateWorkItemExternalLink:", error);
    return { success: false, error: error.message };
  }
}

