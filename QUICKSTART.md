# ⚡ Quick Start Guide

Get the Mentorship Feedback Platform running in 5 minutes!

## 🎯 Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop

## 🚀 Setup Steps

### 1️⃣ Install Dependencies

```bash
pnpm install
```

### 2️⃣ Start Database

```bash
docker-compose up -d
```

### 3️⃣ Setup Database

```bash
cd apps/web
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4️⃣ Start Development Server

```bash
pnpm dev
```

## 🎉 You're Done!

Open **http://localhost:3000** and log in with any test account:

| Email | Role |
|-------|------|
| `admin@test.com` | Admin |
| `organizer@test.com` | Organizer |
| `mentor@test.com` | Mentor |
| `mentee@test.com` | Mentee |

**No password required in development mode!**

---

## 📝 Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm typecheck        # Check types
pnpm lint             # Run linter

# Database
pnpm db:studio        # Open database GUI
pnpm db:seed          # Re-seed database

# Production
pnpm build            # Build for production
pnpm start            # Start production server
```

---

## 🐛 Troubleshooting

### Database won't start?
```bash
docker-compose restart postgres
```

### Can't log in?
Make sure you ran `pnpm db:seed` to create test accounts.

### Port 3000 already in use?
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Build errors?
```bash
rm -rf .next node_modules
pnpm install
pnpm db:generate
```

---

## 📚 Full Documentation

- **README.md** - Complete setup guide
- **IMPLEMENTATION_STATUS.md** - Feature details
- **PROJECT_COMPLETE.md** - Overview and summary
- **apps/web/docs/DEPLOYMENT.md** - Production deployment

---

## 🎨 What You Can Do

### As Admin (`admin@test.com`)
- Manage users and assign roles at `/admin/users`
- Access all features

### As Organizer (`organizer@test.com`)
- Create events at `/organizer/events`
- Build custom forms at `/organizer/forms`
- View analytics at `/organizer/reports`

### As Mentor (`mentor@test.com`)
- View assignments at `/mentor/dashboard`
- Submit feedback for mentees

### As Mentee (`mentee@test.com`)
- View received feedback at `/mentee/dashboard`
- Filter by event or mentor

---

**Need help? Check the full documentation or open an issue!**
