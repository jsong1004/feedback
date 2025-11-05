# Mentorship Feedback Web Service - Implementation Plan

## Prototype Overview
This application is a web-based service designed to centralize and streamline the feedback process within mentorship programs. It enables program organizers to create and manage mentoring events and customizable feedback forms. Mentors can securely submit structured feedback to their assigned mentees using these forms, while mentees can access and review all feedback received. The application features personalized dashboards for mentors and mentees, and basic reporting for organizers to track feedback submission rates. Built on a modern web stack, it leverages Google Cloud Platform (GCP) with Cloud Run for compute, Firestore for the database, and Google Authentication for secure user access, ensuring scalability, maintainability, and a robust user experience. The primary goal is to enhance mentee development, improve feedback quality, and reduce administrative overhead for program organizers.

---

# Implementation Prompt List

## Phase 0: Project Setup & Configuration
### Core Project Setup
- [ ] **Initialize Monorepo with Next.js, tRPC, Prisma, TailwindCSS, and NextAuth.js** — Set up a new monorepo project using `pnpm` workspace. Initialize a Next.js application with TypeScript, integrating tRPC for API layer, Prisma as the ORM for Firestore, TailwindCSS for styling, and NextAuth.js for authentication. Ensure all necessary configurations are in place for a smooth development workflow.
- [ ] **Configure Google Cloud Project and Firestore** — Set up a new GCP project. Initialize Firestore in Native mode and configure it for use with the Next.js application via Prisma. Ensure proper service account keys and environment variables are configured for secure access.
- [ ] **Implement Basic NextAuth.js Google Provider** — Configure NextAuth.js to use the Google authentication provider. Set up environment variables for Google Client ID and Client Secret. Implement a basic sign-in/sign-out flow and ensure user sessions are correctly managed. This should handle the initial user creation in the database upon first sign-in.
- [ ] **Set up TailwindCSS for UI Development** — Ensure TailwindCSS is correctly integrated into the Next.js project. Configure `tailwind.config.js` with basic styling presets and purge paths. Verify that utility classes are applied correctly.
- [ ] **Configure Prisma with Firestore Provider** — Set up Prisma to connect to Firestore. Define the `datasource` and `generator` blocks in `schema.prisma` to use the Firestore provider. Ensure Prisma Client can generate types from the Firestore schema.

## Phase 1: Core UI Components (Atoms)
### Foundational UI Elements
- [ ] **Build `Button` Component** — Create a reusable `Button` component with support for variants (e.g., `primary`, `secondary`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), and an `isLoading` state (showing a spinner and disabling the button). Use TailwindCSS for styling and ensure accessibility (focus states, ARIA attributes).
- [ ] **Build `Input` and `Textarea` Components** — Create accessible `Input` and `Textarea` components. Include support for different types (text, email, password), labels, placeholders, error states, and disabled states. Style with TailwindCSS.
- [ ] **Build `Select` Component** — Create an accessible `Select` component for dropdowns. Support labels, options, default values, and error states. Style with TailwindCSS.
- [ ] **Build `Checkbox` and `RadioGroup` Components** — Create accessible `Checkbox` and `RadioGroup` components. Ensure proper labeling, state management, and styling with TailwindCSS.
- [ ] **Build `Dialog` / `Modal` Component** — Create a reusable `Dialog` or `Modal` component for overlays. It should support opening/closing, displaying content, and proper accessibility (focus trapping, keyboard navigation, ARIA attributes). Style with TailwindCSS.
- [ ] **Build `Spinner` Component** — Create a simple, animated `Spinner` component to indicate loading states.
- [ ] **Build `Toast` Notification System** — Implement a global toast notification system for displaying success, error, and info messages to the user.

