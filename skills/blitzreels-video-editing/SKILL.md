---
name: blitzreels-video-editing
description: Edit a raw talking-head recording into a vertical short: silence and retake cuts, captions, motion design and music. Use when a raw video needs a short-form edit.
---

# BlitzReels video editing

Turn one raw talking-head video into a finished 1080×1920 short with Claude Code and Remotion.
The edit is retention editing: a text hook on frame 0, key visuals stacked above the speaker, captions on the seam,
a snapback zoom on every jump cut, a cool grade, music and restrained sound design.
Beat planning and timing are judgment calls: ultrathink them.

Needs Node 20+, ffmpeg and uv. Music and sound effects need `ELEVENLABS_API_KEY`.
To cut many shorts out of one long video instead, use the `blitzreels-clipping` skill.

## 1. Set up

Copy `template/` from this skill's directory into a new folder next to the raw video, then run `npm install` in it.
Run every later command from that folder.

Done: `npm run edit` prints its usage.

## 2. Prepare

```bash
npm run edit -- prepare <raw-video> --language <code> --vocab "<names the speaker uses>"
```

This transcribes locally, removes repeated takes (the last take of a sentence wins), cuts silences, crops to 9:16 and
writes `public/talk.mp4`, `src/edit/timeline.json`, `public/transcript.md` and `public/contact-sheet.jpg`.

Read `transcript.md`, including its **Removed as retakes** list, and look at the contact sheet:

- Speaker off-centre: re-run with `--frame-x` (0 keeps the left edge, 1 the right edge).
- A real line listed as a retake: re-run with `--keep-takes` and tell the user which retakes remain.
- Misheard words and names: fix the `text` of those words in `src/edit/timeline.json`.

Done: every sentence in `transcript.md` reads as the speaker meant it, names spelled right, face centred in every tile.

## 3. Author

Read [`references/motion.md`](references/motion.md) before the first beat; it holds the layout zones, the kit and
the timing rules.

Plan the beats against `transcript.md` first, one idea per beat, then write them: data in `src/edit/Edit.tsx`,
components in `src/edit/`, shaped like `src/edit/examples.tsx`.
Every word, number and label on screen comes from what the speaker says or what the footage shows.
Real footage beats mock UI: when a line names a product, a screen or a result, ask the user for a recording of it and
place it in `public/footage/`.

Done: `npm run typecheck` passes and every sentence of the transcript has either a beat or deliberate plain footage.

## 4. Sound

With `ELEVENLABS_API_KEY` set: run `npm run edit -- sfx` once, write `src/edit/score.json` (format in
`references/motion.md`), run `npm run edit -- music`, then fill `music` and `sfx` in `Edit.tsx`.
Without the key, tell the user the short ships without music and sound effects.

Done: music and every cue are set in `Edit.tsx`, or the user knows why they are absent.

## 5. Review

```bash
npm run edit -- stills 0 <peak second of every beat>
```

Read `out/stills/sheet.jpg`. Check every tile for text that wraps or leaves the frame, graphics on the face, captions
colliding with a graphic, and text too small to read on a phone. Fix and re-run until a full pass is clean.
For live preview, `npm run edit -- studio` serves `http://localhost:3219`.

Done: every beat seen in a clean tile.

## 6. Render

Run `npm run edit -- render`. Verify `out/short.mp4` with ffprobe: h264 + aac, duration equal to
`durationSeconds` in `src/edit/timeline.json`. Give the user the path.

When the user asks for changes, edit the beat or the data, re-run stills for the touched beats, then render again.
