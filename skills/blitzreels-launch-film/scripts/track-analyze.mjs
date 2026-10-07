// Estimates tempo, first strong downbeat and key of a supplied music track, and prints a grid.json skeleton.
// Usage: node track-analyze.mjs --track FILE [--seconds 15] [--fps 60]
import { spawnSync } from "node:child_process";
import { basename } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({ options: { track: { type: "string" }, seconds: { type: "string" }, fps: { type: "string" } } });
if (!args.track) {
  console.error("usage: track-analyze.mjs --track FILE [--seconds 15] [--fps 60]");
  process.exit(2);
}
const SR = 22050;
const filmSeconds = Number(args.seconds ?? 15);
const fps = Number(args.fps ?? 60);

const dec = spawnSync("ffmpeg", ["-v", "error", "-i", args.track, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
if (dec.status !== 0) {
  console.error(`ffmpeg could not decode ${args.track}:\n${dec.stderr}`);
  console.log(JSON.stringify({ ok: false, error: "decode failed" }));
  process.exit(1);
}
const x = new Float32Array(dec.stdout.buffer, dec.stdout.byteOffset, dec.stdout.length / 4);
const duration = x.length / SR;
const pc = (n) => ((n % 12) + 12) % 12;
const binMidi = ({ k, size }) => 69 + 12 * Math.log2((k * SR) / size / 440);

// ---------- FFT ----------
const fft = ({ re, im }) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
      }
    }
  }
};

/** Magnitude spectra of Hann-windowed frames. */
const stft = ({ size, hop, each }) => {
  const win = Float64Array.from({ length: size }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size));
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  const mag = new Float64Array(size / 2);
  for (let f = 0; f * hop + size <= x.length; f++) {
    for (let i = 0; i < size; i++) {
      re[i] = x[f * hop + i] * win[i];
      im[i] = 0;
    }
    fft({ re, im });
    for (let k = 0; k < size / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
    each({ frame: f, mag });
  }
};

// ---------- onset envelope (log spectral flux, full band and low band) ----------
const N1 = 2048;
const HOP = 256;
const FR = SR / HOP;
const lowBins = Math.round((200 * N1) / SR);
const full = [];
const low = [];
const chromaFrames = [];
let prev = null;
stft({
  size: N1,
  hop: HOP,
  each: ({ mag }) => {
    const cur = Float64Array.from(mag, (m) => Math.log1p(100 * m));
    let a = 0;
    let b = 0;
    if (prev) for (let k = 1; k < cur.length; k++) {
      const d = Math.max(0, cur[k] - prev[k]);
      a += d;
      if (k <= lowBins) b += d;
    }
    full.push(a);
    low.push(b);
    prev = cur;
    const c = new Float64Array(12);
    for (let k = Math.ceil((130 * N1) / SR); k < (2000 * N1) / SR; k++) c[pc(Math.round(binMidi({ k, size: N1 })))] += mag[k];
    chromaFrames.push(c);
  },
});
const whiten = (env) => {
  const out = new Float64Array(env.length);
  const w = Math.round(FR * 0.25);
  for (let i = 0; i < env.length; i++) {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(env.length - 1, i + w); j++, n++) s += env[j];
    out[i] = Math.max(0, env[i] - s / n);
  }
  return out;
};
const onset = whiten(full);
const lowOnset = whiten(low);
// Log flux peaks when an onset nears the end of the analysis frame.
const frameTime = (f) => (f * HOP + N1 * 0.85) / SR;
const at = ({ env, pos }) => {
  const i = Math.floor(pos);
  return i < 0 || i + 1 >= env.length ? 0 : env[i] + (env[i + 1] - env[i]) * (pos - i);
};

