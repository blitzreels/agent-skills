---
name: blitzreels-launch-film
description: >
  Make a stunning 10–30 s motion-graphics launch film for a product, rendered entirely from code:
  a deterministic seek(t) web page captured frame by frame with real motion blur, a synthesised score
  in one key, real product UI rebuilt as code, and a multi-agent studio (story concepts, scene agents,
  five critics, a ship gate) that keeps going until the film both makes sense and looks expensive.
  Use when the user asks for a launch video, launch film, product trailer, showreel, motion graphics
  video, feature announcement video or "a video like Gaurav's / like the BlitzClean film" for their
  product, app, repo or site. Outputs a 16:9 hero and a recomposed 9:16 cut. Optional step-up with
  generated music, sound textures, an Eleven v4 voice line, and image/video plates via the BlitzReels CLI or
  ElevenLabs. Works without a BlitzReels account (generation is opt-in). Not for talking-head or voice-over
  explainers, or editing existing videos.
---

# BlitzReels launch film

You run a small motion studio. The film is a program: a `seek(t)` page that paints any frame exactly, rendered by Playwright, post-processed in float, encoded by ffmpeg. The sound is a program too, on the same beat grid. Agents build it, critics judge it against a written rubric, and a ship gate makes sure every version beats the last one.

Two things decide the result, and both are your job before any frame is drawn:

1. **It must make sense.** A brief, a verified asset list and a beat sheet where every beat says what the viewer knows after it. A film that looks stunning but says nothing has failed.
2. **It must be judged against something explicit.** `references/rubric.md` plus what you learn from the user's references. Critique against rules with numbers, never vibes.

## References (read the ones the current phase needs)

| File | Read when |
| --- | --- |
| `references/contract.md` | always, first: studio layout, engine API, grid, scripts |
| `references/story.md` | intake and gate 1: brief, assets, beats templates |
| `references/rubric.md` | copied into the studio; every critic and agent judges against it |
| `references/motion.md` | building scenes |
| `references/look.md` | animatic and building scenes |
| `references/sound.md` | scoring |
| `references/critics.md` | critique rounds and the ship gate |
| `references/workflow.md` | the three Workflow scripts and file ownership |
| `references/enhance.md` | only if the user opted into generated media (BlitzReels CLI / ElevenLabs) |
| `references/lessons.md` | before starting, and append after finishing |

`SKILL_DIR` below means this skill's folder (the directory containing this file).

## Process

### 0. Set up the studio

```bash
node SKILL_DIR/scripts/new-studio.mjs --dir ./launch-film --title "<Product>" --slug <slug>
```

The new studio has no accent on purpose: the engine refuses to render until `film.config.json` has the product's brand colour (step 1). `--demo` keeps the template's demo film and accent for a quick engine test.

It lives in the product's repo (renders and audio are git-ignored), so the next film for this product starts from this one. If `./launch-film/` already exists, reuse it: read `versions.md`, `brief.md` and `lessons.md` first. Commit the studio after each gate.

Run at `xhigh` effort for a new film.

### 1. Intake: research first, then grill the user with AskUserQuestion

Find facts yourself; ask the user only for decisions. Never ask something the repo, the site or the app can answer.

