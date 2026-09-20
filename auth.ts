import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "./lib/firebase-admin";

const ADMIN_EMAILS = [
  "bsluongdinhtrung@gmail.com",
  "nguyethmu@gmail.com",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: FirestoreAdapter(adminDb),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      if (session?.user && user) {
        session.user.id = user.id;
        const emailLower = (user.email || "").toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(emailLower);

        try {
          const isoUserDoc = await adminDb.collection("iso_users").doc(emailLower).get();
          if (isoUserDoc.exists) {
            const data = isoUserDoc.data();
            session.user.role = (data?.role || (isAdmin ? "ADMIN" : "USER")) as "ADMIN" | "USER";
            session.user.title = data?.title || (isAdmin ? "Trưởng khoa" : "Nhân viên");
            if (data?.fullName) {
              session.user.name = data.fullName;
            }
          } else {
            session.user.role = isAdmin ? "ADMIN" : "USER";
            session.user.title = isAdmin ? "Trưởng khoa / Admin" : "Nhân viên";
          }
        } catch (error) {
          console.error("Error reading iso_users for session:", error);
          session.user.role = isAdmin ? "ADMIN" : "USER";
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }: any) {
      const emailLower = (user.email || "").toLowerCase();
      const isAdmin = ADMIN_EMAILS.includes(emailLower);
      const userRef = adminDb.collection("users").doc(user.id);

      await userRef.set({
        role: isAdmin ? "ADMIN" : "USER",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
    },
  },
});
