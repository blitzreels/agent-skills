# Enhance (optional): generated media

The default film is 100 % code: synthesised score, vector UI, shader light. That's what makes it precise, in tune and cheap to revise. Generated media is an optional step up for things code does badly: organic textures, photographic plates, a produced music bed, a voice. Offer it in intake round 3; never use it without the user's yes and a shown cost.

## Providers

| Need | BlitzReels CLI (`blitzreels generate …`, one login) | ElevenLabs API (`ELEVENLABS_API_KEY`) |
| --- | --- | --- |
| Music bed | `music` (15/30/45/60/90/120 s) | `music_v2` with a composition plan built on the film's grid (sections split at the gates, exact durations) |
| Sound textures | `sounds` (1–30 s, prompt influence) | `eleven_text_to_sound_v2` (0.5–30 s, loop) |
| Voice line | `voiceovers` | `eleven_v4` (most expressive; inline tags like `[whispers]`, `[excited]`; no SSML) |
| Image plates | `images` (nano-banana-2, GPT Image…, references supported) | — |
| Video plates | `videos` (Seedance, Wan…, image-to-video from a still) | — |

All through one script, which records every asset in `assets/gen/manifest.json` (prompt, provider, model, file) so the film stays reproducible:

```bash
node SKILL_DIR/scripts/generate.mjs --studio ./launch-film --provider blitzreels|elevenlabs \
  --kind music|sound|voice|image|video --name <slug> --prompt "<prompt>" [--duration s] [--aspect 16:9] \
  [--model ID] [--voice-id ID] [--plan plan.json] [--source-image FILE]
```

Without `--yes` it prints the provider's pricing and stops. Show the cost to the user with AskUserQuestion ("Generate the music bed for ~N credits?"), then rerun with `--yes`. Check exact model ids, durations and limits with `blitzreels credits pricing --kind <kind> --json` before choosing; they change.

## Rules (the code film's rules still apply)

**Music**
- Generate for the grid: the prompt states BPM, key, length, and "builds to a drop at the middle, clean ending". ElevenLabs `music_v2` gets a composition plan from `grid.json` automatically.
- `generate.mjs` runs `track-analyze` on the result. If the BPM or key doesn't match the grid, re-time the grid to the track (beats follow the music) or regenerate; never leave a film cut against a track it doesn't match.
- Then score in track mode: SFX tuned to the track's key (the one-key rule still holds), the track ducked under the biggest hits, gates kept or replaced by a filter dip.

**Sound effects**
- Generated sounds are for textures only: air, impacts' noise layer, glass, paper, room tone, foley. Every pitched UI sound stays synthesised in key.
- Anything tonal that was generated must pass `audio-check`'s pitch test or be filtered to noise. No generated sound repeats across scenes.

**Voice**
- At most one or two short lines (a hook question, the tagline), placed on the grid, ducking the music. The film must still make sense muted: the line's words are on screen too.
- `eleven_v4` with direction tags; pick the voice with the user (preview a few seconds).

**Images and video**
- Atmosphere and plates only: lit backdrops behind glass, textures, abstract product-world footage, a photographic opening plate. Never a product screen, a number, a logo or a claim; those come from `assets.md` and are drawn as code (rubric 4, 40).
- Match the look: prompt with the accent colour, the preset (void/paper/glass), "no text, no logos, no UI".
- Video is pre-extracted to JPEG frames at the film's fps (`generate.mjs` does it) and played with `footage()` from `src/engine/footage.js`, so frame t is always the same image. Return the promise from `seek` so the renderer waits for the frame:

```js
const plate = footage(el, { dir: "../assets/gen/light-frames", count: 300, fps: 60, loop: true });
return { seek(ctx) { /* … */ return plate.seek({ t: ctx.t, at: ctx.cue("hook-impact") }); } };
```

- Generate-then-trace (Movez): a generated clip can give organic motion that code then redraws on top in the film's own look. Use the clip as a guide layer while building, then hide it.

## Disclosure

Generated media is synthetic: tell the user which shots and sounds are generated (the manifest lists them), so they can label the post if the platform asks.
