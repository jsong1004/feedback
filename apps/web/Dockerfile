# Multi-stage Dockerfile for Next.js 14 Application
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.11.0

# ===== Dependencies Stage =====
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ===== Builder Stage =====
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY apps/web ./apps/web
COPY package.json pnpm-workspace.yaml ./

# Generate Prisma Client
WORKDIR /app/apps/web
RUN pnpm db:generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# ===== Runner Stage =====
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy Prisma files for migrations
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules/.prisma ./apps/web/node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules/@prisma ./apps/web/node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "apps/web/server.js"]
