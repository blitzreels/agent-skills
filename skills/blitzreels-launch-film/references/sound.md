# Sound

Sound is on the same timeline as the picture: `grid.json` cues drive both. `audio/synth.mjs` is the library, `audio/score.mjs` is this film's score, `scripts/audio-check.mjs` is the gate.

## The one-key rule

The most common failure of code-made films: every effect is an arbitrary frequency, so music and effects clash. A viewer hears it as "out of tune" even if they can't say why.

- Pick the key in `film.config.json` (default A minor; with a supplied track, the key `track-analyze.mjs` detected).
- Every pitched cue in `grid.json` has a MIDI `note` in that key; `synth.mjs` refuses anything else and names the cue.
- Sequences climb the chord under them: rows on beat 8 over an A minor bar play A–C–E–A, not a chromatic run.
- Pitched sounds are never resampled for variety; only pure-noise sounds (whooshes, clicks, air) get per-cue speed variation.
- Overtones stay in the scale: an octave or a fifth that's in the scale, never a fifth above the leading tone.
- Pitch dives on hits (impact, thud, logo) settle on the note within ~30 ms.
- `audio-check.mjs` pitch-checks the effects stem; a failure blocks shipping.

## Palette per scene

- Each scene gets its own family of sounds that match what's on screen: glossy app icons → a clack; a drop-down panel → a filtered noise fall; rows → blips; tiles → marimba; checkboxes → checks; segments landing → slots; the light act → soft bells; the download → a success arpeggio.
- No recipe repeats across scenes except deliberate pitched sequences. Monotony was the first complaint on the BlitzClean film.
- Every UI micro-event has its own cue on the 16th grid.

## Shape

- Hook: a low pulsing bed in the key from frame 0, so the first frame has weight.
- Build: rising energy into the drop (riser, hats, a reverse swell ending on the hit).
- Gate: true digital silence for the gate frames right before the drop and the logo; the picture holds still too.
- Drop at ~50 %: the loudest moment, with a decorrelated side layer.
- Breath: a quieter light act.
- Resolve: the logo on the tonic chord; the tail decays below −40 dBFS before the end.
- Test: describe the film from the audio alone. If you can't hear the hook, drop, breath and resolve, it isn't finished.

## Motion-matched effects

- Whooshes span their move and peak at its fastest frame; pan follows direction (`pan` can be a function of progress).
- Clicks land on the press frame; the hit transient lands 0 to +3 frames after its visual event.

## Mix and master

- Music ducks slightly under effects (envelope follower) and pumps against the kick.
- Plate reverb on a send; big hits get a side layer for width.
- Master chain: high-pass ~28 Hz, gentle EQ, light glue compression, static gain, limiter. Measure loudness after the chain: −14 LUFS ±1, true peak ≤ −2 dBTP, LRA 4–8 LU.

## Supplied track

- `node <skill>/scripts/track-analyze.mjs --track assets/music.mp3` → BPM, first downbeat offset, key, grid skeleton.
- Set `bpm`, `key` and an `offset` in the grid; cut the film to the track's bars; tune every effect to the detected key; duck the track under the biggest hits; keep the gates (a silence before the drop works even over a track if the track itself breaks there; otherwise use a filter sweep instead of silence).
- Never use music the user hasn't confirmed they may use.
