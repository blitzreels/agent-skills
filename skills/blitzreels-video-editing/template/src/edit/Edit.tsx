import { type Beat, type Cue, type Grade, type Keyframe, type Music, TalkEdit } from "../kit/TalkEdit";
import type { Timeline } from "../kit/timeline";
import { snapback } from "../kit/zoom";
import timelineJson from "./timeline.json";

export const timeline: Timeline = timelineJson as Timeline;

const beats: Beat[] = [];

const sfx: Cue[] = [];

const zoomKeys: Keyframe[] = snapback({
  cuts: timeline.cuts,
  durationSeconds: timeline.durationSeconds,
  punch: 1.1,
  drift: 0.035,
  punches: [],
});

const stackKeys: Keyframe[] = [];

const captionMutes: [number, number][] = [];

const grade: Grade = { contrast: 1.1, saturate: 0.96, temperature: -0.2, vignette: 0.45, grain: 0.06 };

const music: Music | null = null;

export function Short() {
  return (
    <TalkEdit
      timeline={timeline}
      beats={beats}
      sfx={sfx}
      zoomKeys={zoomKeys}
      stackKeys={stackKeys}
      captionMutes={captionMutes}
      grade={grade}
      music={music}
    />
  );
}
