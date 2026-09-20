import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { UserProfile } from "@/types/iso";
import { StaffManagement } from "@/components/admin/StaffManagement";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const usersSnap = await adminDb.collection("iso_users").get();
  const users: UserProfile[] = usersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: doc.id,
      fullName: data.fullName || doc.id,
      role: data.role || "USER",
      title: data.title || "Kỹ thuật viên",
      phone: data.phone || "",
      active: data.active !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  return (
    <StaffManagement
      initialUsers={users}
      currentAdminEmail={session.user.email || ""}
    />
  );
}