// ---------- tempo: autocorrelation with a 100–140 BPM preference, then a fine comb search ----------
const ac = (lag) => {
  let s = 0;
  for (let i = 0; i + lag < onset.length; i++) s += onset[i] * at({ env: onset, pos: i + lag });
  return s / (onset.length - lag);
};
const prior = (bpm) => Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.35) ** 2);
let coarse = 120;
let bestScore = -Infinity;
for (let bpm = 70; bpm <= 180; bpm += 0.5) {
  const lag = (FR * 60) / bpm;
  const score = (ac(lag) + 0.5 * ac(2 * lag) + 0.25 * ac(4 * lag)) * prior(bpm);
  if (score > bestScore) [bestScore, coarse] = [score, bpm];
}
const comb = ({ period, phase, env }) => {
  let s = 0;
  let n = 0;
  for (let p = phase; p < env.length; p += period, n++) s += at({ env, pos: p });
  return n ? s / n : 0;
};
let best = { bpm: coarse, phase: 0, score: -Infinity };
for (let bpm = coarse - 2; bpm <= coarse + 2; bpm += 0.02) {
  const period = (FR * 60) / bpm;
  for (let phase = 0; phase < period; phase += 0.25) {
    const score = comb({ period, phase, env: onset });
    if (score > best.score) best = { bpm, phase, score };
  }
}
const bpm = Math.abs(best.bpm - Math.round(best.bpm)) < 0.2 ? Math.round(best.bpm) : +best.bpm.toFixed(2);
const period = (FR * 60) / bpm;
let phase = best.phase;
{
  let s = -Infinity;
  for (let p = best.phase - 2; p <= best.phase + 2; p += 0.05) {
    const v = comb({ period, phase: p, env: onset });
    if (v > s) [s, phase] = [v, p];
  }
}

// ---------- downbeat: chords change on bar lines, so pick the half-beat position with the most harmonic change ----------
const prefix = [new Float64Array(12)];
for (const c of chromaFrames) prefix.push(prefix.at(-1).map((v, i) => v + c[i]));
const chromaMean = ({ from, to }) => {
  const a = Math.max(0, Math.min(chromaFrames.length, Math.round(from)));
  const b = Math.max(0, Math.min(chromaFrames.length, Math.round(to)));
  return prefix[b].map((v, i) => v - prefix[a][i]);
};
const novelty = (p) => {
  const before = chromaMean({ from: p - period, to: p });
  const after = chromaMean({ from: p, to: p + period });
  const dot = before.reduce((s, v, i) => s + v * after[i], 0);
  const n = Math.hypot(...before) * Math.hypot(...after);
  return n > 0 ? 1 - dot / n : 0;
};
const bar = 4 * period;
const lowPeak = Math.max(...lowOnset) || 1;
const candidates = Array.from({ length: 8 }, (_, k) => {
  const start = (((phase + (k * period) / 2) % bar) + bar) % bar;
  let s = 0;
  let n = 0;
  for (let p = start; p < onset.length - period; p += bar, n++) s += novelty(p) + (0.25 * at({ env: lowOnset, pos: p })) / lowPeak;
  return { k, start, score: n ? s / n : 0 };
});
const down = candidates.reduce((a, b) => (b.score > a.score ? b : a));
const downs = [];
for (let p = down.start; p < onset.length; p += bar) downs.push(p);
const strongest = (p) => Math.max(...[-2, -1, 0, 1, 2].map((d) => at({ env: onset, pos: p + d })));
const peakOnset = Math.max(...downs.map(strongest));
const firstDown = downs.find((p) => strongest(p) >= 0.3 * peakOnset) ?? downs[0] ?? 0;
const barPhase = down.k;

/** Snap the downbeat to the steepest 2 ms energy rise within ±35 ms. */
const refine = (t) => {
  const step = Math.round(0.002 * SR);
  const win = Math.round(0.005 * SR);
  const rms = (c) => {
    let e = 0;
    for (let i = Math.max(0, c - win); i < Math.min(x.length, c + win); i++) e += x[i] * x[i];
    return Math.log10(e / (2 * win) + 1e-12);
  };
  let bestT = t;
  let bestRise = -Infinity;
  for (let c = Math.round((t - 0.035) * SR); c <= Math.round((t + 0.035) * SR); c += step) {
    const rise = rms(c + win) - rms(c - win);
    if (rise > bestRise) [bestRise, bestT] = [rise, c / SR];
  }
  return Math.max(0, bestT);
};
const offset = +refine(frameTime(firstDown)).toFixed(3);

