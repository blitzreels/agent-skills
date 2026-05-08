---
name: blitzreels-cli
description: "Use the BlitzReels CLI to let AI coding agents inspect, edit, verify, and export BlitzReels video projects from a shell. Use this whenever the user mentions the BlitzReels CLI, npx blitzreels, agent-driven video editing, local BlitzReels project edits, dashboard project URLs, captions, text overlays, media placement, silence/mistake edits, snapshots, exports, or asks an agent to control BlitzReels without hand-writing REST calls."
---

# BlitzReels CLI

Use this skill when an AI coding agent should control BlitzReels through `npx blitzreels` instead of hand-writing REST calls.

The CLI is a creator video-editing control surface. It is not a flat OpenAPI explorer. Prefer it for project-first workflows where the agent needs to browse state, apply edits, verify, and export.

## When To Use This Skill

Use this skill for shell-based BlitzReels work: authenticating the CLI, inspecting local or production projects, editing timeline items, adding media/logo/text overlays, adjusting captions, applying preview-first destructive edits, taking snapshots, and exporting.

If a user gives a dashboard project URL and asks an agent to edit or check the video, use this skill first. Inspect with CLI reads before mutating, and verify writes with timeline/context reads or snapshots.

## How To Guide Users

Treat the CLI as an agent control surface, not something the user must memorize. Your job is to run the right commands, explain what changed, and show the user enough context to trust the result.

When introducing the CLI to a user:

1. Explain that `npx blitzreels@latest` lets an agent inspect and edit their BlitzReels project from the shell.
2. Start with auth only when needed: `auth whoami --json` if a key is already configured, or `auth login` if not.
3. Tell the user whether you are targeting local or production, especially when using `--base-url http://localhost:3000/api/v1`.
4. Use read commands before edits so the user sees you are acting on the right project, timeline item, media asset, caption word, or export.
5. For potentially expensive or irreversible actions, explain the risk and use the CLI's confirmation flags only after the relevant preview or intent is clear.
6. After edits, summarize the exact visible change and the verification command or snapshot used.

Good user-facing explanations are concrete:

- "I found project `PROJECT_ID`, inspected the timeline, and updated caption word `WORD_ID` from `SUpabase` to `Supabase`."
- "I inserted this logo as a media overlay at `6.0s` for `1.6s`, then verified the timeline item exists."
- "The command failed before any API call. The CLI suggested `captions words list`, so I retried that exact command."

Avoid dumping the full command list unless the user asks for docs. Prefer giving the next useful command and why it is the right one.

## Recommended Workflow

Use this loop for most editing tasks:

1. **Authenticate**: `auth whoami --json`
2. **Orient**: `project inspect --project-id PROJECT_ID --mode full --json` or `project timeline --project-id PROJECT_ID --json`
3. **Select IDs**: list media, text, captions, or timeline items before editing
4. **Edit**: run the narrowest command that changes only the intended item
5. **Verify**: inspect timeline/context or render snapshots
6. **Report**: tell the user what changed, which IDs were touched, and what remains uncertain

If the user asks a broad question like "check this video", inspect first, then ask what edit they want unless they already gave a concrete edit request.

## Safety And Consent

Be careful with actions that delete, export, consume credits, overwrite text, or apply destructive timeline edits.

- Use `silence plan` and `mistakes plan` before `apply`.
- Do not pass `--confirm-preview` until the preview/plan has been reviewed.
- Do not pass `--confirm-delete` unless deletion is clearly requested.
- Exports can consume credits and take time; inspect project state before starting one.
- Never paste raw API keys into chat, notes, PRDs, eval outputs, or handoff files.
- If local and production are both plausible, state which one you are using before editing.

When a command fails, first determine whether the failure happened before or after an API call. Validation errors happen locally and are safe to retry with the suggested command. API errors may have already reached BlitzReels; include the request id when reporting them.

## Quick Start

```bash
npx blitzreels@latest auth login
npx blitzreels@latest auth whoami --json
npx blitzreels@latest api docs
npx blitzreels@latest api spec
```

For the scoped package:

```bash
npx @blitzreels/cli@latest auth login
```

For local development against a running BlitzReels app:

```bash
npx blitzreels@latest auth login --base-url http://localhost:3000/api/v1
npx blitzreels@latest auth whoami --base-url http://localhost:3000/api/v1 --json
```

## Auth

Preferred auth flow:

```bash
npx blitzreels@latest auth login
```

`auth login` opens the browser, asks the logged-in BlitzReels user to approve a one-time CLI code, then stores the generated API key in macOS Keychain when available or `~/.blitzreels/config.json` as fallback.

Remote shells:

```bash
npx blitzreels@latest auth login --no-browser
```

Manual key fallback:

