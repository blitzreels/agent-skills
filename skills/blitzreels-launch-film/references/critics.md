# Critics and the ship gate

Five critics review each version in parallel. Then the ship gate decides whether the new version replaces the last one. Critics judge evidence (contact sheets, strips, the audio report, the MP4), never the code and never the agents' claims.

## Evidence pack (the lead prepares it per version)

- `out/vN/16x9.mp4` and `out/vN/9x16.mp4` (final quality)
- `out/vN/beats-16x9.png`, `out/vN/beats-9x16.png`: one labelled frame per beat and cue (`sheet.mjs --mode beats`)
- `out/vN/strips-16x9.png`: −12…+12 frames around every scene boundary (`sheet.mjs --mode strips`)
- `out/vN/audio-check.txt`: `audio-check.mjs` output (pitch table, LUFS, gates, loudest window)
- `brief.md`, `beats.md`, `rubric.md`
- For the gate: the same pack for the previous passing version

Critics look at the PNGs with the Read tool, and extract any extra frames they need with `sheet.mjs --mode frames --video ... --frames ...`.

## Output schema (every critic)

```json
{
  "critic": "story",
  "score": 7.5,
  "issues": [
    {
      "rule": 30,
      "severity": "major",
      "frames": "448-472",
      "measured": "carried object changes size by 64 px at the cut (512 → 576)",
      "fix": "set AGENTS_CARD_RECT height to 512 in both scenes",
      "owner": "scenes/proof.js"
    }
  ]
}
```

- `severity`: `blocker` (breaks rule A, or the film is wrong), `major` (a viewer would notice), `minor` (a designer would notice), `nit`.
- `measured` is a number or an observation tied to frames. "Feels off" is not an issue.
- `fix` is specific enough that the owning agent can do it without asking.
- `score` is 0–10 against the rubric section the critic owns.

## The five critics

Each prompt starts with: "You are a senior motion designer reviewing a launch film against rubric.md. Judge only the evidence pack. Report in the JSON schema. Find the 3 worst problems first; then the rest. Never praise."

1. **Story critic** (rules 1–8, 29–30). Before reading the brief, watch the beats sheet muted and write the logline you understood and the takeaway you'd remember. Then compare with `brief.md`. Any mismatch is a blocker. Check every number against `assets.md`. Check each beat's "viewer knows after" actually happens on screen. Check every cut has a carried object and that the hand-off is pixel-exact in the strips.
2. **Motion critic** (rules 10, 14–16, 24–34). Use the strips: velocity across cuts (no jumps, no stop-go), blur present on fast moves and absent on holds, no ghost rows, stillness before hits, staggers and overlaps, springs per motion class, kinetic type behaving.
3. **Look and type critic** (rules 35–46, 7). Palette and accent count, shadows and halos, banding in dark regions (zoom a crop), glass with light behind it, rebuilt UI fidelity versus the real screenshot, text sizes, reading time, safe areas in both formats.
4. **Sound critic** (rules 11, 13, 17–20, 23, 47–52). Read `audio-check.txt`; listen by reasoning over the cue list and the loudness curve: is every pitched cue in key (any failure is a blocker), does each UI event have its own sound, do sounds follow motion and pan, is there shape without picture, are there repeats across scenes, is the drop the loudest moment.
5. **Craft critic** (rules 9, 12, 21–23, 53–55, and anything else). Formats and lengths, 9:16 recomposition quality (not a crop), first and last frames, poster frame, file size, encode artefacts, anything broken a viewer would screenshot.

## After critique

The lead merges the five reports, dedupes, and assigns each issue to its owner (a scene file, `audio/score.mjs`, or the engine). Blockers and majors must be fixed; minors if cheap; nits are logged, not fixed. Scene agents fix only their files. Then a new version is rendered and goes to the gate.

## Ship gate

A separate judge (never one of the critics, never the lead) gets the evidence pack of the new version and of the last passing version, side by side, frame-matched.

Prompt core: "Version B claims to fix the issues listed below. Treat every claimed fix as unproven until you see it in the frames. Hunt for regressions first: anything that got worse, anywhere, in either format or in the audio. Then verify each claimed fix. Verdict: PASS only if B is better overall and has no new blocker or major regression. Otherwise FAIL with the regressions."

```json
{ "verdict": "PASS", "better": ["..."], "regressions": [], "unverified_fixes": ["..."], "notes": "..." }
```

- PASS: B becomes the current version; append to `versions.md`: `v5 · passed gate · out/v5/16x9.mp4 · <one-line why>`.
- FAIL: B is discarded (keep its notes); the next round starts from the last passing version plus the regression list.

## Stop rule

Ship the current version when any of these is true:

- No critic reports a blocker or major issue.
- Two gates in a row FAIL (the fixes are trading one problem for another).
- 3 critique rounds are done, or about 4 hours have passed.

Then deliver. Don't keep polishing nits: by the last rounds Gaurav's critics were trading one-frame nits, which is the signal to ship.
