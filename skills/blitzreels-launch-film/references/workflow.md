# Workflow

A launch film is made in four segments. Each segment is one Workflow run; the two human gates sit between them, so the lead (the main session) stops and waits for the user there. Invoking this skill is the user's opt-in to these workflows.

```
Intake (lead, inline) ── brief.md · assets.md · beats.md draft
   │
   ▼  Workflow 1: Study + Story ── reference teardown → rubric additions; 4 story concepts → judges → merged beats.md
   │
   ▼  GATE 1 (user): approve brief + assets + beats
   │
   ▼  Workflow 2: Animatic ── one still per beat at final look, per format → contact sheets
   │
   ▼  GATE 2 (user): approve the animatic sheets
   │
   ▼  Workflow 3: Build + Critique ── scene agents + audio agent → v1 → [5 critics → fixes → render → ship gate] × ≤ 3
   │
   ▼  Deliver (lead, inline) ── final renders, poster, opening clip, sheets, versions.md, disk cleanup, report
```

## Ownership (no two agents edit the same file)

| Owner | Files |
| --- | --- |
| Lead | `film.config.json`, `grid.json`, `src/film/film.js` (scene list and hand-off rects), `src/engine/*`, `versions.md` |
| Scene agent per scene | `src/film/scenes/<scene>.js` only |
| Audio agent | `audio/score.mjs` only (reads `grid.json`; asks the lead for new cues) |
| Critics, judges | read-only |

- Hand-offs are the lead's job. Every cut's carried object has one exported rect (position, size, radius) in `film.js` that both neighbouring scenes import; a scene never re-measures its neighbour.
- Only the lead talks to the user, through AskUserQuestion. Agents never decide a brand, story or fact question themselves: they return it in their report and the lead asks.
- A scene agent that needs a new cue writes a request in its final report; the lead adds it to `grid.json` (keeps beats on the 16th grid) before the next render.

## Resource rules

- `render.mjs` holds a machine-wide lock: at most 2 renders at once, one browser each. Agents queue; never start browsers outside `render.mjs`/`sheet.mjs`.
- Scene agents iterate with `--quality draft --from --to` on their own time range; only the lead renders full finals.
- Drafts and sheets go in `out/drafts/`; `report.mjs --clean` removes them after each gate. A full study can otherwise fill tens of GB.
- New films run at `xhigh` effort; quick fix rounds can drop to `high`.

## Workflow 1: Study + Story

Pass `args: { studio: "/abs/path/launch-film", skill: "/abs/path/to/launch-film skill", refs: ["refs/a.mp4", ...] }`.

