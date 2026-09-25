#!/bin/sh
set -e

# Automatically execute database migrations on container startup if enabled
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[Duesora] Checking database schema migrations..."
  node ./bin/duesora.mjs migrate || {
    echo "[Duesora] Warning: Automated migration attempt failed or database is not yet ready. Continuing startup..."
  }
fi

# Execute the container command (default: node server.js)
exec "$@"