## Phase 2: User Authentication & Profile Management
### Authentication Flow
- [ ] **Implement Google Sign-In Page and Logic** — Create a dedicated sign-in page (`/auth/signin`) that uses NextAuth.js Google Provider. Handle successful authentication by redirecting to a dashboard and initial role assignment logic. Ensure proper error handling during sign-in.
- [ ] **Create User Profile Page (`/profile`)** — Build a protected page where authenticated users can view and edit their basic profile information. This includes displaying pre-filled name and email from Google Auth and allowing updates to `companyName` and `description`.
- [ ] **Implement User Profile Update API** — Create a tRPC endpoint (`user.updateProfile`) that allows an authenticated user to update their `companyName` and `description` in the Firestore `users` collection. Ensure validation of input fields.
- [ ] **Initial Role Assignment Logic** — Upon a user's first sign-in, ensure the backend assigns a default `["user"]` role. Implement a mechanism for an Admin/Organizer to later assign specific roles (`mentor`, `mentee`, `organizer`, `admin`). This might involve a temporary `status: "pending_role_assignment"` field and a dedicated admin interface.

## Phase 3: Admin User Management
### User Role Management
- [ ] **Build Admin User Management Page (`/admin/users`)** — Create a protected page accessible only to users with the `admin` role. This page should display a list of all users in the system, showing their name, email, and current roles.
- [ ] **Implement User Search and Filter Functionality** — Add search and filter capabilities to the Admin User Management page, allowing admins to search by email or filter by role.
- [ ] **Implement User Role Update API** — Create a tRPC endpoint (`admin.updateUserRole`) that allows an admin to update a specific user's role(s). This should include validation to prevent accidental role changes (e.g., removing the last admin role).
- [ ] **Integrate Role-Based Access Control (RBAC) Middleware** — Implement tRPC middleware and/or API route guards to enforce role-based access control for all protected API endpoints and UI routes. Only users with the required roles should be able to access specific resources or perform certain actions.

## Phase 4: Database Schema & Models
### Firestore Data Models
- [ ] **Define `User` Schema in Prisma** — Translate the `users` collection data model into Prisma schema (`prisma/schema.prisma`). Include fields for `id`, `email`, `googleId`, `roles` (array of strings), `status`, `companyName`, `description`, `createdAt`, `updatedAt`.
- [ ] **Define `Event` Schema in Prisma** — Translate the `events` collection data model into Prisma schema. Include fields for `id`, `name`, `description`, `startDate`, `endDate`, `organizerId` (relation to User), `feedbackFormId` (relation to FeedbackForm), `createdAt`, `updatedAt`.
- [ ] **Define `FeedbackForm` Schema in Prisma** — Translate the `feedback_forms` collection data model into Prisma schema. This will involve defining a structure for `questions` (array of objects with `id`, `type`, `label`, `options`, `minRating`, `maxRating`).
- [ ] **Define `MenteeAssignment` Schema in Prisma** — Translate the `mentee_assignments` collection data model into Prisma schema. Include fields for `id`, `menteeId` (relation to User), `mentorId` (relation to User), `eventId` (relation to Event), `assignedAt`.
- [ ] **Define `FeedbackSubmission` Schema in Prisma** — Translate the `feedback_submissions` collection data model into Prisma schema. Include fields for `id`, `menteeId` (relation to User), `mentorId` (relation to User), `eventId` (relation to Event), `feedbackFormId` (relation to FeedbackForm), `submissionDate`, `answers` (map of `questionId` to `answerValue`), `createdAt`.
- [ ] **Generate Prisma Client and Push Schema** — After defining all schemas, run `npx prisma generate` to update the Prisma client and `npx prisma db push` to synchronize the schema with Firestore (if using a development database or initial setup).

