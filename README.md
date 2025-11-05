# Mentorship Feedback Platform

A comprehensive web application for managing mentorship programs, collecting feedback, and generating analytics reports.

## 🎯 Features

### Role-Based Access Control
- **Admin**: Full system access, user management
- **Organizer**: Event and form creation, analytics
- **Mentor**: Submit feedback for assigned mentees
- **Mentee**: View received feedback

### Core Functionality
- **Dynamic Form Builder**: Create custom feedback forms with multiple question types (text, textarea, select, radio, rating)
- **AI Form Recognition**: Upload images of paper forms and automatically extract questions using OCR technology
- **Event Management**: Organize mentorship events with date ranges and assigned forms
- **Mentee Assignments**: Link mentors with mentees for specific events
- **Feedback Submission**: Mentors submit structured feedback through dynamic forms
- **Analytics Dashboard**: Track submission rates and mentor performance
- **Email Notifications**: Automated notifications for feedback submission and reminders
- **Profile Management**: Users can manage their profiles and company information

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: tRPC v11, Next.js API Routes
- **Database**: PostgreSQL (Cloud SQL for production, Docker for development)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v4 (Google OAuth + Mock Credentials)
- **Email**: Nodemailer with Google SMTP
- **AI/OCR**: OpenRouter API with GPT-4o-mini for form recognition
- **Validation**: Zod
- **State Management**: TanStack React Query
- **UI Components**: Custom components with class-variance-authority
- **File Upload**: React Dropzone
- **Deployment**: Google Cloud Run + Cloud SQL

## 📋 Prerequisites

