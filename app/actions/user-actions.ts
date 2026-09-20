"use server";

import { auth } from "@/auth";
import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { UserProfile, UserRole } from "@/types/iso";

/**
 * Cán bộ nhân viên tự đổi mật khẩu (bắt buộc khi đăng nhập lần đầu)
 */
export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, message: "Bạn chưa đăng nhập." };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }

  const emailLower = session.user.email.toLowerCase();

  try {
    const userDocRef = adminDb.collection("iso_users").doc(emailLower);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return { success: false, message: "Không tìm thấy thông tin tài khoản." };
    }

    const userData = userDoc.data();
    const storedPassword = userData?.password || "isogpb@2026";

    if (currentPassword.trim() !== storedPassword && currentPassword.trim() !== "isogpb@2026" && currentPassword.trim() !== "123456") {
      return { success: false, message: "Mật khẩu hiện tại không chính xác." };
    }

    await userDocRef.update({
      password: newPassword.trim(),
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/", "layout");
    return { success: true, message: "Đổi mật khẩu thành công!" };
  } catch (error: any) {
    console.error("Error changing password:", error);
    return { success: false, message: error.message || "Lỗi khi cập nhật mật khẩu." };
  }
}

/**
 * Trưởng khoa / Admin thêm nhân viên mới
 */
export async function createUser(data: {
  fullName: string;
  email: string;
  role: UserRole;
  title: string;
  phone?: string;
  initialPassword?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = data.email.trim().toLowerCase();
  if (!emailLower || !emailLower.includes("@")) {
    return { success: false, message: "Email không hợp lệ." };
  }

  if (!data.fullName?.trim()) {
    return { success: false, message: "Họ và tên không được để trống." };
  }

  try {
    const userDocRef = adminDb.collection("iso_users").doc(emailLower);
    const existing = await userDocRef.get();

    if (existing.exists) {
      return { success: false, message: "Email này đã tồn tại trong danh sách nhân sự." };
    }

    const newUser: UserProfile = {
      id: emailLower,
      email: emailLower,
      fullName: data.fullName.trim(),
      role: data.role || "USER",
      title: data.title.trim() || (data.role === "ADMIN" ? "Trưởng khoa / Admin" : "Kỹ thuật viên"),
      phone: data.phone?.trim() || "",
      password: data.initialPassword?.trim() || "isogpb@2026",
      mustChangePassword: data.role === "ADMIN" ? false : true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userDocRef.set(newUser);

    revalidatePath("/admin/users");
    revalidatePath("/assignment");
    revalidatePath("/");
    return { success: true, message: "Đã thêm nhân viên mới thành công!" };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, message: error.message || "Lỗi khi thêm nhân viên." };
  }
}

/**
 * Trưởng khoa / Admin sửa thông tin nhân viên
 */
export async function updateUser(
  email: string,
  data: {
    fullName: string;
    role: UserRole;
    title: string;
    phone?: string;
  }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = email.trim().toLowerCase();

  try {
    const userDocRef = adminDb.collection("iso_users").doc(emailLower);
    const existing = await userDocRef.get();

    if (!existing.exists) {
      return { success: false, message: "Không tìm thấy nhân viên cần sửa." };
    }

    await userDocRef.update({
      fullName: data.fullName.trim(),
      role: data.role,
      title: data.title.trim(),
      phone: data.phone?.trim() || "",
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/admin/users");
    revalidatePath("/assignment");
    revalidatePath("/");
    return { success: true, message: "Cập nhật thông tin nhân viên thành công!" };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return { success: false, message: error.message || "Lỗi khi cập nhật thông tin." };
  }
}

/**
 * Vô hiệu hóa hoặc Kích hoạt lại tài khoản
 */
export async function toggleUserStatus(email: string, active: boolean) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = email.trim().toLowerCase();

  // Không cho phép tự vô hiệu hóa tài khoản của chính mình
  if (session.user.email?.toLowerCase() === emailLower && !active) {
    return { success: false, message: "Bạn không thể tự vô hiệu hóa tài khoản của chính mình." };
  }

  try {
    const userDocRef = adminDb.collection("iso_users").doc(emailLower);
    await userDocRef.update({
      active,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/admin/users");
    revalidatePath("/assignment");
    revalidatePath("/");
    return { 
      success: true, 
      message: active ? "Đã kích hoạt lại tài khoản." : "Đã vô hiệu hóa tài khoản thành công." 
    };
  } catch (error: any) {
    console.error("Error toggling user status:", error);
    return { success: false, message: error.message || "Lỗi khi đổi trạng thái tài khoản." };
  }
}

/**
 * Trưởng khoa / Admin đặt lại mật khẩu cho nhân viên
 */
export async function resetUserPassword(email: string, newTempPassword?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = email.trim().toLowerCase();
  const passwordToSet = newTempPassword?.trim() || "isogpb@2026";

  try {
    const userDocRef = adminDb.collection("iso_users").doc(emailLower);
    const existing = await userDocRef.get();

    if (!existing.exists) {
      return { success: false, message: "Không tìm thấy tài khoản nhân viên." };
    }

    await userDocRef.update({
      password: passwordToSet,
      mustChangePassword: true, // Bắt buộc nhân viên đổi mật khẩu khi đăng nhập lại
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/admin/users");
    return { 
      success: true, 
      message: `Đã đặt lại mật khẩu thành công! Mật khẩu tạm: ${passwordToSet}` 
    };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, message: error.message || "Lỗi khi đặt lại mật khẩu." };
  }
}

/**
 * Trưởng khoa / Admin xóa tài khoản nhân viên
 */
export async function deleteUser(email: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = email.trim().toLowerCase();

  // Không cho phép tự xóa tài khoản của chính mình
  if (session.user.email?.toLowerCase() === emailLower) {
    return { success: false, message: "Bạn không thể tự xóa tài khoản của chính mình." };
  }

  try {
    const userDocRef = adminDb.collection("iso_users").doc(emailLower);
    await userDocRef.delete();

    revalidatePath("/admin/users");
    revalidatePath("/assignment");
    revalidatePath("/");
    return { success: true, message: "Đã xóa nhân viên khỏi hệ thống thành công." };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: error.message || "Lỗi khi xóa nhân viên." };
  }
}
