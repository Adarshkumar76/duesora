import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, memberships } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { sanitizeEmail } from "@/lib/security/sanitize";
import { handleSocialSignIn } from "@/lib/auth/social";

const providers: Provider[] = [
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
];

const githubClientId =
  process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID || process.env.GITHUB_ID;
const githubClientSecret =
  process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_SECRET;

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
}

const googleClientId =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET;

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github" || account?.provider === "google") {
        if (!user.email) return false;
        try {
          const result = await handleSocialSignIn({
            provider: account.provider,
            email: user.email,
            name: user.name,
          });
          user.id = result.userId;
          (user as { workspaceId?: string | null }).workspaceId = result.workspaceId;
        } catch (err) {
          console.error("Failed to process social sign in:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.workspaceId = (user as { workspaceId?: string | null }).workspaceId ?? null;
      }

      // If user authenticated via OAuth or workspaceId is missing, hydrate from database
      if (
        token.email &&
        (account?.provider === "github" || account?.provider === "google" || !token.workspaceId)
      ) {
        try {
          const db = getDb();
          const [dbUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, sanitizeEmail(token.email)))
            .limit(1);

          if (dbUser) {
            token.id = dbUser.id;
            const [membership] = await db
              .select({ workspaceId: memberships.workspaceId })
              .from(memberships)
              .where(eq(memberships.userId, dbUser.id))
              .limit(1);

            token.workspaceId = membership?.workspaceId ?? null;
          }
        } catch (err) {
          console.error("Error hydrating OAuth token:", err);
        }
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