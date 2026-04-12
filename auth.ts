import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "./lib/firebase-admin";

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
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role || "patient";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }: any) {
      // Logic gán quyền admin cho email bsluongdinhtrung@gmail.com
      const ADMIN_EMAIL = "bsluongdinhtrung@gmail.com";
      const userRef = adminDb.collection("users").doc(user.id);
      
      const defaultRole = user.email === ADMIN_EMAIL ? "admin" : "patient";
      
      // Update role into firestore
      await userRef.update({
        role: defaultRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
});
