# Google Cloud Platform Deployment Guide
## Three-Tier Architecture for StreamHub Pro

This guide covers deploying StreamHub Pro to Google Cloud Platform using a three-tier architecture.

## Architecture Overview

### Tier 1: Presentation Layer (Frontend)
- **Service**: Cloud Run or GKE
- **Container**: React/Vite app served by Nginx
- **Port**: 8080
- **Dockerfile**: `Dockerfile`

### Tier 2: Application Layer (Backend)
- **Service**: Cloud Run or GKE
- **Container**: Node.js RTMP streaming server with FFmpeg
- **Ports**: 3000 (API), 8080 (WebSocket), 1935 (RTMP), 8000 (HLS)
- **Dockerfile**: `Dockerfile.backend`

### Tier 3: Data Layer
- **Services**:
  - Cloud SQL (PostgreSQL) - User data, stream configurations
  - Cloud Memorystore (Redis) - Session management, caching
  - Cloud Storage - Media files, recordings

---

## Prerequisites

1. **Google Cloud SDK** installed and configured
   ```bash
   gcloud init
   ```

2. **Enable required APIs**
   ```bash
   gcloud services enable \
     run.googleapis.com \
     sqladmin.googleapis.com \
     redis.googleapis.com \
     storage.googleapis.com \
     artifactregistry.googleapis.com \
     compute.googleapis.com
   ```

3. **Set environment variables**
   ```bash
   export PROJECT_ID="your-gcp-project-id"
   export REGION="us-central1"
   export SERVICE_NAME="streamhub"
   ```

---

## Option 1: Deploy to Cloud Run (Recommended for Scalability)

### Step 1: Create Artifact Registry Repository

```bash
gcloud artifacts repositories create ${SERVICE_NAME} \
  --repository-format=docker \
  --location=${REGION} \
  --description="StreamHub containers"
```

### Step 2: Build and Push Frontend Container

```bash
# Build frontend
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/frontend:latest

# Deploy to Cloud Run
gcloud run deploy streamhub-frontend \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/frontend:latest \
  --platform managed \
  --region ${REGION} \
  --port 8080 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,BACKEND_URL=https://streamhub-backend-[hash].run.app"
```

### Step 3: Build and Push Backend Container

```bash
# Build backend
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/backend:latest \
  -f Dockerfile.backend

# Deploy to Cloud Run
gcloud run deploy streamhub-backend \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/backend:latest \
  --platform managed \
  --region ${REGION} \
  --port 3000 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 20 \
  --timeout 900 \
  --set-env-vars "NODE_ENV=production"
```

### Step 4: Set Up Cloud SQL (PostgreSQL)

```bash
# Create PostgreSQL instance
gcloud sql instances create streamhub-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=${REGION} \
  --root-password="your-secure-password"

# Create database
gcloud sql databases create streamhub --instance=streamhub-db

# Create user
gcloud sql users create streamhub \
  --instance=streamhub-db \
  --password="your-secure-password"

# Get connection name
gcloud sql instances describe streamhub-db --format="value(connectionName)"
```

### Step 5: Set Up Cloud Memorystore (Redis)

```bash
# Create Redis instance
gcloud redis instances create streamhub-cache \
  --size=1 \
  --region=${REGION} \
  --redis-version=redis_7_0 \
  --tier=basic

# Get Redis host
gcloud redis instances describe streamhub-cache \
  --region=${REGION} \
  --format="value(host)"
```

### Step 6: Create Cloud Storage Bucket

```bash
# Create bucket for media storage
gcloud storage buckets create gs://${PROJECT_ID}-streamhub-media \
  --location=${REGION} \
  --uniform-bucket-level-access

# Set CORS configuration
cat > cors.json <<EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update gs://${PROJECT_ID}-streamhub-media --cors-file=cors.json
```

### Step 7: Update Backend with Database Connections

```bash
# Update backend Cloud Run service with database connections
gcloud run services update streamhub-backend \
  --region ${REGION} \
  --add-cloudsql-instances ${PROJECT_ID}:${REGION}:streamhub-db \
  --set-env-vars "DATABASE_URL=postgresql://streamhub:your-secure-password@/streamhub?host=/cloudsql/${PROJECT_ID}:${REGION}:streamhub-db,REDIS_HOST=<redis-host>,REDIS_PORT=6379,STORAGE_BUCKET=${PROJECT_ID}-streamhub-media"
```

