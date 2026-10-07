# Rubric

The bar every launch film is judged against, by the critics and by the ship gate. Copy it into the studio as `rubric.md` at the start, then append rules learned from this film's references (with the reference and the measured number next to each).

Rules are measurable on purpose. A critic quotes the rule number, the frames, what it measured and the fix.

Sources: a frame-by-frame and audio teardown of Gaurav's Fastlane launch film (the quality bar, "G"), two house films, the BlitzClean launch film (11 versions of real viewer feedback, "BC"), and the motion-studio write-ups by Movez and whrrari.

## A. It makes sense (judged first; a film that fails here is not shipped however good it looks)

1. **Logline holds.** Someone who watches it once, muted, can say the brief's logline back in their own words. The story critic does this test cold before reading the brief.
2. **One takeaway.** The thing the viewer must remember (brief) is on screen, readable, for at least 1 s, and it's the biggest type in the film except the logo.
3. **Every beat earns its place.** Each beat in `beats.md` has a reason that moves the viewer from one known state to the next. If a beat can be cut and the logline still holds, cut it.
4. **Real facts only.** Every number, claim, screen and logo comes from `assets.md`. The film can invent camera moves, never facts. A missing asset blocks the run; it is never drawn as a plausible fake.
5. **Causality is visible.** When the film claims an outcome (space freed, time saved, money made), the viewer sees where it comes from (BC: five cleaned folders land as slices that add up to +21.4 GB, instead of one big number appearing).
6. **Problem first, product as the answer.** The default arc: the problem you feel (0–2 s) → the product in action → proof with a real number → why trust it → payoff and CTA. Deviate only when the brief says why.
7. **Text budget.** At most 5 words on screen per card. Each card is fully formed and still for at least 0.4 s + 0.1 s per word. Headline cap height ≥ 60 px at 1080p (≥ 90 px in 9:16). Text that must be read moves < 4 px/frame.
8. **The CTA is answerable.** The lockup says what it is, where to get it and the price/licence if relevant (BC: "Download free for Mac", the URL, "Open source"), readable for ≥ 1 s before the end.

## B. Timing and structure

9. **Format.** 60 fps; length = bars × 4 × 60 / BPM exactly (128 BPM × 8 bars = 15.000 s = 900 frames). 16:9 hero plus a recomposed 9:16.
10. **Moving from frame 0.** Something is already in motion on frame 0 (BC: the first icon is mid-flight). No frame is static for more than 3 frames before 0.5 s.
11. **Sound by frame 6.** The first transient lands by 0.10 s.
12. **Product readable by 0.5 s.** A real product element is legible by frame 30.
13. **One grid.** Every setup change, hit and UI pop lands on a 16th note ±1 frame. All times come from `grid.json` cues; nothing is hard-coded twice.
14. **Shot rhythm.** Average setup length 0.9–1.3 s for a 15 s film (G 1.08 s), min 0.25 s, max 2.0 s except the lockup.
15. **Perspective changes at least every 2 beats** outside the lockup: tilt, orbit, dolly, push-through, whip.
16. **At most 2 hard cuts.** Every other change is an in-camera transition (morph, portal, whip, iris, match-move).
17. **The drop at ~50 %** (±0.3 s): the loudest moment, with a visual flash or spatial reset.
18. **Stillness before each major hit** (at most 3): picture frozen 9–15 frames and digital silence for those frames (the grid `gates`). The floor/environment freezes too.
19. **Hit sync.** Each hit's transient lands 0 to +3 frames after its visual event, never before.
20. **Every UI micro-event has its own sound** on the 16th grid: key, chip, row, tick, toggle, segment.
21. **One tonal act break** in the last third: a light act of 1.5–2.5 s entered through an iris or wipe from a hero object, and left by contracting into the next hero object (BC: the white world shrinks into the repo card) or a hard inversion.
22. **Lockup in ≤ 4 staged beats:** logo hit, wordmark, line, CTA/URL. Every line on screen ≥ 0.5 s before the end; only the last 6–12 frames may fade.
23. **Audio tail.** Last transient ≥ 0.25 s before the end; mix below −40 dBFS by the last frame.

## C. Motion

