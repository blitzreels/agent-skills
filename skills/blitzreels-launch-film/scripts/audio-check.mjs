// Checks a studio's mastered score: pitch of every tonal cue vs the key, loudness, gate silence, loudest moment.
// Usage: node audio-check.mjs --studio DIR   (needs DIR/grid.json and DIR/audio/{score.wav,score.json,sfx-stem.f32})
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { measureLoudness, noteName } from "../template/audio/synth.mjs";

const { values: args } = parseArgs({ options: { studio: { type: "string" }, target: { type: "string" }, "true-peak": { type: "string" } } });
if (!args.studio) {
  console.error("usage: audio-check.mjs --studio DIR");
  process.exit(2);
}
const dir = resolve(args.studio);
const target = Number(args.target ?? -14);
const tpLimit = Number(args["true-peak"] ?? -2);
const paths = { wav: resolve(dir, "audio/score.wav"), json: resolve(dir, "audio/score.json"), stem: resolve(dir, "audio/sfx-stem.f32") };
for (const p of Object.values(paths)) if (!existsSync(p)) fail(`missing ${p} (run node audio/score.mjs first)`);

const score = JSON.parse(readFileSync(paths.json, "utf8"));
const SR = score.sr;
const scale = new Set(score.scale);
const failures = [];

// ---- 1. pitch ----
const stemBuf = readFileSync(paths.stem);
const stem = new Float32Array(stemBuf.buffer, stemBuf.byteOffset, stemBuf.length / 4);
const WIN = Math.round(0.12 * SR);
const hann = Float64Array.from({ length: WIN }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1)));
const freqs = [];
for (let m = 24; m <= 112; m += 0.1) freqs.push(440 * 2 ** ((m - 69) / 12));

const goertzel = ({ x, f }) => {
  const w = (2 * Math.PI * f) / SR;
  const c = 2 * Math.cos(w);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < x.length; i++) {
    const s0 = x[i] + c * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - c * s1 * s2;
};

const windowAt = ({ from }) => {
  const a = Math.round(from * SR);
  const x = new Float64Array(WIN);
  for (let i = 0; i < WIN; i++) x[i] = (stem[a + i] ?? 0) * hann[i];
  return x;
};

/** Dominant new pitch at a cue: 10-cent Goertzel scan of the window after the cue minus the window before it,
 * so a sustained or decaying earlier sound cannot win. */
const dominant = ({ time }) => {
  const after = windowAt({ from: time + 0.04 });
  const before = windowAt({ from: time - 0.005 - 0.12 });
  let best = 0;
  let bestF = 0;
  for (const f of freqs) {
    const p = goertzel({ x: after, f }) - goertzel({ x: before, f });
    if (p > best) [best, bestF] = [p, f];
  }
  const level = 10 * Math.log10((best * 4) / (WIN * WIN) + 1e-20);
  return { midi: bestF ? 69 + 12 * Math.log2(bestF / 440) : 0, level };
};

const pc = (n) => ((n % 12) + 12) % 12;
const isOff = (status) => status === "OUT OF KEY" || status === "DETUNED";

const pitchStatus = ({ cue, nearest, cents }) => {
  if (!scale.has(pc(nearest))) return "OUT OF KEY";
  if (Math.abs(cents) > 35) return "DETUNED";
  if (cue.note == null) return "in key";
  if (pc(nearest - cue.note) === 0) return "ok";
  return "in key (other partial)";
};

const tonal = score.cues.filter((c) => c.pitched || c.keyed);
const pitchRows = tonal.map((c) => {
  const masked = score.cues.some((o) => o !== c && Math.abs(o.time - c.time) < 0.06);
  const d = dominant({ time: c.time });
  const nearest = Math.round(d.midi);
  const cents = Math.round((d.midi - nearest) * 100);
  const expected = c.note != null ? noteName(c.note) : null;
  let status = pitchStatus({ cue: c, nearest, cents });
  if (d.level < -70) status = "quiet";
  else if (masked && isOff(status)) status = `masked (${status.toLowerCase()})`;
  if (isOff(status)) failures.push(`pitch: cue "${c.id}" (${c.sfx}) sounds ${noteName(nearest)} ${cents >= 0 ? "+" : ""}${cents}c, ${status.toLowerCase()} in ${score.key}${expected ? `; expected ${expected}` : ""}`);
  return { id: c.id, sfx: c.sfx, time: c.time, expected: expected ?? "-", detected: noteName(nearest), cents, status };
});

// ---- 2. loudness (after the full master chain: this is the delivered file) ----
const loud = measureLoudness({ file: paths.wav });
if (!(Math.abs(loud.I - target) <= 1)) failures.push(`loudness: integrated ${loud.I} LUFS, target ${target} ± 1`);
if (!(loud.TP <= tpLimit)) failures.push(`true peak: ${loud.TP} dBTP, limit ${tpLimit}`);