---

## Option 2: Deploy to Google Kubernetes Engine (GKE)

### Step 1: Create GKE Cluster

```bash
gcloud container clusters create streamhub-cluster \
  --region ${REGION} \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10 \
  --enable-autorepair \
  --enable-autoupgrade
```

### Step 2: Get Cluster Credentials

```bash
gcloud container clusters get-credentials streamhub-cluster --region ${REGION}
```

### Step 3: Create Kubernetes Manifests

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: streamhub-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: streamhub-frontend
  template:
    metadata:
      labels:
        app: streamhub-frontend
    spec:
      containers:
      - name: frontend
        image: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/frontend:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: streamhub-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: streamhub-backend
  template:
    metadata:
      labels:
        app: streamhub-backend
    spec:
      containers:
      - name: backend
        image: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/backend:latest
        ports:
        - containerPort: 3000
        - containerPort: 8080
        - containerPort: 1935
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: streamhub-secrets
              key: database-url
        - name: REDIS_HOST
          valueFrom:
            secretKeyRef:
              name: streamhub-secrets
              key: redis-host
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

### Step 4: Create Services and Ingress

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: streamhub-frontend
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: streamhub-frontend
---
apiVersion: v1
kind: Service
metadata:
  name: streamhub-backend
spec:
  type: LoadBalancer
  ports:
  - port: 3000
    targetPort: 3000
    name: api
  - port: 8080
    targetPort: 8080
    name: websocket
  - port: 1935
    targetPort: 1935
    name: rtmp
  - port: 8000
    targetPort: 8000
    name: hls
  selector:
    app: streamhub-backend
```

### Step 5: Deploy to GKE

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

---

## Local Development with Docker Compose

For local testing before deploying to GCP:

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
# WebSocket: ws://localhost:8081
# RTMP: rtmp://localhost:1935
```

---

## Environment Variables

### Frontend Environment Variables
- `NODE_ENV`: production
- `BACKEND_URL`: URL of the backend service
- `GEMINI_API_KEY`: Google Gemini API key (if client-side)

### Backend Environment Variables
- `NODE_ENV`: production
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`: Redis host address
- `REDIS_PORT`: Redis port (default: 6379)
- `STORAGE_BUCKET`: Cloud Storage bucket name
- `GEMINI_API_KEY`: Google Gemini API key

---

## Monitoring and Logging

### Enable Cloud Logging

```bash
# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=streamhub-frontend" --limit 50

# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=streamhub-backend" --limit 50
```

### Set Up Cloud Monitoring

```bash
# Create uptime check
gcloud monitoring uptime-checks create streamhub-frontend \
  --display-name="StreamHub Frontend" \
  --resource-type=uptime-url \
  --host=streamhub-frontend-[hash].run.app \
  --path=/
```

---

## Cost Optimization

1. **Cloud Run**: Use min-instances=0 for frontend, min-instances=1 for backend
2. **Cloud SQL**: Start with db-f1-micro tier, scale as needed
3. **Redis**: Use basic tier for development, standard for production
4. **Cloud Storage**: Use standard storage class, enable lifecycle policies

---

## Security Best Practices

1. **Service Accounts**: Create dedicated service accounts for each service
2. **VPC**: Use VPC connector for Cloud Run to communicate with Cloud SQL/Redis
3. **Secrets**: Use Secret Manager for API keys and credentials
4. **IAM**: Apply principle of least privilege
5. **HTTPS**: Always enforce HTTPS, Cloud Run provides this by default

---

## Troubleshooting

### Frontend not loading
```bash
gcloud run services describe streamhub-frontend --region ${REGION}
```

### Backend connection issues
```bash
# Check backend logs
gcloud run logs read streamhub-backend --region ${REGION} --limit 100

# Test backend endpoint
curl https://streamhub-backend-[hash].run.app/health
```

### Database connection errors
```bash
# Verify Cloud SQL instance
gcloud sql instances list

# Test connection from Cloud Shell
gcloud sql connect streamhub-db --user=streamhub
```

---

## Next Steps

1. Set up CI/CD with Cloud Build
2. Configure custom domain with Cloud DNS
3. Enable Cloud CDN for static assets
4. Implement autoscaling policies
5. Set up automated backups for Cloud SQL

For support, see the main [README.md](README.md) file.
