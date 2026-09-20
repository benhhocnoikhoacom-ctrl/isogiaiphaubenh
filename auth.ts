import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { adminDb } from "./lib/firebase-admin";

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

        try {
          const userDoc = await adminDb.collection("iso_users").doc(emailLower).get();

          if (!userDoc.exists) {
            // Check fallback for admins
            if (ADMIN_EMAILS.includes(emailLower) && (inputPassword === "isogpb@2026" || inputPassword === "123456")) {
              return {
                id: emailLower,
                email: emailLower,
                name: emailLower === "bsluongdinhtrung@gmail.com" ? "BS. Lương Đình Trung" : "BS. Đào Thị Nguyệt",
                role: "ADMIN",
                title: "Trưởng khoa",
              };
            }
            return null;
          }

          const userData = userDoc.data();
          const storedPassword = userData?.password || "isogpb@2026";

          // Match password (stored password or accepted defaults)
          if (inputPassword === storedPassword || inputPassword === "isogpb@2026" || inputPassword === "123456") {
            const isAdmin = ADMIN_EMAILS.includes(emailLower) || userData?.role === "ADMIN";
            return {
              id: emailLower,
              email: emailLower,
              name: userData?.fullName || emailLower,
              role: (isAdmin ? "ADMIN" : "USER") as "ADMIN" | "USER",
              title: userData?.title || (isAdmin ? "Trưởng khoa" : "Nhân viên"),
            };
          }

          return null;
        } catch (error) {
          console.error("Authorize error in credentials provider:", error);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.title = user.title;
        token.name = user.name;
        token.email = user.email;
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
        if (token?.name) {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
});
