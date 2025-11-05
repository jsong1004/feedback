import { router } from "../trpc";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { eventRouter } from "./event";
import { feedbackFormRouter } from "./feedbackForm";
import { menteeAssignmentRouter } from "./menteeAssignment";
import { feedbackSubmissionRouter } from "./feedbackSubmission";
import { organizerReportRouter } from "./organizerReport";

export const appRouter = router({
  user: userRouter,
  admin: adminRouter,
  event: eventRouter,
  feedbackForm: feedbackFormRouter,
  menteeAssignment: menteeAssignmentRouter,
  feedbackSubmission: feedbackSubmissionRouter,
  organizerReport: organizerReportRouter,
});

export type AppRouter = typeof appRouter;
