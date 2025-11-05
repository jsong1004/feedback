import { z } from "zod";
import { router, organizerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const organizerReportRouter = router({
  getFeedbackSubmissionRates: organizerProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify event ownership
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: {
          feedbackForm: {
            select: {
              id: true,
              name: true,
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

      if (event.organizerId !== ctx.user.id && !ctx.user.roles.includes("admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view reports for this event",
        });
      }

      // Get all assignments and submissions for the event
      const [assignments, submissions] = await Promise.all([
        ctx.prisma.menteeAssignment.findMany({
          where: { eventId: input.eventId },
          include: {
            mentee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            mentor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        ctx.prisma.feedbackSubmission.findMany({
          where: { eventId: input.eventId },
          select: {
            menteeId: true,
            mentorId: true,
            submissionDate: true,
          },
        }),
      ]);

      // Create submission map for quick lookup
      const submissionMap = new Map<string, Date>();
      submissions.forEach((sub) => {
        const key = `${sub.mentorId}-${sub.menteeId}`;
        submissionMap.set(key, sub.submissionDate);
      });

      // Calculate stats
      const totalAssignments = assignments.length;
      const totalSubmissions = submissions.length;
      const submissionRate =
        totalAssignments > 0 ? (totalSubmissions / totalAssignments) * 100 : 0;

      // Build detailed breakdown
      const breakdown = assignments.map((assignment) => {
        const key = `${assignment.mentorId}-${assignment.menteeId}`;
        const submissionDate = submissionMap.get(key);

        return {
          mentor: assignment.mentor,
          mentee: assignment.mentee,
          submitted: !!submissionDate,
          submissionDate: submissionDate || null,
        };
      });

      // Group by mentor
      const mentorStats = new Map<
        string,
        {
          mentor: { id: string; name: string | null; email: string };
          assigned: number;
          submitted: number;
        }
      >();

      assignments.forEach((assignment) => {
        const mentorId = assignment.mentorId;
        if (!mentorStats.has(mentorId)) {
          mentorStats.set(mentorId, {
            mentor: assignment.mentor,
            assigned: 0,
            submitted: 0,
          });
        }

        const stats = mentorStats.get(mentorId)!;
        stats.assigned++;

        const key = `${assignment.mentorId}-${assignment.menteeId}`;
        if (submissionMap.has(key)) {
          stats.submitted++;
        }
      });

      return {
        event: {
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          feedbackForm: event.feedbackForm,
        },
        stats: {
          totalAssignments,
          totalSubmissions,
          submissionRate: Math.round(submissionRate * 100) / 100,
          pendingSubmissions: totalAssignments - totalSubmissions,
        },
        breakdown,
        mentorStats: Array.from(mentorStats.values()).map((stat) => ({
          ...stat,
          submissionRate:
            stat.assigned > 0
              ? Math.round((stat.submitted / stat.assigned) * 100 * 100) / 100
              : 0,
        })),
      };
    }),
});
