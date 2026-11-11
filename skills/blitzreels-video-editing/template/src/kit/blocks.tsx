import type { ReactNode } from "react";
import { interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Check, Cross, Rise, Serif, useEaseAt } from "./primitives";
import { useStack } from "./TalkEdit";
import { BODY, frame as zones, outExpo, tone } from "./theme";

export type BeatProps = { start: number };

export function CrownZone({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: zones.gutter,
        right: zones.gutter,
        top: zones.crownTop,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

export function ChestZone({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: zones.gutter,
        right: zones.gutter,
        top: zones.chestTop,
        height: zones.chestBottom - zones.chestTop,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

export function Scrim({ side }: { side: "chest" | "crown" }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const gradients = {
    chest: "linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.7) 100%)",
    crown: "linear-gradient(0deg, rgba(0,0,0,0) 72%, rgba(0,0,0,0.5) 100%)",
  };
  return <div style={{ position: "absolute", inset: 0, background: gradients[side], opacity }} />;
}

export function TopPanel({ children }: { children: ReactNode }) {
  const stack = useStack();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: zones.stackPanel,
        overflow: "hidden",
        translate: `0 ${(stack - 1) * zones.stackPanel}px`,
        background: "radial-gradient(120% 90% at 50% 0%, #1F232C 0%, #0B0C10 72%)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          background: `linear-gradient(90deg, ${tone.accent}00, ${tone.accent}, ${tone.peach}, ${tone.accent}00)`,
        }}
      />
    </div>
  );
}

export function PanelSwap({ at, children }: { at: number; children: ReactNode }) {
  const p = useEaseAt({ at, duration: 0.4 });
  return (
    <div style={{ position: "absolute", inset: 0, translate: `${(1 - p) * 100}% 0`, opacity: p > 0 ? 1 : 0 }}>
      {children}
    </div>
  );
}

export function Footage({ src, frames, objectPosition, pushTo }: { src: string; frames: number; objectPosition: string; pushTo: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = interpolate(frame, [0, fps * 5], [1.02, pushTo], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, scale: String(scale) }}>
      <Loop durationInFrames={frames}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition }} />
      </Loop>
    </div>
  );
}

export type TitleLine = { text: string; paper: string; ink: string; at: number };

export function TitleHook({ lines, size }: { lines: TitleLine[]; size: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {lines.map((line, i) => (
        <TitleBox key={line.text} line={line} size={size} tilt={i % 2 === 0 ? -1.2 : 1} />
      ))}
    </div>
  );
}

function TitleBox({ line, size, tilt }: { line: TitleLine; size: number; tilt: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wipe = useEaseAt({ at: line.at, duration: 0.35 });
  const p = line.at <= 0 ? 1 : wipe;
  const settle = interpolate(frame / fps, [Math.max(0, line.at), Math.max(0, line.at) + 0.45], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: outExpo,
  });
  return (
    <div
      style={{
        rotate: `${tilt}deg`,
        scale: String(settle),
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 14px)`,
        background: line.paper,
        borderRadius: 14,
        padding: `${size * 0.1}px ${size * 0.28}px ${size * 0.14}px`,
        boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
      }}
    >
      <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1.05, letterSpacing: "-0.03em", color: line.ink, whiteSpace: "nowrap" }}>
        {line.text}
      </span>
    </div>
  );
}

export function TimeRow({ at, label, good }: { at: number; label: string; good: boolean }) {
  return (
    <Rise at={at} distance={26} style={{}}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 0", borderTop: `1px solid ${tone.line}` }}>
        {good ? <Check at={at + 0.15} size={58} color={tone.accent} /> : <Cross at={at + 0.1} size={58} />}
        <Serif text={label} size={good ? 82 : 60} color={good ? tone.peach : tone.faint} italic />
      </div>
    </Rise>
  );
}
