import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    // Mock Credentials Provider for Development
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            id: "credentials",
            name: "Mock Sign In",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "test@example.com" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              // Mock users for development
              const mockUsers: Record<string, { name: string; roles: string[] }> = {
                "admin@test.com": { name: "Admin User", roles: ["admin", "organizer", "mentor"] },
                "organizer@test.com": { name: "Organizer User", roles: ["organizer", "mentor"] },
                "mentor@test.com": { name: "Mentor User", roles: ["mentor"] },
                "mentee@test.com": { name: "Mentee User", roles: ["mentee"] },
              };

              const mockUser = mockUsers[credentials.email];
              if (mockUser) {
                // Create or update user in database
                const user = await prisma.user.upsert({
                  where: { email: credentials.email },
                  update: {
                    roles: mockUser.roles,
                    name: mockUser.name,
                  },
                  create: {
                    email: credentials.email,
                    name: mockUser.name,
                    roles: mockUser.roles,
                    status: "active",
                  },
                });

                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  roles: user.roles,
                };
              }

              return null;
            },
          }),
        ]
      : []),

    // Google OAuth Provider for Production
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Handle Google OAuth sign-in
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user with default role
          // Note: Organizers will assign mentor/mentee roles through admin panel
          // after user signs in for the first time
          await prisma.user.create({
            data: {
              email: user.email!,
              googleId: account.providerAccountId,
              name: user.name,
              roles: ["user"],
              status: "active",
            },
          });
        } else {
          // Update Google ID if not set
          await prisma.user.update({
            where: { email: user.email! },
            data: {
              googleId: account.providerAccountId,
              name: user.name,
            },
          });
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Fetch user from database to get roles
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.roles = dbUser.roles;
        }
      }

      // Handle session update (profile edit, etc.)
      if (trigger === "update" && session) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });

        if (dbUser) {
          token.roles = dbUser.roles;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
