#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BLITZREELS_API_BASE_URL:-https://blitzreels.com/api/v1}"
API_KEY="${BLITZREELS_API_KEY:-}"

if [[ -z "$API_KEY" ]]; then
  echo "BLITZREELS_API_KEY is required" >&2
  exit 1
fi

if [[ $# -lt 2 ]]; then
  echo "Usage: blitzreels.sh METHOD PATH [JSON_BODY]" >&2
  echo "Example: blitzreels.sh POST /projects '{\"name\":\"My Video\"}'" >&2
  exit 1
fi

METHOD="$1"
PATH_PART="$2"
BODY="${3:-}"

if [[ -n "$BODY" ]]; then
  curl -sS -X "$METHOD" "${BASE_URL}${PATH_PART}" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$BODY"
else
  curl -sS -X "$METHOD" "${BASE_URL}${PATH_PART}" \
    -H "Authorization: Bearer $API_KEY"
fi

