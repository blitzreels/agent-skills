# BlitzReels Agent Skills

BlitzReels is an AI video generation + editing platform with a public REST API.

This repo packages “Agent Skills” (instructions + helper scripts) for AI coding agents (Codex, Claude Code, Cursor, etc.) so agents can discover the API, browse the OpenAPI spec, and call the right endpoints.

## LLM Resources (On blitzreels.com)

- `https://blitzreels.com/llms.txt` (concise)
- `https://blitzreels.com/llms-full.txt` (expanded)
- `https://blitzreels.com/api/openapi.json` (canonical API contract)

## Skills

- `blitzreels` - BlitzReels API umbrella skill (AI video generation API entrypoint, discovery, auth, OpenAPI link).
- `blitzreels-faceless` - Faceless video generation workflows (voices, visual styles, jobs, exports).
- `blitzreels-motion-graphics` - Editing + motion graphics workflows (timeline/overlays/templates/export; uses OpenAPI to discover exact endpoints).

## Installation

If you publish this folder as its own GitHub repo (recommended), users can install it via the Skills CLI:

```bash
npx skills add blitzreels/agent-skills --skill blitzreels
```

List skills in the repo:

```bash
npx skills add blitzreels/agent-skills --list
```

## Development

Each skill lives in `skills/<skill-name>` and includes:

- `SKILL.md` - agent instructions
- `scripts/` - helper scripts (optional)
- `examples/` - usage examples (optional)

## License

MIT
