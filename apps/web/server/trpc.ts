import { initTRPC, TRPCError } from "@trpc/server";
import { type Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import superjson from "superjson";

export interface Context {
  session: Session | null;
  prisma: typeof prisma;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for authenticated users
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// Middleware for role-based access control
const hasRole = (roles: string[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const userRoles = ctx.session.user.roles;
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Required role(s): ${roles.join(", ")}`,
      });
    }

    return next({
      ctx: {
        session: ctx.session,
        user: ctx.session.user,
      },
    });
  });

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(hasRole(["admin"]));
export const organizerProcedure = t.procedure.use(hasRole(["organizer", "admin"]));
export const mentorProcedure = t.procedure.use(hasRole(["mentor", "organizer", "admin"]));
export const menteeProcedure = t.procedure.use(hasRole(["mentee", "admin"]));