```bash
npx blitzreels@latest auth set-key --api-key br_live_xxxxx
```

Environment variables:

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"
export BLITZREELS_BASE_URL="https://www.blitzreels.com/api/v1"
```

Keys are runtime-environment bounded:

- Production accepts `br_live_...`.
- Local/development accepts `br_test_...`.
- Wrong-environment keys should be treated as invalid, not retried blindly.

Never paste raw API keys into chat, notes, PRDs, eval outputs, or handoff files.

## Agent Output Rules

- Use `--json` for commands whose output will be parsed by an agent or script.
- Human-readable output is the default for interactive creator workflows.
- Do not scrape dashboard HTML. Use the CLI, OpenAPI, `/api/docs.md`, or `/llms-full.txt`.
- Do not guess project, media, caption, or content item IDs. List or inspect first.
- After writes, verify with `project inspect`, `project timeline`, `project snapshot`, or `project snapshots`.
- Faulty commands are validated before API calls. Read stderr suggestions and retry the suggested command/flag instead of guessing.
- Use `npx blitzreels@latest <command> --help` for command-specific usage and flags; this does not require auth.
- With `--json`, failures are structured on stderr as `{ "error": { "code", "message", "suggestions", "usage" } }`.

## Faulty Command Recovery

The CLI is designed to help agents recover from command mistakes.

When a command fails before an API call:

1. Read stderr before retrying.
2. If stderr includes `Did you mean?`, run the suggested command or flag exactly.
3. If stderr includes `Usage:`, compare the current command to that usage line and fill missing required flags.
4. If `--json` was passed, parse stderr as JSON and use `error.suggestions` plus `error.usage`.
5. Use `<command> --help` when unsure; command-specific help does not require authentication.

Do not keep retrying slight variations after a validation error. The validator is the source of truth for the CLI command surface.

## Discovery Commands

```bash
npx blitzreels@latest auth whoami --json
npx blitzreels@latest workspace settings get --json
npx blitzreels@latest projects list --status active --json
npx blitzreels@latest media list --asset-type video --json
npx blitzreels@latest media folders list --json
npx blitzreels@latest project inspect --project-id PROJECT_ID --mode full --json
npx blitzreels@latest project timeline --project-id PROJECT_ID --json
```

Docs:

```bash
npx blitzreels@latest api docs
npx blitzreels@latest api spec
```

## Project Workflows

```bash
npx blitzreels@latest projects create --name "Launch short" --aspect-ratio 9:16 --json
npx blitzreels@latest projects get --project-id PROJECT_ID --json
npx blitzreels@latest projects rename --project-id PROJECT_ID --name "New title"
npx blitzreels@latest projects update --project-id PROJECT_ID --description "New description"
npx blitzreels@latest projects delete --project-id PROJECT_ID --confirm-delete
```

Use plural `projects ...` for project listing and metadata management. Use singular `project ...` for inspecting or previewing one editing project.

## Media Library Workflows

```bash
npx blitzreels@latest media upload --file ./video.mp4 --auto-transcribe true --json
npx blitzreels@latest media import-youtube --url "https://www.youtube.com/watch?v=..." --json
npx blitzreels@latest media get --asset-id ASSET_ID --json
npx blitzreels@latest media rename --asset-id ASSET_ID --name "New media name"
npx blitzreels@latest media update --asset-id ASSET_ID --description "B-roll" --folder-id FOLDER_ID
npx blitzreels@latest media move --asset-id ASSET_ID --target-folder-id FOLDER_ID
npx blitzreels@latest media attach --project-id PROJECT_ID --asset-id ASSET_ID --at 0 --duration 4 --json
npx blitzreels@latest media attach --project-id PROJECT_ID --asset-id ASSET_ID --at 0 --duration 4 --position-preset top-right --width-px 280 --height-px 120 --animation-preset popIn --layer-index 3 --json
npx blitzreels@latest media delete --asset-id ASSET_ID --confirm-delete
```

Placement flags for `media attach`:

- `--position-preset`: `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`, `full-screen`
- `--position-x`, `--position-y`: explicit canvas coordinates
- `--width-px`, `--height-px`, `--scale`, `--opacity`: transform sizing and visibility
- `--animation-preset`: `none`, `fadeIn`, `fadeOut`, `zoomIn`, `slideIn`, `popIn`, `bounce`, `spin`
- `--layer-index`: z-order, applied with a follow-up timeline move when needed

Folder workflows:

```bash
npx blitzreels@latest media folders create --name "B-roll" --icon-type video --json
npx blitzreels@latest media folders rename --folder-id FOLDER_ID --name "New folder name"
npx blitzreels@latest media folders update --folder-id FOLDER_ID --parent-folder-id root
npx blitzreels@latest media folders delete --folder-id FOLDER_ID --confirm-delete
```

## Editing Workflows

Text overlays:

```bash
npx blitzreels@latest text add --project-id PROJECT_ID --text "Hook" --at 0 --duration 4 --json
npx blitzreels@latest text add --project-id PROJECT_ID --text "serveurs MCP" --at 3 --duration 2 --font-family "Pacifico" --font-size 92 --font-weight 700 --color "#17FFA6" --background-color "#051914" --padding-x 38 --padding-y 18 --border-radius 24 --top "18%" --left "50%" --json
npx blitzreels@latest text list --project-id PROJECT_ID --json
npx blitzreels@latest text update --project-id PROJECT_ID --content-item-id CONTENT_ITEM_ID --text "New hook"
npx blitzreels@latest text update --project-id PROJECT_ID --content-item-id CONTENT_ITEM_ID --font-family "Pacifico" --font-size 96 --color "#17FFA6"
npx blitzreels@latest text remove --project-id PROJECT_ID --content-item-id CONTENT_ITEM_ID
```

Text style flags work on `text add` and `text update`: `--spec-json`, `--font-family`, `--font-size`, `--font-weight`, `--color`, `--background-color`, `--padding-x`, `--padding-y`, `--border-radius`, `--top`, `--left`, `--text-align`, `--text-shadow`, `--no-background`.

Timeline transforms:

```bash
npx blitzreels@latest timeline transform --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --position-x 72 --position-y 96 --width-px 360 --height-px null --keep-aspect-ratio true --json
npx blitzreels@latest timeline move --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --at 4.2 --layer-index 5 --json
npx blitzreels@latest timeline delete --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --auto-pack false --json
```

Use `null` for `--width-px` or `--height-px` when clearing one dimension.

Caption word editing:

```bash
npx blitzreels@latest captions words list --project-id PROJECT_ID --match-text supabase --json
npx blitzreels@latest captions words text --project-id PROJECT_ID --word-id WORD_ID --new-text "Supabase"
npx blitzreels@latest captions words batch-text --project-id PROJECT_ID --updates-json '[{"word_id":"WORD_ID","new_text":"Vercel"}]'
npx blitzreels@latest captions words style --project-id PROJECT_ID --match-text Supabase --font-family "Pacifico" --font-size 64 --color "#17FFA6" --scale 1.25
npx blitzreels@latest captions words emphasis --project-id PROJECT_ID --match-text Stripe --emphasis true
npx blitzreels@latest captions words delete --project-id PROJECT_ID --word-id WORD_ID
npx blitzreels@latest captions words merge --project-id PROJECT_ID --word-ids WORD_ID_1,WORD_ID_2 --text "MCP servers"
npx blitzreels@latest captions words split --project-id PROJECT_ID --word-id WORD_ID --words "MCP,servers"
```

Caption word selectors: `--word-id`, `--word-ids`, `--timeline-item-id`, `--match-text`, or `--match-pattern` (`numbers`, `caps`, `exclamations`). Use `--style-json null` to clear style and `--clear-existing true` to replace existing styles.

Audio:

```bash
npx blitzreels@latest audio add --project-id PROJECT_ID --asset-id ASSET_ID --at 0 --volume 0.6
```

Caption themes:

```bash
npx blitzreels@latest captions themes list --json
npx blitzreels@latest captions theme set --project-id PROJECT_ID --theme-id THEME_ID
npx blitzreels@latest captions theme set-default --theme-id THEME_ID
```

Preview-first destructive edits:

```bash
npx blitzreels@latest silence plan --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --json
npx blitzreels@latest silence apply --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --confirm-preview
npx blitzreels@latest mistakes plan --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --json
npx blitzreels@latest mistakes apply --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --confirm-preview
```

Do not apply silence or mistake edits without reviewing the plan output first.

## Visual Verification

```bash
npx blitzreels@latest project snapshot --project-id PROJECT_ID --at 00:03 --json
npx blitzreels@latest project snapshots --project-id PROJECT_ID --at 00:01,00:03,00:07 --json
```

Use snapshots before export when editing captions, text overlays, crop/framing, or media placement.

## Export

```bash
npx blitzreels@latest exports start --project-id PROJECT_ID --json
npx blitzreels@latest exports wait --export-id EXPORT_ID --json
npx blitzreels@latest exports download --export-id EXPORT_ID --output ./short.mp4
```

Exports can consume credits and take time. Inspect project state before starting one.

## Safety Checklist

1. Authenticate and confirm environment with `auth whoami --json`.
2. Inspect the project before editing.
3. Use `--json` for machine-readable output.
4. Use plan commands before destructive timeline edits.
5. Pass `--confirm-preview` only after reviewing a plan.
6. Pass `--confirm-delete` only for intentional deletes.
7. Verify with snapshots before export.
