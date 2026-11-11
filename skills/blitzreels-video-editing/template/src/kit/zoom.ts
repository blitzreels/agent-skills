import type { Keyframe } from "./TalkEdit";

const FRAME = 1 / 48;

export type Punch = { at: number; zoom: number };

export function snapback({
  cuts,
  durationSeconds,
  punch,
  drift,
  punches,
}: {
  cuts: number[];
  durationSeconds: number;
  punch: number;
  drift: number;
  punches: Punch[];
}): Keyframe[] {
  const edges = [0, ...cuts, durationSeconds];
  const keys: Keyframe[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const start = edges[i];
    const end = edges[i + 1] - FRAME;
    const base = i % 2 === 0 ? 1 : punch;
    const hit = punches.find((p) => p.at > start && p.at < end);
    keys.push([start, base]);
    if (hit) {
      const before = base + drift * ((hit.at - start) / (end - start));
      keys.push([hit.at - 0.05, before], [hit.at, hit.zoom], [end, hit.zoom + drift * 0.5]);
    } else {
      keys.push([end, base + drift]);
    }
  }
  return keys;
}
