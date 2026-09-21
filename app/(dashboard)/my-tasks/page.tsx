import { MyTasksView } from "@/components/tasks/MyTasksView";
import { adminDb } from "@/lib/firebase-admin";
import { syncTasksForCurrentPeriod } from "@/lib/task-engine";
import { WorkItem } from "@/types/iso";

import { FALLBACK_WORK_ITEMS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function MyTasksPage() {
  const tasks = await syncTasksForCurrentPeriod();

  let workItems: WorkItem[] = [];
  try {
    const workItemsSnap = await adminDb.collection("iso_work_items").where("active", "==", true).get();
    workItems = workItemsSnap.docs.map(d => d.data() as WorkItem);
  } catch (error) {
    console.error("Error loading workItems from Firestore, using fallback:", error);
    workItems = FALLBACK_WORK_ITEMS;
  }

  return (
    <MyTasksView
      allTasks={tasks}
      allWorkItems={workItems}
    />
  );
}
