import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SUPER_ADMINS = ["labread33@gmail.com", "marina.leshetz@gmail.com"];

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      if (SUPER_ADMINS.includes(user.email)) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { role: "ADMIN", name: user.name ?? undefined },
          create: { email: user.email, name: user.name ?? undefined, role: "ADMIN" },
        });
        return true;
      }

      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      return !!dbUser;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { role: true, id: true },
        });
        token.role = dbUser?.role ?? "VIEWER";
        token.sub = dbUser?.id ?? token.sub;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

export function isSuperAdmin(email: string) {
  return SUPER_ADMINS.includes(email);
}
