import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Word } from "./timeline";
import { BODY, frame as zones, tone } from "./theme";

type Page = { words: Word[]; start: number; end: number };

const MAX_WORDS = 4;
const GAP = 0.7;
const HOLD = 0.35;

function paginate({ words }: { words: Word[] }) {
  const result: Page[] = [];
  let current: Word[] = [];
  const flush = () => {
    if (current.length === 0) return;
    result.push({ words: current, start: current[0].start, end: current[current.length - 1].end });
    current = [];
  };
  words.forEach((word, index) => {
    const previous = words[index - 1];
    if (previous && word.start - previous.end > GAP) flush();
    current.push(word);
    if (current.length >= MAX_WORDS || /[.,?!]$/.test(word.text)) flush();
  });
  flush();
  return result;
}

export function Captions({ words, mutes, stack }: { words: Word[]; mutes: [number, number][]; stack: number }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const pages = useMemo(() => paginate({ words }), [words]);
  const seconds = frame / fps;

  const index = pages.findIndex((page, i) => {
    const next = pages[i + 1];
    const until = Math.min(page.end + HOLD, next ? next.start : Infinity);
    return seconds >= page.start && seconds < until;
  });
  if (index === -1) return null;
  const page = pages[index];

  const muteFade = mutes.reduce((visible, [from, to]) => {
    const fadeIn = interpolate(seconds, [from - 0.15, from], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fadeOut = interpolate(seconds, [to, to + 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return Math.min(visible, Math.max(fadeIn, fadeOut));
  }, 1);
  if (muteFade <= 0) return null;

  const bottom = interpolate(stack, [0, 1], [zones.captionBottom, zones.stackCaptionBottom]);
  const pop = interpolate(seconds - page.start, [0, 0.16], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const activeIndex = page.words.reduce((active, word, i) => (seconds >= word.start ? i : active), 0);

  return (
    <div
      style={{
        position: "absolute",
        left: (width - zones.captionWidth) / 2,
        width: zones.captionWidth,
        bottom,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: zones.captionSize * 0.28,
        rowGap: 4,
        opacity: muteFade,
        scale: String(pop),
        transformOrigin: "50% 100%",
      }}
    >
      {page.words.map((word, i) => (
        <span
          key={`${word.start}-${word.text}`}
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: zones.captionSize,
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
            color: i === activeIndex ? tone.peach : tone.white,
            textShadow: "0 3px 0 rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9), 0 8px 26px rgba(0,0,0,0.6)",
            WebkitTextStroke: "2px rgba(0,0,0,0.85)",
            paintOrder: "stroke fill",
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}
