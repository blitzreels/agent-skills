#!/usr/bin/env bash
set -euo pipefail

# faceless.sh — End-to-end faceless video generation via BlitzReels API.
# Wraps: create project → faceless generation → poll → export → download URL.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLITZREELS_SH="${SCRIPT_DIR}/blitzreels.sh"

BASE_URL="${BLITZREELS_API_BASE_URL:-https://www.blitzreels.com/api/v1}"
API_KEY="${BLITZREELS_API_KEY:-}"

usage() {
  cat <<'EOF'
Usage: faceless.sh [OPTIONS]

Generate a faceless video end-to-end.

Required (one of):
  --topic TEXT          Topic for AI-generated script
  --script TEXT         User-provided script (paragraph breaks = scene breaks)

Options:
  --duration SECONDS    Video duration, 10–120 (default: 30)
  --voice VOICE_ID      ElevenLabs voice ID (default: rachel)
  --style STYLE_ID      Visual style ID (default: cinematic)
  --image-model ID      Image model (default: google-gemini-2.5-flash-image)
  --video-model ID      Video model (default: kling-2.1)
  --video-duration SEC  Per-clip video duration, 3–10 (default: model-dependent)
  --storyboard-only     Generate images only (no video/audio)
  --no-animated-video   Skip video animation (images + audio only)
  --aspect RATIO        Aspect ratio: 9:16, 16:9, 1:1 (default: 9:16)
  --name TEXT           Project name (default: auto-generated from topic)
  --captions BOOL       Enable captions: true/false (default: true)
  --caption-style ID    Caption style preset
  --resolution RES      Export resolution: 720p, 1080p, 4k (default: 1080p)
  --yes                 Skip confirmation prompt (for CI/automation)
  --dry-run             Show plan only, do not execute
  --help                Show this help

Environment:
  BLITZREELS_API_KEY          Required. API key for authentication.
  BLITZREELS_API_BASE_URL     Optional. Override base URL.
  BLITZREELS_ALLOW_EXPENSIVE  Set to 1 to allow expensive API calls.

Examples:
  faceless.sh --topic "5 productivity tips" --duration 30 --voice rachel --style cinematic
  faceless.sh --script "Scene one text.\n\nScene two text." --duration 60
  faceless.sh --topic "History of coffee" --dry-run
  faceless.sh --topic "AI explained" --image-model google-gemini-3-pro-image --video-model veo3.1
  faceless.sh --topic "Quick recipe" --storyboard-only
EOF
  exit 0
}

# --- Parse arguments ---
TOPIC=""
SCRIPT=""
DURATION=30
VOICE="rachel"
STYLE="cinematic"
IMAGE_MODEL="google-gemini-2.5-flash-image"
VIDEO_MODEL="kling-2.1"
VIDEO_DURATION=""
STORYBOARD_ONLY=""
NO_ANIMATED_VIDEO=""
ASPECT="9:16"
NAME=""
CAPTIONS="true"
CAPTION_STYLE=""
RESOLUTION="1080p"
SKIP_CONFIRM=""
DRY_RUN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --topic)      TOPIC="$2"; shift 2 ;;
    --script)     SCRIPT="$2"; shift 2 ;;
    --duration)   DURATION="$2"; shift 2 ;;
    --voice)      VOICE="$2"; shift 2 ;;
    --style)      STYLE="$2"; shift 2 ;;
    --aspect)     ASPECT="$2"; shift 2 ;;
    --image-model) IMAGE_MODEL="$2"; shift 2 ;;
    --video-model) VIDEO_MODEL="$2"; shift 2 ;;
    --video-duration) VIDEO_DURATION="$2"; shift 2 ;;
    --storyboard-only) STORYBOARD_ONLY=1; shift ;;
    --no-animated-video) NO_ANIMATED_VIDEO=1; shift ;;
    --name)       NAME="$2"; shift 2 ;;
    --captions)   CAPTIONS="$2"; shift 2 ;;
    --caption-style) CAPTION_STYLE="$2"; shift 2 ;;
    --resolution) RESOLUTION="$2"; shift 2 ;;
    --yes)        SKIP_CONFIRM=1; shift ;;
    --dry-run)    DRY_RUN=1; shift ;;
    --help)       usage ;;
    *)            echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# --- Validate ---
if [[ -z "$TOPIC" && -z "$SCRIPT" ]]; then
  echo "Error: --topic or --script is required." >&2
  echo "Run with --help for usage." >&2
  exit 1
fi

