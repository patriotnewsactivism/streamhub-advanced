# Deployment Readiness Status

This file summarizes what is already finished, what remains from the roadmap/TODO, and the checks needed to keep the Google Cloud deployment (Cloud Run + Cloud SQL + optional Compute Engine relay VM) in sync.

## Completed
- PostgreSQL schema checked in (`init.sql`) and load scripts (`apply-schema.sh`, `apply-schema-job.sh`).
- Backend service (`backend/server.js`) deployed with health and DB test endpoints.
- Service Networking IAM fix (`service-networking-iam.tf`) to unblock private IP Cloud SQL creation.
- Docker + Cloud Build pipelines for frontend/backed images (`cloudbuild.yaml`, `cloudbuild-init.yaml`).

## Still Outstanding from PLAN/TODO
- **Streaming path**: WebSocket binary handler + FFmpeg piping from the browser is still a stub; RTMP bridge is not wired.
- **Authentication**: No JWT/session implementation; endpoints are unauthenticated.
- **Redis**: Configured as optional but not required or validated in production.
- **CI/CD hardening**: Monitoring/logging are documented but not automated; no test suite runs in the pipeline.
- **Cloud VM integration**: Frontend CloudVMManager is a mock; no backend orchestration for provisioning or relaying via Compute Engine/Cloud Run jobs.

## Deployment sync checklist (run after any schema or backend change)
1. **Build & deploy** via Cloud Build:
   ```bash
   gcloud builds submit --config cloudbuild.yaml \
     --substitutions _REGION=${REGION},_INSTANCE_CONNECTION_NAME=${INSTANCE},_DB_USER=${DB_USER},_DB_NAME=${DB_NAME}
   ```
2. **Re-apply schema** so Cloud SQL matches `init.sql`:
   ```bash
   gcloud builds submit --config cloudbuild-init.yaml \
     --substitutions _INSTANCE_CONNECTION_NAME=${INSTANCE},_DB_USER=${DB_USER},_DB_NAME=${DB_NAME}
   ```
3. **Verify connectivity from the running service or VM**:
   ```bash
   curl -f https://<backend-host>/health
   curl -f https://<backend-host>/api/test-db
   ```
4. **Attach VPC connector if needed** to reach private IP services:
   ```bash
   gcloud run services update streamhub-backend \
     --region ${REGION} \
     --vpc-connector ${VPC_CONNECTOR_NAME} \
     --vpc-egress all-traffic
   ```
5. **Confirm IAM bindings** so Cloud Build can act as the runtime service account:
   ```bash
   gcloud iam service-accounts add-iam-policy-binding "${CLOUD_RUN_SA}" \
     --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

## Next actions to unblock VM-based streaming
- Implement the WebSocket binary ingest and FFmpeg piping in `backend/server.js`.
- Add API + infrastructure to provision/attach Compute Engine instances (or Cloud Run Jobs) for relay workloads with private VPC access.
- Secure all endpoints with JWT + role-based checks and enforce secret management via Secret Manager.
- Add automated smoke tests to Cloud Build to fail fast on deploy regressions.
