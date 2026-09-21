import { AssignmentBoard } from "@/components/assignment/AssignmentBoard";
import { adminDb } from "@/lib/firebase-admin";
import { UserProfile, WorkItem } from "@/types/iso";

import { FALLBACK_WORK_ITEMS, FALLBACK_USERS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function AssignmentPage() {
  let workItems: WorkItem[] = [];
  try {
    const workItemsSnap = await adminDb.collection("iso_work_items").get();
    workItems = workItemsSnap.docs.map(d => d.data() as WorkItem);
  } catch (error) {
    console.error("Error loading work items in AssignmentPage, using fallback:", error);
    workItems = FALLBACK_WORK_ITEMS;
  }

  let users: UserProfile[] = [];
  try {
    const usersSnap = await adminDb.collection("iso_users").where("active", "==", true).get();
    users = usersSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as UserProfile));
  } catch (error) {
    console.error("Error loading users in AssignmentPage, using fallback:", error);
    users = FALLBACK_USERS;
  }

  return (
    <AssignmentBoard
      initialWorkItems={workItems}
      users={users}
    />
  );
}
