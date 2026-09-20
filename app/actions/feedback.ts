"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/auth";
import { Feedback } from "@/types/feedback";

export async function submitFeedbackAction(
  prevState: any,
  formData: FormData
) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const content = formData.get("content") as string;
    const ratingForm = formData.get("rating");
    const rating = ratingForm ? parseInt(ratingForm as string, 10) : undefined;

    if (!name || !content) {
      return { success: false, error: "Vui lòng nhập tên và nội dung góp ý." };
    }

    const newFeedback: Feedback = {
      name,
      email: email || undefined,
      content,
      rating,
      status: "new",
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection("feedbacks").add(newFeedback);

    return { 
      success: true, 
      message: "Cảm ơn bạn đã đóng góp ý kiến!",
      id: docRef.id
    };
  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau." };
  }
}

export async function updateFeedbackStatusAction(id: string, newStatus: "new" | "reviewed" | "resolved") {
  try {
    const session = await auth();
    if (session?.user?.role?.toUpperCase() !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    await adminDb.collection("feedbacks").doc(id).update({
      status: newStatus,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating feedback status:", error);
    return { success: false, error: error.message };
  }
}
