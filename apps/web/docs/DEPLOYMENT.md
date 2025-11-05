# Deployment Guide

This guide covers deploying the Mentorship Feedback Platform to Google Cloud Platform.

## Prerequisites

- Google Cloud Platform account
- gcloud CLI installed and configured
- Docker installed (for local testing)
- Project with billing enabled

## Architecture

- **Compute**: Google Cloud Run (serverless containers)
- **Database**: Cloud SQL for PostgreSQL
- **Container Registry**: Google Container Registry (GCR)
- **Build**: Cloud Build

## Step 1: Set Up Cloud SQL

### Create PostgreSQL Instance

```bash
# Set variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export DB_INSTANCE_NAME="feedback-db"

# Create Cloud SQL instance
gcloud sql instances create ${DB_INSTANCE_NAME} \
  --project=${GCP_PROJECT_ID} \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=${GCP_REGION} \
  --root-password=your-secure-password \
  --backup \
  --backup-start-time=02:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=3
```

### Create Database

```bash
# Create the database
gcloud sql databases create feedback_prod \
  --instance=${DB_INSTANCE_NAME}

# Create a user
gcloud sql users create feedback_user \
  --instance=${DB_INSTANCE_NAME} \
  --password=your-secure-password
```

### Get Connection String

```bash
# Get the connection name
gcloud sql instances describe ${DB_INSTANCE_NAME} \
  --format='value(connectionName)'

# Connection string format:
# postgresql://feedback_user:password@/feedback_prod?host=/cloudsql/PROJECT:REGION:INSTANCE
```

## Step 2: Configure Secrets

### Create Secrets in Secret Manager

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets
echo -n "postgresql://feedback_user:password@/feedback_prod?host=/cloudsql/${GCP_PROJECT_ID}:${GCP_REGION}:${DB_INSTANCE_NAME}" | \
  gcloud secrets create database-url --data-file=-

# Generate NextAuth secret
openssl rand -base64 32 | \
  gcloud secrets create nextauth-secret --data-file=-

# Add Google OAuth credentials
echo -n "your-google-client-id" | \
  gcloud secrets create google-client-id --data-file=-
echo -n "your-google-client-secret" | \
  gcloud secrets create google-client-secret --data-file=-

# Add SMTP credentials
echo -n "smtp.gmail.com" | gcloud secrets create smtp-host --data-file=-
echo -n "587" | gcloud secrets create smtp-port --data-file=-
echo -n "your-email@gmail.com" | gcloud secrets create smtp-user --data-file=-
echo -n "your-app-password" | gcloud secrets create smtp-password --data-file=-
echo -n "noreply@yourdomain.com" | gcloud secrets create smtp-from --data-file=-
```

## Step 3: Build and Deploy

### Option A: Using Deploy Script (Recommended)

```bash
# Set environment variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export SERVICE_NAME="feedback-platform"

# Run deployment script
./deploy.sh
```

### Option B: Manual Deployment

```bash
# Build Docker image
gcloud builds submit --tag gcr.io/${GCP_PROJECT_ID}/feedback-platform

# Deploy to Cloud Run
gcloud run deploy feedback-platform \
  --image gcr.io/${GCP_PROJECT_ID}/feedback-platform \
  --platform managed \
  --region ${GCP_REGION} \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --add-cloudsql-instances ${GCP_PROJECT_ID}:${GCP_REGION}:${DB_INSTANCE_NAME} \
  --set-secrets="DATABASE_URL=database-url:latest,NEXTAUTH_SECRET=nextauth-secret:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,SMTP_HOST=smtp-host:latest,SMTP_PORT=smtp-port:latest,SMTP_USER=smtp-user:latest,SMTP_PASSWORD=smtp-password:latest,SMTP_FROM=smtp-from:latest"
```

## Step 4: Run Database Migrations

After deployment, run Prisma migrations using Cloud Run Jobs:

```bash
# Create migration job
gcloud run jobs create migration-job \
  --image gcr.io/${GCP_PROJECT_ID}/feedback-platform \
  --region ${GCP_REGION} \
  --set-cloudsql-instances ${GCP_PROJECT_ID}:${GCP_REGION}:${DB_INSTANCE_NAME} \
  --set-secrets="DATABASE_URL=database-url:latest" \
  --command="pnpm" \
  --args="db:migrate:deploy"

