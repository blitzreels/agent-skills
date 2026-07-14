# BlitzReels Agent Skills

Installable skills for operating and integrating the BlitzReels video platform.

The skills teach workflow decisions and verification.
The live CLI contract and OpenAPI specification remain the source of truth for commands and fields.

## Skills

- `blitzreels` — integrate or debug the public REST API.
- `blitzreels-clipping` — turn long-form media into managed short clips.
- `blitzreels-editing` — edit existing projects through CLI or REST.
- `blitzreels-generation` — generate AI media and full videos.
- `blitzreels-caption-themes` — create reusable caption looks.
- `blitzreels-carousels` — create still-slide social carousels.

## Install

Claude Code plugin (skills + hosted MCP server over OAuth):

```bash
/plugin marketplace add blitzreels/agent-skills
/plugin install blitzreels@blitzreels
```

Standalone skills for any agent:

```bash
npx skills add blitzreels/agent-skills --list
npx skills add blitzreels/agent-skills --skill blitzreels-editing
```

`blitzreels-cli` and `blitzreels-video-editing` were merged into `blitzreels-editing`.

## Live contracts

- API index: <https://www.blitzreels.com/api/capabilities.json>
- OpenAPI: <https://www.blitzreels.com/api/openapi.json>
- API reference: <https://www.blitzreels.com/api/docs.md>
- CLI guide: <https://www.blitzreels.com/docs/cli.md>

## Development

Each skill lives in `skills/<name>/SKILL.md`.
Keep strategy in skills and exact command or payload schemas in the live contracts above.

## License

MIT
