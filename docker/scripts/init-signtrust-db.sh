#!/bin/bash
# ──────────────────────────────────────────────
# SignTrust — Initialise database & user
# Connects to the EXISTING trust-mysql container
# and creates the signtrust_db database + user.
#
# Usage:  ./docker/scripts/init-signtrust-db.sh
# Make executable:  chmod +x docker/scripts/init-signtrust-db.sh
# ──────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/../mysql/init-signtrust.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "[ERROR] SQL file not found: $SQL_FILE"
  exit 1
fi

echo "[INFO] Initialising SignTrust database on trust-mysql..."

docker exec -i trust-mysql mysql -uroot -pChangeMeRootP@ss2024 < "$SQL_FILE"

echo "[OK] SignTrust database and user created successfully."
