# Motion craft

How to make the rubric's section C happen in a `seek(t)` scene. Engine helpers are in `src/engine/motion.js` and `type.js` (see contract.md).

## Think like an After Effects designer

What separates a motion designer's film from "the model made a video":

| AE habit | In this engine |
| --- | --- |
| Layer motion blur, 180° shutter | the renderer averages sub-frames in float; report speed with `ctx.reportMotion(px)` so fast frames get more samples |
| Graph editor: speed flows through middle keyframes | `track({ t, changes })` or one curve for the whole move; never chain `prog()` segments that each ease to zero |
| Text animators with range selectors | `kinetic()`: per character, staggered, with a living hold and a cascading exit |
| Shape layers, not footage | rebuild UI as DOM/SVG; animate each part |
| Offsetting child layers 2–3 frames | `stagger({ index, step: 2 / 60 })`; children start after their parent |
| Pre-comps and null parents | a scene's world group with one camera transform; children positioned in world units |
| Trim paths | SVG `stroke-dasharray` / `stroke-dashoffset` from `prog()`; a bright dot on the head |
| Easy ease is a smell | asymmetric curves: `ease.outExpo` in, `ease.inExpo` out, springs for settle |

## Springs

- Closed form, so frame 812 renders without simulating 0–811.
- Pick by class: `snappy` UI, `default` cards and camera, `heavy` big type and logos, `playful` only for characters.
- A value that changes target several times (cursor, camera, a growing bar) uses `track()`: one spring per change, summed. Restarting a spring at each change creates a velocity jump that reads as a stutter.

## Camera

- One world group per scene with `translate/scale/rotate` from a camera function of `t`.
- A camera path is one continuous move. If it has to visit several framings, use `track()` across them; the camera may slow near a framing but never stops dead unless it's a deliberate hold before a hit.
- Exact positions matter for hand-offs: prefer scale + translate cameras (no perspective) when an element must land on a precise screen rect, and compute that rect from the camera with a `toScreen({ t, x, y })` helper, never by eye.
- Anticipation: a 2–4 % pull back before a push reads as intent.
- Stillness before big hits: freeze the camera and the environment (floor drift too) for the gate frames.

## Transitions that carry the eye

- Every cut has a carried object (story.md). The outgoing scene moves it to an exported rect; the incoming scene starts with it exactly there, same size and radius.
- Patterns that work: element → container (pill becomes the menu bar item), element → portal (card opens into the next world), shrink-into (a whole world contracts into the next scene's card), iris from a hero point, one continuous pan shared by both scenes (same curve, two offsets), file → icon morph with a 3-frame crossfade at identical size.
- Avoid: two separate moves (exit then enter) with different easings at a cut; a fade to black between scenes; a full-frame grey flash.

## Type in motion

- `kinetic()` for every headline and caption. Display weight 600–700, tracking −0.035 em, lines overlap by 50 ms.
- The hit word of a line can arrive on its own cue (BC: "choking." lands in red on the alarm).
- Numbers: `stepNumber()` when a value grows in steps (each step on a cue, with a note); a kinetic entrance for a single big stat. Never a fast digit roll at hero size.
- Reading time: hold fully formed for 0.4 s + 0.1 s per word before any exit starts.

## Build-ons

- A UI panel builds top to bottom: block cascade 2 frames apart; each block's contents 2 frames behind; sparklines draw on with a head dot; counters count; bars fill; one light sweep over the most important block; a status dot pulses.
- A list builds row by row on 16ths, each row with its own pitched cue climbing the chord.

## First frame

Frame 0 must already be moving: start objects mid-flight (their animation began at negative time), with the camera already slamming in. A static title card on frame 0 loses the scroll.

## Checking motion

Look at strips (`sheet.mjs --mode strips`) for every cut: positions continuous across the cut, blur where speed is high, no blur on holds, no double images. Look at the 9:16 strips separately; portrait moves need their own camera path.
