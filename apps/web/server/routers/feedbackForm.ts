import { z } from "zod";
import { router, organizerProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  extractQuestionsFromImage,
  validateImageData,
} from "../services/ocr";

// Question schema for validation
const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "textarea", "select", "radio", "rating"]),
  label: z.string().min(1).max(500),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select/radio
  minRating: z.number().min(1).optional(), // For rating
  maxRating: z.number().max(10).optional(), // For rating
});

export const feedbackFormRouter = router({
  create: organizerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        questions: z.array(questionSchema).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate question IDs are unique
      const questionIds = input.questions.map((q) => q.id);
      const uniqueIds = new Set(questionIds);
      if (questionIds.length !== uniqueIds.size) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Question IDs must be unique",
        });
      }

      // Validate select/radio have options
      for (const question of input.questions) {
        if (["select", "radio"].includes(question.type)) {
          if (!question.options || question.options.length === 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Question "${question.label}" must have options`,
            });
          }
        }

        if (question.type === "rating") {
          if (!question.minRating || !question.maxRating) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Question "${question.label}" must have min and max rating`,
            });
          }
          if (question.minRating >= question.maxRating) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Min rating must be less than max rating for "${question.label}"`,
            });
          }
        }
      }

      const feedbackForm = await ctx.prisma.feedbackForm.create({
        data: {
          name: input.name,
          description: input.description,
          questions: input.questions as any,
          createdBy: ctx.user.id,
        },
      });

      return feedbackForm;
    }),

  getMyForms: organizerProcedure
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

      const forms = await ctx.prisma.feedbackForm.findMany({
        where: { createdBy: ctx.user.id },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              events: true,
              submissions: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (forms.length > limit) {
        const nextItem = forms.pop();
        nextCursor = nextItem?.id;
      }

      return {
        forms,
        nextCursor,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const form = await ctx.prisma.feedbackForm.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              events: true,
              submissions: true,
            },
          },
        },
      });

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback form not found",
        });
      }

      return form;
    }),

  getAll: organizerProcedure.query(async ({ ctx }) => {
    // Get all forms for selection in event creation
    const forms = await ctx.prisma.feedbackForm.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return forms;
  }),

  update: organizerProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        questions: z.array(questionSchema).min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const form = await ctx.prisma.feedbackForm.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      });

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback form not found",
        });
      }

      if (form.createdBy !== ctx.user.id && !ctx.user.roles.includes("admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this form",
        });
      }

      // Prevent editing if form has submissions
      if (form._count.submissions > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot edit form that has existing submissions",
        });
      }

      // Validate questions if provided
      if (input.questions) {
        const questionIds = input.questions.map((q) => q.id);
        const uniqueIds = new Set(questionIds);
        if (questionIds.length !== uniqueIds.size) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Question IDs must be unique",
          });
        }

        for (const question of input.questions) {
          if (["select", "radio"].includes(question.type)) {
            if (!question.options || question.options.length === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Question "${question.label}" must have options`,
              });
            }
          }

          if (question.type === "rating") {
            if (!question.minRating || !question.maxRating) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Question "${question.label}" must have min and max rating`,
              });
            }
            if (question.minRating >= question.maxRating) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Min rating must be less than max rating for "${question.label}"`,
              });
            }
          }
        }
      }

      const updatedForm = await ctx.prisma.feedbackForm.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          questions: input.questions as any,
        },
      });

      return updatedForm;
    }),

  delete: organizerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const form = await ctx.prisma.feedbackForm.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              events: true,
              submissions: true,
            },
          },
        },
      });

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback form not found",
        });
      }

      if (form.createdBy !== ctx.user.id && !ctx.user.roles.includes("admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this form",
        });
      }

      // Prevent deleting if form is used in events
      if (form._count.events > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete form that is being used in events",
        });
      }

      await ctx.prisma.feedbackForm.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  extractFromImage: organizerProcedure
    .input(
      z.object({
        imageData: z.string().min(1, "Image data is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate image data format and size
        validateImageData(input.imageData);

        // Extract questions using AI OCR
        const questions = await extractQuestionsFromImage(input.imageData);

        // Validate extracted questions against schema
        for (const question of questions) {
          questionSchema.parse(question);
        }

        return {
          success: true,
          questions,
          count: questions.length,
        };
      } catch (error: any) {
        // Provide user-friendly error messages
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to extract questions from image",
        });
      }
    }),
});
