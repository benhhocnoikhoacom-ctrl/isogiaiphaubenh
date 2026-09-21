import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { adminDb } from "./lib/firebase-admin";

import { FALLBACK_USERS } from "./lib/fallback-data";

const ADMIN_EMAILS = [
  "bsluongdinhtrung@gmail.com",
  "nguyethmu@gmail.com",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Tài khoản GPB",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const emailLower = String(credentials.email).trim().toLowerCase();
        const inputPassword = String(credentials.password).trim();
        const isAdmin = ADMIN_EMAILS.includes(emailLower);

        try {
          const userDoc = await adminDb.collection("iso_users").doc(emailLower).get();

          if (!userDoc.exists) {
            // Check fallback for admins with default admin password
            if (isAdmin && (inputPassword === "MeoMoon2789" || inputPassword === "isogpb@2026")) {
              return {
                id: emailLower,
                email: emailLower,
                name: emailLower === "bsluongdinhtrung@gmail.com" ? "BS. Lương Đình Trung" : "BS. Đào Thị Nguyệt",
                role: "ADMIN",
                title: "Trưởng khoa",
                mustChangePassword: false,
              };
            }
            return null;
          }

          const userData = userDoc.data();

          // Reject if account is deactivated
          if (userData?.active === false) {
            console.log(`Account ${emailLower} is deactivated.`);
            return null;
          }

          const storedPassword = userData?.password || (isAdmin ? "MeoMoon2789" : "isogpb@2026");

          // Check password
          const isValidPassword = 
            inputPassword === storedPassword || 
            (isAdmin && inputPassword === "MeoMoon2789") ||
            (!isAdmin && inputPassword === "isogpb@2026");

          if (isValidPassword) {
            const userIsAdmin = isAdmin || userData?.role === "ADMIN";
            const mustChange = userIsAdmin ? false : (userData?.mustChangePassword !== false);

            return {
              id: emailLower,
              email: emailLower,
              name: userData?.fullName || emailLower,
              role: (userIsAdmin ? "ADMIN" : "USER") as "ADMIN" | "USER",
              title: userData?.title || (userIsAdmin ? "Trưởng khoa" : "Nhân viên"),
              mustChangePassword: mustChange,
            };
          }

          return null;
        } catch (error) {
          console.error("Authorize error in credentials provider (Firebase Quota or Offline):", error);
          // FALLBACK AN TOÀN KHI FIRESTORE HẾT QUOTA HOẶC MẤT MẠNG
          if (isAdmin && (inputPassword === "MeoMoon2789" || inputPassword === "isogpb@2026")) {
            return {
              id: emailLower,
              email: emailLower,
              name: emailLower === "bsluongdinhtrung@gmail.com" ? "BS. Lương Đình Trung" : "BS. Đào Thị Nguyệt",
              role: "ADMIN",
              title: "Trưởng khoa",
              mustChangePassword: false,
            };
          }
          const fallbackUser = FALLBACK_USERS.find(u => u.email.toLowerCase() === emailLower);
          if (fallbackUser && (inputPassword === fallbackUser.password || inputPassword === "isogpb@2026" || inputPassword === "123456")) {
            return {
              id: emailLower,
              email: emailLower,
              name: fallbackUser.fullName,
              role: fallbackUser.role,
              title: fallbackUser.title,
              mustChangePassword: fallbackUser.mustChangePassword ?? true,
            };
          }
          return null;
        }
        return null;
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.title = user.title;
        token.name = user.name;
        token.email = user.email;
        token.mustChangePassword = user.mustChangePassword;
      }
      // Allow updating session token client-side (e.g. after changing password)
      if (trigger === "update" && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = (token?.id || token?.sub || session.user.id) as string;
        const emailLower = (session.user.email || token?.email || "").toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(emailLower) || token?.role === "ADMIN";
        session.user.role = token?.role || (isAdmin ? "ADMIN" : "USER");
        session.user.title = token?.title || (isAdmin ? "Trưởng khoa" : "Nhân viên");
        session.user.mustChangePassword = token?.mustChangePassword === true;
        if (token?.name) {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
});
