#!/usr/bin/env bash
set -euo pipefail

# validate-api.sh — Validate that required carousel endpoints exist in the OpenAPI spec.
#
# The spec has historically been emitted broken (paths:{}) when the server's Zod
# introspection fails. This script distinguishes that case from "endpoints really
# missing" because the fix lives in different places.
#
# Usage: bash scripts/validate-api.sh

OPENAPI_URL="${BLITZREELS_API_BASE_URL:-https://www.blitzreels.com}/api/openapi.json"

echo "Fetching OpenAPI spec from: $OPENAPI_URL"

SPEC=$(curl -sS "$OPENAPI_URL")

if [[ -z "$SPEC" ]]; then
  echo "❌ Failed to fetch OpenAPI spec" >&2
  exit 1
fi

# Detect the "spec is broken" case up-front so we don't drown the user in a wall
# of false "MISSING" reports.
PATH_COUNT=$(echo "$SPEC" | jq -r '.paths | length')
INFO_DESC=$(echo "$SPEC" | jq -r '.info.description // ""')

if [[ "$PATH_COUNT" == "0" ]]; then
  echo ""
  echo "⚠️  OpenAPI spec is currently broken: paths object is empty."
  if echo "$INFO_DESC" | grep -q "OpenAPI generation error"; then
    echo "    Server reports: $(echo "$INFO_DESC" | grep -oE '\[OpenAPI generation error[^]]*\]')"
  fi
  echo ""
  echo "This is a server-side issue, not a problem with your setup."
  echo "The API endpoints themselves are live — the skill's SKILL.md has the canonical field reference."
  echo ""
  echo "Report/track the spec issue rather than trying to consume openapi.json until it's fixed."
  exit 1
fi

# Required endpoints for carousel workflows.
# Only list endpoints the skill actually calls on its happy path.
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
