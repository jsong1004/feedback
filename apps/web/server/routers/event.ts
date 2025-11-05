import { z } from "zod";
import { router, organizerProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const eventRouter = router({
  create: organizerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        startDate: z.date(),
        endDate: z.date(),
        feedbackFormId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate dates (allow same date with different times)
      if (input.endDate < input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date/time must be after or equal to start date/time",
        });
      }

      // Verify feedback form exists
      const feedbackForm = await ctx.prisma.feedbackForm.findUnique({
        where: { id: input.feedbackFormId },
      });

      if (!feedbackForm) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback form not found",
        });
      }

      const event = await ctx.prisma.event.create({
        data: {
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          organizerId: ctx.user.id,
          feedbackFormId: input.feedbackFormId,
        },
        include: {
          feedbackForm: true,
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return event;
    }),

  getMyEvents: organizerProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;

      const events = await ctx.prisma.event.findMany({
        where: { organizerId: ctx.user.id },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { startDate: "desc" },
        include: {
          feedbackForm: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              menteeAssignments: true,
              feedbackSubmissions: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (events.length > limit) {
        const nextItem = events.pop();
        nextCursor = nextItem?.id;
      }

      return {
        events,
        nextCursor,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
        include: {
          feedbackForm: true,
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              menteeAssignments: true,
              feedbackSubmissions: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      return event;
    }),

  update: organizerProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.organizerId !== ctx.user.id && !ctx.user.roles.includes("admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this event",
        });
      }

      // Validate dates if both are provided (allow same date with different times)
      const newStartDate = input.startDate ?? event.startDate;
      const newEndDate = input.endDate ?? event.endDate;

      if (newEndDate < newStartDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date/time must be after or equal to start date/time",
        });
      }

      const updatedEvent = await ctx.prisma.event.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
        },
        include: {
          feedbackForm: true,
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedEvent;
    }),

  delete: organizerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.id },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.organizerId !== ctx.user.id && !ctx.user.roles.includes("admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this event",
        });
      }

      await ctx.prisma.event.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
