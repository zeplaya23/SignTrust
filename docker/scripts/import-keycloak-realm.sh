#!/bin/bash
# ──────────────────────────────────────────────
# SignTrust — Import Keycloak realm
# Uses a temporary curl container on trust-net to
# reach Keycloak (no ports exposed on host).
# ──────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REALM_FILE="${SCRIPT_DIR}/../keycloak/signtrust-realm.json"

ADMIN_USER="admin"
ADMIN_PASSWORD="ChangeMeKcAdminP@ss2024"
KC_URL="http://trust-keycloak:8080/auth"
NETWORK="maintrustplatform_trust-net"

if [ ! -f "$REALM_FILE" ]; then
  echo "[ERROR] Realm JSON not found: $REALM_FILE"
  exit 1
fi

# Helper: run curl via a temporary container on trust-net
run_curl() {
  docker run --rm --network "$NETWORK" \
    -v "$REALM_FILE:/tmp/signtrust-realm.json:ro" \
    curlimages/curl:latest \
    "$@"
}

echo "[INFO] Authenticating with Keycloak admin API..."

TOKEN_RESPONSE=$(run_curl -sf -X POST \
  "${KC_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=admin-cli&username=${ADMIN_USER}&password=${ADMIN_PASSWORD}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | sed 's/.*"access_token":"\([^"]*\)".*/\1/')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "$TOKEN_RESPONSE" ]; then
  echo "[ERROR] Failed to obtain admin token."
  echo "$TOKEN_RESPONSE"
  exit 1
fi

echo "[INFO] Token acquired. Checking if realm 'signtrust' exists..."

HTTP_CODE=$(run_curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${KC_URL}/admin/realms/signtrust" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "[WARN] Realm 'signtrust' already exists. Updating via PUT..."
  RESPONSE=$(run_curl -s -o /dev/null -w "%{http_code}" -X PUT \
    "${KC_URL}/admin/realms/signtrust" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d @/tmp/signtrust-realm.json)
  echo "[OK] Realm 'signtrust' updated (HTTP $RESPONSE)."
else
  echo "[INFO] Creating new realm 'signtrust'..."
  RESPONSE=$(run_curl -s -o /dev/null -w "%{http_code}" -X POST \
    "${KC_URL}/admin/realms" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d @/tmp/signtrust-realm.json)
  echo "[OK] Realm 'signtrust' imported (HTTP $RESPONSE)."
fi

echo "[DONE] Keycloak realm 'signtrust' is ready."