# Execute the migration job
gcloud run jobs execute migration-job --region ${GCP_REGION}
```

## Step 5: Seed Database (Optional)

```bash
# Create seed job
gcloud run jobs create seed-job \
  --image gcr.io/${GCP_PROJECT_ID}/feedback-platform \
  --region ${GCP_REGION} \
  --set-cloudsql-instances ${GCP_PROJECT_ID}:${GCP_REGION}:${DB_INSTANCE_NAME} \
  --set-secrets="DATABASE_URL=database-url:latest" \
  --command="pnpm" \
  --args="db:seed"

# Execute the seed job
gcloud run jobs execute seed-job --region ${GCP_REGION}
```

## Step 6: Configure OAuth Redirect URLs

After deployment, update your Google OAuth credentials:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Find your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://your-service-url.run.app/api/auth/callback/google`
4. Add authorized JavaScript origins:
   - `https://your-service-url.run.app`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@/db?host=/cloudsql/...` |
| `NEXTAUTH_URL` | Application URL | `https://your-service.run.app` |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From GCP Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | From GCP Console |

### Email Configuration (Optional but Recommended)

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password/app password | Your Gmail app password |
| `SMTP_FROM` | From email address | `noreply@yourdomain.com` |

## Monitoring and Logs

### View Logs

```bash
# View Cloud Run logs
gcloud run services logs read feedback-platform \
  --region ${GCP_REGION} \
  --limit 50

# Stream logs
gcloud run services logs tail feedback-platform \
  --region ${GCP_REGION}
```

### Monitor Performance

1. Go to Cloud Console → Cloud Run
2. Select your service
3. View metrics: requests, latency, errors, container instances

## Scaling Configuration

Cloud Run auto-scales based on traffic. Adjust settings:

```bash
# Update scaling settings
gcloud run services update feedback-platform \
  --region ${GCP_REGION} \
  --min-instances 1 \
  --max-instances 20 \
  --concurrency 80
```

## Cost Optimization

### Development Environment
- Cloud SQL: db-f1-micro (shared CPU, 0.6GB RAM)
- Cloud Run: 512Mi memory, min 0 instances
- Estimated cost: $10-30/month

### Production Environment
- Cloud SQL: db-n1-standard-1 (1 vCPU, 3.75GB RAM)
- Cloud Run: 1Gi memory, min 1 instance
- Estimated cost: $50-150/month

## Backup and Recovery

### Automated Backups

Cloud SQL automatically creates backups daily. To restore:

```bash
# List backups
gcloud sql backups list --instance=${DB_INSTANCE_NAME}

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=${DB_INSTANCE_NAME} \
  --backup-id=BACKUP_ID
```

### Manual Backup

```bash
# Export database
gcloud sql export sql ${DB_INSTANCE_NAME} \
  gs://your-bucket/backup-$(date +%Y%m%d).sql \
  --database=feedback_prod
```

## Updating the Application

```bash
# Build new image
gcloud builds submit --tag gcr.io/${GCP_PROJECT_ID}/feedback-platform

# Deploy update (zero downtime)
gcloud run deploy feedback-platform \
  --image gcr.io/${GCP_PROJECT_ID}/feedback-platform \
  --region ${GCP_REGION}

# Run migrations if needed
gcloud run jobs execute migration-job --region ${GCP_REGION}
```

## Troubleshooting

### Connection Issues

```bash
# Test Cloud SQL connection
gcloud sql connect ${DB_INSTANCE_NAME} --user=feedback_user --database=feedback_prod
```

### Application Errors

```bash
# View recent errors
gcloud run services logs read feedback-platform \
  --region ${GCP_REGION} \
  --limit 100 \
  --filter="severity>=ERROR"
```

### Database Migration Issues

```bash
# Check migration status manually
gcloud run jobs execute migration-job --region ${GCP_REGION} --wait

# View job logs
gcloud run jobs logs read migration-job --region ${GCP_REGION}
```

## Security Best Practices

1. **Use Secret Manager**: Never hardcode secrets in environment variables
2. **Enable Cloud Armor**: Add DDoS protection and WAF rules
3. **Set up VPC**: Use VPC connector for private networking
4. **Enable Cloud Audit Logs**: Track all administrative actions
5. **Regular Updates**: Keep dependencies and base images updated
6. **SSL/TLS**: Cloud Run provides automatic HTTPS
7. **IAM Policies**: Follow principle of least privilege

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v1
      - run: |
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/feedback-platform
          gcloud run deploy feedback-platform --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/feedback-platform --region us-central1
```

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