**1a. Research (before any question).**
- Read the product: README, docs, site, changelog, screenshots, the app itself if it's on this machine. Note facts with sources.
- Gather real assets into `assets/`: app icon, logo, the 1–3 screens the film is built around, third-party icons from the real apps.
- Find the brand colour: `node SKILL_DIR/scripts/brand-colors.mjs --studio ./launch-film --url <site>` (it reads `assets/` images, the site's theme-color, brand/primary/accent CSS variables and CSS frequency, and prints ranked candidates with contrast on dark and light stages). The film's accent is the brand's colour, never a default.
- If the user gave a track: `node SKILL_DIR/scripts/track-analyze.mjs --track assets/<file>`.

**1b. Grill, in rounds, with the AskUserQuestion tool.** Treat the film as a design tree: each round asks every decision whose prerequisites are settled, up to 4 questions per call; answers unlock the next round. Keep going until nothing is silently assumed. Every question:
- offers 2–4 concrete options built from your research (real numbers, real screens, real colours), recommended option first with "(Recommended)" in its label;
- uses `preview` when the user should compare things visually: ASCII layouts of the hook, the look presets, beat-sheet variants, colour swatches written as hex with where they come from;
- never asks for a fact you can look up.

Rounds (adapt to the product; skip what's already clear from the request):

| Round | Decisions |
| --- | --- |
| 1 · Purpose | where it's posted and who watches (sets length, format priority, sound-off reading); the one takeaway (offer 3 phrasings from your research); what the film must never do or say |
| 2 · Substance | which real number is the proof (offer the strongest true ones you found); which screens/features are on stage (max 3); the CTA (download, sign up, star the repo) and the URL |
| 3 · Look & sound | accent colour (top `brand-colors.mjs` candidates as options, each with its source and contrast); look preset (void, paper, glass) with previews; length (10/15/20/30 s); synthesised score or the user's track; references (films, frames, a folder) or the built-in rubric; optional generated media (enhance.md): none (pure code, Recommended by default), BlitzReels CLI, or ElevenLabs, and for what (music bed, textures, a voice line, image/video plates) |
| 4 · Loose ends | anything the earlier answers opened: private data to hide, a second colour the brand uses, a mascot, legal lines, languages |

Then write `film.config.json` (accent, look, bpm/bars from the length), `brief.md`, `assets.md` and a first `beats.md` (story.md). Anything still `need` in `assets.md` blocks the run: ask for it or fetch it from the real source; never fake it.

### 2. Workflow 1: Study + Story

Run the `launch-film-story` workflow from `references/workflow.md` with the studio path, this skill's path and the reference files. It tears down each reference into measurable rules, writes four competing beat sheets from different angles, has three judges score them for sense, wow and feasibility, and merges the winner into `beats.md` and `grid.json`.

Then read `beats.md` yourself. Fix anything that breaks rubric section A.

### 3. Gate 1: the user approves the story

Show the logline, the takeaway and the beat table in one message, then ask with AskUserQuestion: "Approve the story?" with options "Approve (Recommended)", "Change the hook", "Change the proof/number", "Other changes", and a preview of the beat table. Loop on changes. Don't start visuals until they approve.

### 4. Workflow 2: Animatic

Set up `film.js` first (scene list, hand-off rects for every carried object, formats). Then run `launch-film-animatic`: one agent per scene builds its scene at final look for both formats, rebuilding product UI as code verified by overlay. Render beat sheets for 16:9 and 9:16.

### 5. Gate 2: the user approves the animatic

Open both contact sheets for the user (`open out/...png`), say what each beat is, then ask with AskUserQuestion: "Approve the animatic?" with options "Approve (Recommended)", "Change the look", "Change specific beats", "Other". Loop on changes.

### 6. Workflow 3: Build + Critique

Run `launch-film-build`: scene agents animate their scenes, the audio agent scores the film until `audio-check` passes, the lead renders v1 and its evidence pack, then up to 3 rounds of five critics → fixes by owner → new version → ship gate. Stop when there's no blocker or major issue, after two failed gates in a row, or after 3 rounds (about 4 hours). See critics.md.

Between rounds, you (the lead) add any cue requests to `grid.json`, keep hand-off rects exact, record each gate verdict in `versions.md`, and open each passing version for the user so they can watch progress.

### 7. Deliver

Follow "Deliver" in workflow.md: final 16:9 and 9:16 MP4s (16:9 ≤ 10 MB), poster frame, a 3–4 s opening clip, the last contact sheet, `report.mjs --clean`. Open the final film for the user immediately. Then append anything new you learned to `references/lessons.md` in this skill.

## Non-negotiables

- Frame 0 is already moving. The first sound lands by frame 6.
- Every cut has a carried object at an exact, shared rect. No stop-and-go cameras.
- Motion blur comes from the renderer, in float, adaptive to speed. No fake per-element smears.
- Kinetic type for every headline; `stepNumber` for numbers that change in steps.
- Real product facts, real assets, real UI rebuilt as code. Never invent a metric or a screen.
- The accent is the product's brand colour (never a default). One accent. No black shadows on dark grounds. No blob gradients. No banding.
- One key for music and every pitched effect; `audio-check` must pass. −14 LUFS, ≤ −2 dBTP.
- 16:9 and 9:16 are separate compositions, each reviewed.
- At most 2 renders at once (the render lock). Drafts at half resolution, cleaned after each gate.
- Always open renders for the user as soon as they exist.

## Revising a shipped film

For feedback on an existing film ("the shadows look bad", "this transition isn't smooth"): don't rerun the whole studio. Find the frames (`sheet.mjs --mode frames`), name the cause before changing anything (lessons.md has most of them), fix the owning file, render, show the user the before/after frames, and record the change in `versions.md`. Run the ship gate if the change touches more than one scene.
