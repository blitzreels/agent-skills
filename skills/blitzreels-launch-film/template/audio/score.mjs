// This film's score: generated music (or a supplied track) + the grid's SFX → audio/score.wav, sfx-stem.f32, score.json.
// Usage: node audio/score.mjs [--track assets/music.mp3 --offset 0.52]   (or film.config.json "music": { track, offset })
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { SR, biggestHit, createFilm, duck, gateWindows, loadTrack, master, music, placeCues, validate, writeStem } from "./synth.mjs";

const studio = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { values: args } = parseArgs({ options: { track: { type: "string" }, offset: { type: "string" } } });
const grid = JSON.parse(readFileSync(resolve(studio, "grid.json"), "utf8"));
const config = JSON.parse(readFileSync(resolve(studio, "film.config.json"), "utf8"));
const started = performance.now();

try {
  validate({ grid });
} catch (e) {
  console.error(e.message);
  console.log(JSON.stringify({ ok: false, error: e.message }));
  process.exit(1);
}
const film = createFilm({ grid });
const track = args.track ?? config.music?.track;
const end = grid.bars * 4;

if (track) {
  loadTrack({ film, file: resolve(studio, track), offset: Number(args.offset ?? config.music?.offset ?? 0) });
} else {
  const drop = grid.gates?.length ? Math.max(...grid.gates.map((g) => g.beat)) : end / 2;
  music({
    film,
    arrangement: {
      resolve: true,
      sections: [
        { type: "intro", from: 0, to: Math.min(4, drop) },
        { type: "build", from: Math.min(4, drop), to: drop },
        { type: "drop", from: drop, to: end - 1 },
        { type: "resolve", from: end - 1, to: end },
      ],
    },
  });
}

placeCues({ film, cues: grid.cues });
duck({ film, ...(track ? { kickDepth: 0, sfxDepth: 0.6, hitDepth: 0.5 } : {}) });
const hit = biggestHit({ film });
const stats = master({ film, outFile: resolve(studio, "audio/score.wav"), hit });
writeStem({ film, outFile: resolve(studio, "audio/sfx-stem.f32") });

const summary = {
  mode: track ? "track" : "synth",
  track: film.track ?? null,
  key: film.key.name,
  scale: film.key.pcs,
  bpm: grid.bpm,
  bars: grid.bars,
  fps: film.fps,
  sr: SR,
  duration: +film.duration.toFixed(4),
  gates: gateWindows({ grid }),
  biggestHit: hit && { id: hit.id, time: hit.time },
  master: stats,
  cues: film.log,
};
writeFileSync(resolve(studio, "audio/score.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`score.wav ${film.duration.toFixed(3)}s ${film.key.name} ${summary.mode}: I ${stats.I} LUFS, TP ${stats.TP} dBTP, LRA ${stats.LRA} LU`);
console.log(JSON.stringify({ ok: true, mode: summary.mode, I: stats.I, TP: stats.TP, LRA: stats.LRA, cues: film.log.length, ms: Math.round(performance.now() - started) }));
