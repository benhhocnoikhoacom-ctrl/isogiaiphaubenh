import { AssignmentBoard } from "@/components/assignment/AssignmentBoard";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapSupabaseWorkItem } from "@/lib/task-engine";
import { UserProfile, WorkItem } from "@/types/iso";
import { FALLBACK_WORK_ITEMS, FALLBACK_USERS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function AssignmentPage() {
  let workItems: WorkItem[] = [];
  try {
    const { data, error } = await supabaseAdmin.from("iso_work_items").select("*");
    if (error || !data) throw error || new Error("Failed to fetch work items");
    workItems = data.map(mapSupabaseWorkItem);
  } catch (error) {
    console.error("Error loading work items in AssignmentPage, using fallback:", error);
    workItems = FALLBACK_WORK_ITEMS;
  }

  let users: UserProfile[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("iso_users")
      .select("*")
      .eq("active", true);

    if (error || !data) throw error || new Error("Failed to fetch users");
    users = data.map((d: any) => ({
      id: d.id,
      email: d.email,
      fullName: d.full_name,
      role: d.role,
      title: d.title,
      phone: d.phone || "",
      active: d.active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
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
