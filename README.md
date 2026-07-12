# BlitzReels Agent Skills

Installable skills for operating and integrating the BlitzReels video platform.

The skills teach workflow decisions and verification.
The live CLI contract and OpenAPI specification remain the source of truth for commands and fields.

## Skills

- `blitzreels` — integrate or debug the public REST API.
- `blitzreels-cli` — inspect and edit a workspace from a shell.
- `blitzreels-clipping` — turn long-form media into managed short clips.
- `blitzreels-video-editing` — edit an existing project through REST.
- `blitzreels-caption-themes` — create reusable caption looks.
- `blitzreels-carousels` — create still-slide social carousels.

## Install

```bash
npx skills add blitzreels/agent-skills --list
npx skills add blitzreels/agent-skills --skill blitzreels-cli
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
