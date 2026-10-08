# Studio contract

The interfaces every part of a launch-film studio agrees on. The engine, the audio toolkit, the scene agents and the critics all read this file. Change it only on purpose, and update every consumer when you do.

## Studio layout (created in the product repo as `./launch-film/`)

```
launch-film/
  film.config.json      title, slug, fps, bpm, bars, key, formats, look, accent
  grid.json             the beat grid: the single timing source for picture and sound
  brief.md              logline, takeaway, facts, unacceptables (gate 1)
  assets.md             every screen, logo and number with its real source (gate 1)
  beats.md              the beat sheet (gate 1)
  rubric.md             built-in rubric + anything learned from the references
  refs/                 reference films, frames and their teardown notes
  assets/               real product assets (screenshots are references, not film layers)
  src/
    index.html          loads fonts, the engine and the film
    engine/             runtime.js, motion.js, type.js, gl.js, looks.js (copied from the skill, rarely edited)
    film/film.js        defineFilm({ config, grid, scenes })
    film/scenes/*.js    one file per scene, owned by one scene agent
  audio/
    synth.mjs           the synth library (copied from the skill)
    score.mjs           this film's music + cue palette → score.wav and sfx stem
    score.wav           mastered score (git-ignored)
  out/                  renders, sheets, strips (git-ignored)
  versions.md           every version, its gate verdict and why
```

## film.config.json

```json
{
  "title": "BlitzClean",
  "slug": "blitzclean",
  "fps": 60,
  "bpm": 128,
  "bars": 8,
  "key": "A minor",
  "look": "void",
  "accent": "#rrggbb",
  "palette": {},
  "fonts": { "display": "Geist", "mono": "Geist Mono" },
  "formats": { "16x9": [1920, 1080], "9x16": [1080, 1920] }
}
```

- `accent`: the product's brand colour from `brand-colors.mjs` + the user's pick. Required; the engine throws without it.
- `palette`: optional overrides of the look's tokens (`bg`, `ink`, `muted`, `line`, `card`, `sky`, `floor`…) when the brand has its own background or ink colours.

Duration is `bars * 4 * 60 / bpm` seconds. 128 BPM × 8 bars = 15.000 s = 900 frames at 60 fps.

## grid.json

```json
{
  "bpm": 128, "bars": 8, "fps": 60, "key": "A minor",
  "gates": [{ "beat": 16, "frames": 12 }],
  "cues": [
    { "id": "hook-impact", "beat": 0, "sfx": "impact", "pan": 0 },
    { "id": "row-1", "beat": 8.25, "sfx": "blip", "note": 76, "pan": 0.3 }
  ]
}
```

- `gates`: true silence (picture holds still too) for `frames` frames before `beat`. Used before the biggest hits.
- `cues[].note`: MIDI note. Required for every pitched sfx, and must be in `key`. The audio toolkit refuses anything else.
- Picture code reads cue times with `ctx.cue(id)`; audio reads the same ids. Never hard-code a time that a cue already names.
- `cues[].scene` (optional): the scene id. The monotony check uses it to forbid one recipe across scenes; without it, cues of the same recipe more than 2 beats apart count as a repeat.
- `cues[].repeat: true` allows a deliberate repeat of a recipe.
- Recipe kinds in `synth.mjs`: `pitched` (needs `note`), `keyed` (takes its pitch from the key; `note` optional: impact, logo, shimmer), `noise` (the only kind with per-cue speed variation), `sweep`.
- Supplied track: `"music": { "track": "assets/music.mp3", "offset": 0.362 }` in film.config.json (or `node audio/score.mjs --track ... --offset ...`). The track's key replaces `key`.
- `master({ hit })` keeps the biggest hit the loudest 400 ms window by turning down any rival window after the full chain.

## Engine (browser, ES modules in src/engine)

### runtime.js

```js
export function defineFilm({ config, grid, scenes })
```

- `scenes`: `[{ id, from, to, build }]`, `from`/`to` in beats. A scene is active (mounted and seeked) in `[sec(from) - 0.5, sec(to) + 0.5]` and hidden otherwise, so hand-offs can overlap.
- `build(root, ctx)` runs once per format. It creates the scene's DOM inside `root` (an absolutely positioned layer the size of the frame) and returns `{ seek(ctx) }`.
- `seek(ctx)` may return a Promise (e.g. a footage frame decoding); the runtime waits for every active scene before painting.
- `seek(ctx)` must be a pure function of `ctx.t`: no timers, no `Date`, no `Math.random` (use `noise`/`rand` from motion.js), no state carried between calls. Frame 812 must render without frames 0–811.
- `ctx`: `{ t, beat, frame, fps, duration, format, W, H, cue(id) → seconds, sec(beat) → seconds, layout, look, horizon, gates, ambient }`. `ambient` is a clock that slows to a stop before each gate: drive floors, drifts and idle motion from it so the stillness rule holds automatically.
- `type.js` seeks return `{ motion }`; pass it to `ctx.reportMotion`.
- `ctx.layout`: `{ format, W, H, unit, safe: { x, y, w, h }, portrait }`. `unit` is 1 at 1920 px wide. Scenes position things from `layout`, never from fixed 1920×1080 pixels, so 9:16 is a recomposition.

