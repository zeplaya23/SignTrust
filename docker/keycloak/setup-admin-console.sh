#!/bin/bash
# ============================================================
# Setup SuperAdmin Console in Keycloak master realm
# Run this AFTER Keycloak is up and running.
# Usage: ./setup-admin-console.sh [KEYCLOAK_URL]
# ============================================================

KEYCLOAK_URL="${1:-http://localhost:5080/auth}"
ADMIN_USER="${KC_ADMIN_USER:-admin}"
ADMIN_PASS="${KC_ADMIN_PASS:-admin}"
REALM="master"

echo "==> Authenticating to Keycloak at $KEYCLOAK_URL..."

TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASS" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to authenticate. Check Keycloak URL and credentials."
  exit 1
fi
echo "==> Authenticated successfully."

AUTH="Authorization: Bearer $TOKEN"

# --- 1. Create SUPER_ADMIN role in master realm ---
echo "==> Creating SUPER_ADMIN role..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SUPER_ADMIN",
    "description": "SignTrust platform super administrator",
    "composite": false,
    "clientRole": false
  }' 2>/dev/null || true
echo "    Done."

# --- 2. Create signtrust-admin-console client ---
echo "==> Creating signtrust-admin-console client..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d @"$SCRIPT_DIR/master-realm-admin-client.json" 2>/dev/null || true
echo "    Done."

# --- 3. Create superadmin user ---
echo "==> Creating superadmin user (admin@cryptoneo.ci)..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "email": "admin@cryptoneo.ci",
    "firstName": "Super",
    "lastName": "Admin",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "admin",
      "temporary": false
    }]
  }' 2>/dev/null || true

# --- 4. Get user ID and assign SUPER_ADMIN role ---
echo "==> Assigning SUPER_ADMIN role..."
USER_ID=$(curl -s "$KEYCLOAK_URL/admin/realms/$REALM/users?username=superadmin" \
  -H "$AUTH" | python3 -c "import sys,json; users=json.load(sys.stdin); print(users[0]['id'] if users else '')" 2>/dev/null)

if [ -n "$USER_ID" ]; then
  ROLE_REP=$(curl -s "$KEYCLOAK_URL/admin/realms/$REALM/roles/SUPER_ADMIN" -H "$AUTH" 2>/dev/null)
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "[$ROLE_REP]" 2>/dev/null
  echo "    Assigned SUPER_ADMIN to user $USER_ID"
else
  echo "    WARNING: Could not find superadmin user."
fi

echo ""
echo "============================================"
echo " SuperAdmin Console setup complete!"
echo " Client:   signtrust-admin-console"
echo " User:     superadmin / admin"
echo " Email:    admin@cryptoneo.ci"
echo " Role:     SUPER_ADMIN"
echo " Console:  http://localhost:5174/admin/login"
echo "============================================"
