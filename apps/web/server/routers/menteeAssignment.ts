import { z } from "zod";
import { router, organizerProcedure, mentorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  sendAssignmentInvitation,
  sendAssignmentNotification,
} from "../../lib/email";

export const menteeAssignmentRouter = router({
  assign: organizerProcedure
    .input(
      z.object({
        menteeId: z.string().uuid(),
        mentorId: z.string().uuid(),
        eventId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify event exists and user is organizer
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
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
          message: "Not authorized to assign mentees for this event",
        });
      }

      // Verify mentee and mentor exist and have correct roles
      const [mentee, mentor] = await Promise.all([
        ctx.prisma.user.findUnique({ where: { id: input.menteeId } }),
        ctx.prisma.user.findUnique({ where: { id: input.mentorId } }),
      ]);

      if (!mentee || !mentee.roles.includes("mentee")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid mentee",
        });
      }

      if (!mentor || !mentor.roles.includes("mentor")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid mentor",
        });
      }

      // Create assignment (upsert to handle duplicates)
      const assignment = await ctx.prisma.menteeAssignment.upsert({
        where: {
          menteeId_mentorId_eventId: {
            menteeId: input.menteeId,
            mentorId: input.mentorId,
            eventId: input.eventId,
          },
        },
        update: {},
        create: {
          menteeId: input.menteeId,
          mentorId: input.mentorId,
          eventId: input.eventId,
        },
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
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return assignment;
    }),

  getMenteesForMentor: mentorProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.prisma.menteeAssignment.findMany({
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
              companyName: true,
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
          event: {
            startDate: "desc",
          },
        },
      });

      return assignments;
    }),

  getAssignmentsForEvent: organizerProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify event ownership
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
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
          message: "Not authorized to view assignments for this event",
        });
      }

      const assignments = await ctx.prisma.menteeAssignment.findMany({
        where: { eventId: input.eventId },
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
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
        orderBy: {
          assignedAt: "desc",
        },
      });

      return assignments;
    }),

  removeAssignment: organizerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get assignment and verify ownership
      const assignment = await ctx.prisma.menteeAssignment.findUnique({
        where: { id: input.id },
        include: { event: true },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      if (
        assignment.event.organizerId !== ctx.user.id &&
        !ctx.user.roles.includes("admin")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to remove this assignment",
        });
      }

      await ctx.prisma.menteeAssignment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  bulkAssign: organizerProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        assignments: z.array(
          z.object({
            menteeEmail: z.string().email(),
            mentorEmail: z.string().email(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify event exists and user is organizer
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
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
          message: "Not authorized to assign mentees for this event",
        });
      }

      const results = [];
      const errors = [];

      for (const assignment of input.assignments) {
        try {
          // Find or note users by email
          const [mentee, mentor] = await Promise.all([
            ctx.prisma.user.findUnique({
              where: { email: assignment.menteeEmail },
            }),
            ctx.prisma.user.findUnique({
              where: { email: assignment.mentorEmail },
            }),
          ]);

          // Handle new users - send invitations
          if (!mentee) {
            await sendAssignmentInvitation(
              assignment.menteeEmail,
              event.name,
              event.startDate,
              event.endDate,
              "mentee"
            );
            results.push({
              menteeEmail: assignment.menteeEmail,
              mentorEmail: assignment.mentorEmail,
              status: "invited_mentee",
            });
            continue;
          }

          if (!mentor) {
            await sendAssignmentInvitation(
              assignment.mentorEmail,
              event.name,
              event.startDate,
              event.endDate,
              "mentor"
            );
            results.push({
              menteeEmail: assignment.menteeEmail,
              mentorEmail: assignment.mentorEmail,
              status: "invited_mentor",
            });
            continue;
          }

          // Verify roles
          if (!mentee.roles.includes("mentee")) {
            errors.push({
              menteeEmail: assignment.menteeEmail,
              mentorEmail: assignment.mentorEmail,
              error: "User does not have mentee role",
            });
            continue;
          }

          if (!mentor.roles.includes("mentor")) {
            errors.push({
              menteeEmail: assignment.menteeEmail,
              mentorEmail: assignment.mentorEmail,
              error: "User does not have mentor role",
            });
            continue;
          }

          // Create assignment
          const created = await ctx.prisma.menteeAssignment.upsert({
            where: {
              menteeId_mentorId_eventId: {
                menteeId: mentee.id,
                mentorId: mentor.id,
                eventId: input.eventId,
              },
            },
            update: {},
            create: {
              menteeId: mentee.id,
              mentorId: mentor.id,
              eventId: input.eventId,
            },
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
          });

          // Send notifications to both users
          await Promise.all([
            sendAssignmentNotification(
              mentee.email,
              mentee.name,
              event.name,
              event.startDate,
              event.endDate,
              "mentee",
              mentor.name || undefined
            ),
            sendAssignmentNotification(
              mentor.email,
              mentor.name,
              event.name,
              event.startDate,
              event.endDate,
              "mentor",
              mentee.name || undefined
            ),
          ]);

          results.push({
            menteeEmail: assignment.menteeEmail,
            mentorEmail: assignment.mentorEmail,
            status: "created",
            assignment: created,
          });
        } catch (error: any) {
          errors.push({
            menteeEmail: assignment.menteeEmail,
            mentorEmail: assignment.mentorEmail,
            error: error.message || "Failed to create assignment",
          });
        }
      }

      return {
        results,
        errors,
        totalProcessed: input.assignments.length,
        successCount: results.length,
        errorCount: errors.length,
      };
    }),

  searchUsers: organizerProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["mentor", "mentee"]),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          roles: {
            has: input.role,
          },
          ...(input.search
            ? {
                OR: [
                  { name: { contains: input.search, mode: "insensitive" } },
                  { email: { contains: input.search, mode: "insensitive" } },
                  { companyName: { contains: input.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
        },
        take: input.limit,
        orderBy: {
          name: "asc",
        },
      });

      return users;
    }),

  checkUserByEmail: organizerProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
        },
      });

      if (!user) {
        return {
          exists: false,
          user: null,
        };
      }

      return {
        exists: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hasMentorRole: user.roles.includes("mentor"),
          hasMenteeRole: user.roles.includes("mentee"),
        },
      };
    }),
});
