export type Word = { text: string; start: number; end: number };

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
  cuts: number[];
  words: Word[];
};

export function durationInFrames({ timeline }: { timeline: Timeline }) {
  return Math.floor(timeline.durationSeconds * timeline.fps);
}
