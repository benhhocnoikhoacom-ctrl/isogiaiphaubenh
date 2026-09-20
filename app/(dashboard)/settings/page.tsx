import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  // Protect this route from non-admins
  if (session?.user?.role?.toUpperCase() !== "ADMIN") {
    redirect("/"); // Or to an unauthorized page
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <ShieldAlert className="h-8 w-8 text-rose-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">
            Chỉ dành cho tài khoản Admin có thẩm quyền.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold mb-4">User Management (Sắp ra mắt)</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Khu vực phân quyền cho phép bạn xem danh sách và cấp quyền cho User khác bằng Firebase Admin SDK. Tính năng này được ẩn hoàn toàn đối với người dùng thông thường thông qua Header Router và Server Route Protection.
        </p>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 font-mono text-sm">
          <strong>Your Session Data:</strong>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(session.user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
