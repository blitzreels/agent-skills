#!/usr/bin/env bash
set -euo pipefail

# carousel.sh — Create a "carousel" project (still slides) and insert images + titles.
#
# NOTE: This builds timeline segments for each slide. Carousel projects can be
# exported as a ZIP of per-slide PNG/JPG images via:
#   POST /projects/{id}/export { "format": "zip", ... }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLITZREELS_SH="${SCRIPT_DIR}/blitzreels.sh"

usage() {
  cat <<'EOF'
Usage: carousel.sh [options]

Options:
  --platform tiktok|instagram        Required
  --name TEXT                        Optional (default: "Carousel")
  --aspect 9:16|4:5|1:1              Optional (default: tiktok=9:16, instagram=4:5)
  --slide-duration SECONDS           Optional (default: 3)
  --images "URL|URL|..."             Required (pipe-delimited)
  --titles "TEXT|TEXT|..."           Optional (pipe-delimited; aligns with images)
  --yes                              Optional: skip confirmation

Environment:
  BLITZREELS_API_KEY                 Required
  BLITZREELS_API_BASE_URL            Optional
  BLITZREELS_ALLOW_EXPENSIVE         Optional (only needed if you export a video preview)

Examples:
  carousel.sh --platform tiktok --images "https://.../1.jpg|https://.../2.jpg" --titles "Hook|CTA"
  carousel.sh --platform instagram --aspect 4:5 --images "https://.../1.png|https://.../2.png"
EOF
  exit 0
}

PLATFORM=""
NAME="Carousel"
ASPECT=""
SLIDE_DURATION="3"
IMAGES=""
TITLES=""
YES="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform) PLATFORM="${2:-}"; shift 2 ;;
    --name) NAME="${2:-}"; shift 2 ;;
    --aspect) ASPECT="${2:-}"; shift 2 ;;
    --slide-duration) SLIDE_DURATION="${2:-}"; shift 2 ;;
    --images) IMAGES="${2:-}"; shift 2 ;;
    --titles) TITLES="${2:-}"; shift 2 ;;
    --yes) YES="true"; shift 1 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$PLATFORM" ]]; then
  echo "--platform is required (tiktok|instagram)" >&2
  exit 1
fi
if [[ "$PLATFORM" != "tiktok" && "$PLATFORM" != "instagram" ]]; then
  echo "Invalid --platform: $PLATFORM" >&2
  exit 1
fi
if [[ -z "$IMAGES" ]]; then
  echo "--images is required" >&2
  exit 1
fi

if [[ -z "$ASPECT" ]]; then
  if [[ "$PLATFORM" == "instagram" ]]; then
    ASPECT="4:5"
  else
    ASPECT="9:16"
  fi
fi

SAFE_AREA_PRESET="tiktok_9_16"
if [[ "$PLATFORM" == "instagram" ]]; then
  case "$ASPECT" in
    1:1) SAFE_AREA_PRESET="instagram_1_1" ;;
    4:5) SAFE_AREA_PRESET="instagram_4_5" ;;
    *) SAFE_AREA_PRESET="instagram_4_5" ;;
  esac
fi

IFS='|' read -r -a IMAGE_URLS <<<"$IMAGES"
IFS='|' read -r -a TITLE_TEXTS <<<"$TITLES"

SLIDE_COUNT="${#IMAGE_URLS[@]}"
if [[ "$SLIDE_COUNT" -lt 1 ]]; then
  echo "No images provided" >&2
  exit 1
fi

if [[ "$YES" != "true" ]]; then
  echo "Plan:"
  echo "  platform:        $PLATFORM"
  echo "  aspect:          $ASPECT"
  echo "  slides:          $SLIDE_COUNT"
  echo "  slide_duration:  $SLIDE_DURATION seconds"
  echo "  safe_area_preset:$SAFE_AREA_PRESET"
  echo ""
  echo "Proceed? (y/N)"
  read -r CONFIRM
  if [[ "${CONFIRM:-}" != "y" && "${CONFIRM:-}" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

CREATE_BODY=$(
  jq -n \
    --arg name "$NAME" \
    --arg aspect "$ASPECT" \
    --arg platform "$PLATFORM" \
    --arg safeArea "$SAFE_AREA_PRESET" \
    --argjson slideCount "$SLIDE_COUNT" \
    '{
      name: $name,
      aspect_ratio: $aspect,
      project_type: "carousel",
      carousel_settings: {
        platform: $platform,
        safe_area_preset: $safeArea,
        slide_count: $slideCount,
        background_strategy: "mixed",
        export_formats: ["png","jpg"],
        jpeg_quality: 90
      }
    }'
)

PROJECT_JSON=$(bash "$BLITZREELS_SH" POST /projects "$CREATE_BODY")
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')
if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "null" ]]; then
  echo "Failed to create project:" >&2
  echo "$PROJECT_JSON" | jq . >&2
  exit 1