if [[ -z "$API_KEY" ]]; then
  echo "Error: BLITZREELS_API_KEY is required." >&2
  exit 1
fi

if [[ "$DURATION" -lt 10 || "$DURATION" -gt 120 ]]; then
  echo "Error: --duration must be between 10 and 120." >&2
  exit 1
fi

# Auto-generate project name
if [[ -z "$NAME" ]]; then
  if [[ -n "$TOPIC" ]]; then
    NAME="Faceless: ${TOPIC:0:50}"
  else
    NAME="Faceless: Custom Script"
  fi
fi

# --- Build plan summary ---
INPUT_MODE="topic"
INPUT_PREVIEW="$TOPIC"
if [[ -n "$SCRIPT" ]]; then
  INPUT_MODE="script"
  SCENE_COUNT=$(echo -e "$SCRIPT" | grep -c '^$' || true)
  SCENE_COUNT=$((SCENE_COUNT + 1))
  INPUT_PREVIEW="(${SCENE_COUNT} scenes from user script)"
fi

# Determine output mode label
OUTPUT_MODE="Full video"
if [[ -n "$STORYBOARD_ONLY" ]]; then
  OUTPUT_MODE="Storyboard only (images)"
elif [[ -n "$NO_ANIMATED_VIDEO" ]]; then
  OUTPUT_MODE="Images + audio (no video)"
fi

echo "╔══════════════════════════════════════════════════╗"
echo "║          FACELESS VIDEO GENERATION PLAN          ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Input:       ${INPUT_MODE} — ${INPUT_PREVIEW:0:30}"
echo "║  Duration:    ${DURATION}s"
echo "║  Voice:       ${VOICE}"
echo "║  Style:       ${STYLE}"
echo "║  Image Model: ${IMAGE_MODEL}"
if [[ -z "$STORYBOARD_ONLY" ]]; then
echo "║  Video Model: ${VIDEO_MODEL}"
fi
if [[ -n "$VIDEO_DURATION" ]]; then
echo "║  Clip Length: ${VIDEO_DURATION}s per scene"
fi
echo "║  Output:      ${OUTPUT_MODE}"
echo "║  Aspect:      ${ASPECT}"
echo "║  Captions:    ${CAPTIONS}"
if [[ -n "$CAPTION_STYLE" ]]; then
echo "║  Cap Style:   ${CAPTION_STYLE}"
fi
echo "║  Resolution:  ${RESOLUTION}"
echo "║  Project:     ${NAME}"
echo "╠══════════════════════════════════════════════════╣"
echo "║  ⚠ This will consume AI credits.                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [[ -n "$DRY_RUN" ]]; then
  echo "[dry-run] Plan shown above. No API calls made."
  exit 0
fi

# --- Confirm ---
if [[ -z "$SKIP_CONFIRM" ]]; then
  read -rp "Proceed? [y/N] " REPLY
  if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# --- Ensure expensive calls are allowed ---
export BLITZREELS_ALLOW_EXPENSIVE=1

# --- Step 1: Create project ---
echo ""
echo "→ Step 1/5: Creating project..."
PROJECT_JSON=$(bash "$BLITZREELS_SH" POST /projects \
  "{\"name\":\"${NAME}\",\"aspect_ratio\":\"${ASPECT}\"}")
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')

if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "null" ]]; then
  echo "Error: Failed to create project." >&2
  echo "$PROJECT_JSON" >&2
  exit 1
fi
echo "  Project ID: ${PROJECT_ID}"

# --- Step 2: Start faceless generation ---
echo "→ Step 2/5: Starting faceless generation..."

# Build request body
FACELESS_BODY="{\"duration_seconds\":${DURATION},\"visual_style\":\"${STYLE}\",\"voice_id\":\"${VOICE}\",\"captions\":${CAPTIONS}"
FACELESS_BODY="${FACELESS_BODY},\"imageModelId\":\"${IMAGE_MODEL}\",\"videoModel\":\"${VIDEO_MODEL}\""

if [[ -n "$STORYBOARD_ONLY" ]]; then
  FACELESS_BODY="${FACELESS_BODY},\"storyboardOnly\":true"
fi

if [[ -n "$NO_ANIMATED_VIDEO" ]]; then
  FACELESS_BODY="${FACELESS_BODY},\"generateAnimatedVideos\":false"
fi

if [[ -n "$VIDEO_DURATION" ]]; then
  FACELESS_BODY="${FACELESS_BODY},\"videoDuration\":${VIDEO_DURATION}"
fi

