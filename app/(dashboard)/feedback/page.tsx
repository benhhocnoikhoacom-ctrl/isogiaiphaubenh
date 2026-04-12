"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitFeedbackAction } from "@/app/actions/feedback";
import { useFormStatus } from "react-dom";
import { MessageSquarePlus, Send, Star } from "lucide-react";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:scale-100 disabled:opacity-50`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {pending ? "Đang gửi..." : "Gửi Đánh Giá"}
        <Send className={`h-4 w-4 transition-transform ${pending ? "animate-pulse" : "group-hover:translate-x-1"}`} />
      </span>
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export default function FeedbackPage() {
  const [state, formAction] = useActionState(submitFeedbackAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setRating(5);
    }
  }, [state]);

  return (
    <div className="mx-auto max-w-2xl py-10 sm:py-20 lg:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-white/70 shadow-2xl ring-1 ring-zinc-200 backdrop-blur-xl dark:bg-zinc-900/70 dark:ring-zinc-800">
        
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        
        <div className="relative p-8 sm:p-12">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 shadow-lg shadow-emerald-500/30">
              <MessageSquarePlus className="h-8 w-8 text-white" />
            </div>
            <h1 className="bg-gradient-to-br from-zinc-800 to-zinc-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-zinc-100 dark:to-zinc-400 sm:text-4xl">
              Đóng Góp Ý Kiến
            </h1>
            <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
              Chúng tôi luôn lắng nghe để mang lại trải nghiệm y tế tốt nhất. Mọi ý kiến của bạn đều rất quý giá!
            </p>
          </div>

          <form ref={formRef} action={formAction} className="space-y-6">
            {state?.success === false && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400">
                {state.error}
              </div>
            )}
            
            {state?.success === true && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">
                {state.message}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Họ và Tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  placeholder="Nguyễn Văn A"
                  className="block w-full rounded-xl border-zinc-200 bg-white/50 px-4 py-3 text-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:border-teal-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email <span className="text-zinc-400">(Tùy chọn)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="nguyenvana@example.com"
                  className="block w-full rounded-xl border-zinc-200 bg-white/50 px-4 py-3 text-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:border-teal-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Đánh giá mức độ hài lòng
              </label>
              <input type="hidden" name="rating" value={rating} />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-zinc-200 text-zinc-200 dark:fill-zinc-800 dark:text-zinc-800"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nội dung góp ý <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="content"
                id="content"
                required
                rows={4}
                placeholder="Chia sẻ trải nghiệm hoặc đề xuất của bạn..."
                className="block w-full resize-none rounded-xl border-zinc-200 bg-white/50 px-4 py-3 text-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:border-teal-500"
              />
            </div>

            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}