fi
echo "Project: $PROJECT_ID"

for i in "${!IMAGE_URLS[@]}"; do
  url="${IMAGE_URLS[$i]}"
  idx=$((i + 1))
  start=$(awk "BEGIN {printf \"%.3f\", $i * $SLIDE_DURATION}")

  mediaBody=$(jq -n --arg url "$url" --arg name "Slide ${idx}" '{url:$url,name:$name}')
  mediaRes=$(bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/media" "$mediaBody")
  assetId=$(echo "$mediaRes" | jq -r '.media.id')
  if [[ -z "$assetId" || "$assetId" == "null" ]]; then
    echo "Failed to upload slide ${idx} media:" >&2
    echo "$mediaRes" | jq . >&2
    exit 1
  fi

  insertBody=$(
    jq -n \
      --arg asset "$assetId" \
      --argjson start "$start" \
      --argjson dur "$SLIDE_DURATION" \
      '{items:[{asset_id:$asset,start_seconds:$start,duration_seconds:$dur,position_preset:"fullscreen"}],allow_duplicate:false}'
  )
  insertRes=$(bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/timeline/media" "$insertBody")
  ok=$(echo "$insertRes" | jq -r '.inserted[0].success')
  if [[ "$ok" != "true" ]]; then
    echo "Failed to insert slide ${idx} on timeline:" >&2
    echo "$insertRes" | jq . >&2
    exit 1
  fi

  title="${TITLE_TEXTS[$i]:-}"
  if [[ -n "$title" ]]; then
    # Validate readability rules
    IFS=$'\n' read -r -d '' -a titleLines <<<"$title"
    lineCount="${#titleLines[@]}"

    # Check max lines (4)
    if [[ $lineCount -gt 4 ]]; then
      echo "⚠️  Warning: Slide ${idx} has ${lineCount} lines (max recommended: 4)" >&2
    fi

    # Check max chars per line (40)
    for line in "${titleLines[@]}"; do
      charCount="${#line}"
      if [[ $charCount -gt 40 ]]; then
        echo "⚠️  Warning: Slide ${idx} line too long (${charCount} chars, max: 40): \"${line:0:40}...\"" >&2
      fi
    done

    # Conservative placement: slightly above center and slightly left of center (TikTok right UI).
    textOverlayBody=$(
      jq -n \
        --arg text "$title" \
        --argjson start "$start" \
        --argjson dur "$SLIDE_DURATION" \
        '{
          text:$text,
          start_seconds:$start,
          duration_seconds:$dur,
          position:"top",
          position_x:0.45,
          position_y:0.18,
          style:{
            font_size:64,
            font_weight:"700",
            text_align:"center",
            color:"#ffffff",
            text_stroke_enabled:true,
            text_stroke_color:"#000000",
            text_stroke_width_px:6
          }
        }'
    )
    textOverlayRes=$(bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/text-overlays" "$textOverlayBody")
    textOverlayOk=$(echo "$textOverlayRes" | jq -r '.success // false')
    if [[ "$textOverlayOk" != "true" ]]; then
      echo "Warning: failed to add title overlay for slide ${idx}" >&2
      echo "$textOverlayRes" | jq . >&2
    fi
  fi

  echo "Slide ${idx}: asset=${assetId} start=${start}s"
done

echo ""
echo "Next:"
echo "  Context (timeline):"
echo "    bash scripts/blitzreels.sh GET \"/projects/${PROJECT_ID}/context?mode=timeline\""
echo "  Context (assets):"
echo "    bash scripts/blitzreels.sh GET \"/projects/${PROJECT_ID}/context?mode=assets\""
echo ""
echo "Export a slideshow video (expensive):"
echo "  bash scripts/blitzreels.sh POST \"/projects/${PROJECT_ID}/export\" '{\"resolution\":\"1080p\",\"format\":\"mp4\"}'"
