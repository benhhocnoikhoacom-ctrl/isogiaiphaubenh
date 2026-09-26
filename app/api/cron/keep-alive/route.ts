import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { syncTasksForCurrentPeriod, clearTasksCache } from "@/lib/task-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Kiểm tra bảo mật nếu có thiết lập CRON_SECRET trên Vercel
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");
      const userAgent = request.headers.get("user-agent") || "";
      const isGitHub = userAgent.includes("GitHub-Actions");

      if (token !== cronSecret && !isGitHub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const timestamp = new Date().toISOString();

    // 1. Đánh thức CSDL Supabase
    const { error: dbError } = await supabaseAdmin
      .from("iso_users")
      .select("id")
      .limit(1);

    if (dbError) {
      console.warn("Supabase ping warning:", dbError.message);
    }

    // 2. Chạy quét quá hạn toàn diện & đồng bộ dữ liệu (Overdue Sweep)
    clearTasksCache();
    const tasks = await syncTasksForCurrentPeriod();

    const overdueCount = tasks.filter((t) => t.status === "OVERDUE").length;
    const dueSoonCount = tasks.filter((t) => t.status === "DUE_SOON").length;

    return NextResponse.json({
      success: true,
      timestamp,
      message: "Keep-alive ping and 17:05 overdue sweep completed successfully",
      stats: {
        totalTasks: tasks.length,
        overdueCount,
        dueSoonCount,
      },
      supabaseActive: !dbError,
    });
  } catch (error: any) {
    console.error("Keep-alive cron error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