// ---- 3. gates ----
const dec = spawnSync("ffmpeg", ["-v", "error", "-i", paths.wav, "-f", "f32le", "-ac", "2", "-ar", String(SR), "-"], { maxBuffer: 1 << 30 });
const pcm = new Float32Array(dec.stdout.buffer, dec.stdout.byteOffset, dec.stdout.length / 4);
const gateRows = score.gates.map((g) => {
  let e = 0;
  const a = Math.round(g.from * SR);
  const b = Math.round(g.to * SR);
  for (let i = a; i < b; i++) e += pcm[i * 2] ** 2 + pcm[i * 2 + 1] ** 2;
  const db = e > 0 ? +(10 * Math.log10(e / (2 * Math.max(1, b - a)))).toFixed(1) : -Infinity;
  if (!(db < -80)) failures.push(`gate before beat ${g.beat}: ${db} dB in ${g.from.toFixed(3)}–${g.to.toFixed(3)} s, needs < -80 dB`);
  return { beat: g.beat, from: +g.from.toFixed(3), to: +g.to.toFixed(3), db: Number.isFinite(db) ? db : "-inf" };
});

// ---- 4. loudest momentary window vs the biggest hit ----
const log = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", paths.wav, "-af", "ebur128=framelog=info", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 30 }).stderr;
const frames = [...log.matchAll(/t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+|-inf)/g)].map((m) => ({ t: Number(m[1]), M: Number(m[2]) })).filter((f) => Number.isFinite(f.M));
const loudest = frames.reduce((a, b) => (b.M > a.M ? b : a), { t: 0, M: -Infinity });
const hit = score.biggestHit;
let loudestRow = { t: loudest.t, M: loudest.M, window: [+(loudest.t - 0.4).toFixed(2), loudest.t], hit: hit?.id ?? null, hitTime: hit?.time ?? null };
if (!hit) failures.push("loudest moment: no big hit (impact/drop/logo) in the cues");
else {
  const near = loudest.t >= hit.time && loudest.t - 0.4 <= hit.time + 0.8;
  const atHit = frames.filter((f) => f.t >= hit.time && f.t <= hit.time + 1.2).reduce((m, f) => Math.max(m, f.M), -Infinity);
  loudestRow = { ...loudestRow, near, MnearHit: atHit };
  if (!near) failures.push(`loudest moment: momentary max ${loudest.M} LUFS at ${(loudest.t - 0.4).toFixed(2)}–${loudest.t.toFixed(2)} s, but the biggest hit "${hit.id}" is at ${hit.time.toFixed(2)} s (max near it ${atHit} LUFS)`);
}

// ---- report ----
console.log(`audio-check ${dir}  (${score.mode}, ${score.key}, ${score.bpm} BPM)`);
console.log("\npitch (sfx stem, onset spectrum of 120 ms from cue + 40 ms):");
console.log(`  ${"cue".padEnd(16)}${"sfx".padEnd(13)}${"time".padStart(7)}  ${"want".padEnd(5)}${"got".padEnd(5)}${"cents".padStart(6)}  status`);
for (const r of pitchRows) console.log(`  ${r.id.padEnd(16)}${r.sfx.padEnd(13)}${r.time.toFixed(3).padStart(7)}  ${r.expected.padEnd(5)}${r.detected.padEnd(5)}${String(r.cents).padStart(6)}  ${r.status}`);
console.log(`\nloudness: I ${loud.I} LUFS (target ${target}), LRA ${loud.LRA} LU, true peak ${loud.TP} dBTP (limit ${tpLimit})`);
for (const g of gateRows) console.log(`gate → beat ${g.beat}: ${g.from}–${g.to} s at ${g.db} dB`);
console.log(`loudest 400 ms: ${loudestRow.window[0]}–${loudestRow.window[1]} s at ${loudest.M} LUFS; biggest hit ${loudestRow.hit} at ${loudestRow.hitTime}s`);
if (failures.length) console.log(`\nFAIL (${failures.length}):\n  - ${failures.join("\n  - ")}`);
else console.log("\nPASS");
console.log(JSON.stringify({ ok: failures.length === 0, failures, loudness: loud, gates: gateRows, loudest: loudestRow, pitch: { checked: pitchRows.length, out: pitchRows.filter((r) => isOff(r.status)).length, masked: pitchRows.filter((r) => r.status.startsWith("masked")).length } }));
process.exit(failures.length ? 1 : 0);

function fail(msg) {
  console.error(msg);
  console.log(JSON.stringify({ ok: false, failures: [msg] }));
  process.exit(1);
}
