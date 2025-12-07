# Service Networking IAM Configuration
# This file grants the necessary IAM permissions for Cloud SQL private IP instances
#
# The Service Networking service account needs the servicenetworking.serviceAgent role
# to manage private service connections for Cloud SQL instances.
# Without this role, the SQL instance creation will fail with:
# "Error waiting for Create Instance: Per-Product Per-Project Service Account is not found"

# Get the project information
data "google_project" "project_info" {
  project_id = var.project_id
}

# Grant the Service Networking service agent role
# This must be created before the SQL instance
resource "google_project_iam_member" "service_networking_agent" {
  project = var.project_id
  role    = "roles/servicenetworking.serviceAgent"
  member  = "serviceAccount:service-${data.google_project.project_info.number}@service-networking.iam.gserviceaccount.com"

  # Ensure this is created after the service networking API is enabled
  depends_on = [
    module.project-services.google_project_service.project_services
  ]
}

# Also grant the networkUser role to the Cloud SQL service account
# This allows Cloud SQL to use the VPC network
resource "google_project_iam_member" "cloudsql_network_user" {
  project = var.project_id
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:service-${data.google_project.project_info.number}@gcp-sa-cloud-sql.iam.gserviceaccount.com"

  # Ensure this is created after the service networking API is enabled
  depends_on = [
    module.project-services.google_project_service.project_services
  ]
}
