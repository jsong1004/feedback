import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  getUsers: adminProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          role: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;

      const where = {
        AND: [
          input?.search
            ? {
                OR: [
                  { email: { contains: input.search, mode: "insensitive" as const } },
                  { name: { contains: input.search, mode: "insensitive" as const } },
                ],
              }
            : {},
          input?.role ? { roles: { has: input.role } } : {},
        ],
      };

      const users = await ctx.prisma.user.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          status: true,
          companyName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      return {
        users,
        nextCursor,
      };
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        roles: z.array(z.enum(["admin", "organizer", "mentor", "mentee", "user"])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent removing the last admin
      if (!input.roles.includes("admin")) {
        const adminCount = await ctx.prisma.user.count({
          where: { roles: { has: "admin" } },
        });

        const targetUser = await ctx.prisma.user.findUnique({
          where: { id: input.userId },
          select: { roles: true },
        });

        if (targetUser?.roles.includes("admin") && adminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the last admin user",
          });
        }
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { roles: input.roles },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          status: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    }),

  updateUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        status: z.enum(["active", "inactive", "suspended"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { status: input.status },
        select: {
          id: true,
          email: true,
          status: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    }),
});
