#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# BrewLite A2 - Automated Post-Deployment Smoke Test Suite
# Stages: Docker Image -> Registry -> Deploy -> Smoke Test -> Rollback
# ==============================================================================

API_BASE_URL="${API_BASE_URL:-http://localhost:4001}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:3001}"
MAX_RETRIES="${MAX_RETRIES:-10}"
RETRY_DELAY="${RETRY_DELAY:-3}"

echo "========================================================"
echo " Starting Post-Deployment Smoke Test"
echo " Target API: $API_BASE_URL"
echo " Target Web: $WEB_BASE_URL"
echo " Retries:    $MAX_RETRIES (delay: ${RETRY_DELAY}s)"
echo "========================================================"

wait_for_service() {
  local url="$1"
  local name="$2"
  local retries=0
  echo -n "Waiting for $name to be responsive..."
  until curl -sf -o /dev/null "$url" || [ "$retries" -ge "$MAX_RETRIES" ]; do
    retries=$((retries + 1))
    echo -n "."
    sleep "$RETRY_DELAY"
  done
  echo ""
  if [ "$retries" -ge "$MAX_RETRIES" ]; then
    echo "❌ ERROR: $name at $url is not responding after $((MAX_RETRIES * RETRY_DELAY))s!"
    return 1
  fi
  echo " $name is responsive!"
  return 0
}

# 1. Wait for API and Web services to boot up
wait_for_service "$API_BASE_URL/api/health" "Backend API"
wait_for_service "$WEB_BASE_URL" "Frontend Web"

FAILED_TESTS=0

test_endpoint() {
  local description="$1"
  local url="$2"
  local expected_pattern="$3"

  echo -n "Running Test: $description ... "
  local response
  response=$(curl -sSL "$url" 2>&1 || true)

  if echo "$response" | grep -qi "$expected_pattern"; then
    echo " PASSED"
  else
    echo "❌ FAILED"
    echo "   Expected pattern: $expected_pattern"
    echo "   Actual response:  $response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

echo ""
echo "--- Executing Core Smoke Checks ---"

# Check 1: Healthcheck API + PostgreSQL connection
test_endpoint "1. Backend Health & DB connectivity (GET /api/health)" \
  "$API_BASE_URL/api/health" \
  '"status":"ok"'

# Check 2: Frontend Home UI (Next.js SSR/Static)
test_endpoint "2. Frontend Homepage Rendering (GET /)" \
  "$WEB_BASE_URL" \
  'BrewLite'

# Check 3: Product Catalog Retrieval (GET /api/products)
test_endpoint "3. Product Catalog API (GET /api/products)" \
  "$API_BASE_URL/api/products" \
  '"data":'

# Check 4: VNPay Security Guard (P0.1 Tamper rejection on unsigned callback)
test_endpoint "4. VNPay Security Signature Guard (GET /api/payments/vnpay/verify)" \
  "$API_BASE_URL/api/payments/vnpay/verify" \
  '"responseCode":"99"'

# Check 5: Barista KDS Route (GET /barista)
test_endpoint "5. Barista KDS UI Interface (GET /barista)" \
  "$WEB_BASE_URL/barista" \
  'BrewLite'

echo ""
echo "========================================================"
if [ "$FAILED_TESTS" -eq 0 ]; then
  echo " ALL SMOKE TESTS PASSED! Deployment verified healthy."
  echo "========================================================"
  exit 0
else
  echo "❌ SMOKE TEST FAILED: $FAILED_TESTS check(s) failed!"
  echo " Initiating automatic rollback recommendation..."
  echo "========================================================"
  exit 1
fi

