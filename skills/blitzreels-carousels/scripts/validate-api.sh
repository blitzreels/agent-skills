#!/usr/bin/env bash
set -euo pipefail

# validate-api.sh — Validate that required carousel endpoints exist in the OpenAPI spec
#
# Usage: bash scripts/validate-api.sh

OPENAPI_URL="${BLITZREELS_API_BASE_URL:-https://www.blitzreels.com}/api/openapi.json"

echo "Fetching OpenAPI spec from: $OPENAPI_URL"

# Fetch spec
SPEC=$(curl -s "$OPENAPI_URL")

if [[ -z "$SPEC" ]]; then
  echo "❌ Failed to fetch OpenAPI spec" >&2
  exit 1
fi

# Required endpoints for carousel workflows
REQUIRED_ENDPOINTS=(
  "/projects"
  "/projects/{id}/media"
  "/projects/{id}/timeline/media"
  "/projects/{id}/text-overlays"
  "/projects/{id}/context"
  "/projects/{id}/export"
)

echo ""
echo "Validating required carousel endpoints..."
echo ""

MISSING_COUNT=0

for endpoint in "${REQUIRED_ENDPOINTS[@]}"; do
  # Check if endpoint exists in spec (escape braces for grep)
  ESCAPED=$(echo "$endpoint" | sed 's/{/\\{/g' | sed 's/}/\\}/g')

  if echo "$SPEC" | jq -e ".paths | has(\"$endpoint\")" > /dev/null 2>&1; then
    echo "✅ $endpoint"
  else
    echo "❌ $endpoint (MISSING)"
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
done

echo ""

if [[ $MISSING_COUNT -gt 0 ]]; then
  echo "❌ Validation failed: $MISSING_COUNT endpoint(s) missing"
  echo ""
  echo "This may indicate:"
  echo "  - API spec is out of date"
  echo "  - Endpoint paths have changed"
  echo "  - Feature not yet available in public API"
  echo ""
  echo "Review the spec at: $OPENAPI_URL"
  exit 1
else
  echo "✅ All required carousel endpoints found"
  echo ""
  echo "You're ready to create carousels!"
fi
