const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

function getDb() {
  const env = fs.readFileSync('.env', 'utf-8');
  const line = env.split('\n').find(l => l.startsWith('GOOGLE_CREDENTIALS_BASE64='));
  const b64 = line.split('=')[1].trim();
  const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  const app = !getApps().length ? initializeApp({ credential: cert(creds) }) : getApps()[0];
  return getFirestore(app);
}

function getVietnamToday() {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, "0");
  const d = String(vnTime.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCurrentMonthPeriod() {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function calculateTaskStatus(dueDate, completedDate, reminderDays = 3) {
  if (completedDate) return "COMPLETED";
  const today = getVietnamToday();
  const due = dueDate.slice(0, 10);
  if (today > due) return "OVERDUE";
  const dueTime = new Date(due).getTime();
  const reminderTime = dueTime - reminderDays * 24 * 60 * 60 * 1000;
  const reminderDateStr = new Date(reminderTime).toISOString().slice(0, 10);
  if (today >= reminderDateStr) return "DUE_SOON";
  return "NOT_DUE";
}

function calculateDefaultDueDate(item, currentMonthPeriod) {
  const [yearStr, monthStr] = currentMonthPeriod.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (item.frequency === "Daily") {
    const today = getVietnamToday();
    return { period: today, dueDate: today };
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
    return {
      period: `${year}`,
      dueDate: `${year}-${String(dueMonth).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`
    };
  }

  if (item.frequency === "Periodic") {
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

async function sync() {
  const db = getDb();
  const currentMonth = getCurrentMonthPeriod();
  const itemsSnap = await db.collection("iso_work_items").where("active", "==", true).get();
  const batch = db.batch();
  const nowIso = new Date().toISOString();

  let count = 0;
  itemsSnap.docs.forEach(doc => {
    const item = doc.data();
    const { period, dueDate } = calculateDefaultDueDate(item, currentMonth);
    const taskId = `TSK_${item.itemId}_${period.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const status = calculateTaskStatus(dueDate, undefined, item.reminderDays);

    const taskRef = db.collection("iso_tasks").doc(taskId);
    batch.set(taskRef, {
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
      externalLink: item.externalLink || null,
      createdAt: nowIso,
      updatedAt: nowIso
    }, { merge: true });
    count++;
  });

  await batch.commit();
  console.log(`Synced ${count} tasks into Firestore for period ${currentMonth}!`);
}

sync().catch(console.error);
