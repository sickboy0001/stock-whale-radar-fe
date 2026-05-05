import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false;

      try {
        // Check if user exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        if (!existingUser) {
          // Create new user
          await db.insert(users).values({
            id: nanoid(),
            email: user.email,
            displayName: user.name,
            imageUrl: user.image,
            googleId: profile?.sub as string,
          });
        }
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user && user.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin ?? false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});
