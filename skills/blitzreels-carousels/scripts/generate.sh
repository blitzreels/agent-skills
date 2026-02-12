#!/usr/bin/env bash
set -euo pipefail

# generate.sh — One-call carousel generation (backgrounds + overlays) via:
#   POST /projects/{id}/carousels/generate
#
# This builds/clears timeline items, inserts slide backgrounds, and adds text overlays.
# If you use background_strategy=ai_image or mixed, it will start an AI-image batch and
# return ai_image_run_id + ai_image_asset_ids.
#
# IMPORTANT:
# As of the current public OpenAPI spec (https://www.blitzreels.com/api/openapi.json),
# `/projects/{projectId}/carousels/generate` is not a documented public endpoint.
# Prefer `carousel.sh` (manual assembly) unless you know this endpoint is enabled.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLITZREELS_SH="${SCRIPT_DIR}/blitzreels.sh"

usage() {
  cat <<'EOF'
Usage: generate.sh --project-id UUID [options]

Options:
  --project-id UUID                 Required
  --clear-existing true|false       Optional (default: true)
  --slide-duration SECONDS          Optional (default: 3)
  --background-strategy mixed|ai_image|template   Optional (default: mixed)
  --slides-json FILE                Optional: JSON file containing request body fields (excluding projectId)

Examples:
  bash scripts/generate.sh --project-id "$PROJECT_ID" --slide-duration 3

  # Use a custom request body
  cat > /tmp/slides.json <<'JSON'
  {
    "clear_existing": true,
    "slide_duration_seconds": 3,
    "background_strategy": "mixed",
    "slides": [
      { "title": "Hook", "body": "One sentence.", "background_prompt": "Minimal abstract gradient background." },
      { "title": "Main point", "background_prompt": "Clean dark background with subtle texture." },
      { "title": "CTA", "body": "Follow for more.", "background_prompt": "Bright background, high contrast." }
    ]
  }
JSON
  bash scripts/generate.sh --project-id "$PROJECT_ID" --slides-json /tmp/slides.json
EOF
  exit 0
}

PROJECT_ID=""
CLEAR_EXISTING="true"
SLIDE_DURATION="3"
BACKGROUND_STRATEGY="mixed"
SLIDES_JSON=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-id) PROJECT_ID="${2:-}"; shift 2 ;;
    --clear-existing) CLEAR_EXISTING="${2:-}"; shift 2 ;;
    --slide-duration) SLIDE_DURATION="${2:-}"; shift 2 ;;
    --background-strategy) BACKGROUND_STRATEGY="${2:-}"; shift 2 ;;
    --slides-json) SLIDES_JSON="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  echo "--project-id is required" >&2
  exit 1
fi

BODY="{}"
if [[ -n "$SLIDES_JSON" ]]; then
  if [[ ! -f "$SLIDES_JSON" ]]; then
    echo "--slides-json file not found: $SLIDES_JSON" >&2
    exit 1
  fi
  BODY="$(cat "$SLIDES_JSON")"
else
  BODY=$(
    jq -n \
      --argjson clear "$CLEAR_EXISTING" \
      --argjson dur "$SLIDE_DURATION" \
      --arg strategy "$BACKGROUND_STRATEGY" \
      '{
        clear_existing: ($clear == true),
        slide_duration_seconds: $dur,
        background_strategy: $strategy,
        topic: "My carousel topic",
        slide_count: 5
      }'
  )
fi

echo "POST /projects/${PROJECT_ID}/carousels/generate"
bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/carousels/generate" "$BODY" | jq .