- Node.js 20+
- pnpm 10+
- Docker and Docker Compose (for local development)
- Google Cloud Platform account (for production deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd feedback

# Install dependencies
pnpm install
```

### 2. Set Up Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Generate Prisma Client
cd apps/web
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database with test data
pnpm db:seed
```

### 3. Configure Environment

```bash
# Copy environment template
cd apps/web
cp .env.example .env

# Edit .env with your configuration
# For development, the default values should work
```

### 4. Start Development Server

```bash
cd apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 Test Accounts

After seeding the database, you can log in with these accounts (password not required in development):

| Email | Role | Description |
|-------|------|-------------|
| admin@test.com | Admin + Organizer + Mentor | Full system access |
| organizer@test.com | Organizer | Can create events and forms |
| mentor@test.com | Mentor | Can submit feedback |
| mentor2@test.com | Mentor | Can submit feedback |
| mentee@test.com | Mentee | Can view feedback |
| mentee2@test.com | Mentee | Can view feedback |
| mentee3@test.com | Mentee | Can view feedback |

## 📁 Project Structure

```
feedback/
├── apps/
│   └── web/                      # Next.js application
│       ├── app/                  # App router pages
│       │   ├── api/             # API routes
│       │   ├── auth/            # Authentication pages
│       │   ├── admin/           # Admin dashboard
│       │   ├── organizer/       # Organizer pages
│       │   ├── mentor/          # Mentor pages
│       │   └── mentee/          # Mentee pages
│       ├── components/          # React components
│       │   ├── ui/              # Reusable UI components
│       │   └── layout/          # Layout components
│       ├── lib/                 # Utilities
│       │   ├── auth.ts          # Auth helpers
│       │   ├── email.ts         # Email service
│       │   ├── prisma.ts        # Prisma client
│       │   └── trpc/            # tRPC configuration
│       ├── server/              # Backend
│       │   ├── routers/         # tRPC routers
│       │   └── trpc.ts          # tRPC setup
│       ├── prisma/              # Database
│       │   ├── schema.prisma    # Database schema
│       │   └── seed.ts          # Seed script
│       ├── docs/                # Documentation
│       │   └── DEPLOYMENT.md    # Deployment guide
│       ├── Dockerfile           # Docker configuration
│       └── deploy.sh            # Deployment script
├── docs/                        # Project documentation
├── docker-compose.yml           # Local development setup
└── README.md                    # This file
```

## 🔧 Available Scripts

### Development

```bash
# Start development server
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Database

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema changes (dev)
pnpm db:push

# Create migration
pnpm db:migrate

# Deploy migrations (production)
pnpm db:migrate:deploy

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

### Building

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔐 Authentication

### Development Mode
- **Mock Credentials Provider**: Log in with any of the test accounts (no password required)
- Automatically creates sessions for development

### Production Mode
- **Google OAuth**: Requires Google Client ID and Secret
- Configure OAuth credentials in Google Cloud Console
- Set environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## 📧 Email Notifications

### Development Mode
- Emails are logged to console instead of being sent
- No SMTP configuration required

### Production Mode
- Configure Google SMTP in environment variables:
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=your-email@gmail.com`
  - `SMTP_PASSWORD=your-app-password`
  - `SMTP_FROM=noreply@yourdomain.com`

### Gmail App Password Setup
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate an app password for "Mail"
4. Use this password in `SMTP_PASSWORD`

## 🤖 AI Form Recognition

The platform includes AI-powered OCR functionality to automatically create digital forms from paper forms.

### Features

- **Upload Images**: Drag-and-drop or file upload for form images (PNG, JPEG)
- **AI Extraction**: Automatically detects questions, types, options, and ratings
- **Question Types**: Recognizes text, textarea, select, radio, and rating questions
- **Smart Detection**: Identifies required fields, answer options, and rating scales
- **Review & Edit**: Extracted questions can be reviewed and modified before saving

### Setup

1. Get an API key from [OpenRouter](https://openrouter.ai/keys)
2. Add to your `.env` file:
   ```bash
   OPENROUTER_API_KEY="your-api-key-here"
   OPENROUTER_MODEL="openai/gpt-4o-mini"  # Recommended for cost-effective OCR
   ```

### Usage

1. Navigate to **Organizer → Feedback Forms**
2. Click **Import from Image** button
3. Upload a clear image of your paper form (max 4MB)
4. Wait 5-10 seconds for AI processing
5. Review extracted questions in the form builder
6. Edit or adjust questions as needed
7. Save the form

### Best Practices

- Use well-lit, clear images with minimal glare
- Ensure text is readable and properly aligned
- Include all question options and rating scales in the image
- Mark required fields with asterisks (*) or "(required)" labels
- Review all extracted questions before saving

### Supported Question Types

| Type | Detection Criteria |
|------|-------------------|
| **Text** | Short answer fields, single-line inputs |
| **Textarea** | Long answer fields, multi-line text areas, essay questions |
| **Select** | Dropdown lists, "choose one from list" with many options |
| **Radio** | Multiple choice, radio buttons, 2-5 options |
| **Rating** | Star ratings, numeric scales (1-5, 1-10), Likert scales |

### Cost & Performance

- **Model**: GPT-4o-mini (~$0.15 per 1M tokens)
- **Average Cost**: ~$0.01-0.02 per form extraction
- **Processing Time**: 5-10 seconds per image
- **File Size Limit**: 4MB maximum

## 📊 Database Schema

### Core Models

- **User**: Authentication, roles, profile information
- **Event**: Mentorship events with date ranges
- **FeedbackForm**: Dynamic form definitions with JSON questions
- **MenteeAssignment**: Links mentors with mentees for events
- **FeedbackSubmission**: Submitted feedback with JSON answers

### Relationships

```
User (Organizer) → Event → FeedbackForm
User (Mentor) + User (Mentee) → MenteeAssignment → Event
User (Mentor) + User (Mentee) → FeedbackSubmission → Event + FeedbackForm
```

## 🚢 Deployment

See [DEPLOYMENT.md](apps/web/docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Cloud Run

```bash
# Set environment variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"

# Run deployment script
cd apps/web
./deploy.sh
```

## 🎨 UI Components

The application includes a complete set of accessible UI components:

- **Button**: Multiple variants (primary, secondary, ghost, danger) with loading states
- **Input, Textarea**: Form inputs with labels and error states
- **Select, RadioGroup, Checkbox**: Form controls
- **Dialog**: Modal dialogs with focus trapping
- **Toast**: Notification system with auto-dismiss
- **Spinner**: Loading indicators
- **Navigation**: Responsive header with role-based menu items

All components follow accessibility best practices (WCAG 2.1 AA).

## 🔒 Security Features

- **Role-Based Access Control (RBAC)**: Enforced at both API and page level
- **Protected Routes**: ProtectedLayout component guards pages
- **Input Validation**: Zod schemas validate all inputs
- **CSRF Protection**: NextAuth.js built-in CSRF protection
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Prevention**: React automatic escaping
- **Admin Safeguards**: Cannot remove the last admin user

## 📈 Analytics & Reporting

Organizers can view comprehensive reports:

- **Submission Rates**: Track feedback completion percentages
- **Mentor Performance**: Individual mentor submission statistics
- **Assignment Details**: Detailed breakdown of all assignments
- **Event Analytics**: Overall event statistics and trends

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Prisma Issues

```bash
# Regenerate Prisma Client
pnpm db:generate

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Environment Variables

### Required Variables

| Variable | Description | Default (Development) |
|----------|-------------|-----------------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://feedback_user:feedback_pass@localhost:5432/feedback_dev` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Auto-generated in dev |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | - |
| `SMTP_HOST` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `SMTP_FROM` | From email address | - |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI OCR | - |
| `OPENROUTER_BASE_URL` | OpenRouter API endpoint | `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | AI model for OCR | `openai/gpt-4o-mini` |
| `NODE_ENV` | Environment | `development` |

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- tRPC team for type-safe APIs
- All contributors and testers

## 📞 Support

For issues, questions, or contributions, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation in `/docs`

---

**Built with ❤️ for mentorship programs**
