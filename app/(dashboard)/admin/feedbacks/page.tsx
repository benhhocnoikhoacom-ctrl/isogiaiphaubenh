import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { MessageSquareQuote } from "lucide-react";
import AdminFeedbackList from "./AdminFeedbackList";
import { Feedback } from "@/types/feedback";

export default async function AdminFeedbacksPage() {
  const session = await auth();

  // Protect this route from non-admins
  if (session?.user?.role?.toUpperCase() !== "ADMIN") {
    redirect("/"); 
  }

  // Fetch feedbacks side
  const snapshot = await adminDb
    .collection("feedbacks")
    .orderBy("createdAt", "desc")
    .get();

  const feedbacks: Feedback[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      content: data.content,
      rating: data.rating,
      status: data.status,
      // Convert Timestamp to Date, then to ISO string for safe passing to Client Component
      createdAt: data.createdAt?.toDate().toISOString(), 
    } as unknown as Feedback;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20">
          <MessageSquareQuote className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Ý Kiến</h1>
          <p className="text-muted-foreground mt-1">
            Xem và xử lý ý kiến đóng góp từ người dùng. Chỉ Admin mới có quyền truy cập.
          </p>
        </div>
      </div>

      <AdminFeedbackList initialFeedbacks={feedbacks} />
    </div>
  );
}
