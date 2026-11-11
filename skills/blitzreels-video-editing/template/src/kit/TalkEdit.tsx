import { createContext, type ReactNode, useContext } from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions } from "./Captions";
import { BeatFrame } from "./primitives";
import { frame as zones } from "./theme";
import type { Timeline } from "./timeline";

export type Beat = {
  id: string;
  start: number;
  end: number;
  hideCaptions: boolean;
  render: (start: number) => ReactNode;
};

export type Sound = "whoosh" | "swish" | "pop" | "ding" | "impact" | "whip" | "riser" | "click" | "typing";

export type Cue = { at: number; sound: Sound; volume: number };

export type Keyframe = [seconds: number, value: number];

export type Grade = {
  contrast: number;
  saturate: number;
  temperature: number;
  vignette: number;
  grain: number;
};

export type Music = { src: string; volume: Keyframe[] };

const StackContext = createContext(0);

export function useStack() {
  return useContext(StackContext);
}

export function track({ keys, seconds, rest }: { keys: Keyframe[]; seconds: number; rest: number }) {
  if (keys.length === 0) return rest;
  if (keys.length === 1) return keys[0][1];
  return interpolate(
    seconds,
    keys.map(([t]) => t),
    keys.map(([, v]) => v),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );
}

export function gradeFilter({ grade }: { grade: Grade }) {
  return `contrast(${grade.contrast}) saturate(${grade.saturate})`;
}

export function Tint({ grade }: { grade: Grade }) {
  if (grade.temperature === 0) return null;
  const color = grade.temperature > 0 ? "255,138,60" : "70,140,255";
  return (
    <AbsoluteFill
      style={{ backgroundColor: `rgba(${color},${Math.abs(grade.temperature)})`, mixBlendMode: "soft-light" }}
    />
  );
}

export function Vignette({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 62% at 50% 46%, rgba(0,0,0,0) 58%, rgba(0,0,0,${amount}) 100%)`,
      }}
    />
  );
}

function Grain({ amount }: { amount: number }) {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 6;
  return (
    <AbsoluteFill style={{ opacity: amount, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#grain-${seed})`}
          transform={`translate(${(random(`gx${seed}`) - 0.5) * 40} ${(random(`gy${seed}`) - 0.5) * 40})`}
        />
      </svg>
    </AbsoluteFill>
  );
}

export function TalkEdit({
  timeline,
  beats,
  sfx,
  zoomKeys,
  stackKeys,
  captionMutes,
  grade,
  music,
}: {
  timeline: Timeline;
  beats: Beat[];
  sfx: Cue[];
  zoomKeys: Keyframe[];
  stackKeys: Keyframe[];
  captionMutes: [number, number][];
  grade: Grade;
  music: Music | null;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const zoom = track({ keys: zoomKeys, seconds, rest: 1 });
  const stack = track({ keys: stackKeys, seconds, rest: 0 });
  const mutes = [
    ...beats.filter((beat) => beat.hideCaptions).map((beat) => [beat.start, beat.end] as [number, number]),
    ...captionMutes,
  ];

  return (
    <StackContext.Provider value={stack}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <AbsoluteFill style={{ translate: `0 ${stack * zones.stackShift}px` }}>
          <AbsoluteFill style={{ scale: String(zoom), transformOrigin: "50% 42%", filter: gradeFilter({ grade }) }}>
            <OffthreadVideo src={staticFile("talk.mp4")} />
            <Tint grade={grade} />
          </AbsoluteFill>
        </AbsoluteFill>
        <Vignette amount={grade.vignette} />
        {grade.grain > 0 ? <Grain amount={grade.grain} /> : null}
        {beats.map((beat) => {
          const duration = Math.round((beat.end - beat.start) * fps);
          return (
            <Sequence
              key={beat.id}
              name={beat.id}
              from={Math.round(beat.start * fps)}
              durationInFrames={duration}
              premountFor={fps}
            >
              <BeatFrame duration={duration}>{beat.render(beat.start)}</BeatFrame>
            </Sequence>
          );
        })}
        <Captions words={timeline.words} mutes={mutes} stack={stack} />
        {music === null ? null : (
          <Audio
            src={staticFile(music.src)}
            volume={(f) => track({ keys: music.volume, seconds: f / fps, rest: 0.08 })}
          />
        )}
        {sfx.map((cue) => (
          <Sequence key={`${cue.at}-${cue.sound}`} from={Math.round(cue.at * fps)} durationInFrames={fps * 3} layout="none">
            <Audio src={staticFile(`sfx/${cue.sound}.mp3`)} volume={cue.volume} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </StackContext.Provider>
  );
}
