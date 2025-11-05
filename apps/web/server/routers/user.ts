import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        companyName: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        companyName: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          name: input.name,
          companyName: input.companyName,
          description: input.description,
        },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          companyName: true,
          description: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    }),
});