if [[ -n "$SCRIPT" ]]; then
  # Escape script for JSON
  ESCAPED_SCRIPT=$(echo -e "$SCRIPT" | jq -Rs .)
  FACELESS_BODY="${FACELESS_BODY},\"script\":${ESCAPED_SCRIPT}"
else
  ESCAPED_TOPIC=$(echo "$TOPIC" | jq -Rs .)
  FACELESS_BODY="${FACELESS_BODY},\"topic\":${ESCAPED_TOPIC}"
fi

if [[ -n "$CAPTION_STYLE" ]]; then
  FACELESS_BODY="${FACELESS_BODY},\"caption_style\":\"${CAPTION_STYLE}\""
fi
FACELESS_BODY="${FACELESS_BODY}}"

JOB_JSON=$(bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/faceless" "$FACELESS_BODY")
JOB_ID=$(echo "$JOB_JSON" | jq -r '.job_id // .jobId // .id')

if [[ -z "$JOB_ID" || "$JOB_ID" == "null" ]]; then
  echo "Error: Failed to start faceless generation." >&2
  echo "$JOB_JSON" >&2
  exit 1
fi
echo "  Job ID: ${JOB_ID}"

# --- Step 3: Poll job status ---
echo "→ Step 3/5: Waiting for generation to complete..."
MAX_POLLS=120
POLL_INTERVAL=5
for i in $(seq 1 $MAX_POLLS); do
  STATUS_JSON=$(bash "$BLITZREELS_SH" GET "/jobs/${JOB_ID}")
  STATUS=$(echo "$STATUS_JSON" | jq -r '.status')

  case "$STATUS" in
    completed|done|success)
      echo "  Generation complete!"
      break
      ;;
    failed|error)
      echo "Error: Generation failed." >&2
      echo "$STATUS_JSON" | jq . >&2
      exit 1
      ;;
    *)
      PROGRESS=$(echo "$STATUS_JSON" | jq -r '.progress // "unknown"')
      printf "\r  Status: %-12s Progress: %-6s (poll %d/%d)" "$STATUS" "$PROGRESS" "$i" "$MAX_POLLS"
      sleep "$POLL_INTERVAL"
      ;;
  esac
done
echo ""

if [[ "$i" -eq "$MAX_POLLS" && ! "$STATUS" =~ ^(completed|done|success)$ ]]; then
  echo "Error: Timed out waiting for generation (${MAX_POLLS} × ${POLL_INTERVAL}s)." >&2
  exit 1
fi

# --- Step 4: Export ---
echo "→ Step 4/5: Starting export (${RESOLUTION})..."
EXPORT_JSON=$(bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/export" \
  "{\"resolution\":\"${RESOLUTION}\"}")
EXPORT_ID=$(echo "$EXPORT_JSON" | jq -r '.export_id // .exportId // .id')

if [[ -z "$EXPORT_ID" || "$EXPORT_ID" == "null" ]]; then
  echo "Error: Failed to start export." >&2
  echo "$EXPORT_JSON" >&2
  exit 1
fi
echo "  Export ID: ${EXPORT_ID}"

# --- Step 5: Poll export & get download URL ---
echo "→ Step 5/5: Waiting for export..."
for i in $(seq 1 60); do
  EXPORT_STATUS_JSON=$(bash "$BLITZREELS_SH" GET "/exports/${EXPORT_ID}")
  EXPORT_STATUS=$(echo "$EXPORT_STATUS_JSON" | jq -r '.status')

  case "$EXPORT_STATUS" in
    completed|done|success)
      DOWNLOAD_URL=$(echo "$EXPORT_STATUS_JSON" | jq -r '.download_url // .downloadUrl // .url')
      echo "  Export complete!"
      echo ""
      echo "╔══════════════════════════════════════════════╗"
      echo "║              GENERATION COMPLETE             ║"
      echo "╠══════════════════════════════════════════════╣"
      echo "║  Project:     ${PROJECT_ID}"
      echo "║  Export:      ${EXPORT_ID}"
      echo "║  Download:    ${DOWNLOAD_URL}"
      echo "╚══════════════════════════════════════════════╝"
      exit 0
      ;;
    failed|error)
      echo "Error: Export failed." >&2
      echo "$EXPORT_STATUS_JSON" | jq . >&2
      exit 1
      ;;
    *)
      printf "\r  Export status: %-12s (poll %d/60)" "$EXPORT_STATUS" "$i"
      sleep 5
      ;;
  esac
done
echo ""
echo "Error: Timed out waiting for export." >&2
exit 1