The page exposes, for the renderer:

```js
window.__film = {
  fps, duration, formats,             // from config
  ready: Promise<void>,               // fonts + assets + scene builds done
  setFormat(name): Promise<void>,     // rebuilds scenes for a format
  seek(t): Promise<{ motion: number }>// paints frame t, resolves after paint;
                                      // motion = scenes' reported speed in px/frame (0 when still)
}
```

Scenes report motion through `ctx.reportMotion(pxPerFrame)` inside `seek`. The renderer uses it to choose motion-blur samples.

### motion.js

```js
clamp(v, lo, hi), lerp(a, b, k), mix(a, b, k)
prog({ t, from, to, ease })                 // 0→1 over [from, to], eased, clamped
ease.outExpo, ease.inExpo, ease.snap, ease.glide, ease.outCubic, ease.charIn
spring({ t, at, preset })                   // closed-form, 0→1 from time `at`; preset: "snappy" | "default" | "heavy" | "playful"
track({ t, changes: [{ at, value }], preset })// value that changes target several times; one spring per change, summed: continuous, seekable
noise({ seed, t, freq })                    // smooth seeded noise in [-1, 1]
rand({ seed })                              // seeded random in [0, 1)
stagger({ index, step })                    // index * step seconds
```

Spring presets (damping ratio ζ, natural frequency ω): snappy ζ 0.9 ω 30 (UI, buttons), default ζ 0.82 ω 18 (cards, camera), heavy ζ 1 ω 11 (big type, logos), playful ζ 0.55 ω 16 (mascots, stickers).

### type.js

```js
kinetic(el, { lines: [{ text, color }], size, weight, align })  → { seek({ t, at, out }) }
stepNumber(el, { steps: [{ at, text }], size, weight, color })  → { seek({ t }) }
```

- `kinetic`: per-character rise, 3D unfold from −78° and de-blur, 22 ms stagger, lines overlapping by 50 ms; the hold drifts tracking and scale slightly; the exit cascades out upward from `out`.
- `stepNumber`: on each step only changed characters flip (old glyph up and out, new one rising in), compared from the right, with figure spaces for padding. Use it for any number that changes in steps. Never roll digits fast: they blur into blocks.

### footage.js

```js
footage(el, { dir, count, fps, loop, fit }) → { seek({ t, at, rate }) → Promise }
```

Plays pre-extracted JPEG frames (from `generate.mjs` or `ffmpeg -vf fps=60`) exactly per frame. Return its promise from the scene's `seek`.

### gl.js

```js
glLayer(canvas, { fragment, uniforms }) → { seek(uniforms) }
shaders.lightField   // soft moving light behind glass, in the accent colour
shaders.glass        // refraction + frost + bevel highlight over a GL-drawn backdrop
shaders.grain        // optional in-scene grain
```

Glass only reads as glass with something lit behind it. Over black it reads as grey plastic.

### post (Node, inside scripts/render.mjs)

Post runs on the accumulated float frame, never in 8-bit:

1. Motion blur: average N sub-frames across a 180° shutter in Float32. N comes from `motion` (1 when still, up to 12 when fast).
2. Bloom: threshold the highlights, blur at quarter resolution, add back. Subtle: strength 0.15 by default.
3. Grade: a hue-preserving tone curve. Never let white go grey or the accent go muddy.
4. Dither: ±0.5 LSB triangular noise before quantising to 8 bits, so dark gradients never band.

## Scripts (in the skill's `scripts/`, run with `node <skill>/scripts/<name>.mjs`)

| Script | Does |
| --- | --- |
| `new-studio.mjs --dir ./launch-film --title X --slug x` | copies `template/`, writes config, runs `npm install` |
| `render.mjs --studio DIR [--determinism FRAME] --format 16x9 --quality draft\|final [--from s --to s] [--out file]` | captures `seek(t)` with Playwright, post, encodes H.264 + `audio/score.wav`; draft = half resolution, 1–2 samples; final = full, adaptive blur. Holds the machine-wide render lock (2 at most) |
| `sheet.mjs --studio DIR --format 16x9 --mode beats\|strips\|frames [--frames 0,120] [--video file]` | contact sheet with one labelled frame per beat, or transition strips (−12…+12 frames around each scene boundary), from a render or straight from the page |
| `audio-check.mjs --studio DIR` | pitch-checks every pitched cue against the key, measures LUFS / true peak / LRA, checks gates are silent and the biggest hit is the loudest moment; exit 1 on failure |
| `track-analyze.mjs --track FILE` | estimates BPM, first downbeat and key of a supplied track, and prints a grid.json skeleton |
| `brand-colors.mjs --studio DIR [--images a,b] [--url site]` | ranked brand-colour candidates from real assets and the site, with contrast on void and paper |
| `generate.mjs --studio DIR --provider blitzreels\|elevenlabs --kind image\|video\|music\|sound\|voice --name x --prompt … [--yes]` | optional generated media (enhance.md); prints pricing until `--yes`; video → JPEG frames for `footage()`; music → track analysis; records `assets/gen/manifest.json` |
| `report.mjs --studio DIR` | disk used by drafts, versions list, deletes drafts older than the last gate with `--clean` |

All scripts print a short JSON summary on the last line so agents can parse results.
