#!/bin/bash
# Script to apply database schema to Cloud SQL
# This will be run as a one-time Cloud Build job

set -e

echo "Installing PostgreSQL client..."
apt-get update && apt-get install -y postgresql-client

echo "Connecting to Cloud SQL and applying schema..."
PGPASSWORD="${DB_PASS}" psql -h "/cloudsql/${INSTANCE_CONNECTION_NAME}" -U "${DB_USER}" -d "${DB_NAME}" -f init.sql

echo "Schema applied successfully!"
