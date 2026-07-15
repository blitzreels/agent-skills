# AI Video Editing Skills for Claude Code, Codex, Cursor, and ChatGPT

[![skills.sh](https://skills.sh/b/blitzreels/agent-skills)](https://skills.sh/blitzreels/agent-skills)

BlitzReels agent skills teach AI coding agents how to edit videos, turn long-form content into short clips, add
captions and media, generate AI videos, preview changes, and export finished videos.

They work with the BlitzReels CLI, REST API, and hosted MCP server, so your agent can operate a real video editor
instead of producing instructions for you to follow manually.

## Quickstart

Run the skills.sh installer:

```bash
npx skills@latest add blitzreels/agent-skills
```

Choose the skills you want and the AI agents where you want to install them.

## Install as a Claude Code plugin

The [Claude Code plugin](https://code.claude.com/docs/en/plugins) installs the skills with the hosted BlitzReels MCP
server and OAuth authentication.

Inside Claude Code:

```bash
/plugin marketplace add blitzreels/agent-skills
/plugin install blitzreels@blitzreels
```

Or from your shell:

```bash
claude plugin marketplace add blitzreels/agent-skills
claude plugin install blitzreels@blitzreels
```

Use the skills.sh installer for Codex, Cursor, Claude Code, and other Agent Skills-compatible agents.
Use the Claude Code plugin when you want the skills and MCP server as one managed installation.

## Use BlitzReels with ChatGPT

[Open BlitzReels in ChatGPT](https://chatgpt.com/plugins/plugin_asdk_app_6952ccb1c6a48191a9d2d07eedb46ad1?q=blitzreels).
