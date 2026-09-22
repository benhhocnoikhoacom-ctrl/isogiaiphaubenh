import { MyTasksView } from "@/components/tasks/MyTasksView";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { syncTasksForCurrentPeriod, mapSupabaseWorkItem } from "@/lib/task-engine";
import { WorkItem } from "@/types/iso";
import { FALLBACK_WORK_ITEMS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function MyTasksPage() {
  const tasks = await syncTasksForCurrentPeriod();

  let workItems: WorkItem[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("iso_work_items")
      .select("*")
      .eq("active", true);

    if (error || !data) {
      throw error || new Error("Cannot fetch work items");
    }

    workItems = data.map(mapSupabaseWorkItem);
  } catch (error) {
    console.error("Error loading workItems from Supabase, using fallback:", error);
    workItems = FALLBACK_WORK_ITEMS;
  }

  return (
    <MyTasksView
      allTasks={tasks}
      allWorkItems={workItems}
    />
  );
}