```js
export const meta = {
  name: 'launch-film-story',
  description: 'Study the references and write the strongest beat sheet for the film',
  phases: [{ title: 'Study' }, { title: 'Concepts' }, { title: 'Judge' }, { title: 'Merge' }],
}
const S = args.studio, K = args.skill
const ANGLES = [
  'one continuous camera move: a single carried object travels through the whole film',
  'beat machine: every 16th is an event, the edit is the music',
  'the product as a world: the UI is the set, the camera lives inside it',
  'problem to payoff: the viewer\'s pain is literal on screen, then dissolved by the product',
]
phase('Study')
const study = args.refs && args.refs.length
  ? await parallel(args.refs.map(r => () => agent(
      `Tear down the reference film ${r} (in ${S}). Extract frames with ffmpeg (every 6th frame + scene-change frames), make contact sheets, analyse audio (onsets, silence before hits, loudness curve with ffmpeg ebur128). Write ${S}/refs/${r.split('/').pop()}.teardown.md: a timestamped table (on screen, camera, transition, easing, sound) and measured numbers (shot length, hard cuts, BPM, LUFS, LRA, loudest moment, first motion frame). End with 5 rules this film follows that are measurable and not already in ${K}/references/rubric.md.`,
      { label: `study ${r}`, phase: 'Study' })))
  : []
phase('Concepts')
const concepts = await parallel(ANGLES.map((angle, i) => () => agent(
  `Read ${S}/brief.md, ${S}/assets.md, ${K}/references/story.md, ${K}/references/rubric.md and any ${S}/refs/*.teardown.md. Write a complete beat sheet for this film from this angle: ${angle}. Follow the beats.md format in story.md exactly (viewer knows after, carried object, ≤5 words, real asset, sound, why). Use only facts and assets listed in assets.md. Return the markdown table plus a 3-line pitch.`,
  { label: `concept ${i + 1}`, phase: 'Concepts' })))
phase('Judge')
const JUDGE = { type: 'object', properties: { scores: { type: 'array', items: { type: 'object', properties: { concept: { type: 'number' }, sense: { type: 'number' }, wow: { type: 'number' }, feasible: { type: 'number' }, best_ideas: { type: 'array', items: { type: 'string' } } }, required: ['concept', 'sense', 'wow', 'feasible', 'best_ideas'] } }, winner: { type: 'number' } }, required: ['scores', 'winner'] }
const panel = concepts.map((c, i) => `## Concept ${i + 1}\n${c}`).join('\n\n')
const votes = await parallel(['a viewer scrolling X with the sound off', 'a senior motion designer', 'the product\'s founder who must approve every claim'].map(lens => () => agent(
  `Judge these beat sheets as ${lens}, against ${S}/brief.md and ${K}/references/rubric.md section A. Score each 0-10 on sense (logline lands, every beat earns its place), wow (would be shared), feasible (buildable from code with the real assets in 15-30 s of film). List the best ideas worth grafting.\n\n${panel}`,
  { label: `judge: ${lens}`, phase: 'Judge', schema: JUDGE })))
phase('Merge')
const merged = await agent(
  `Write ${S}/beats.md: start from the concept with the highest total across these judge votes, graft the best ideas from the others where they don't break the logline, and make every row satisfy story.md. Then add one cue per row to ${S}/grid.json (16th-grid beats, ids matching beats.md). Append to ${S}/rubric.md the measurable rules from the teardowns. Votes:\n${JSON.stringify(votes.filter(Boolean))}\n\n${panel}`,
  { label: 'merge beats', phase: 'Merge' })
return { study: study.filter(Boolean).length, merged }
```

After it returns, the lead reads `beats.md` itself, fixes anything that breaks rule A, and presents brief + assets + beats to the user (GATE 1).

## Workflow 2: Animatic

One agent per scene builds a still-accurate version of its scene: final look, final layout, real assets, rebuilt UI verified against the screenshots, no motion polish yet. The lead then renders `sheet.mjs --mode beats` for both formats and shows them to the user (GATE 2). Rebuilt screens are verified here: overlay the rebuild on the screenshot and report the max offset.

```js
export const meta = {
  name: 'launch-film-animatic',
  description: 'Build every scene to final look as stills, one agent per scene',
  phases: [{ title: 'Scenes' }, { title: 'Check' }],
}
const S = args.studio, K = args.skill
phase('Scenes')
const built = await parallel(args.scenes.map(sc => () => agent(
  `You own ONLY ${S}/src/film/scenes/${sc.id}.js. Read ${K}/references/contract.md, motion.md, look.md, ${S}/brief.md, assets.md, beats.md (your rows: ${sc.rows}). Build your scene at final look for both formats using ctx.layout (9:16 is a recomposition). Rebuild any product screen as code from its screenshot and verify by overlay (report max px offset). Use the hand-off rects exported from film.js for your entry and exit objects. Check your work with: node ${K}/scripts/sheet.mjs --studio ${S} --mode frames --frames <your beat frames> for 16x9 and 9x16, and LOOK at the PNGs. Report: frames checked, overlay offsets, cue requests.`,
  { label: sc.id, phase: 'Scenes' })))
phase('Check')
const check = await agent(
  `Render beats sheets for 16x9 and 9x16 (node ${K}/scripts/sheet.mjs --studio ${S} --mode beats --format <f>). Look at both. List anything that breaks rubric sections A or D, by beat. Return the sheet paths and the list.`,
  { label: 'animatic check', phase: 'Check' })
return { built, check }
```

## Workflow 3: Build + Critique

```js
export const meta = {
  name: 'launch-film-build',
  description: 'Animate every scene, score the sound, then critique and gate until it ships',
  phases: [{ title: 'Build' }, { title: 'Critique' }, { title: 'Fix' }, { title: 'Gate' }],
}
const S = args.studio, K = args.skill
const CRIT = { type: 'object', properties: { critic: { type: 'string' }, score: { type: 'number' }, issues: { type: 'array', items: { type: 'object', properties: { rule: { type: 'number' }, severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] }, frames: { type: 'string' }, measured: { type: 'string' }, fix: { type: 'string' }, owner: { type: 'string' } }, required: ['rule', 'severity', 'frames', 'measured', 'fix', 'owner'] } } }, required: ['critic', 'score', 'issues'] }
const GATE = { type: 'object', properties: { verdict: { type: 'string', enum: ['PASS', 'FAIL'] }, better: { type: 'array', items: { type: 'string' } }, regressions: { type: 'array', items: { type: 'string' } }, unverified_fixes: { type: 'array', items: { type: 'string' } } }, required: ['verdict', 'better', 'regressions', 'unverified_fixes'] }
const CRITICS = ['story', 'motion', 'look and type', 'sound', 'craft']

phase('Build')
await parallel([
  ...args.scenes.map(sc => () => agent(
    `You own ONLY ${S}/src/film/scenes/${sc.id}.js. Animate it to rubric sections B and C (${K}/references/rubric.md, motion.md): continuous camera, springs per motion class, kinetic type, build-on cascades, exact hand-offs via film.js rects, cues from ctx.cue(). Loop: draft-render your range (node ${K}/scripts/render.mjs --studio ${S} --quality draft --from <s> --to <s> --format 16x9, then 9x16), make strips, LOOK, fix. Report cue requests.`,
    { label: `animate ${sc.id}`, phase: 'Build' })),
  () => agent(
    `You own ONLY ${S}/audio/score.mjs. Read ${K}/references/sound.md, ${S}/grid.json, beats.md. Give every scene its own palette, every UI event its own pitched-in-key cue, whooshes that span and pan with their moves, gates before the big hits, the drop as the loudest moment. Run node audio/score.mjs then node ${K}/scripts/audio-check.mjs --studio ${S} until it passes.`,
    { label: 'score', phase: 'Build' }),
])
await agent(`Render v1 finals for every format (node ${K}/scripts/render.mjs --studio ${S} --quality final --format <f> --out ${S}/out/v1/<f>.mp4), then the evidence pack described in ${K}/references/critics.md into ${S}/out/v1/. Append "v1 · built · out/v1/16x9.mp4" to versions.md. Return the pack paths.`, { label: 'render v1', phase: 'Build' })

let current = 1, failsInRow = 0
for (let round = 1; round <= 3 && failsInRow < 2; round++) {
  phase('Critique')
  const reports = (await parallel(CRITICS.map(c => () => agent(
    `You are the ${c} critic in ${K}/references/critics.md. Evidence pack: ${S}/out/v${current}/. Rubric: ${S}/rubric.md. Follow that file exactly.`,
    { label: `${c} critic r${round}`, phase: 'Critique', schema: CRIT })))).filter(Boolean)
  const serious = reports.flatMap(r => r.issues).filter(i => i.severity === 'blocker' || i.severity === 'major')
  log(`round ${round}: ${serious.length} blocker/major issues`)
  if (!serious.length) break
  phase('Fix')
  const owners = [...new Set(serious.map(i => i.owner))]
  await parallel(owners.map(o => () => agent(
    `You own ONLY ${o} in ${S}. Fix these issues, verify each one with draft renders and strips of the affected frames, and LOOK at them:\n${JSON.stringify(serious.filter(i => i.owner === o), null, 2)}`,
    { label: `fix ${o}`, phase: 'Fix' })))
  const next = current + 1
  await agent(`Render v${next} finals and its evidence pack into ${S}/out/v${next}/ exactly like v${current}.`, { label: `render v${next}`, phase: 'Fix' })
  phase('Gate')
  const verdict = await agent(
    `You are the ship gate in ${K}/references/critics.md. Previous: ${S}/out/v${current}/. Candidate: ${S}/out/v${next}/. Claimed fixes:\n${JSON.stringify(serious.map(i => i.fix))}`,
    { label: `gate v${next}`, phase: 'Gate', schema: GATE, effort: 'xhigh' })
  if (verdict && verdict.verdict === 'PASS') { current = next; failsInRow = 0 } else { failsInRow++ }
  log(`gate v${next}: ${verdict ? verdict.verdict : 'no verdict'}`)
}
return { ship: current }
```

The lead records each verdict in `versions.md`, then delivers `out/v<ship>/`.

## Deliver (lead)

1. Copy the shipped version to `out/final/<slug>-16x9.mp4` and `<slug>-9x16.mp4`; check size (rubric 54); if over 10 MB re-encode at crf 20.
2. Poster frame (the takeaway frame) as PNG; a 3–4 s opening clip with a 0.2 s audio fade for quote posts.
3. `report.mjs --clean`, then report: versions and verdicts, the critics' last scores, render times, final sizes, disk freed.
4. Open the final for the user straight away (`open out/final/<slug>-16x9.mp4`). Always show the result, never just a path.
