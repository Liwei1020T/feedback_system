#!/bin/bash
set -e

echo "Starting Feedback Management System..."

# Check if database file exists
DB_FILE="${DATA_STORE_PATH:-/app/data/db.json}"
DB_DIR=$(dirname "$DB_FILE")

# Ensure data directory exists
mkdir -p "$DB_DIR"
echo "Data directory ready: $DB_DIR"

# Check if we need to seed demo data
SEED_DEMO="${SEED_DEMO_DATA:-true}"

if [ "$SEED_DEMO" = "true" ] && [ ! -f "$DB_FILE" ]; then
    echo "Database not found. Initializing with demo data..."

    # The application will create default data on first run
    # We'll enhance it with additional demo data after startup
    echo "Demo data will be seeded on first application start"
else
    echo "Using existing database: $DB_FILE"
fi

# Start the application
echo "Launching application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "${WORKERS:-1}"