## Phase 5: API Layer (tRPC)
### Core API Endpoints
- [ ] **Create `user` tRPC Router** — Implement tRPC procedures for `user.getProfile` and `user.updateProfile`. Ensure proper input validation using Zod schemas.
- [ ] **Create `admin` tRPC Router** — Implement tRPC procedures for `admin.getUsers` (with filtering/searching) and `admin.updateUserRole`. Ensure admin role check and robust validation.
- [ ] **Create `event` tRPC Router (Organizer)** — Implement tRPC procedures for `event.createEvent`, `event.getEvents` (for organizer's managed events), `event.updateEvent`, and `event.deleteEvent`. Include Zod validation for all inputs and ensure organizer role check.
- [ ] **Create `feedbackForm` tRPC Router (Organizer)** — Implement tRPC procedures for `feedbackForm.createForm`, `feedbackForm.getForms` (for organizer's created forms), and `feedbackForm.getFormById`. Include Zod validation for form structure and question types.
- [ ] **Create `menteeAssignment` tRPC Router** — Implement tRPC procedures for `menteeAssignment.getMenteesForMentor` (mentor-specific) and `menteeAssignment.assignMenteeToMentor` (admin/organizer specific, if needed for initial setup).
- [ ] **Create `feedbackSubmission` tRPC Router (Mentor)** — Implement tRPC procedures for `feedbackSubmission.submitFeedback`. This procedure should validate the submitted answers against the associated `FeedbackForm` schema and ensure the mentor is assigned to the mentee for the event.
- [ ] **Create `menteeFeedback` tRPC Router (Mentee)** — Implement tRPC procedures for `menteeFeedback.getReceivedFeedback` (mentee-specific, with optional filtering by event/mentor) and `menteeFeedback.getFeedbackById`.
- [ ] **Create `organizerReport` tRPC Router (Organizer)** — Implement a tRPC procedure for `organizerReport.getFeedbackSubmissionRates` that calculates and returns the required report data for managed events.

## Phase 6: Business Logic & Utilities
### Core Logic and Helpers
- [ ] **Implement Feedback Form Question Validation Logic** — Create a utility function or service that dynamically validates submitted feedback answers against the structure and types defined in the `FeedbackForm` schema. This is crucial for `feedbackSubmission.submitFeedback`.
- [ ] **Develop Role-Based Authorization Helper** — Create a helper function or decorator for tRPC procedures to easily check if the authenticated user has the required role(s) to perform an action.
- [ ] **Implement Date/Time Utilities** — Create utility functions for formatting dates and times, and for handling `startDate`/`endDate` comparisons for events.

## Phase 7: Pages & Routing
### Application Pages
- [ ] **Build Organizer Event Management Page (`/organizer/events`)** — Create a protected page for organizers to list, create, edit, and delete mentoring events. This page will consume `event` tRPC procedures.
- [ ] **Build Organizer Feedback Form Builder Page (`/organizer/forms`)** — Create a protected page for organizers to create and manage feedback forms. This page will use `feedbackForm` tRPC procedures and include dynamic form building UI.
- [ ] **Build Mentor Dashboard Page (`/mentor/dashboard`)** — Create a protected page for mentors. This dashboard will display active events, upcoming feedback deadlines, pending feedback counts, and quick links to assigned mentees. It will consume `menteeAssignment` and `feedbackSubmission` tRPC data.
- [ ] **Build Mentor Feedback Submission Page (`/mentor/events/[eventId]/mentees/[menteeId]/submit-feedback`)** — Create a protected page where mentors can fill out and submit feedback forms for a specific mentee within an event. This page will dynamically render the form based on the `feedbackFormId` associated with the event.
- [ ] **Build Mentee Dashboard Page (`/mentee/dashboard`)** — Create a protected page for mentees showing a timeline of received feedback, categorized by mentor and event.
- [ ] **Build Mentee Received Feedback Page (`/mentee/feedback`)** — Create a protected page where mentees can view all the feedback they have received. Include filtering options by event and mentor.
- [ ] **Build Organizer Reporting Page (`/organizer/reports`)** — Create a protected page for organizers to view feedback submission rates for their managed events. This page will consume `organizerReport.getFeedbackSubmissionRates`.

## Phase 8: Client-Side Logic & Hooks
### Frontend Interaction
- [ ] **Implement React Hook for User Session/Role Access** — Create a custom React hook (e.g., `useAuth`) to easily access the current user's session data and roles across the frontend application.
- [ ] **Implement Form Handling with React Hook Form and Zod** — Use React Hook Form for managing form states and validation, integrating with Zod schemas for client-side validation, especially for feedback forms and profile updates.
- [ ] **Integrate tRPC Client into Frontend** — Set up the tRPC client in the Next.js application, ensuring proper data fetching, caching, and invalidation strategies.
- [ ] **Implement Dynamic Form Rendering for Feedback Forms** — Develop client-side logic to dynamically render feedback forms based on the `questions` array received from the `feedbackForm` API. This involves mapping question types to appropriate UI components (Input, Textarea, Select, RadioGroup, etc.).

## Phase 9: Styling & Theming
### Visual Design
- [ ] **Develop Base Layout and Navigation** — Create a responsive base layout for the application, including a navigation bar that dynamically adjusts based on the authenticated user's roles (e.g., different menu items for Mentor, Mentee, Organizer, Admin).
- [ ] **Implement Consistent Theming with TailwindCSS** — Define a consistent visual theme using TailwindCSS. Ensure colors, typography, spacing, and component styles are harmonized across the application.
- [ ] **Ensure Responsiveness for All Pages** — Verify that all developed pages and components are fully responsive and provide a good user experience on various screen sizes (mobile, tablet, desktop).

## Phase 10: Testing
### Quality Assurance
- [ ] **Write Unit Tests for tRPC Procedures** — Implement unit tests for critical tRPC procedures (e.g., `createEvent`, `submitFeedback`, `updateUserRole`) to ensure their business logic is correct and robust. Use a testing framework like Vitest or Jest.
- [ ] **Write Integration Tests for API Endpoints** — Implement integration tests that cover the interaction between the tRPC procedures, Prisma, and Firestore.
- [ ] **Implement End-to-End Tests for Core User Journeys** — Use Playwright or Cypress to write end-to-end tests for key user journeys, such as Mentor submitting feedback, Mentee viewing feedback, and Organizer creating an event.
- [ ] **Set up CI/CD Pipeline for Automated Testing** — Configure a CI/CD pipeline (e.g., GitHub Actions) to automatically run unit, integration, and E2E tests on every push to the repository.

## Phase 11: Documentation
### Project Knowledge Base
- [ ] **Update README.md with Setup Instructions** — Provide comprehensive instructions for setting up the development environment, running the application, and deploying it.
- [ ] **Document API Endpoints and Data Models** — Generate or manually create documentation for all tRPC API endpoints, including request/response schemas and authentication requirements. Document the Firestore data models.
- [ ] **Create Component Storybook/Documentation (Optional but Recommended)** — If time permits, set up Storybook (or similar) to document and showcase all reusable UI components.

## Phase 12: DevOps & Deployment
### Production Readiness
- [ ] **Containerize Next.js Application for Cloud Run** — Create a Dockerfile for the Next.js application, optimizing it for production deployment on Cloud Run.
- [ ] **Configure Cloud Run Deployment** — Set up Cloud Run services for the Next.js application, configuring environment variables, scaling settings, and IAM permissions.
- [ ] **Set up Logging and Monitoring in GCP** — Integrate GCP Cloud Logging and Cloud Monitoring for the Cloud Run services, enabling effective debugging and performance tracking.
- [ ] **Implement Automated Email Notifications (Cloud Functions & SendGrid)** — Develop a Google Cloud Function that triggers upon `feedback_submissions` creation (Firestore trigger). This function will use a third-party email service (e.g., SendGrid) to send notifications to mentees.
- [ ] **Implement Scheduled Email Reminders (Cloud Scheduler & Cloud Functions)** — Develop a Google Cloud Function triggered by Cloud Scheduler (e.g., daily cron job) to check for upcoming feedback deadlines and send reminder emails to mentors.

## Phase 13: Polish & Launch Preparation
### Final Touches
- [ ] **Review UI/UX for Consistency and Usability** — Conduct a thorough review of the user interface and user experience across all pages and roles to ensure consistency, intuitiveness, and ease of use.
- [ ] **Optimize Performance (Client-side)** — Implement client-side performance optimizations such as code splitting, image optimization, and lazy loading.
- [ ] **Accessibility Audit** — Perform a final accessibility audit to ensure compliance with WCAG 2.1 AA standards where feasible.
- [ ] **Prepare Release Notes** — Draft comprehensive release notes highlighting new features, bug fixes, and known issues for the MVP launch.

## Phase 14: Post-Launch
### Ongoing Support & Iteration
- [ ] **Monitor Application Performance and Health** — Continuously monitor the application's performance, error rates, and resource utilization using GCP's monitoring tools.
- [ ] **Gather User Feedback** — Collect feedback from initial users (mentors, mentees, organizers) to identify areas for improvement and prioritize future enhancements.
- [ ] **Plan for Next Iteration (Should-Haves)** — Based on user feedback and monitoring data, plan the implementation of "Should-Have" features like advanced dashboards, more detailed reporting, and potential C1/C2 features.
