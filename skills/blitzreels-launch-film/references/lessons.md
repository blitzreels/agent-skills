# Lessons

What broke on real films and the fix now built into the skill. Read before starting; add to it after each film.

| Symptom (what the viewer said) | Cause | Fix in the skill |
| --- | --- | --- |
| "The sound effects are out of tune with each other" (viewer feedback) | effects at arbitrary Hz; per-cue resampling ±3 % for variety | one key, MIDI notes validated, no resampling of pitched sounds, pitch-check gate (sound.md) |
| "Sound effects are so monotonous, the same ones in 4–5 slides" | one small palette reused everywhere | a palette per scene, no recipe repeats across scenes (rubric 48) |
| "Some parts of the UI appear laggy, I can't explain why" | no motion blur (60 fps strobing), a camera that stopped at every keyframe, jitter stepped at 30 Hz | float sub-frame motion blur in the renderer, `track()` cameras, smooth seeded noise (rubric 24, 25, 34) |
| "The font is basic, there's no text animation" | system font, whole-line fades | Geist display + `kinetic()` per-character animator, living holds (rubric 31, 42) |
| "Use real icons" | emoji / generic glyphs | real icons from the apps or press kits (look.md) |
| "The gradient is slop" | big soft radial blobs as decoration | sharp light only: rays, horizon, rim, sweeps (rubric 37) |
| "The shadows are really bad" | 120–160 px black shadows at 90 % on a near-black stage → muddy halos and banding; readable mirrored text in reflections | rim light + hairline + contact shadow; blurred glow reflections (rubric 36, 41) |
| "This part is so bad" (a big centred number with a caption) | an outcome with no cause, floating in empty space | visible causality: the parts land and add up, step-flipping digits (rubric 5, 32) |
| "This interaction is not seamless, it hurts" (repo → download → logo) | hard-coded positions that ignored the camera; the icon started 1.6× too big | exported hand-off rects, scale+translate cameras with `toScreen()`, identical size at the morph (motion.md) |
| "Why are you not showing me the video" | render finished, result only described | always open the render for the user the moment it exists |
| Rolling digits looked like broken blocks | fast reels + motion blur at 240 px | `stepNumber()` or a kinetic entrance instead |
| Grey full-frame flash at the drop | a 55 % white flash over dark frames | flashes peak in 1–3 frames, no grey frames (rubric 44) |
| Laptop crashed twice (Gaurav) | 8 agents × 2 headless browsers rendering at once | machine-wide render lock, 2 renders max |
| 44 GB of drafts (Gaurav) | every draft kept at 1080p | half-res drafts, `report.mjs --clean` after each gate |
| White turned grey, red turned brick (Gaurav) | a generic tone curve | hue-preserving grade |
| Rows of ghost copies on fast objects (Gaurav) | too few blur samples | adaptive samples from reported motion, up to 12 |
| The last rounds traded one nit for another (Gaurav) | no stop rule | stop rule in critics.md |
| A cleanup regex deleted half a shared file (BC) | regex across a multi-component source file; the work wasn't committed | edit with exact, bounded replacements; keep the studio in git and commit after each gate |
| The 9:16 cut looked like a crop | a centre crop of the 16:9 render | layout-driven scenes, recomposed per format, reviewed separately (rubric 53) |
