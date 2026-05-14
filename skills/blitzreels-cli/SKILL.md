---
name: blitzreels-cli
description: "Use the BlitzReels CLI to let AI coding agents inspect, edit, verify, and export BlitzReels video projects from a shell. Use this whenever the user mentions the BlitzReels CLI, a local blitzreels command, agent-driven video editing, local BlitzReels project edits, dashboard project URLs, captions, text overlays, media placement, silence/mistake edits, snapshots, exports, or asks an agent to control BlitzReels without hand-writing REST calls."
---

# BlitzReels CLI

Use this skill when an AI coding agent should control BlitzReels through the installed `blitzreels` command instead of hand-writing REST calls.

The CLI is a creator video-editing control surface. It is not a flat OpenAPI explorer. Prefer it for project-first workflows where the agent needs to browse state, apply edits, verify, and export.

## When To Use This Skill

Use this skill for shell-based BlitzReels work: authenticating the CLI, inspecting local or production projects, editing timeline items, adding media/logo/text overlays, adjusting captions, applying preview-first destructive edits, taking snapshots, and exporting.

If a user gives a dashboard project URL and asks an agent to edit or check the video, use this skill first. Inspect with CLI reads before mutating, and verify writes with timeline/context reads or snapshots.

## How To Guide Users

Treat the CLI as an agent control surface, not something the user must memorize. Your job is to run the right commands, explain what changed, and show the user enough context to trust the result.

When introducing the CLI to a user:

1. Explain that the installed `blitzreels` command lets an agent inspect and edit their BlitzReels project from the shell.
2. Do not run package-manager launchers as a fallback. If `blitzreels` is missing, ask the user to download/install the CLI first.
3. Do not make sign-in the first CLI task. Probe with `projects list --status active --json` first; if that fails because the user is signed out, run `auth login`, then retry the same list command.
4. Tell the user whether you are targeting local or production, especially when using `--base-url http://localhost:3000/api/v1`.
5. Use read commands before edits so the user sees you are acting on the right project, timeline item, media asset, caption word, or export.
6. For potentially expensive or irreversible actions, explain the risk and use the CLI's confirmation flags only after the relevant preview or intent is clear.
7. After edits, summarize the exact visible change and the verification command or snapshot used.

Good user-facing explanations are concrete:

- "I found project `PROJECT_ID`, inspected the timeline, and updated caption word `WORD_ID` from `SUpabase` to `Supabase`."
- "I inserted this logo as a media overlay at `6.0s` for `1.6s`, then verified the timeline item exists."
- "The command failed before any API call. The CLI suggested `captions words list`, so I retried that exact command."

Avoid dumping the full command list unless the user asks for docs. Prefer giving the next useful command and why it is the right one.

## Recommended Workflow

Use this loop for most editing tasks:

1. **Require local CLI**: `command -v blitzreels`; if missing, ask the user to download/install it and stop.
2. **Probe session**: run `blitzreels projects list --status active --json` as the first BlitzReels API call.
3. **Authenticate only if needed**: if the probe says signed out, run `blitzreels auth login`, then retry the same `projects list`.
4. **Orient lightly**: prefer `projects get --project-id PROJECT_ID --json` plus `project timeline --project-id PROJECT_ID --json`; use `project inspect --mode full` only when word-level or deep metadata is required.
5. **Select IDs**: list media, text, captions, or timeline items before editing.
6. **Edit**: run the narrowest command that changes only the intended item.
7. **Verify**: inspect timeline/context or render snapshots.
8. **Report**: tell the user what changed, which IDs were touched, and what remains uncertain.

If the user asks a broad question like "check this video", inspect first, then ask what edit they want unless they already gave a concrete edit request.

## Speed Rules

Prefer fewer, narrower calls over one huge inspect. A full inspect can include large per-word caption payloads and slow down simple editing tasks.

