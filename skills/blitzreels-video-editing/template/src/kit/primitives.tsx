import type { CSSProperties, ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, DISPLAY, glassCard, outExpo, tone } from "./theme";

export function useSpringAt({ at }: { at: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 16, stiffness: 150, mass: 0.8 } });
}

export function useEaseAt({ at, duration }: { at: number; duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return interpolate(frame / fps, [at, at + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: outExpo,
  });
}

export function BeatFrame({ duration, children }: { duration: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [duration - 8, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out, filter: out < 1 ? `blur(${(1 - out) * 6}px)` : undefined }}>
      {children}
    </div>
  );
}

export function Rise({ at, distance, style, children }: { at: number; distance: number; style: CSSProperties; children: ReactNode }) {
  const p = useSpringAt({ at });
  return (
    <div
      style={{
        ...style,
        opacity: interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
        translate: `0 ${(1 - p) * distance}px`,
        scale: String(interpolate(p, [0, 1], [0.94, 1])),
        filter: p < 0.98 ? `blur(${Math.max(0, 1 - p) * 10}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function Glass({ style, children }: { style: CSSProperties; children: ReactNode }) {
  return <div style={{ ...glassCard, position: "relative", overflow: "hidden", ...style }}>{children}</div>;
}

export function Sheen({ at }: { at: number }) {
  const p = useEaseAt({ at, duration: 0.9 });
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: "linear-gradient(105deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.16) 48%, rgba(255,255,255,0) 60%)",
        translate: `${interpolate(p, [0, 1], [-110, 110])}% 0`,
      }}
    />
  );
}

export function Kicker({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, letterSpacing: "0.14em", textTransform: "uppercase", color }}>
      {text}
    </div>
  );
}

export function Serif({ text, size, color, italic }: { text: string; size: number; color: string; italic: boolean }) {
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontStyle: italic ? "italic" : "normal",
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: "-0.03em",
        color,
      }}
    >
      {text}
    </div>
  );
}

export function WipeLine({ at, text, size, color, italic }: { at: number; text: string; size: number; color: string; italic: boolean }) {
  const p = useEaseAt({ at, duration: 0.7 });
  return (
    <div style={{ overflow: "hidden", paddingBottom: size * 0.16 }}>
      <div style={{ translate: `0 ${(1 - p) * 115}%`, whiteSpace: "nowrap" }}>
        <Serif text={text} size={size} color={color} italic={italic} />
      </div>
    </div>
  );
}

export function Sticker({
  at,
  text,
  paper,
  color,
  size,
  tilt,
}: {
  at: number;
  text: string;
  paper: string;
  color: string;
  size: number;
  tilt: number;
}) {
  const p = useSpringAt({ at });
  return (
    <div
      style={{
        display: "inline-block",
        scale: String(interpolate(p, [0, 1], [0.4, 1])),
        opacity: interpolate(p, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }),
        rotate: `${interpolate(p, [0, 1], [tilt * 4, tilt])}deg`,
        background: paper,
        borderRadius: 16,
        padding: `${size * 0.12}px ${size * 0.3}px ${size * 0.16}px`,
        boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
        fontFamily: BODY,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.03em",
        lineHeight: 1.05,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

export function Check({ at, size, color }: { at: number; size: number; color: string }) {
  const p = useEaseAt({ at, duration: 0.45 });
  const pop = useSpringAt({ at });
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block", scale: String(interpolate(pop, [0, 1], [0.6, 1])) }}>
      <circle cx="20" cy="20" r="19" fill={color} opacity={Math.min(1, pop * 1.5)} />
      <path
        d="M11 20.5l6 6 12-13"
        fill="none"
        stroke={tone.ink}
        strokeWidth={4.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
    </svg>
  );
}

export function Cross({ at, size }: { at: number; size: number }) {
  const p = useEaseAt({ at, duration: 0.35 });
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
      <circle cx="20" cy="20" r="19" fill="rgba(255,255,255,0.12)" opacity={p > 0 ? 1 : 0} />
      {["M13 13l14 14", "M27 13L13 27"].map((d, i) => (
        <path
          key={d}
          d={d}
          stroke={tone.faint}
          strokeWidth={3.6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - Math.min(1, Math.max(0, p * 2 - i))}
        />
      ))}
    </svg>
  );
}

export function Caret({ on, color, height }: { on: boolean; color: string; height: number }) {
  const frame = useCurrentFrame();
  const visible = on && Math.floor(frame / 9) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: height * 0.5,
        height,
        marginLeft: 4,
        verticalAlign: "text-bottom",
        background: color,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}

export function useTyped({ text, from, until }: { text: string; from: number; until: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.floor(
    interpolate(frame / fps, [from, until], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
}
