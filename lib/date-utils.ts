import { TaskStatusCode, WorkItem } from "@/types/iso";

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
 * Chuyển đổi định dạng ngày bất kỳ (DD/MM/YYYY hoặc YYYY-MM-DD) về chuẩn YYYY-MM-DD
 */
export function parseDateToYMD(dateStr: string): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/.test(trimmed)) {
    const parts = trimmed.split(/[\/-]/);
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2].slice(0, 4);
    return `${year}-${month}-${day}`;
  }
  return trimmed.slice(0, 10);
}

/**
 * Tính toán trạng thái 4 cờ chuẩn ISO dựa chính xác theo sheet STATUS_DICTIONARY:
 * - OVERDUE: Today > Due_Date AND chưa hoàn thành
 * - DUE_SOON: Today >= Due_Date - Reminder_Days AND chưa hoàn thành
 * - NOT_DUE: Today < Due_Date - Reminder_Days
 * - COMPLETED: Completed_Date có giá trị (hoặc PENDING_APPROVAL nếu cần duyệt)
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
  const due = parseDateToYMD(dueDate);

  if (!due) return "NOT_DUE";

  // 1. Quá hạn: Today > Due_Date
  if (today > due) {
    return "OVERDUE";
  }

  // 2. Sắp đến hạn: Today >= Due_Date - Reminder_Days
  const [y, m, d] = due.split("-").map(Number);
  const dueTime = new Date(y, m - 1, d).getTime();
  const reminderTime = dueTime - reminderDays * 24 * 60 * 60 * 1000;
  const remDate = new Date(reminderTime);
  const remY = remDate.getFullYear();
  const remM = String(remDate.getMonth() + 1).padStart(2, "0");
  const remD = String(remDate.getDate()).padStart(2, "0");
  const reminderDateStr = `${remY}-${remM}-${remD}`;

  if (today >= reminderDateStr) {
    return "DUE_SOON";
  }

  // 3. Chưa đến hạn: Today < Due_Date - Reminder_Days
  return "NOT_DUE";
}

/**
 * Tính ngày đến hạn mặc định theo quy tắc trong WORK_ITEMS của Excel
 */
export function calculateDefaultDueDate(item: WorkItem, currentMonthPeriod: string): { period: string; dueDate: string } {
  const [yearStr, monthStr] = currentMonthPeriod.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  if (item.frequency === "Daily") {
    const today = getVietnamToday();
    return {
      period: today,
      dueDate: today,
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
      dueDate: dueStr,
    };
  }

  if (item.frequency === "Periodic") {
    // Nếu là theo quý: chốt vào đầu tháng sau khi kết thúc quý (Q3 kết thúc tháng 9 -> chốt 05/10)
    if (item.dueRule.includes("quý")) {
      const currentQuarter = Math.ceil(month / 3);
      const nextQuarterFirstMonth = currentQuarter * 3 + 1;
      const targetYear = nextQuarterFirstMonth > 12 ? year + 1 : year;
      const targetMonth = nextQuarterFirstMonth > 12 ? 1 : nextQuarterFirstMonth;
      const targetDay = item.dueRule.includes("10") ? 10 : 5;

      return {
        period: `${year}-Q${currentQuarter}`,
        dueDate: `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`,
      };
    }

    // Nếu là hàng tháng: hạn rà soát của kỳ là ngày 03, 05 hoặc 10 của kỳ hiện tại
    const targetDay = item.dueRule.includes("03") ? 3 : (item.dueRule.includes("10") ? 10 : 5);
    return {
      period: currentMonthPeriod,
      dueDate: `${year}-${String(month).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`,
    };
  }

  // Mixed hoặc Event
  const targetDay = item.dueRule.includes("03") ? 3 : (item.dueRule.includes("10") ? 10 : 5);
  return {
    period: currentMonthPeriod,
    dueDate: `${year}-${String(month).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`,
  };
}