- Run independent reads in parallel when the tool environment supports it: project metadata, timeline, text list, media list, audio list, and asset searches do not depend on each other.
- Use subagents only for sidecar work that does not block the next edit, such as searching a large media library, auditing caption overlaps, or downloading/render-checking snapshots. Keep the critical edit path in the main agent.
- Parallelize independent writes only when they touch different item families and do not rely on timeline ordering. Good examples: updating a title text item and adding music. Be more careful with multiple timeline insertions at the same layer/time.
- After attaching B-roll or any media with transcription, immediately re-read `project timeline --json` before continuing. Media attach can import source captions; delete or move unintended imported captions before adding more layers so overlaps do not compound.
- Download multiple snapshot URLs in parallel after the snapshot command returns. Do not fetch them one by one unless the environment lacks parallel tool calls.

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
command -v blitzreels
blitzreels projects list --status active --json
blitzreels api docs
blitzreels api spec
```

If `projects list` reports that the user is signed out:

```bash
blitzreels auth login
blitzreels projects list --status active --json
```

For local development against a running BlitzReels app:

```bash
blitzreels projects list --status active --base-url http://localhost:3000/api/v1 --json
blitzreels auth login --base-url http://localhost:3000/api/v1 # only if the list command reports signed out
blitzreels projects list --status active --base-url http://localhost:3000/api/v1 --json
```

## Auth

Preferred auth flow:

```bash
blitzreels projects list --status active --json
```

If that reports unauthenticated:

```bash
blitzreels auth login
blitzreels projects list --status active --json
```

Run `auth login` only after a real project-list probe shows the session is unauthenticated. `auth login` opens the browser, asks the logged-in BlitzReels user to approve a one-time CLI code, then stores the generated API key in macOS Keychain when available or `~/.blitzreels/config.json` as fallback.

Remote shells:

```bash
blitzreels projects list --status active --json
```

If that reports unauthenticated:

```bash
blitzreels auth login --no-browser
blitzreels projects list --status active --json
```

Manual key fallback:

```bash
blitzreels auth set-key --api-key br_live_xxxxx
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
- Use `blitzreels <command> --help` for command-specific usage and flags; this does not require auth.
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
blitzreels projects list --status active --json
blitzreels workspace settings get --json
blitzreels projects get --project-id PROJECT_ID --json
blitzreels project timeline --project-id PROJECT_ID --json
blitzreels media list --asset-type video --json
blitzreels media list --asset-type audio --json
blitzreels media folders list --json
blitzreels project inspect --project-id PROJECT_ID --mode full --json # only when deep metadata is needed
```

Docs:

```bash
blitzreels api docs
blitzreels api spec
```

## Project Workflows

```bash
blitzreels projects create --name "Launch short" --aspect-ratio 9:16 --json
blitzreels projects get --project-id PROJECT_ID --json
blitzreels projects rename --project-id PROJECT_ID --name "New title"
blitzreels projects update --project-id PROJECT_ID --description "New description"
blitzreels projects delete --project-id PROJECT_ID --confirm-delete
```

Use plural `projects ...` for project listing and metadata management. Use singular `project ...` for inspecting or previewing one editing project.

## Media Library Workflows

```bash
blitzreels media upload --file ./video.mp4 --auto-transcribe true --json
blitzreels media import-youtube --url "https://www.youtube.com/watch?v=..." --json
blitzreels media get --asset-id ASSET_ID --json
blitzreels media rename --asset-id ASSET_ID --name "New media name"
blitzreels media update --asset-id ASSET_ID --description "B-roll" --folder-id FOLDER_ID
blitzreels media move --asset-id ASSET_ID --target-folder-id FOLDER_ID
blitzreels media attach --project-id PROJECT_ID --asset-id ASSET_ID --at 0 --duration 4 --json
blitzreels media attach --project-id PROJECT_ID --asset-id ASSET_ID --at 0 --duration 4 --position-preset top-right --width-px 280 --height-px 120 --animation-preset popIn --layer-index 3 --json
blitzreels media delete --asset-id ASSET_ID --confirm-delete
```

Placement flags for `media attach`:

- `--position-preset`: `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`, `full-screen`
- `--position-x`, `--position-y`: explicit canvas coordinates
- `--width-px`, `--height-px`, `--scale`, `--opacity`: transform sizing and visibility
- `--animation-preset`: `none`, `fadeIn`, `fadeOut`, `zoomIn`, `slideIn`, `popIn`, `bounce`, `spin`
- `--layer-index`: z-order, applied with a follow-up timeline move when needed

## Visual Quality And Safe Zones

When a user asks for text, B-roll, logos, or overlays, translate the creative request into the existing CLI/API controls. Do not invent new CLI flags or API fields. If a request is semantic, such as "make the hook big, two lines max, inside the safe zone", explain your interpretation and choose concrete current controls: text spec/style, timeline transform, position, dimensions, and snapshots for verification.

Inform the user about platform safe zones before placing important text or logos. Safe zones are not filters or magic API switches; they are placement constraints that keep content away from TikTok, Instagram, YouTube Shorts, and device UI. If the platform is not specified, assume a conservative universal short-form safe zone and say so. Keep important text, logos, faces, product names, and CTAs away from the top chrome, bottom captions/description area, and right-side action rail.

Use high-quality visual assets:

- Prefer source images/logos at least 2x the final rendered size. For a 280 px wide logo on canvas, prefer a source around 560 px wide or larger.
- Avoid tiny favicons, social thumbnails, compressed screenshots, watermarked stock previews, and images with baked-in padding unless the padding is intentional.
- SVGs can render differently across browser, Remotion, and export paths. If an SVG looks low-poly, jagged, clipped, or inconsistent, rasterize it to a high-resolution PNG/WebP before importing, then verify with snapshots.
- For B-roll, prefer assets that already match the target orientation and resolution. Avoid stretching low-resolution landscape footage into a vertical short unless the user explicitly wants that style.

After inserting visual media, verify the actual frame with `project snapshot` or `project snapshots` at the timestamps where the asset appears. Do not rely only on command success.

Folder workflows:

```bash
blitzreels media folders create --name "B-roll" --icon-type video --json
blitzreels media folders rename --folder-id FOLDER_ID --name "New folder name"
blitzreels media folders update --folder-id FOLDER_ID --parent-folder-id root
blitzreels media folders delete --folder-id FOLDER_ID --confirm-delete
```

## Editing Workflows

Text overlays:

```bash
blitzreels text add --project-id PROJECT_ID --text "Hook" --at 0 --duration 4 --json
blitzreels text add --project-id PROJECT_ID --text "serveurs MCP" --at 3 --duration 2 --font-family "Pacifico" --font-size 92 --font-weight 700 --color "#17FFA6" --background-color "#051914" --padding-x 38 --padding-y 18 --border-radius 24 --top "18%" --left "50%" --json
blitzreels text list --project-id PROJECT_ID --json
blitzreels text update --project-id PROJECT_ID --content-item-id CONTENT_ITEM_ID --text "New hook"
blitzreels text update --project-id PROJECT_ID --content-item-id CONTENT_ITEM_ID --font-family "Pacifico" --font-size 96 --color "#17FFA6"
blitzreels text remove --project-id PROJECT_ID --content-item-id CONTENT_ITEM_ID
```

Text style flags work on `text add` and `text update`: `--spec-json`, `--font-family`, `--font-size`, `--font-weight`, `--color`, `--background-color`, `--padding-x`, `--padding-y`, `--border-radius`, `--top`, `--left`, `--text-align`, `--text-shadow`, `--no-background`.

For semantic text requests, document your interpretation in plain language before or after the edit. Example: "I interpreted 'big hook, two lines max, widest inside safe zone' as centered top text, max width inside the universal safe-zone area, with the largest readable font that does not wrap past two lines." Then implement that interpretation with the current text spec/style controls and verify visually.

Timeline transforms:

```bash
blitzreels timeline transform --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --position-x 72 --position-y 96 --width-px 360 --height-px null --keep-aspect-ratio true --json
blitzreels timeline move --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --at 4.2 --layer-index 5 --json
blitzreels timeline delete --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --auto-pack false --json
```

Use `null` for `--width-px` or `--height-px` when clearing one dimension.

Timeline effects:

```bash
blitzreels effects zoom add --project-id PROJECT_ID --at 9.8 --duration 1.8 --scale-start 1 --scale-end 1.1 --easing easeInOut --json
blitzreels effects zoom update --project-id PROJECT_ID --timeline-item-id EFFECT_TIMELINE_ITEM_ID --scale-end 1.1 --easing easeInOut --duration 1.8 --json
blitzreels effects mask add --project-id PROJECT_ID --settings-json '{"shape":"rounded","size":{"width":0.8,"height":0.8}}' --json
blitzreels effects colorgrade update --project-id PROJECT_ID --timeline-item-id EFFECT_TIMELINE_ITEM_ID --settings-json '{"brightness":1.1,"vignetteEnabled":true}' --json
```

Use `effects zoom update` for future zoom changes instead of editing the database. Read `project timeline --json` first to find the effect timeline item ID, then verify with `project timeline` or a snapshot.

Caption word editing:

```bash
blitzreels captions words list --project-id PROJECT_ID --match-text supabase --json
blitzreels captions words text --project-id PROJECT_ID --word-id WORD_ID --new-text "Supabase"
blitzreels captions words batch-text --project-id PROJECT_ID --updates-json '[{"word_id":"WORD_ID","new_text":"Vercel"}]'
blitzreels captions words style --project-id PROJECT_ID --match-text Supabase --font-family "Pacifico" --font-size 64 --color "#17FFA6" --scale 1.25
blitzreels captions words emphasis --project-id PROJECT_ID --match-text Stripe --emphasis true
blitzreels captions words delete --project-id PROJECT_ID --word-id WORD_ID
blitzreels captions words merge --project-id PROJECT_ID --word-ids WORD_ID_1,WORD_ID_2 --text "MCP servers"
blitzreels captions words split --project-id PROJECT_ID --word-id WORD_ID --words "MCP,servers"
```

Caption word selectors: `--word-id`, `--word-ids`, `--timeline-item-id`, `--match-text`, or `--match-pattern` (`numbers`, `caps`, `exclamations`). Use `--style-json null` to clear style and `--clear-existing true` to replace existing styles.

Audio:

```bash
blitzreels audio add --project-id PROJECT_ID --asset-id ASSET_ID --at 0 --volume 0.6
```

Caption presets and project caption style:

```bash
blitzreels captions presets list --json
blitzreels captions preset set --project-id PROJECT_ID --preset-id PRESET_ID
blitzreels captions style get --project-id PROJECT_ID --json
blitzreels captions style update --project-id PROJECT_ID --preset-id PRESET_ID --stroke-width 8 --shadow-enabled true --json
```

Preview-first destructive edits:

```bash
blitzreels silence plan --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --json
blitzreels silence apply --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --confirm-preview
blitzreels mistakes plan --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --json
blitzreels mistakes apply --project-id PROJECT_ID --timeline-item-id TIMELINE_ITEM_ID --confirm-preview
```

Do not apply silence or mistake edits without reviewing the plan output first.

## Visual Verification

```bash
blitzreels project snapshot --project-id PROJECT_ID --at 00:03 --json
blitzreels project snapshots --project-id PROJECT_ID --at 00:01,00:03,00:07 --json
```

Use snapshots before export when editing captions, text overlays, crop/framing, or media placement.

## Export

```bash
blitzreels exports start --project-id PROJECT_ID --json
blitzreels exports wait --export-id EXPORT_ID --json
blitzreels exports download --export-id EXPORT_ID --output ./short.mp4
```

Exports can consume credits and take time. Inspect project state before starting one.

## Safety Checklist

1. Confirm the local `blitzreels` binary exists; if missing, ask the user to install it.
2. Probe with `projects list --status active --json` before any sign-in command.
3. Sign in only after the list probe reports unauthenticated, then retry the list probe.
4. Inspect the project before editing.
5. Use `--json` for machine-readable output.
6. Use plan commands before destructive timeline edits.
7. Pass `--confirm-preview` only after reviewing a plan.
8. Pass `--confirm-delete` only for intentional deletes.
9. Verify with snapshots before export.
