#!/bin/bash
# Apply database schema using psql with Cloud SQL connection

set -e

echo "📊 Applying StreamHub database schema..."

# Read password from secret
DB_PASSWORD=$(cat /tmp/db_password.txt)

# Connect to database and apply schema
PGPASSWORD="$DB_PASSWORD" psql \
  -h "/cloudsql/${INSTANCE_CONNECTION_NAME}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -f /app/init.sql

echo "✅ Schema applied successfully!"
