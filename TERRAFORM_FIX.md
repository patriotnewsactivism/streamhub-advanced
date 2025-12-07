# Terraform Deployment Fix for Cloud SQL Private IP

## Problem

The Cloud Build deployment was failing with the following error:

```
Error: Error waiting for Create Instance:
on main.tf line 146
running tf apply: terraform apply failed: running terraform failed: exit status 1
```

## Root Cause

When creating a Google Cloud SQL instance with a private IP address (no public IP), Google Cloud Platform requires specific IAM permissions for service accounts:

1. **Service Networking Service Account**: Needs `roles/servicenetworking.serviceAgent` to manage private service connections
2. **Cloud SQL Service Account**: Needs `roles/compute.networkUser` to use the VPC network

The Google Cloud Config SDK deployment using the `terraform-google-three-tier-app` blueprint doesn't automatically grant these permissions in all cases, causing the SQL instance creation to fail.

## Solution

Created `service-networking-iam.tf` which:

1. **Grants servicenetworking.serviceAgent role** to the Service Networking service account
   - Service account: `service-<PROJECT_NUMBER>@service-networking.iam.gserviceaccount.com`
   - This allows the service to create and manage private service connections

2. **Grants compute.networkUser role** to the Cloud SQL service account
   - Service account: `service-<PROJECT_NUMBER>@gcp-sa-cloud-sql.iam.gserviceaccount.com`
   - This allows Cloud SQL instances to use the VPC network

3. **Proper dependencies**: Ensures these IAM bindings are created after the project services are enabled and before the SQL instance is created

## How It Works

The Config SDK Terraform image automatically merges all `.tf` files in the repository with the remote blueprint. By adding `service-networking-iam.tf`, we extend the blueprint configuration without modifying the original source.

## References

- [Stack Overflow: Cloud SQL Instance Fails with Service Account Error](https://stackoverflow.com/questions/72889719/google-cloud-cloudsql-instance-fails-to-create-using-terraform-provider-with-err)
- [Google Cloud: Configure Private Services Access](https://cloud.google.com/sql/docs/postgres/configure-private-services-access)
- [Medium: Deploy Cloud SQL with Private IP using Terraform](https://medium.com/swlh/how-to-deploy-a-cloud-sql-db-with-a-private-ip-only-using-terraform-e184b08eca64)

## Testing

To test this fix, trigger a new Cloud Build:

```bash
gcloud builds submit
```

Or through the Cloud Config SDK deployment interface.

## Expected Behavior

With this fix:
1. Project services will be enabled
2. IAM permissions will be granted to service accounts
3. VPC network will be created
4. Service networking connection will be established
5. **Cloud SQL instance will successfully create** with private IP
6. Redis instance will be created
7. Cloud Run services will be deployed

The deployment should complete without the "Error waiting for Create Instance" error.
