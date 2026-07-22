# Faceless Prompting

Use an **atomic shot** as the unit of generation.
One shot has one decisive starting frame, one dominant subject action, one camera behavior, and one readable ending.

## Authority

- Authored narration is spoken text and stays verbatim.
- Authored cues are the source of truth for subject, beat, timing intent, overlays, and transitions.
- Generated prompts describe only the visual plate the model can render reliably.
- Deterministic editor layers carry exact text, captions, logos, interfaces, meters, maps, arrows, graphs, counters,
  flashes, black frames, and transitions.
- Dialogue, voiceover delivery, music, and sound effects remain separate audio instructions.

For a structured production brief, apply its script, global visual rules, beats, captions, audio, sources, and
packaging as authored.
Treat hard rules and disabled-generation flags as blocking constraints.

## Atomic shot contract

Write the image prompt as:

`subject + visible starting state + environment + composition + camera angle + lighting + atmosphere + safe space`

Write the motion prompt as:

`opening state -> one physical action with consequences -> final readable state + one camera behavior + duration`

Each scene passes only when all checks are true:

- The image prompt creates one clean, decisive frame in at most 100 words.
- The motion prompt uses concrete verbs, names the moving subject, and stays within 60 words.
- Opening, middle, and ending states are observable and feasible in the scene duration.
- The action can occur continuously in one location without a cut, morph, or time jump.
- Recurring subjects repeat the same identity anchors while pose, emotion, framing, and action fit the current beat.
- The shared visual style keeps palette and world coherent without forcing the same mood or camera move on every scene.
- Caption-safe negative space is intentional and does not hide the focal subject.

When a cue contains multiple shots, select the strongest physical beat for generation.
Keep every remaining beat in the authored cue and implement it with timeline cuts, additional media, or editor layers.

## Example

Authored cue:

`Show the health meter falling, then cut to a city map with an escape arrow.`

Generated plate:

`A feverish armored courier bracing against a stone gate, knees buckling, plague haze curling around the armor,
high-angle medium shot, cold moonlight, dark fantasy realism, clean upper-left negative space.`

Motion:

`The courier takes two unsteady steps, grips the gate, then drops to one knee as the haze thickens; the camera makes
one short handheld push and settles on the collapsed posture over four seconds.`

Editor layers:

`Animate the health meter, cut to the map, then draw the escape arrow at the authored cue times.`

## Voiceover continuity

- Split TTS scenes at completed clauses or sentences so each request starts and ends naturally.
- Send adjacent narration as previous and next context when the provider supports contextual requests.
- Keep stage directions, visual cues, and pronunciation notes outside spoken text.
- Preserve proper-name spelling; use a provider pronunciation dictionary or phonetic alias when available.
- Listen across every scene join and inspect the final word plus the next sentence onset.
- Regenerate a join when a sentence is clipped, an unsupported pause appears before a name, or delivery resets sharply.
- Align scene timing to the final generated voiceover; do not hand-stretch narration to fit placeholder durations.

## Review evidence

Approve stills before animation.
For each animated scene, inspect the first frame, action midpoint, final two seconds, caption-safe area, identity, and
the matching narration join.
The review is complete only when every authored beat is implemented or reported with its exact unsupported public
capability.