24. **Motion blur on speed, from the renderer.** 180° shutter, sub-frames averaged in float. Anything > 30 px/frame smears; anything < 10 px/frame stays crisp. No fake per-element Gaussian smears on top. No row of ghost copies: fast frames get more samples (up to 12).
25. **Continuous camera.** A multi-point camera move never stops at its middle keyframes (BC: four stop-and-go keyframes read as lag). Use `track()` (one spring per target change) or one eased curve across the whole move.
26. **Asymmetric eases on hero moves.** Entrances cover ≥ 60 % of their distance in the first 30 % of their time, or spring with ≤ 6 % overshoot. Exits accelerate into blur. No symmetric ease-in-out on anything important.
27. **Motion classes.** Snappy for small UI, default for cards and camera, heavy for big type and logos, playful only for mascots. If everything overshoots, nothing feels precise.
28. **Overlapping action.** Children trail their parent by 2–3 frames; staggers are 1–2 frames per item; nothing important starts on the same frame as something else.
29. **Transitions go through the product.** At least 3 transitions where the outgoing element becomes the container, portal or anchor of the next shot.
30. **One carried object threads ≥ 3 setups** and every cut names the object that carries the eye across it (BC: status pill → menu bar item → threads card → freed bar → light iris → repo card → file tile → app icon). The hand-off is exact: same position, same size, same corner radius on both sides of the cut.
31. **Kinetic type, not fades.** Headlines animate per character (rise, 3D unfold, de-blur, ~22 ms stagger); lines overlap; holds drift slightly in tracking and scale so text is never frozen; exits cascade out in order.
32. **Numbers step, they don't blur.** A number that changes in steps flips only its changed digits (stepNumber). Never roll digits fast at big sizes: with motion blur they become blocks.
33. **Build-ons, not pop-ins.** UI enters as a cascade (blocks 2 frames apart, contents 2 frames behind their card), lines draw on, values count, one light sweep. Never a whole screen fading in at once.
34. **Organic jitter is smooth.** Shake, strain or idle motion uses seeded smooth noise at the film's frame rate, never random values stepped at half rate.

## D. Look

35. **One accent per frame.** The brand accent is the only hue; whites and greys don't count; ≤ 8 % of pixels except one flash.
36. **No black shadows on dark grounds.** On a near-black stage, elevation comes from a rim light (1 px inner top highlight), a hairline border and a tight contact shadow (≤ 16 px blur). Big black drop shadows read as muddy halos with banding.
37. **No blob gradients.** No large soft radial blobs, domes or glows as decoration. Light is sharp (rays, horizon line, rim, specular sweep) or comes from a lit object.
38. **No banding.** Dark gradients are smooth: the renderer dithers before quantising, and post runs in float. Check a dark region of a still for missing levels.
39. **Glass needs light behind it.** Glass over black reads as grey plastic. Put a lit field, footage or UI behind any glass.
40. **Real UI rebuilt, not screenshotted.** Product screens are rebuilt as code from the real screenshot and verified against it (overlay diff within a few px). Screenshots are references; they look soft and laggy when scaled and can't animate.
41. **Reflections are glow, not mirrors.** Floor reflections are blurred and faint; never readable upside-down text.
42. **Type.** One display family (default Geist 600–700), tight tracking (−0.03 to −0.045 em on display sizes), tabular figures for numbers, mono only for paths and code.
43. **Depth.** Every setup outside the lockup has ≥ 3 layers with a speed ratio ≥ 1.5× between neighbours.
44. **Flashes.** At most 2 full-frame flashes, peak in 1–3 frames, gone in ≤ 10. No grey full-frame flash frames.
45. **Hue-preserving grade.** White stays white, the accent stays saturated; no tone curve that turns white grey or red brick.
46. **Safe area.** Text ≥ 5 % inside the frame (≥ 8 % top/bottom in 9:16 for platform UI), nothing important cropped by 3D moves.

## E. Sound

47. **One key (the one-key rule).** Melody, chords and every pitched sound effect use notes from the film's key; `audio-check` pitch-checks the effects stem and fails the build otherwise. Pitched effects are never resampled for variety; overtones stay in the scale; pitch dives settle on the note in ≤ 30 ms.
48. **No monotony.** The same effect recipe never repeats across different scenes, except as a deliberate pitched sequence (rows, steps), which climbs the current chord.
49. **Sound follows motion.** Whooshes span the move they belong to and pan with its direction; a click lands on the press frame; a slice that lands plays a note.
50. **Shape without picture.** Listen eyes-closed: you can hear the hook, the build, the drop, the breath before the light act and the logo resolve. If it has no shape alone, it isn't finished.
51. **Loudness.** −14 LUFS integrated ±1, true peak ≤ −2 dBTP, LRA 4–8 LU, measured after the full master chain. The drop or logo hit is the loudest momentary window.
52. **Width.** Big hits have a decorrelated side layer; music ducks a little under effects so every hit reads.

## F. Delivery

53. **Both formats pass.** The 9:16 cut is recomposed (bigger type, fewer simultaneous elements, its own camera path), not a crop, and has its own contact sheet review.
54. **Shareable size.** The 16:9 15 s film is ≤ 10 MB at good quality (Discord free tier is 20 MB, some accounts still 10 MB); H.264 + AAC, `+faststart`.
55. **Deliverables.** Final MP4s, poster frame, contact sheet, a 3–4 s opening clip for quote posts, `versions.md` with every gate verdict.
