# BlitzReels Agent Skills

Agent Skills are packaged instructions and helper scripts that extend AI coding agents (Codex, Claude Code, Cursor, etc.).

## Skills

- `blitzreels` - Use the BlitzReels REST API to create projects, generate faceless videos, add captions, and export.

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
