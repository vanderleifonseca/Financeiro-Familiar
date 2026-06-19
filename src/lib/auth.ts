import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const member = await prisma.member.findUnique({ where: { email } });
        if (!member) return null;

        const isValid = await bcrypt.compare(password, member.passwordHash);
        if (!isValid) return null;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          color: member.color,
        };
      },
    }),
  ],
});
