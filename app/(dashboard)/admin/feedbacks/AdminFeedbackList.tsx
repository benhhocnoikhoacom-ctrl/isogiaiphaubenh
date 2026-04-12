"use client";

import { useState } from "react";
import { Feedback } from "@/types/feedback";
import { updateFeedbackStatusAction } from "@/app/actions/feedback";
import { CheckCircle2, Circle, Clock, Mail, Star, User } from "lucide-react";

export default function AdminFeedbackList({ initialFeedbacks }: { initialFeedbacks: Feedback[] }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: "new" | "reviewed" | "resolved") => {
    setLoadingId(id);
    const result = await updateFeedbackStatusAction(id, newStatus);
    if (result.success) {
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    } else {
      alert("Lỗi khi cập nhật: " + result.error);
    }
    setLoadingId(null);
  };

  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-20 dark:border-zinc-800">
        <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-900">
          <MessageSquareQuote className="h-8 w-8 text-zinc-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-500">Chưa có ý kiến đánh giá nào</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {feedbacks.map((item) => (
        <div
          key={item.id}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          {/* Status Badge */}
          <div className="absolute top-6 right-6 flex items-center">
            {item.status === "new" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <Circle className="h-3 w-3 fill-rose-600 dark:fill-rose-400" />
                Mới
              </span>
            )}
            {item.status === "reviewed" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                Đang xử lý
              </span>
            )}
            {item.status === "resolved" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Đã xử lý
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <User className="h-5 w-5 text-zinc-500" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</h3>
              {item.email && (
                <div className="flex items-center text-xs text-zinc-500">
                  <Mail className="mr-1 h-3 w-3" />
                  <span className="truncate">{item.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  (item.rating || 0) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "fill-zinc-100 text-zinc-200 dark:fill-zinc-800 dark:text-zinc-800"
                }`}
              />
            ))}
          </div>

          <div className="flex-1">
            <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-4">
              "{item.content}"
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <span className="text-xs text-zinc-400">
              {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            
            <div className="flex gap-2">
              {item.status !== "reviewed" && (
                <button
                  disabled={loadingId === item.id}
                  onClick={() => handleUpdateStatus(item.id as string, "reviewed")}
                  className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                >
                  {loadingId === item.id ? "..." : "Xem xét"}
                </button>
              )}
              {item.status !== "resolved" && (
                <button
                  disabled={loadingId === item.id}
                  onClick={() => handleUpdateStatus(item.id as string, "resolved")}
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  {loadingId === item.id ? "..." : "Hoàn thành"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Needed to avoid error if missing
import { MessageSquareQuote } from "lucide-react";
