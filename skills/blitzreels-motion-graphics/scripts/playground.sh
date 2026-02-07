#!/usr/bin/env bash
set -euo pipefail

# playground.sh — Playground composition CRUD operations via BlitzReels API.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLITZREELS_SH="${SCRIPT_DIR}/blitzreels.sh"

usage() {
  cat <<'EOF'
Usage: playground.sh COMMAND [ARGS]

Commands:
  list-presets  <projectId>                         List available composition presets
  list          <projectId>                         List compositions in a project
  create        <projectId> <spec.json|-|JSON>      Create composition from file, stdin, or inline JSON
  get           <projectId> <compositionId>         Get composition details
  update        <projectId> <compositionId> <spec>  Update composition spec
  delete        <projectId> <compositionId>         Delete composition
  export        <projectId> [--resolution 1080p]    Export project video

Arguments:
  <projectId>       BlitzReels project ID
  <compositionId>   Composition ID
  <spec.json>       Path to JSON file, "-" for stdin, or inline JSON string

Environment:
  BLITZREELS_API_KEY          Required. API key for authentication.
  BLITZREELS_API_BASE_URL     Optional. Override base URL.
  BLITZREELS_ALLOW_EXPENSIVE  Set to 1 to allow export calls.

Examples:
  playground.sh list-presets proj_abc123
  playground.sh create proj_abc123 spec.json
  echo '{"name":"Test",...}' | playground.sh create proj_abc123 -
  playground.sh create proj_abc123 '{"name":"Test","fps":30,"width":1920,"height":1080,"durationInFrames":150,"mode":"elements","elements":[]}'
  playground.sh get proj_abc123 comp_xyz789
  playground.sh update proj_abc123 comp_xyz789 updated-spec.json
  playground.sh delete proj_abc123 comp_xyz789
  playground.sh export proj_abc123 --resolution 1080p
EOF
  exit 0
}

read_spec() {
  local spec_arg="$1"
  if [[ "$spec_arg" == "-" ]]; then
    cat
  elif [[ -f "$spec_arg" ]]; then
    cat "$spec_arg"
  else
    echo "$spec_arg"
  fi
}

if [[ $# -lt 1 ]]; then
  usage
fi

COMMAND="$1"
shift

case "$COMMAND" in
  list-presets)
    if [[ $# -lt 1 ]]; then
      echo "Usage: playground.sh list-presets <projectId>" >&2
      exit 1
    fi
    bash "$BLITZREELS_SH" GET "/projects/$1/playground/presets"
    ;;

  list)
    if [[ $# -lt 1 ]]; then
      echo "Usage: playground.sh list <projectId>" >&2
      exit 1
    fi
    bash "$BLITZREELS_SH" GET "/projects/$1/playground/compositions"
    ;;

  create)
    if [[ $# -lt 2 ]]; then
      echo "Usage: playground.sh create <projectId> <spec.json|-|JSON>" >&2
      exit 1
    fi
    PROJECT_ID="$1"
    SPEC=$(read_spec "$2")
    bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/playground/compositions" "$SPEC"
    ;;

  get)
    if [[ $# -lt 2 ]]; then
      echo "Usage: playground.sh get <projectId> <compositionId>" >&2
      exit 1
    fi
    bash "$BLITZREELS_SH" GET "/projects/$1/playground/compositions/$2"
    ;;

  update)
    if [[ $# -lt 3 ]]; then
      echo "Usage: playground.sh update <projectId> <compositionId> <spec>" >&2
      exit 1
    fi
    PROJECT_ID="$1"
    COMP_ID="$2"
    SPEC=$(read_spec "$3")
    bash "$BLITZREELS_SH" PATCH "/projects/${PROJECT_ID}/playground/compositions/${COMP_ID}" "$SPEC"
    ;;

  delete)
    if [[ $# -lt 2 ]]; then
      echo "Usage: playground.sh delete <projectId> <compositionId>" >&2
      exit 1
    fi
    bash "$BLITZREELS_SH" DELETE "/projects/$1/playground/compositions/$2"
    ;;

  export)
    if [[ $# -lt 1 ]]; then
      echo "Usage: playground.sh export <projectId> [--resolution 1080p]" >&2
      exit 1
    fi
    PROJECT_ID="$1"
    shift
    RESOLUTION="1080p"
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --resolution) RESOLUTION="$2"; shift 2 ;;
        *) echo "Unknown option: $1" >&2; exit 1 ;;
      esac
    done
    export BLITZREELS_ALLOW_EXPENSIVE=1
    bash "$BLITZREELS_SH" POST "/projects/${PROJECT_ID}/export" \
      "{\"resolution\":\"${RESOLUTION}\"}"
    ;;

  --help|-h|help)
    usage
    ;;

  *)
    echo "Unknown command: $COMMAND" >&2
    echo "Run 'playground.sh --help' for usage." >&2
    exit 1
    ;;
esac
