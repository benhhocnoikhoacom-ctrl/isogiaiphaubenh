import { MyTasksView } from "@/components/tasks/MyTasksView";
import { adminDb } from "@/lib/firebase-admin";
import { syncTasksForCurrentPeriod } from "@/lib/task-engine";
import { WorkItem } from "@/types/iso";

export const dynamic = "force-dynamic";

export default async function MyTasksPage() {
  const tasks = await syncTasksForCurrentPeriod();

  const workItemsSnap = await adminDb.collection("iso_work_items").where("active", "==", true).get();
  const workItems: WorkItem[] = workItemsSnap.docs.map(d => d.data() as WorkItem);

  return (
    <MyTasksView
      allTasks={tasks}
      allWorkItems={workItems}
    />
  );
}
