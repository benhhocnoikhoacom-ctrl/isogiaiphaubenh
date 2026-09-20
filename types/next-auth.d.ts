import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: string;
      id: string;
      title?: string;
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    title?: string;
    mustChangePassword?: boolean;
  }
}
