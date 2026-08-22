import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Guard: missing credentials
        if (!credentials?.email || !credentials?.password) {
          console.error("[NextAuth authorize] Missing email or password in credentials");
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        try {
          // Step 1: Check DATABASE_URL is available
          if (!process.env.DATABASE_URL) {
            console.error("[NextAuth authorize] DATABASE_URL environment variable is NOT SET");
            return null;
          }

          // Step 2: Fetch user from DB
          console.log("[NextAuth authorize] Fetching user:", email);
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.error("[NextAuth authorize] User NOT FOUND in database:", email);
            return null;
          }

          console.log("[NextAuth authorize] User found:", user.email, "role:", user.role, "hashPrefix:", user.passwordHash?.substring(0, 10));

          // Step 3: Check passwordHash exists
          if (!user.passwordHash) {
            console.error("[NextAuth authorize] User has NO passwordHash:", email);
            return null;
          }

          // Step 4: Compare passwords
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            console.error("[NextAuth authorize] Password MISMATCH for:", email);
            return null;
          }

          // Step 5: Return user object
          console.log("[NextAuth authorize] Login SUCCESS for:", email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          const stack = err instanceof Error ? err.stack : undefined;
          console.error("AUTHORIZE_ERROR:", message, stack);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};
