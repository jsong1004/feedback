#!/bin/bash

# Mentorship Feedback Platform - Cloud Run Deployment Script
# This script builds and deploys the application to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-feedback-platform}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${GREEN}🚀 Mentorship Feedback Platform Deployment${NC}"
echo "================================================"
echo "Project ID: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service Name: ${SERVICE_NAME}"
echo "================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated. Running gcloud auth login...${NC}"
    gcloud auth login
fi

# Set the project
echo -e "${YELLOW}📋 Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com

# Build the Docker image
echo -e "${YELLOW}🏗️  Building Docker image...${NC}"
gcloud builds submit --tag ${IMAGE_NAME}

# Deploy to Cloud Run
echo -e "${YELLOW}🚢 Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production" \
    --add-cloudsql-instances ${PROJECT_ID}:${REGION}:feedback-db

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"

echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo "1. Configure environment variables in Cloud Run console:"
echo "   - DATABASE_URL (from Cloud SQL)"
echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo "   - NEXTAUTH_URL (your service URL)"
echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo "   - SMTP_* variables for email notifications"
echo ""
echo "2. Run database migrations:"
echo "   gcloud run jobs create migration-job \\"
echo "     --image ${IMAGE_NAME} \\"
echo "     --region ${REGION} \\"
echo "     --set-env-vars DATABASE_URL=<your-connection-string> \\"
echo "     --command=\"pnpm,db:migrate:deploy\""
echo ""
echo "3. Optionally seed the database:"
echo "   gcloud run jobs create seed-job \\"
echo "     --image ${IMAGE_NAME} \\"
echo "     --region ${REGION} \\"
echo "     --set-env-vars DATABASE_URL=<your-connection-string> \\"
echo "     --command=\"pnpm,db:seed\""
