#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CAROUSEL_SH="${SCRIPT_DIR}/../../blitzreels-carousels/scripts/carousel.sh"

exec bash "$CAROUSEL_SH" --platform instagram "$@"

