import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, memberships } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";

import { sanitizeEmail } from "@/lib/security/sanitize";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = sanitizeEmail(String(credentials.email));
        const password = String(credentials.password);

        // Disallow oversized payloads, missing symbols, and null bytes
        if (
          email.length > 254 ||
          password.length > 100 ||
          password.includes("\0") ||
          !email.includes("@")
        ) {
          return null;
        }

        const db = getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash || user.status !== "active") {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Resolve default workspace
        const [membership] = await db
          .select({ workspaceId: memberships.workspaceId })
          .from(memberships)
          .where(eq(memberships.userId, user.id))
          .limit(1);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: membership?.workspaceId ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.workspaceId = (user as { workspaceId?: string | null }).workspaceId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { workspaceId?: string | null }).workspaceId =
          (token.workspaceId as string | null) ?? null;
      }
      return session;
    },
  },
});