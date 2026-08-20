# AI Video Editing Skills for Grok, Claude Code, Codex, Cursor, and ChatGPT

[![skills.sh](https://skills.sh/b/blitzreels/agent-skills)](https://skills.sh/blitzreels/agent-skills)
[![Smithery](https://smithery.ai/badge/dev-algomax/blitzreels)](https://smithery.ai/servers/dev-algomax/blitzreels)

BlitzReels agent skills teach AI agents how to edit videos, turn long-form and X content into short clips, add
captions and media, generate AI videos, preview changes, and export finished videos.

They work with the BlitzReels CLI, REST API, and hosted MCP server, so your agent can operate a real video editor
instead of producing instructions for you to follow manually.

## Install in Grok

Install directly from the official BlitzReels GitHub organization:

```bash
grok plugin install blitzreels/agent-skills --trust
```

The plugin is also being submitted to the official Grok marketplace. After it is listed, install it by name:

```bash
grok plugin install blitzreels --trust
```

The first BlitzReels tool call opens OAuth in the browser. The same packaged skills and connector are available to
Grok Bot through its plugin settings when the marketplace listing is available there.

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

## Install in Cursor

Install BlitzReels from the Cursor Marketplace to add the video editing skills and hosted MCP server together.
Cursor handles BlitzReels authentication through the MCP connection.

Until the marketplace review is complete, install only the skills with the Quickstart command above.

## Use BlitzReels with ChatGPT

[Open BlitzReels in ChatGPT](https://chatgpt.com/plugins/plugin_asdk_app_6952ccb1c6a48191a9d2d07eedb46ad1?q=blitzreels).

## Security and authentication

- The plugin has no hooks, install scripts, local shell server, or arbitrary code-execution component.
- Its only tool connection is the hosted MCP endpoint at `https://www.blitzreels.com/api/mcp`.
- Authentication uses browser OAuth. It may redirect through the BlitzReels Supabase auth tenant at
  `https://hrkmsptefdhrnzzsphip.supabase.co`; the plugin does not request or read a local API key or environment
  variable.
- The connector can access only the BlitzReels workspaces granted by the signed-in user. Its tools can read media
  and projects, create or edit video projects, and start credit-spending generation or export operations.
- Skills require approval before paid generation, export, publishing, deletion, or other consequential actions.