// ---------- key: chroma vs Krumhansl–Kessler profiles ----------
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const chroma = new Float64Array(12);
const bassFrames = [];
const N2 = 8192;
stft({
  size: N2,
  hop: N2 / 2,
  each: ({ frame, mag }) => {
    for (let k = Math.ceil((80 * N2) / SR); k < (2000 * N2) / SR; k++) {
      const midi = binMidi({ k, size: N2 });
      if (Math.abs(midi - Math.round(midi)) > 0.35) continue;
      chroma[pc(Math.round(midi))] += Math.sqrt(mag[k]);
    }
    const bass = new Float64Array(12);
    for (let k = Math.ceil((40 * N2) / SR); k < (260 * N2) / SR; k++) {
      const midi = binMidi({ k, size: N2 });
      if (Math.abs(midi - Math.round(midi)) <= 0.3) bass[pc(Math.round(midi))] += mag[k];
    }
    bassFrames.push({ t: (frame * (N2 / 2) + N2 / 2) / SR, bass });
  },
});
const corr = ({ a, b }) => {
  const ma = a.reduce((s, v) => s + v, 0) / 12;
  const mb = b.reduce((s, v) => s + v, 0) / 12;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < 12; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db || 1);
};
const keys = [];
for (let t = 0; t < 12; t++) {
  const rot = (p) => Array.from({ length: 12 }, (_, i) => p[(i - t + 12) % 12]);
  keys.push({ key: `${NAMES[t]} major`, r: corr({ a: [...chroma], b: rot(MAJOR) }), tonic: t, minor: false });
  keys.push({ key: `${NAMES[t]} minor`, r: corr({ a: [...chroma], b: rot(MINOR) }), tonic: t, minor: true });
}
keys.sort((a, b) => b.r - a.r);
const relativeOf = (k) => keys.find((o) => o.minor !== k.minor && o.tonic === (k.minor ? (k.tonic + 3) % 12 : (k.tonic + 9) % 12));
// Relative keys share every note; songs open and close on the tonic, so the bass there breaks a close call.
const barSeconds = (4 * 60) / bpm;
const bassAt = ({ from, to }) => bassFrames.filter((f) => f.t >= from && f.t < to).reduce((s, f) => s.map((v, i) => v + f.bass[i]), new Float64Array(12));
const edgeBass = [bassAt({ from: offset, to: offset + barSeconds }), bassAt({ from: duration - barSeconds, to: duration })].reduce((a, b) => a.map((v, i) => v + b[i]));
let key = keys[0];
const rel = relativeOf(key);
let tieBreak = "profile";
if (key.r - rel.r < 0.15 && edgeBass[rel.tonic] > edgeBass[key.tonic] * 1.2) [key, tieBreak] = [rel, "bass on first/last bar"];
const relative = relativeOf(key);

// ---------- grid skeleton ----------
const bars = Math.max(1, Math.round(filmSeconds / barSeconds));
const trackBars = Math.floor((duration - offset) / barSeconds);
const grid = { bpm, bars: Math.min(bars, trackBars), fps, key: key.key, gates: [], cues: [] };
const music = { track: `assets/${basename(args.track)}`, offset };

console.log(`track     ${args.track} (${duration.toFixed(2)} s)`);
console.log(`tempo     ${bpm} BPM (autocorrelation peak ${coarse}, beat ${(60 / bpm).toFixed(4)} s)`);
console.log(`downbeat  first strong downbeat at ${offset} s (half-beat ${barPhase} of the beat comb, by harmonic change)`);
console.log(`key       ${key.key} (r ${key.r.toFixed(3)}, chosen by ${tieBreak}; relative ${relative.key} r ${relative.r.toFixed(3)}; top profile match ${keys[0].key})`);
console.log(`bars      ${grid.bars} bars = ${(grid.bars * barSeconds).toFixed(3)} s for a ~${filmSeconds} s film; ${trackBars} whole bars available after the downbeat`);
console.log(`\ngrid.json skeleton:\n${JSON.stringify(grid, null, 2)}`);
console.log(`\nfilm.config.json: "bpm": ${bpm}, "bars": ${grid.bars}, "key": "${key.key}", "music": ${JSON.stringify(music)}`);
console.log(JSON.stringify({ ok: true, bpm, offset, key: key.key, relative: relative.key, keyConfidence: +key.r.toFixed(3), bars: grid.bars, trackBars, duration: +duration.toFixed(3), grid, music }));
