# BlitzReels Agent Skills

Installable skills for operating and integrating the BlitzReels video platform.

The skills teach workflow decisions and verification.
The live CLI contract and OpenAPI specification remain the source of truth for commands and fields.

## Skills

- `blitzreels-clipping` — turn long-form media into managed short clips.
- `blitzreels-editing` — edit existing projects through CLI or REST.
- `blitzreels-generation` — generate AI media and full videos.
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

### Migrate renamed skills

`blitzreels-cli` and `blitzreels-video-editing` were merged into `blitzreels-editing`.

For project installations:

```bash
npx skills remove blitzreels-cli blitzreels-video-editing
npx skills add blitzreels/agent-skills --skill blitzreels-editing
```

For global installations:

```bash
npx skills remove --global blitzreels-cli blitzreels-video-editing
npx skills add blitzreels/agent-skills --global --skill blitzreels-editing
```

### Remove withdrawn skills

`blitzreels` and `blitzreels-caption-themes` are no longer distributed.

For project installations:

```bash
npx skills remove blitzreels blitzreels-caption-themes
```

For global installations:

```bash
npx skills remove --global blitzreels blitzreels-caption-themes
```

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
