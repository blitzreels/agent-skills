# Motion reference

The template's kit lives in `src/kit/`; the edit's data and beats live in `src/edit/`.

## Frame zones (1080×1920)

The speaker's face sits roughly between y 250 and y 1200, centred.

- **Crown**: `CrownZone`, from y 168 down, over the hair. Text hooks, status pills, small stickers. Captions stay visible.
- **Chest**: `ChestZone`, y 1196 to 1590, below the chin. Cards and calls to action. Captions share this zone, so set
  `hideCaptions: true` on chest beats.
- **Stacked**: a key visual fills the top panel (`TopPanel`, y 0 to 760) while the speaker slides down; captions move
  to the **seam** between them. Drive it with `stackKeys` in `Edit.tsx`: `[t, 0], [t + 0.3, 1]` slides in,
  `[t, 1], [t + 0.25, 0]` slides out. Start a stack a few frames before a jump cut so the motion hides the cut.
- **Takeover**: a beat that covers the whole frame for one moment (a reveal, a before/after). Keep it under 3 seconds.

TikTok, Reels and Shorts cover the bottom 330 px and the right 140 px with their own interface; keep text out of both.

## Beats

A beat is `{ id, start, end, hideCaptions, render }` in `Edit.tsx`. Inside a component, `useCurrentFrame()` counts
from the beat's start, so convert absolute seconds with `const r = (t: number) => t - start`.

- `start` sits 2 to 4 frames before the word the beat illustrates; read word times from `src/edit/timeline.json`.
- One idea per beat, 2 to 10 seconds, plain footage between beats.
- Each beat fades out over its last 8 frames; end a panel beat after the next panel's `PanelSwap` has covered it.
- `captionMutes` hides captions for a range without a beat, for example while a panel types out the spoken words.

## Kit

- `blocks.tsx`: `CrownZone`, `ChestZone`, `Scrim`, `TopPanel`, `PanelSwap` (slides new panel content in from the
  right), `Footage` (looped muted video with a slow push), `TitleHook` (boxed title lines that wipe in), `TimeRow`.
- `primitives.tsx`: `Rise`, `Glass`, `Sheen`, `Kicker`, `Serif`, `WipeLine`, `Sticker`, `Check`, `Cross`, `Caret`,
  and the hooks `useSpringAt`, `useEaseAt`, `useTyped`.
- `examples.tsx`: a hook title, a footage panel, a typing terminal panel, a status pill and a call to action.

Add a component to `src/edit/` when an idea needs one, built from these pieces and the `tone` colours in `theme.ts`.

## Opening

The first two seconds decide retention. Frame 0 shows the text hook already readable, and the spoken hook, the text
hook and the visual all say the same thing. Spend the most motion here: the strongest visual of the video belongs in
the first five seconds.

## Zoom and grade

`snapback` in `src/kit/zoom.ts` alternates the zoom between 1 and `punch` on every jump cut with a slow drift, and
`punches` adds a hard punch-in on a key word: `punches: [{ at: 26.5, zoom: 1.2 }]`.
`grade` in `Edit.tsx` sets contrast, saturation, temperature (negative is cooler), vignette and grain.

## Sound

Sound files live in `public/sfx/` after `npm run edit -- sfx`: whoosh, swish, pop, ding, impact, whip, riser, click,
typing. Cue a whoosh on layout changes, a pop when a graphic lands, typing under typed text. Volumes 0.1 to 0.2, music
0.06 to 0.1: the voice leads.

`src/edit/score.json` is an ElevenLabs composition plan. Section durations add up to the edit's length in
milliseconds, each section lasts at least 3000 ms, and boundaries land on cuts from `timeline.json`:

```json
{
  "positiveGlobalStyles": ["modern upbeat electronic instrumental", "118 BPM", "leaves space for a voice"],
  "negativeGlobalStyles": ["vocals", "spoken words"],
  "sections": [
    { "sectionName": "hook", "positiveLocalStyles": ["starts on the first beat"], "negativeLocalStyles": [], "durationMs": 4800, "lines": [] }
  ]
}
```

Then set `music` in `Edit.tsx`: `{ src: "music.mp3", volume: [[0, 0.08], [durationSeconds, 0.08]] }`.
