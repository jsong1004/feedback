import { z } from "zod";
import { router, mentorProcedure, menteeProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const feedbackSubmissionRouter = router({
  submit: mentorProcedure
    .input(
      z.object({
        menteeId: z.string().uuid(),
        eventId: z.string().uuid(),
        answers: z.record(z.string(), z.any()), // questionId -> answer value
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify assignment exists
      const assignment = await ctx.prisma.menteeAssignment.findUnique({
        where: {
          menteeId_mentorId_eventId: {
            menteeId: input.menteeId,
            mentorId: ctx.user.id,
            eventId: input.eventId,
          },
        },
        include: {
          event: {
            include: {
              feedbackForm: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not assigned to this mentee for this event",
        });
      }

      const feedbackForm = assignment.event.feedbackForm;
      const questions = feedbackForm.questions as any[];

      // Validate answers against form schema
      for (const question of questions) {
        const answer = input.answers[question.id];

        if (question.required && (answer === undefined || answer === null || answer === "")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Answer required for question: ${question.label}`,
          });
        }

        if (answer !== undefined && answer !== null && answer !== "") {
          // Type-specific validation
          if (question.type === "rating") {
            const numAnswer = Number(answer);
            if (
              isNaN(numAnswer) ||
              numAnswer < question.minRating ||
              numAnswer > question.maxRating
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Invalid rating for "${question.label}". Must be between ${question.minRating} and ${question.maxRating}`,
              });
            }
          }

          if (question.type === "select" || question.type === "radio") {
            if (!question.options.includes(answer)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Invalid option for "${question.label}"`,
              });
            }
          }
        }
      }

      // Create or update submission
      const submission = await ctx.prisma.feedbackSubmission.upsert({
        where: {
          menteeId_mentorId_eventId: {
            menteeId: input.menteeId,
            mentorId: ctx.user.id,
            eventId: input.eventId,
          },
        },
        update: {
          answers: input.answers as any,
          submissionDate: new Date(),
        },
        create: {
          menteeId: input.menteeId,
          mentorId: ctx.user.id,
          eventId: input.eventId,
          feedbackFormId: feedbackForm.id,
          answers: input.answers as any,
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return submission;
    }),

  getSubmissionsForMentee: menteeProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        mentorId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const submissions = await ctx.prisma.feedbackSubmission.findMany({
        where: {
          menteeId: ctx.user.id,
          ...(input.eventId ? { eventId: input.eventId } : {}),
          ...(input.mentorId ? { mentorId: input.mentorId } : {}),
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          feedbackForm: {
            select: {
              id: true,
              name: true,
              questions: true,
            },
          },
        },
        orderBy: {
          submissionDate: "desc",
        },
      });

      return submissions;
    }),

  getSubmissionById: menteeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const submission = await ctx.prisma.feedbackSubmission.findUnique({
        where: { id: input.id },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          feedbackForm: {
            select: {
              id: true,
              name: true,
              questions: true,
            },
          },
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback submission not found",
        });
      }

      // Verify the mentee owns this submission
      if (submission.menteeId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this feedback",
        });
      }

      return submission;
    }),

  getMentorSubmissions: mentorProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const submissions = await ctx.prisma.feedbackSubmission.findMany({
        where: {
          mentorId: ctx.user.id,
          ...(input.eventId ? { eventId: input.eventId } : {}),
        },
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: {
          submissionDate: "desc",
        },
      });

      return submissions;
    }),
});
