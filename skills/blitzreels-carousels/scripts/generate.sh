#!/usr/bin/env bash
set -euo pipefail

# generate.sh — One-call carousel generation via:
#   POST /projects/{projectId}/carousels/generate
#
# Given a carousel project and a slides payload, the server will:
#   - upload any background_image_urls as project media
#   - kick off a batch AI image run for any background_prompts (async, job-based)
#   - insert all slides on the timeline as fullscreen images
#   - add solid/gradient fill layers (for those strategies)
#   - add title + body text overlays per slide (64px white, black stroke)
#
# If any slide uses AI image generation, the response includes `job_id`.
# Poll `/jobs/{job_id}` until complete before exporting.
# If every slide uses a provided URL or fill color, the response returns
# `job_id: null` and the carousel is ready to export immediately.
#
# Platform slide caps (from project.carousel_settings.platform):
#   tiktok: 35, instagram: 10, default: 35

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLITZREELS_SH="${SCRIPT_DIR}/blitzreels.sh"

usage() {
  cat <<'EOF'
Usage: generate.sh --project-id UUID --slides-json FILE [options]

Required:
  --project-id UUID                 Project must have been created with project_type=carousel
  --slides-json FILE                JSON file with the full request body (see below)

Options (only used when --slides-json is omitted; the file wins when both supplied):
  --clear-existing true|false       Default: false — wipes timeline items + content items (keeps media library)
  --slide-duration SECONDS          Default: 3
  --background-strategy STRATEGY    solid | gradient | image | mixed (default: mixed)
  --image-model MODEL_ID            e.g. fal-ai/nano-banana (default), fal-ai/bytedance/seedream/v5/lite/text-to-image

Slides JSON example (/tmp/slides.json):
  {
    "clear_existing": true,
    "slide_duration_seconds": 3,
    "background_strategy": "mixed",
    "image_model_id": "fal-ai/nano-banana",
    "slides": [
      { "title": "Hook", "body": "...", "background_prompt": "candid iPhone selfie, messy room, warm lamp, light grain" },
      { "title": "Point", "background_image_url": "https://..." },
      { "title": "CTA",  "body": "...", "background_color": "#0b0b0f" }
    ]
  }

Strategy semantics:
  image     → every slide must supply background_image_url (400 otherwise)
  mixed     → each slide supplies background_image_url OR background_prompt (400 if both missing)
  solid     → ignores image fields; uses background_color per slide (default #000000)
  gradient  → same as solid but renders a gradient fill

Polling:
  If response.job_id is non-null, AI images are still rendering:
    bash scripts/blitzreels.sh GET "/jobs/${JOB_ID}"
  Terminal states: "complete" (ready to export) or a failure state. Re-check until one of those.

Examples:
  # Full control via file
  bash scripts/generate.sh --project-id "$PROJECT_ID" --slides-json /tmp/slides.json

  # Skeleton body from flags (slides still required — provide via file for real runs)
  bash scripts/generate.sh --project-id "$PROJECT_ID" --slides-json /tmp/slides.json \
    --slide-duration 4 --background-strategy solid
EOF
  exit 0
}

PROJECT_ID=""
SLIDES_JSON=""
CLEAR_EXISTING=""
SLIDE_DURATION=""
BACKGROUND_STRATEGY=""
IMAGE_MODEL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-id) PROJECT_ID="${2:-}"; shift 2 ;;
    --slides-json) SLIDES_JSON="${2:-}"; shift 2 ;;
    --clear-existing) CLEAR_EXISTING="${2:-}"; shift 2 ;;
    --slide-duration) SLIDE_DURATION="${2:-}"; shift 2 ;;
    --background-strategy) BACKGROUND_STRATEGY="${2:-}"; shift 2 ;;
    --image-model) IMAGE_MODEL="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  echo "--project-id is required" >&2
  exit 1
fi

if [[ -z "$SLIDES_JSON" ]]; then
  echo "--slides-json is required (the endpoint has no meaningful default for 'slides')" >&2
  exit 1
fi

if [[ ! -f "$SLIDES_JSON" ]]; then
  echo "Slides JSON file not found: $SLIDES_JSON" >&2
  exit 1
fi

BODY=$(cat "$SLIDES_JSON")

# Optional flag overrides. Only overwrite keys the user actually set.
if [[ -n "$CLEAR_EXISTING" ]]; then
  BODY=$(echo "$BODY" | jq --argjson v "$CLEAR_EXISTING" '.clear_existing = $v')
fi
if [[ -n "$SLIDE_DURATION" ]]; then
  BODY=$(echo "$BODY" | jq --argjson v "$SLIDE_DURATION" '.slide_duration_seconds = $v')
fi
if [[ -n "$BACKGROUND_STRATEGY" ]]; then
  BODY=$(echo "$BODY" | jq --arg v "$BACKGROUND_STRATEGY" '.background_strategy = $v')
fi
if [[ -n "$IMAGE_MODEL" ]]; then
  BODY=$(echo "$BODY" | jq --arg v "$IMAGE_MODEL" '.image_model_id = $v')
fi

echo "POST /projects/${PROJECT_ID}/carousels/generate"
RES=$(bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/carousels/generate" "$BODY")
echo "$RES" | jq .

JOB_ID=$(echo "$RES" | jq -r '.job_id // empty')
if [[ -n "$JOB_ID" ]]; then
  echo ""
  echo "AI image run in progress. Poll until complete before export:"
  echo "  bash scripts/blitzreels.sh GET \"/jobs/${JOB_ID}\""
fi
