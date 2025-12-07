#!/bin/bash
# StreamHub Pro Backend Deployment Script
# Deploys to Cloud Run with PostgreSQL Cloud SQL connection

set -e

PROJECT_ID="${PROJECT_ID:-your-gcp-project}"
SERVICE_NAME="${SERVICE_NAME:-streamhub-pro}"
REGION="${REGION:-us-west1}"
INSTANCE_CONNECTION_NAME="${INSTANCE_CONNECTION_NAME:-your-gcp-project:your-region:your-instance}"
IMAGE="${IMAGE:-${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}:latest}"

echo "🚀 Deploying StreamHub Pro Backend to Cloud Run..."

gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE} \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production,DB_NAME=streamhub,DB_USER=streamhub,INSTANCE_CONNECTION_NAME=${INSTANCE_CONNECTION_NAME},ENABLE_RTMP=false" \
  --set-secrets="DB_PASS=streamhub-db-password:latest" \
  --add-cloudsql-instances=${INSTANCE_CONNECTION_NAME} \
  --port=8080

echo "✅ Deployment complete!"
echo "🔗 Service URL: $(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')"
