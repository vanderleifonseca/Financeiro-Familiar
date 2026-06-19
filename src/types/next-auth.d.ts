import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      color?: string;
    } & DefaultSession["user"];
  }

  interface User {
    color?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    color?: string;
  }
}
