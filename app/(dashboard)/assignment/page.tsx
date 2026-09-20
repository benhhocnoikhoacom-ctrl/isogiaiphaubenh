import { AssignmentBoard } from "@/components/assignment/AssignmentBoard";
import { adminDb } from "@/lib/firebase-admin";
import { UserProfile, WorkItem } from "@/types/iso";

export const dynamic = "force-dynamic";

export default async function AssignmentPage() {
  const workItemsSnap = await adminDb.collection("iso_work_items").get();
  const workItems: WorkItem[] = workItemsSnap.docs.map(d => d.data() as WorkItem);

  const usersSnap = await adminDb.collection("iso_users").where("active", "==", true).get();
  const users: UserProfile[] = usersSnap.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as UserProfile));

  return (
    <AssignmentBoard
      initialWorkItems={workItems}
      users={users}
    />
  );
}
