# AI Video Editing Skills for Grok, Claude Code, Codex, Cursor, and ChatGPT

[![skills.sh](https://skills.sh/b/blitzreels/agent-skills)](https://skills.sh/blitzreels/agent-skills)
[![Smithery](https://smithery.ai/badge/dev-algomax/blitzreels)](https://smithery.ai/servers/dev-algomax/blitzreels)

BlitzReels agent skills teach AI agents how to edit videos, turn long-form and X content into short clips, add
captions and media, generate AI videos, preview changes, and export finished videos.

They work with the BlitzReels CLI, REST API, and hosted MCP server, so your agent can operate a real video editor
instead of producing instructions for you to follow manually.

Read the [video editing MCP server guide](docs/video-editing-mcp-server.md) for the agent-first workflow,
transport choices, capability checklist, and example prompts.

## Launch films rendered from code

`blitzreels-launch-film` makes a 10–30 second motion-graphics launch film for your product, rendered entirely from
code: a deterministic `seek(t)` page captured frame by frame with real motion blur, a score synthesised in one key,
your real product UI rebuilt as code, and a studio of agents (story concepts, scene builders, five critics and a ship
gate) that keeps iterating until the film makes sense and looks expensive. It outputs a 16:9 film and a recomposed
9:16 cut.

```text
/blitzreels-launch-film make a 15 s launch film for this repo
```

It works without a BlitzReels account. Generated music, sound textures, an Eleven v4 voice line, or image and video
plates through the BlitzReels CLI or ElevenLabs are an optional step, always shown with their cost first.

Requirements: Node 20+, ffmpeg, and Playwright's Chromium (installed into the film's studio folder on first run).
The process builds on public write-ups by [Gaurav](https://x.com/gauravsbuilding/status/2104431310244880569),
[Movez](https://x.com/0xMovez/status/2104216919033192746) and
[whrrari](https://x.com/0xwhrrari/status/2105643919119696297). The bundled Geist fonts are under the SIL Open Font
License (`skills/blitzreels-launch-film/template/assets/fonts/OFL.txt`).

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

- The plugin has no hooks, install scripts, or local shell server. One skill, `blitzreels-launch-film`, has the agent
  run local Node scripts from the skill folder (render with Playwright and ffmpeg, synthesise audio) inside a
  `launch-film/` studio folder it creates in your project, after `npm install` there.
- Its only tool connection is the hosted MCP endpoint at `https://www.blitzreels.com/api/mcp`.
- Authentication uses browser OAuth. It may redirect through the BlitzReels Supabase auth tenant at
  `https://hrkmsptefdhrnzzsphip.supabase.co`; the plugin does not request or read a local API key or environment
  variable, except `ELEVENLABS_API_KEY` when you opt into ElevenLabs generation in `blitzreels-launch-film`.
- The connector can access only the BlitzReels workspaces granted by the signed-in user. Its tools can read media
  and projects, create or edit video projects, and start credit-spending generation or export operations.
- Skills require approval before paid generation, export, publishing, deletion, or other consequential actions.
