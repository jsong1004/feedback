# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Mentorship Feedback Web Service** - a web-based application designed to centralize and streamline feedback processes within mentorship programs. The application enables:

- **Organizers**: Create/manage mentoring events and customizable feedback forms
- **Mentors**: Submit structured feedback to assigned mentees
- **Mentees**: Access and review all feedback received
- **Admins**: Manage users and role assignments

## Technology Stack

### Core Framework
- **Next.js** with TypeScript (App Router)
- **pnpm** workspace (monorepo structure)

### Backend & Data
- **tRPC** - Type-safe API layer
- **Prisma** - ORM for Firestore
- **Google Cloud Firestore** - Database (Native mode)
- **NextAuth.js** - Authentication with Google Provider

### Frontend
- **TailwindCSS** - Styling
- **React Hook Form + Zod** - Form handling and validation

### Infrastructure
- **Google Cloud Run** - Compute/hosting
- **Google Cloud Functions** - Email notifications (SendGrid)
- **Google Cloud Scheduler** - Reminder emails

## Architecture Principles

### Role-Based Access Control (RBAC)
The application has 4 primary roles:
- `admin` - Full system access, user management
- `organizer` - Event and form management
- `mentor` - Feedback submission
- `mentee` - Feedback viewing

All API endpoints and UI routes must enforce role-based access through tRPC middleware.

### Data Model Structure
```
users (id, email, googleId, roles[], status, companyName, description)
  ↓
events (id, name, organizerId, feedbackFormId, startDate, endDate)
  ↓
mentee_assignments (id, menteeId, mentorId, eventId)
  ↓
feedback_submissions (id, menteeId, mentorId, eventId, feedbackFormId, answers{})
  ↑
feedback_forms (id, name, questions[{type, label, options, minRating, maxRating}])
```

### API Layer Pattern
- All backend logic goes through tRPC procedures
- Use Zod schemas for input validation
- Implement tRPC middleware for authentication and role checks
- Group procedures by domain: `user`, `admin`, `event`, `feedbackForm`, `menteeAssignment`, `feedbackSubmission`, `menteeFeedback`, `organizerReport`

### Dynamic Form System
Feedback forms are dynamically rendered based on JSON schema. Question types include:
- `text` - Short text input
- `textarea` - Long text input
- `select` - Dropdown selection
- `radio` - Radio button group
- `rating` - Numeric rating scale

The frontend must dynamically map question types to appropriate UI components.

## Development Workflow

### Initial Setup (Not Yet Implemented)
When implementing Phase 0:
1. Initialize pnpm workspace: `pnpm init`
2. Set up Next.js with TypeScript
3. Configure GCP project and Firestore
4. Set up environment variables for:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `FIRESTORE_PROJECT_ID`
   - Firestore service account credentials

### Project Commands (Future)
Once implemented, commands will be:
- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run unit tests (Vitest/Jest)
- `pnpm test:e2e` - Run E2E tests (Playwright/Cypress)
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema to Firestore

## Implementation Strategy

### Phase Execution Order
Follow the 14-phase implementation plan in `/docs/tasks.md`:

1. **Phase 0-1**: Foundation (setup, auth, base components)
2. **Phase 2-4**: Core data models and user management
3. **Phase 5-6**: API layer and business logic
4. **Phase 7-8**: Pages, routing, and client-side logic
5. **Phase 9-13**: Polish, testing, deployment
6. **Phase 14**: Post-launch iteration

### Component Architecture
Build UI components in atomic design pattern:
- **Atoms**: Button, Input, Textarea, Select, Checkbox, RadioGroup, Dialog, Spinner, Toast
- **Molecules**: Form fields with labels/errors, feedback question components
- **Organisms**: Dynamic feedback forms, user lists, event cards
- **Templates**: Dashboard layouts, form builders
- **Pages**: Role-specific views (`/mentor/*`, `/mentee/*`, `/organizer/*`, `/admin/*`)

### Authentication Flow
1. User signs in with Google → NextAuth.js handles OAuth
2. On first sign-in → Create user in Firestore with `roles: ["user"]`
3. Admin assigns specific roles (`mentor`, `mentee`, `organizer`, `admin`)
4. Protected routes check `session.user.roles` for authorization

### Key Business Rules
- A mentor can only submit feedback for mentees assigned to them for specific events
- Feedback answers must validate against the associated FeedbackForm schema
- Organizers can only manage their own events and forms
- Mentees can only view feedback submitted to them
- Admins have full system access but should not accidentally remove the last admin role

## Critical Considerations

### Security
- Never expose Firestore credentials in client-side code
- Always validate roles server-side, never trust client-side checks
- Sanitize all user inputs to prevent XSS
- Use Zod validation on all tRPC inputs
- Implement rate limiting for API endpoints

### Performance
- Use tRPC's built-in caching and invalidation
- Implement pagination for large lists (users, feedback submissions)
- Optimize Firestore queries (use indexes, limit fields)
- Use Next.js Image component for optimized images
- Implement code splitting for role-specific routes

### Accessibility
- All forms must have proper labels and ARIA attributes
- Ensure keyboard navigation works throughout the app
- Use semantic HTML elements
- Target WCAG 2.1 AA compliance
- Test with screen readers

## Testing Strategy

### Unit Tests
Focus on:
- tRPC procedure logic
- Form validation functions
- Role-based authorization helpers
- Date/time utilities

### Integration Tests
Focus on:
- tRPC procedures with Prisma and Firestore
- Authentication flows
- Role assignment workflows

### E2E Tests
Focus on critical user journeys:
- Mentor submits feedback for mentee
- Mentee views received feedback
- Organizer creates event with feedback form
- Admin assigns roles to users

## Deployment Notes

### Cloud Run Configuration
- Container must include all Next.js build artifacts
- Set environment variables in Cloud Run console
- Configure IAM permissions for Firestore access
- Set up scaling parameters (min/max instances)

### Email Notifications
- Firestore trigger on `feedback_submissions` → Cloud Function → SendGrid
- Cloud Scheduler daily cron → Cloud Function → Check deadlines → SendGrid

### Monitoring
- Enable Cloud Logging for all services
- Set up Cloud Monitoring dashboards for:
  - Request latency
  - Error rates
  - Feedback submission rates
  - Active user counts
