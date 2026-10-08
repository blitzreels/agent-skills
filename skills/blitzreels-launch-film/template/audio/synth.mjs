// Launch-film audio library: key-locked synthesis, an SFX palette on the beat grid, mixing and mastering.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const SR = 48000;

// ---------- keys ----------
const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MODES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};
const ALIASES = { "": "major", maj: "major", ionian: "major", m: "minor", min: "minor", aeolian: "minor" };
const ACCIDENTAL = { "": 0, "#": 1, "♯": 1, b: -1, "♭": -1 };

const mod = ({ n, m }) => ((n % m) + m) % m;
const pc = (n) => mod({ n: Math.round(n), m: 12 });
export const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
export const noteName = (midi) => `${NAMES[pc(midi)]}${Math.floor(Math.round(midi) / 12) - 1}`;

/** "A minor", "Am", "F# minor", "Bb dorian", "C major" → key with its seven pitch classes. */
export function parseKey(name) {
  const m = /^\s*([A-Ga-g])\s*([#♯b♭]?)\s*([A-Za-z]*)\s*$/.exec(String(name ?? ""));
  if (!m) throw new Error(`key "${name}": expected a tonic and a mode, e.g. "A minor", "C major", "F# minor"`);
  const word = m[3] === "M" ? "major" : m[3].toLowerCase();
  const mode = ALIASES[word] ?? word;
  if (!MODES[mode]) throw new Error(`key "${name}": unknown mode "${m[3]}" (${Object.keys(MODES).join(", ")})`);
  const tonic = pc(PC[m[1].toLowerCase()] + ACCIDENTAL[m[2]]);
  const steps = MODES[mode];
  const pcs = steps.map((s) => pc(tonic + s));
  const set = new Set(pcs);
  return {
    name: `${NAMES[tonic]} ${mode}`,
    tonic,
    mode,
    steps,
    pcs,
    minor: steps[2] === 3,
    has: (midi) => Number.isInteger(midi) && set.has(pc(midi)),
    spell: () => pcs.map((p) => NAMES[p]).join(" "),
  };
}

/** The MIDI note of scale degree `degree` (0 = tonic) nearest to `near`. */
export function degreeNote({ key, degree, near }) {
  const target = key.pcs[mod({ n: degree, m: 7 })];
  return near + mod({ n: target - pc(near) + 6, m: 12 }) - 6;
}

/** Move `steps` scale degrees up (or down) from an in-key note. */
export function scaleStep({ key, note, steps }) {
  const idx = key.pcs.indexOf(pc(note));
  if (idx < 0) throw new Error(`${noteName(note)} is not in ${key.name}`);
  const base = note - key.steps[idx];
  const total = idx + steps;
  return base + 12 * Math.floor(total / 7) + key.steps[mod({ n: total, m: 7 })];
}

/** Diatonic triad on `degree`, root nearest `near`. */
export const triad = ({ key, degree, near }) => {
  const root = degreeNote({ key, degree, near });
  return [root, scaleStep({ key, note: root, steps: 2 }), scaleStep({ key, note: root, steps: 4 })];
};

/** Keeps only harmonic partials that land on a note of the key (no F# fifth above B in A minor). */
export function keyPartials({ key, note, partials }) {
  return partials.filter(({ ratio }) => {
    if (ratio === 1) return true;
    const semis = 12 * Math.log2(ratio);
    const near = Math.round(semis);
    return Math.abs(semis - near) < 0.2 && key.has(note + near);
  });
}

/** Default chord degrees per bar: i–VI–III–VII in minor, I–V–vi–IV in major; `resolve` lands the last bar on the tonic. */
export function progression({ key, bars, resolve }) {
  const cycle = key.minor ? [0, 5, 2, 6] : [0, 4, 5, 3];
  const out = Array.from({ length: bars }, (_, i) => cycle[i % 4]);
  if (resolve && bars > 1) out[bars - 1] = 0;
  return out;
}

// ---------- primitives ----------
/** Seeded noise source in [-1, 1). */
export const rng = ({ seed }) => {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2147483648 - 1;
};
export const hash = (str) => [...String(str)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

export const render = ({ seconds, fn }) => {
  const out = new Float32Array(Math.max(1, Math.ceil(seconds * SR)));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / SR);
  return out;
};

/** Chamberlin state-variable filter; cutoff may be a function of time. */
export const svf = ({ input, cutoff, q, mode }) => {
  const out = new Float32Array(input.length);
  let low = 0;
  let band = 0;
  for (let i = 0; i < input.length; i++) {
    const c = typeof cutoff === "function" ? cutoff(i / SR) : cutoff;
    const f = 2 * Math.sin((Math.PI * Math.min(c, SR / 6)) / SR);
    low += f * band;
    const high = input[i] - low - q * band;
    band += f * high;
    if (mode === "low") out[i] = low;
    else if (mode === "band") out[i] = band;
    else out[i] = high;
  }
  return out;
};

export const mixInto = ({ out, src, at, gain }) => {
  const o = Math.round(at * SR);
  for (let i = 0; i < src.length && o + i < out.length; i++) if (o + i >= 0) out[o + i] += src[i] * gain;
  return out;
};

const sine = ({ f, t }) => Math.sin(2 * Math.PI * f * t);
const saw = ({ f, t }) => 2 * ((f * t) % 1) - 1;
const edges = ({ t, seconds, attack, release }) => Math.min(1, t / attack) * Math.min(1, Math.max(0, seconds - t) / release);

/** Additive tone on `note`: only in-key partials, optional pitch dive that settles on the note within ~30 ms. */
export function tone({ key, note, seconds, partials, decay, dive = 0, attack = 0.002 }) {
  const f0 = hz(note);
  const ps = keyPartials({ key, note, partials: partials ?? [{ ratio: 1, amp: 1 }] });
  const ph = new Float64Array(ps.length);
  return render({
    seconds,
    fn: (t) => {
      const k = 1 + dive * Math.exp(-t * 160);
      let s = 0;
      for (let j = 0; j < ps.length; j++) {
        ph[j] += (2 * Math.PI * f0 * k * ps[j].ratio) / SR;
        s += ps[j].amp * Math.sin(ph[j]) * Math.exp(-t * (ps[j].decay ?? 0));
      }
      return s * Math.exp(-t * decay) * edges({ t, seconds, attack, release: 0.01 });
    },
  });
}

const air = ({ noise, seconds, shape, cutoff, q, mode }) => svf({ input: render({ seconds, fn: (t) => noise() * shape(t) }), cutoff, q, mode: mode ?? "band" });
const sum = (layers) => {
  const out = new Float32Array(Math.max(...layers.map(([s, at]) => s.length + Math.round((at ?? 0) * SR))));
  for (const [s, at, g] of layers) mixInto({ out, src: s, at: at ?? 0, gain: g ?? 1 });
  return out;
};
const seq = ({ notes, step, make }) => sum(notes.map((n, k) => [make(n), k * step]));

// ---------- SFX palette ----------
// Each recipe: { family, pitched (needs cue.note), keyed (tonal, derived from the key; note optional),
// noise (pure noise: may get per-cue speed variation), sweep (gliding pitch, no stable note), big, make({ ctx, note }) }.
// ctx: { key, beat (s), length (beats), noise() }. make returns { lead, samples, side?, gain, wet, pan? }.
const tonic = ({ ctx, note, near }) => note ?? degreeNote({ key: ctx.key, degree: 0, near });
const chordTones = ({ ctx, note, near }) => {
  const root = tonic({ ctx, note, near });
  return triad({ key: ctx.key, degree: ctx.key.pcs.indexOf(pc(root)), near: root });
};

export const PALETTE = {
  impact: {
    family: "impact", keyed: true, big: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 31 });
      const body = tone({ key: ctx.key, note: root, seconds: 1.6, decay: 2.4, dive: 1.2, partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.35, decay: 7 }, { ratio: 3, amp: 0.18, decay: 12 }] });
      const crack = render({ seconds: 0.12, fn: (t) => ctx.noise() * Math.exp(-t * 45) * 0.8 });
      const side = air({ noise: ctx.noise, seconds: 1.4, shape: (t) => Math.exp(-t * 3.2) * 0.28, cutoff: (t) => 9000 * Math.exp(-t * 2) + 1500, q: 0.6 });
      return { lead: 0, samples: sum([[body], [crack]]), side, gain: 0.62, wet: 0.5 };
    },
  },
  drop: {
    family: "impact", keyed: true, big: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 31 });
      const sub = tone({ key: ctx.key, note: root, seconds: 2.2, decay: 1.8, dive: 1.2, partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.3, decay: 5 }] });
      const stab = sum(chordTones({ ctx, note: root + 36, near: root + 36 }).map((n) => [tone({ key: ctx.key, note: n, seconds: 1, decay: 5, partials: [{ ratio: 1, amp: 0.4 }, { ratio: 2, amp: 0.2 }, { ratio: 3, amp: 0.1 }] })]));
      const crash = air({ noise: ctx.noise, seconds: 2, shape: (t) => Math.exp(-t * 3.5) * 0.35, cutoff: 2500, q: 0.6, mode: "high" });
      const side = air({ noise: ctx.noise, seconds: 2, shape: (t) => Math.exp(-t * 2.2) * 0.22, cutoff: (t) => 7000 * Math.exp(-t * 1.2) + 2500, q: 0.5, mode: "high" });
      return { lead: 0, samples: sum([[sub], [stab, 0, 0.6], [crash]]), side, gain: 1.1, wet: 0.55 };
    },
  },
  logo: {
    family: "logo", keyed: true, big: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 31 });
      const sub = tone({ key: ctx.key, note: root, seconds: 1.9, decay: 2.2, dive: 1 });
      const bell = tone({ key: ctx.key, note: root + 48, seconds: 1.9, decay: 1.6, partials: [{ ratio: 1, amp: 0.6 }, { ratio: 1.5, amp: 0.35, decay: 1 }, { ratio: 2, amp: 0.3, decay: 2 }, { ratio: 3, amp: 0.15, decay: 3 }] });
      const click = render({ seconds: 0.03, fn: (t) => ctx.noise() * Math.exp(-t * 300) * 0.6 });
      const [a, b, c] = chordTones({ ctx, note: root + 60, near: root + 60 });
      const side = sum([[tone({ key: ctx.key, note: a, seconds: 1.8, decay: 2.2 })], [tone({ key: ctx.key, note: b, seconds: 1.8, decay: 3.2 })], [tone({ key: ctx.key, note: c, seconds: 1.8, decay: 4.2 })]]).map((v) => v * 0.08);
      return { lead: 0, samples: sum([[sub, 0, 0.9], [bell, 0, 0.5], [click]]), side, gain: 0.85, wet: 0.6 };
    },
  },
  "impact-soft": {
    family: "impact", keyed: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.6, wet: 0.35, samples: sum([[tone({ key: ctx.key, note: tonic({ ctx, note, near: 38 }), seconds: 0.9, decay: 4, dive: 1.4 })], [render({ seconds: 0.08, fn: (t) => ctx.noise() * Math.exp(-t * 60) * 0.4 })]]) }),
  },
  thump: {
    family: "impact", keyed: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.55, wet: 0.15, samples: tone({ key: ctx.key, note: tonic({ ctx, note, near: 34 }), seconds: 0.35, decay: 12, dive: 1 }) }),
  },
  thud: {
    family: "impact", pitched: true,
    make: ({ ctx, note }) => {
      const pre = 0.22;
      const whoosh = air({ noise: ctx.noise, seconds: pre, shape: (t) => (t / pre) ** 2.5, cutoff: (t) => 700 + 6500 * (t / pre) ** 2, q: 0.45 });
      const body = tone({ key: ctx.key, note, seconds: 0.45, decay: 10, dive: 0.6, partials: [{ ratio: 1, amp: 1 }, { ratio: 3, amp: 0.3, decay: 18 }] });
      const clack = svf({ input: render({ seconds: 0.05, fn: (t) => ctx.noise() * Math.exp(-t * 260) }), cutoff: 3200, q: 0.9, mode: "band" });
      return { lead: pre, gain: 0.55, wet: 0.18, samples: sum([[whoosh, 0, 0.32], [body, pre, 0.75], [clack, pre, 0.55]]) };
    },
  },
  settle: {
    family: "settle", pitched: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.45, wet: 0.15, samples: tone({ key: ctx.key, note, seconds: 0.4, decay: 12, dive: 0.5, partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.25, decay: 20 }] }) }),
  },
  letterpress: {
    family: "letterpress", pitched: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.45, wet: 0.2, samples: sum([[tone({ key: ctx.key, note, seconds: 0.3, decay: 18, dive: 0.4 })], [render({ seconds: 0.03, fn: (t) => ctx.noise() * Math.exp(-t * 300) * 0.2 })]]) }),
  },
  button: {
    family: "click", keyed: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.55, wet: 0.12, samples: sum([[tone({ key: ctx.key, note: tonic({ ctx, note, near: 45 }), seconds: 0.12, decay: 45 })], [render({ seconds: 0.02, fn: (t) => ctx.noise() * Math.exp(-t * 500) * 0.5 })]]) }),
  },
  latch: {
    family: "click", keyed: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.45, wet: 0.12, samples: sum([[tone({ key: ctx.key, note: tonic({ ctx, note, near: 57 }), seconds: 0.18, decay: 40 }), 0, 0.8], [render({ seconds: 0.015, fn: (t) => ctx.noise() * Math.exp(-t * 600) * 0.5 })]]) }),
  },
  trackpad: {
    family: "click", keyed: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.42, wet: 0.08, samples: sum([[tone({ key: ctx.key, note: note ?? degreeNote({ key: ctx.key, degree: 5, near: 53 }), seconds: 0.06, decay: 160 })], [render({ seconds: 0.01, fn: (t) => ctx.noise() * Math.exp(-t * 900) * 0.35 })]]) }),
  },
  click: {
    family: "click", noise: true,
    make: ({ ctx }) => ({ lead: 0, gain: 0.45, wet: 0.1, samples: svf({ input: render({ seconds: 0.04, fn: (t) => ctx.noise() * Math.exp(-t * 400) }), cutoff: 2500, q: 0.6, mode: "high" }) }),
  },
  chip: {
    family: "click", keyed: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.22, wet: 0.15, samples: tone({ key: ctx.key, note: tonic({ ctx, note, near: 98 }), seconds: 0.06, decay: 70, partials: [{ ratio: 1, amp: 0.4 }, { ratio: 3, amp: 0.15 }] }) }),
  },
  tick: {
    family: "click", keyed: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.3, wet: 0.2, samples: tone({ key: ctx.key, note: tonic({ ctx, note, near: 93 }), seconds: 0.08, decay: 90 }) }),
  },
  blip: {
    family: "blip", pitched: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.28, wet: 0.2, samples: tone({ key: ctx.key, note, seconds: 0.2, decay: 24, partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.45, decay: 30 }, { ratio: 4, amp: 0.2, decay: 50 }] }) }),
  },
  marimba: {
    family: "marimba", pitched: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.32, wet: 0.3, samples: tone({ key: ctx.key, note, seconds: 0.5, decay: 9, partials: [{ ratio: 1, amp: 1 }, { ratio: 4, amp: 0.35, decay: 35 }] }) }),
  },
  check: {
    family: "check", pitched: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.3, wet: 0.3, samples: tone({ key: ctx.key, note, seconds: 0.2, decay: 26, partials: [{ ratio: 1, amp: 0.7 }, { ratio: 2, amp: 0.3 }] }) }),
  },
  slot: {
    family: "slot", pitched: true,
    make: ({ ctx, note }) => {
      const body = tone({ key: ctx.key, note, seconds: 0.45, decay: 7, partials: [{ ratio: 1, amp: 1 }, { ratio: 3, amp: 0.35, decay: 22 }, { ratio: 2, amp: 0.2, decay: 9 }] });
      const tick = svf({ input: render({ seconds: 0.03, fn: (t) => ctx.noise() * Math.exp(-t * 400) }), cutoff: 5000, q: 0.8, mode: "band" });
      return { lead: 0, gain: 0.3, wet: 0.35, samples: sum([[body], [tick, 0, 0.4]]) };
    },
  },
  mallet: {
    family: "mallet", pitched: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.3, wet: 0.45, samples: tone({ key: ctx.key, note, seconds: 0.9, decay: 6, partials: [{ ratio: 1, amp: 1 }, { ratio: 4, amp: 0.4, decay: 18 }, { ratio: 3, amp: 0.15, decay: 25 }] }) }),
  },
  knock: {
    family: "mallet", pitched: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.45, wet: 0.2, samples: tone({ key: ctx.key, note, seconds: 0.25, decay: 18, partials: [{ ratio: 1, amp: 1 }, { ratio: 4, amp: 0.5, decay: 40 }] }) }),
  },
  bellsoft: {
    family: "bell", pitched: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.22, wet: 0.7, samples: tone({ key: ctx.key, note, seconds: 1.6, decay: 2.2, partials: [{ ratio: 1, amp: 1 }, { ratio: 1.5, amp: 0.4 }, { ratio: 2, amp: 0.25, decay: 2 }] }) }),
  },
  shimmer: {
    family: "shimmer", keyed: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 81 });
      const notes = [...chordTones({ ctx, note: root, near: root }), root + 12];
      const trem = render({ seconds: 1.4, fn: (t) => 1 + 0.3 * sine({ f: 5, t }) });
      const s = sum(notes.map((n, k) => [tone({ key: ctx.key, note: n, seconds: 1.4, decay: 2.5 + k, attack: 0.03 })]));
      for (let i = 0; i < s.length; i++) s[i] *= trem[Math.min(i, trem.length - 1)] / 3;
      return { lead: 0, gain: 0.26, wet: 0.65, samples: s };
    },
  },
  sparkle: {
    family: "shimmer", keyed: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 88 });
      const [r, third, fifth] = chordTones({ ctx, note: root, near: root });
      return { lead: 0, gain: 0.26, wet: 0.5, samples: seq({ notes: [fifth - 12, r, third, fifth], step: 0.035, make: (n) => tone({ key: ctx.key, note: n, seconds: 0.35, decay: 12, partials: [{ ratio: 1, amp: 0.45 }, { ratio: 2, amp: 0.15, decay: 20 }] }) }) };
    },
  },
  glass: {
    family: "shimmer", keyed: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 96 });
      const [r, third, fifth] = chordTones({ ctx, note: root, near: root });
      return { lead: 0, gain: 0.22, wet: 0.6, samples: sum([r, fifth, r + 12, third + 12].map((n, k) => [tone({ key: ctx.key, note: n, seconds: 1.4, decay: 3 + k * 2.5 }), 0, 1 / (k + 1)])) };
    },
  },
  success: {
    family: "success", keyed: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 84 });
      const fifth = scaleStep({ key: ctx.key, note: root, steps: -3 });
      return { lead: 0, gain: 0.32, wet: 0.4, samples: seq({ notes: [fifth, root], step: 0.09, make: (n) => tone({ key: ctx.key, note: n, seconds: 0.6, decay: 6, partials: [{ ratio: 1, amp: 0.55 }, { ratio: 3, amp: 0.14, decay: 15 }] }) }) };
    },
  },
  arpup: {
    family: "success", keyed: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 76 });
      return { lead: 0, gain: 0.32, wet: 0.45, samples: seq({ notes: [...chordTones({ ctx, note: root, near: root }), root + 12], step: 0.06, make: (n) => tone({ key: ctx.key, note: n, seconds: 0.5, decay: 7, partials: [{ ratio: 1, amp: 0.5 }, { ratio: 2, amp: 0.15 }] }) }) };
    },
  },
  sink: {
    family: "fail", keyed: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 57 });
      const notes = [4, 3, 2, 1, 0].map((s) => scaleStep({ key: ctx.key, note: root, steps: s }));
      return { lead: ctx.beat * 0.75, gain: 0.4, wet: 0.25, samples: seq({ notes, step: ctx.beat / 8, make: (n) => tone({ key: ctx.key, note: n, seconds: 0.3, decay: 12 }).map((v) => v * 0.5) }) };
    },
  },
  errtick: {
    family: "fail", keyed: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 69 });
      const n = Math.max(1, Math.round(ctx.length * 8));
      const notes = Array.from({ length: n }, (_, k) => scaleStep({ key: ctx.key, note: root, steps: -(k % 8) }));
      return { lead: 0, gain: 0.2, wet: 0.1, samples: seq({ notes, step: ctx.beat / 8, make: (m) => tone({ key: ctx.key, note: m, seconds: 0.04, decay: 90, partials: [{ ratio: 1, amp: 0.5 }, { ratio: 3, amp: 0.15 }] }) }) };
    },
  },
  alarm: {
    family: "fail", keyed: true,
    make: ({ ctx, note }) => {
      const root = tonic({ ctx, note, near: 69 });
      const hi = scaleStep({ key: ctx.key, note: root, steps: 4 });
      const mid = scaleStep({ key: ctx.key, note: root, steps: 2 });
      return { lead: 0, gain: 0.2, wet: 0.25, samples: seq({ notes: [hi, mid, hi], step: 0.14, make: (m) => tone({ key: ctx.key, note: m, seconds: 0.14, decay: 10, partials: [{ ratio: 1, amp: 0.35 }, { ratio: 3, amp: 0.12 }] }) }) };
    },
  },
  gulp: {
    family: "gulp", keyed: true,
    make: ({ ctx, note }) => {
      const len = 0.21;
      const suck = air({ noise: ctx.noise, seconds: len, shape: (t) => (t / len) ** 3, cutoff: (t) => 5000 * (1 - t / len) + 500, q: 0.35 });
      const body = tone({ key: ctx.key, note: tonic({ ctx, note, near: 57 }), seconds: 0.3, decay: 16, dive: 1.6 });
      return { lead: len, gain: 0.45, wet: 0.3, samples: sum([[suck, 0, 0.6], [body, len, 0.8]]) };
    },
  },
  groan: {
    family: "fail", keyed: true,
    make: ({ ctx, note }) => {
      const seconds = ctx.length * ctx.beat;
      const root = tonic({ ctx, note, near: 33 });
      const harm = [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.5 }, { ratio: 3, amp: 0.33 }, { ratio: 4, amp: 0.25 }];
      const raw = sum([[tone({ key: ctx.key, note: root, seconds, decay: 0, attack: 0.05, partials: harm })], [tone({ key: ctx.key, note: root + 7, seconds, decay: 0, attack: 0.05, partials: harm }), 0, 0.6], [tone({ key: ctx.key, note: root + 12, seconds, decay: 0, attack: 0.05, partials: harm }), 0, 0.4]]);
      const shaped = raw.map((v, i) => (v / 2.6) * (0.55 + 0.45 * (i / raw.length)) * Math.min(1, (raw.length - i) / (0.08 * SR)));
      return { lead: 0, gain: 0.32, wet: 0.35, samples: svf({ input: shaped, cutoff: (t) => 260 + 1600 * (t / seconds) ** 2, q: 0.25, mode: "low" }) };
    },
  },
  flap: {
    family: "counter", keyed: true,
    make: ({ ctx, note }) => {
      const n = Math.max(1, Math.round(ctx.length * 12));
      const root = tonic({ ctx, note, near: 81 });
      const out = new Float32Array(Math.ceil(ctx.length * ctx.beat * SR * 2) + SR / 10);
      for (let k = 0; k < n; k++) {
        const click = sum([[render({ seconds: 0.03, fn: (t) => ctx.noise() * Math.exp(-t * 300) * 0.3 })], [tone({ key: ctx.key, note: root, seconds: 0.03, decay: 300 }), 0, 0.5]]);
        mixInto({ out, src: click, at: ((k * ctx.beat) / 12) * (1 + (k / n) ** 2), gain: 1 });
      }
      return { lead: 0, gain: 0.3, wet: 0.12, samples: out };
    },
  },
  counter: {
    family: "counter", noise: true,
    make: ({ ctx }) => {
      const n = Math.max(1, Math.round(ctx.length * 16));
      const out = new Float32Array(Math.ceil(ctx.length * ctx.beat * SR * 1.7) + SR / 10);
      for (let k = 0; k < n; k++) {
        const click = svf({ input: render({ seconds: 0.025, fn: (t) => ctx.noise() * Math.exp(-t * 700) }), cutoff: 4000 - k * 60, q: 0.8, mode: "band" });
        mixInto({ out, src: click, at: ((k * ctx.beat) / 16) * (1 + (k / n) * 0.6), gain: 1 });
      }
      return { lead: 0, gain: 0.3, wet: 0.1, samples: out };
    },
  },
  typing: {
    family: "counter", noise: true,
    make: ({ ctx }) => {
      const seconds = ctx.length * ctx.beat;
      const out = new Float32Array(Math.ceil(seconds * SR) + SR / 20);
      for (let t = 0; t < seconds - 0.05; t += 0.055 + Math.abs(ctx.noise()) * 0.05) {
        mixInto({ out, src: svf({ input: render({ seconds: 0.03, fn: (u) => ctx.noise() * Math.exp(-u * 500) }), cutoff: 3000 + ctx.noise() * 800, q: 0.7, mode: "band" }), at: t, gain: 1 });
      }
      return { lead: 0, gain: 0.35, wet: 0.1, samples: out };
    },
  },
  whoosh: {
    family: "whoosh", noise: true,
    make: ({ ctx }) => ({ lead: 0.38, gain: 0.42, wet: 0.3, samples: air({ noise: ctx.noise, seconds: 0.55, shape: (t) => Math.sin((Math.PI * Math.min(t, 0.5)) / 0.5) ** 2, cutoff: (t) => 400 + 6000 * (t / 0.45) ** 2, q: 0.35 }) }),
  },
  "swoosh-down": {
    family: "whoosh", noise: true,
    make: ({ ctx }) => ({ lead: 0.05, gain: 0.55, wet: 0.4, samples: air({ noise: ctx.noise, seconds: 0.7, shape: (t) => Math.exp(-t * 4), cutoff: (t) => 7000 * Math.exp(-t * 5) + 200, q: 0.4 }) }),
  },
  whip: {
    family: "whoosh", noise: true,
    make: ({ ctx }) => ({ lead: 0.16, gain: 0.55, wet: 0.2, pan: (k) => -0.7 + 1.4 * k, samples: air({ noise: ctx.noise, seconds: 0.2, shape: (t) => Math.sin((Math.PI * t) / 0.2), cutoff: (t) => 2500 + 6000 * (t / 0.2), q: 0.35 }) }),
  },
  zipup: {
    family: "whoosh", noise: true,
    make: ({ ctx }) => ({ lead: 0.3, gain: 0.5, wet: 0.25, samples: air({ noise: ctx.noise, seconds: 0.34, shape: (t) => Math.sin((Math.PI * t) / 0.34), cutoff: (t) => 900 + 9000 * (t / 0.34) ** 1.5, q: 0.25 }) }),
  },
  dolly: {
    family: "whoosh", noise: true,
    make: ({ ctx }) => ({ lead: 0.42, gain: 0.5, wet: 0.3, samples: air({ noise: ctx.noise, seconds: 0.48, shape: (t) => (t / 0.48) ** 2, cutoff: (t) => 200 + 1600 * (t / 0.48) ** 2, q: 0.6, mode: "low" }) }),
  },
  glidepass: {
    family: "glidepass", sweep: true,
    make: ({ ctx, note }) => {
      const len = 0.6;
      const root = tonic({ ctx, note, near: 57 });
      const from = hz(scaleStep({ key: ctx.key, note: root, steps: 1 }));
      const shape = (t) => Math.sin((Math.PI * t) / len) ** 2;
      const whoosh = air({ noise: ctx.noise, seconds: len, shape, cutoff: (t) => 900 + 5200 * shape(t), q: 0.3 });
      let ph = 0;
      const hum = render({ seconds: len, fn: (t) => ((ph += (2 * Math.PI * (from + (hz(root) - from) * Math.min(1, t / (len * 0.7)))) / SR), Math.sin(ph) * shape(t) * 0.25) });
      return { lead: len / 2, gain: 0.55, wet: 0.3, pan: (k) => 0.75 - 1.5 * k, samples: sum([[whoosh], [hum]]) };
    },
  },
  riser: {
    family: "riser", sweep: true,
    make: ({ ctx, note }) => {
      const seconds = ctx.length * ctx.beat;
      const f0 = hz(tonic({ ctx, note, near: 45 }));
      let ph = 0;
      const toneL = svf({ input: render({ seconds, fn: (t) => ((ph += f0 * 2 ** ((t / seconds) * 2) / SR), (2 * (ph % 1) - 1) * (t / seconds) ** 2) }), cutoff: (t) => 600 + 4000 * (t / seconds) ** 2, q: 0.5, mode: "low" });
      const whoosh = air({ noise: ctx.noise, seconds, shape: (t) => (t / seconds) ** 2, cutoff: (t) => 500 + 5500 * (t / seconds) ** 2, q: 0.3 });
      return { lead: 0, gain: 0.32, wet: 0.4, samples: sum([[toneL, 0, 0.35], [whoosh, 0, 0.45]]) };
    },
  },
  reverse: {
    family: "reverse", noise: true,
    make: ({ ctx }) => {
      const len = Math.max(0.1, ctx.beat * 0.75 - 0.15);
      return { lead: ctx.beat * 0.75, gain: 0.55, wet: 0.5, samples: air({ noise: ctx.noise, seconds: len, shape: (t) => (t / len) ** 3, cutoff: (t) => 800 + 7000 * (t / len) ** 2, q: 0.4 }) };
    },
  },
  airswell: {
    family: "breath", noise: true,
    make: ({ ctx }) => ({ lead: 0.45, gain: 0.35, wet: 0.5, samples: air({ noise: ctx.noise, seconds: 0.5, shape: (t) => (t / 0.5) ** 1.5, cutoff: 1800, q: 0.4, mode: "low" }) }),
  },
  breath: {
    family: "breath", noise: true,
    make: ({ ctx }) => ({ lead: 0.05, gain: 0.25, wet: 0.4, samples: air({ noise: ctx.noise, seconds: 0.35, shape: (t) => Math.sin((Math.PI * t) / 0.35), cutoff: 3500, q: 0.5 }) }),
  },
  dropdown: {
    family: "dropdown", noise: true,
    make: ({ ctx }) => ({ lead: 0.04, gain: 0.35, wet: 0.35, samples: air({ noise: ctx.noise, seconds: 0.45, shape: (t) => Math.exp(-t * 7), cutoff: (t) => 5000 * Math.exp(-t * 6) + 400, q: 0.5 }) }),
  },
  "suck-snap": {
    family: "reverse", keyed: true,
    make: ({ ctx, note }) => {
      const len = 0.35;
      const suck = air({ noise: ctx.noise, seconds: len, shape: (t) => (t / len) ** 3, cutoff: (t) => 600 + 6000 * (t / len), q: 0.4 });
      const snap = sum([[render({ seconds: 0.03, fn: (t) => ctx.noise() * Math.exp(-t * 400) })], [tone({ key: ctx.key, note: tonic({ ctx, note, near: 36 }), seconds: 0.15, decay: 40 })]]);
      return { lead: len, gain: 0.5, wet: 0.2, samples: sum([[suck], [snap, len]]) };
    },
  },
  powerdown: {
    family: "powerdown", sweep: true,
    make: ({ ctx, note }) => {
      const f0 = hz(tonic({ ctx, note, near: 72 }));
      let ph = 0;
      const s = render({ seconds: 0.5, fn: (t) => ((ph += (f0 * Math.exp(-t * 4.5)) / SR), Math.sin(2 * Math.PI * ph) * Math.exp(-t * 5) * 0.5) });
      return { lead: 0, gain: 0.38, wet: 0.3, samples: s };
    },
  },
  collapse: {
    family: "collapse", sweep: true,
    make: ({ ctx, note }) => {
      const len = 0.32;
      const f0 = hz(tonic({ ctx, note, near: 81 }));
      let ph = 0;
      const s = render({ seconds: len + 0.1, fn: (t) => ((ph += (f0 * 4 ** (-Math.min(t, len) / len)) / SR), (Math.sin(2 * Math.PI * ph) * 0.5 + ctx.noise() * 0.25) * Math.min(1, t / 0.02) * Math.exp(-t * 4)) });
      return { lead: 0, gain: 0.32, wet: 0.45, samples: svf({ input: s, cutoff: (t) => 6000 * Math.exp(-t * 6) + 300, q: 0.5, mode: "low" }) };
    },
  },
  pop: {
    family: "blip", keyed: true,
    make: ({ ctx, note }) => ({ lead: 0, gain: 0.3, wet: 0.25, samples: tone({ key: ctx.key, note: tonic({ ctx, note, near: 79 }), seconds: 0.18, decay: 25, dive: -0.3 }) }),
  },
};

// ---------- validation ----------
/** Throws one readable error listing every grid problem: unknown sfx, missing or out-of-key notes, monotony. */
export function validate({ grid, palette = PALETTE }) {
  const problems = [];
  let key;
  try {
    key = parseKey(grid.key);
  } catch (e) {
    problems.push(e.message);
  }
  const total = grid.bars * 4;
  const ids = new Set();
  for (const cue of grid.cues ?? []) {
    const where = `cue "${cue.id}" (beat ${cue.beat}, ${cue.sfx})`;
    if (ids.has(cue.id)) problems.push(`${where}: duplicate id`);
    ids.add(cue.id);
    const recipe = palette[cue.sfx];
    if (!recipe) problems.push(`${where}: unknown sfx "${cue.sfx}" (known: ${Object.keys(palette).join(", ")})`);
    if (!(cue.beat >= 0 && cue.beat <= total)) problems.push(`${where}: beat outside 0–${total}`);
    if (cue.note !== undefined) {
      if (!Number.isInteger(cue.note)) problems.push(`${where}: note must be an integer MIDI note`);
      else if (key && !key.has(cue.note)) problems.push(`${where}: note ${cue.note} (${noteName(cue.note)}) is outside ${key.name} (${key.spell()})`);
      if (recipe && !recipe.pitched && !recipe.keyed) problems.push(`${where}: "${cue.sfx}" is unpitched; remove the note`);
    } else if (recipe?.pitched) problems.push(`${where}: "${cue.sfx}" is pitched and needs a note in ${key?.name ?? "the key"}`);
  }
  for (const g of grid.gates ?? []) if (!(g.beat > 0 && g.beat <= total && g.frames > 0)) problems.push(`gate at beat ${g.beat}: needs 0 < beat ≤ ${total} and frames > 0`);
  problems.push(...monotony({ cues: grid.cues ?? [], palette }));
  if (problems.length) throw new Error(`grid has ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}`);
  return { key };
}

/** A recipe may repeat only as one deliberate sequence (cues ≤ 2 beats apart, or the same `scene`), or with `repeat: true`. */
function monotony({ cues, palette }) {
  const bySfx = Map.groupBy([...cues].sort((a, b) => a.beat - b.beat), (c) => c.sfx);
  const out = [];
  for (const [sfx, list] of bySfx) {
    if (list.length < 2) continue;
    const groups = [];
    for (const c of list) {
      const prev = groups.at(-1)?.at(-1);
      const same = prev && (c.repeat || (prev.scene && c.scene ? prev.scene === c.scene : c.beat - prev.beat <= 2));
      if (same) groups.at(-1).push(c);
      else groups.push([c]);
    }
    if (groups.length > 1) {
      const family = palette[sfx]?.family;
      const alts = Object.entries(palette).filter(([n, r]) => r.family === family && n !== sfx).map(([n]) => n);
      out.push(`monotony: "${sfx}" is used in ${groups.length} separate places (${groups.map((g) => g.map((c) => c.id).join("+")).join(", ")}); pick another recipe${alts.length ? ` (same family: ${alts.join(", ")})` : ""} or mark a deliberate repeat with "repeat": true`);
    }
  }
  return out;
}

// ---------- film, buses and placement ----------
/** Session for one film: stereo buses (music, sfx, reverb send), timing helpers and a cue log. */
export function createFilm({ grid }) {
  const key = parseKey(grid.key);
  const beat = 60 / grid.bpm;
  const duration = grid.bars * 4 * beat;
  const N = Math.ceil(duration * SR);
  const bus = () => ({ l: new Float32Array(N), r: new Float32Array(N) });
  return { grid, key, beat, duration, N, fps: grid.fps ?? 60, sec: (b) => b * beat, music: bus(), sfx: bus(), send: bus(), kicks: [], log: [] };
}

const panFn = (pan) => {
  if (typeof pan === "function") return pan;
  if (Array.isArray(pan)) return (k) => pan[0] + (pan[1] - pan[0]) * k;
  return null;
};

/** Adds mono samples to a bus; `pan` is a number, [from, to] or a function of progress 0→1. */
export function add({ film, bus, samples, start, gain, pan }) {
  const s0 = Math.round(start * SR);
  const fn = panFn(pan);
  const angle = (p) => ((Math.max(-1, Math.min(1, p)) + 1) * Math.PI) / 4;
  let gl = gain * Math.cos(angle(pan ?? 0));
  let gr = gain * Math.sin(angle(pan ?? 0));
  for (let i = 0; i < samples.length; i++) {
    const j = s0 + i;
    if (j < 0 || j >= film.N) continue;
    if (fn) {
      const a = angle(fn(i / samples.length));
      gl = gain * Math.cos(a);
      gr = gain * Math.sin(a);
    }
    bus.l[j] += samples[i] * gl;
    bus.r[j] += samples[i] * gr;
  }
}

/** Mono body plus a decorrelated side layer (L +, R − and delayed 11 ms), so big hits open up. */
export function addWide({ film, bus, mid, side, start, gain, pan }) {
  add({ film, bus, samples: mid, start, gain, pan });
  if (!side) return;
  const s0 = Math.round(start * SR);
  const d = Math.round(0.011 * SR);
  for (let i = 0; i < side.length; i++) {
    const j = s0 + i;
    if (j >= 0 && j < film.N) bus.l[j] += side[i] * gain;
    if (j + d >= 0 && j + d < film.N) bus.r[j + d] -= side[i] * gain;
  }
}

/** Linear-interpolated speed change; only ever applied to pure-noise recipes. */
const vary = ({ samples, rate }) => {
  const out = new Float32Array(Math.floor(samples.length / rate));
  for (let i = 0; i < out.length; i++) {
    const x = i * rate;
    const i0 = Math.floor(x);
    out[i] = samples[i0] + (samples[Math.min(samples.length - 1, i0 + 1)] - samples[i0]) * (x - i0);
  }
  return out;
};

/** Renders every grid cue on the SFX bus (and reverb send) and logs it for score.json. */
export function placeCues({ film, cues, palette = PALETTE }) {
  for (const cue of cues) {
    const recipe = palette[cue.sfx];
    const h = hash(cue.id);
    const ctx = { key: film.key, beat: film.beat, length: cue.length ?? 1, noise: rng({ seed: h }) };
    const made = recipe.make({ ctx, note: cue.note });
    const samples = recipe.noise ? vary({ samples: made.samples, rate: 0.97 + ((h % 1000) / 1000) * 0.06 }) : made.samples;
    const gain = made.gain * (cue.gain ?? 1) * (0.9 + ((h >>> 10) % 1000) / 5000);
    const time = film.sec(cue.beat);
    const start = time - made.lead;
    const pan = cue.pan === undefined ? made.pan ?? 0 : cue.pan;
    addWide({ film, bus: film.sfx, mid: samples, side: made.side, start, gain, pan });
    add({ film, bus: film.send, samples, start, gain: gain * made.wet, pan: 0 });
    film.log.push({
      id: cue.id, sfx: cue.sfx, family: recipe.family, pitched: !!recipe.pitched, keyed: !!recipe.keyed, noise: !!recipe.noise, sweep: !!recipe.sweep,
      big: !!recipe.big, note: cue.note ?? null, beat: cue.beat, time: +time.toFixed(4), start: +start.toFixed(4), end: +(start + samples.length / SR).toFixed(4),
    });
  }
}

// ---------- music ----------
const kick = ({ key }) => {
  let ph = 0;
  const f = hz(degreeNote({ key, degree: 0, near: 31 }));
  const n = rng({ seed: 11 });
  return render({ seconds: 0.45, fn: (t) => ((ph += (2 * Math.PI * (f + 120 * Math.exp(-t * 32))) / SR), Math.tanh(1.6 * Math.sin(ph) * Math.exp(-t * 7.5)) + n() * Math.exp(-t * 600) * 0.3) });
};
const clap = () => {
  const n = rng({ seed: 12 });
  return svf({ input: render({ seconds: 0.3, fn: (t) => n() * ([0, 0.011, 0.022].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) * 140) : 0), 0) * 0.5 + Math.exp(-t * 18) * 0.6) }), cutoff: 1500, q: 0.7, mode: "band" });
};
const hat = ({ open }) => {
  const n = rng({ seed: open ? 13 : 14 });
  return svf({ input: render({ seconds: open ? 0.25 : 0.06, fn: (t) => n() * Math.exp(-t * (open ? 22 : 90)) }), cutoff: 8000, q: 0.5, mode: "high" });
};
const pad = ({ notes, seconds, bright }) =>
  svf({
    input: render({ seconds, fn: (t) => (notes.reduce((s, n) => s + [-0.11, 0, 0.13].reduce((a, d) => a + saw({ f: hz(n + 12) * (1 + d / 100), t: t + d }), 0), 0) / (notes.length * 3)) * edges({ t, seconds, attack: 0.08, release: 0.12 }) }),
    cutoff: (t) => bright * (0.6 + 0.4 * Math.min(1, t / seconds)),
    q: 0.6,
    mode: "low",
  });
const pluck = ({ note }) => svf({ input: render({ seconds: 0.35, fn: (t) => (saw({ f: hz(note), t }) * 0.6 + sine({ f: hz(note), t }) * 0.4) * Math.exp(-t * 9) }), cutoff: (t) => 900 + 5000 * Math.exp(-t * 14), q: 0.4, mode: "low" });
const bass = ({ note, seconds }) => svf({ input: render({ seconds, fn: (t) => (sine({ f: hz(note), t }) * 0.8 + saw({ f: hz(note), t }) * 0.35) * edges({ t, seconds, attack: 0.005, release: 0.02 }) }), cutoff: 420, q: 0.5, mode: "low" });

/**
 * Generates the music bus from an arrangement: { sections: [{ type, from, to }], progression?, resolve? }.
 * Section types: intro (dark pad + tonic drone), build (rising pad, soft arp, bar kicks, roll into the end),
 * drop (bright pad, loud arp, offbeat bass, four-on-the-floor), break (pad only), resolve (tonic chord rings out).
 */
export function music({ film, arrangement }) {
  const { key, grid } = film;
  const at = film.sec;
  const prog = arrangement.progression ?? progression({ key, bars: grid.bars, resolve: arrangement.resolve ?? true });
  const sections = arrangement.sections;
  const typeAt = (b) => sections.find((s) => b >= s.from && b < s.to)?.type;
  const chord = (bar) => triad({ key, degree: prog[Math.min(bar, prog.length - 1)], near: 54 });
  const put = ({ samples, beat, gain, pan }) => add({ film, bus: film.music, samples, start: at(beat), gain, pan: pan ?? 0 });
  const KICK = kick({ key });
  const CLAP = clap();
  const HAT = hat({ open: false });
  const OPEN = hat({ open: true });
  const tonicBass = degreeNote({ key, degree: 0, near: 40 });

  for (const s of sections) {
    for (let bar = Math.floor(s.from / 4); bar * 4 < s.to; bar++) {
      const from = Math.max(s.from, bar * 4);
      const to = s.type === "resolve" ? grid.bars * 4 : Math.min(s.to, bar * 4 + 4);
      if (to <= from) continue;
      const k = (from - s.from) / Math.max(1, s.to - s.from);
      const look = { intro: [900, 0.1], build: [1400 + 1800 * k, 0.12], drop: [3200, 0.2], break: [1200, 0.1], resolve: [2600, 0.2] }[s.type];
      const notes = s.type === "resolve" ? [...triad({ key, degree: 0, near: 54 }), degreeNote({ key, degree: 0, near: 54 }) + 12] : chord(bar);
      put({ samples: pad({ notes, seconds: at(to - from), bright: look[0] }), beat: from, gain: look[1] });
      if (s.type === "resolve") {
        put({ samples: bass({ note: tonicBass - 12, seconds: Math.min(1.6, at(to - from)) }), beat: from, gain: 0.5 });
        break;
      }
    }
    if (s.type === "intro") {
      const seconds = at(s.to - s.from);
      const root = degreeNote({ key, degree: 0, near: 33 });
      const fifth = scaleStep({ key, note: root, steps: 4 }) + 12;
      let ph = 0;
      const drone = svf({
        input: render({ seconds, fn: (t) => ((ph += (2 * Math.PI * hz(root)) / SR), (Math.sin(ph) * 0.9 + saw({ f: hz(root + 12), t }) * 0.25 + saw({ f: hz(fifth) * 1.002, t }) * 0.18) * (0.55 + 0.45 * Math.abs(Math.sin((Math.PI * t) / (film.beat / 2)))) * edges({ t, seconds, attack: 0.01, release: 0.1 })) }),
        cutoff: (t) => 300 + 900 * (t / seconds) ** 2,
        q: 0.4,
        mode: "low",
      });
      put({ samples: drone, beat: s.from, gain: 0.22 });
    }
  }

  for (let e = 0; e < grid.bars * 8; e++) {
    const b = e / 2;
    const type = typeAt(b);
    const notes = chord(Math.floor(b / 4));
    const eighth = e % 8;
    if (type === "drop" || type === "build") {
      const note = notes[eighth % 3] + 12 + (eighth % 4 === 3 ? 12 : 0);
      const g = type === "drop" ? 0.17 : 0.085;
      put({ samples: pluck({ note }), beat: b, gain: g, pan: eighth % 2 ? 0.35 : -0.35 });
      add({ film, bus: film.send, samples: pluck({ note }), start: at(b), gain: 0.05, pan: 0 });
    }
    if (type === "drop" && e % 2 === 1) put({ samples: bass({ note: notes[0] - 12, seconds: film.beat / 2 }), beat: b, gain: 0.5 });
  }

  for (let b = 0; b < grid.bars * 4; b++) {
    const type = typeAt(b);
    if (type === "drop") {
      put({ samples: KICK, beat: b, gain: 0.8 });
      film.kicks.push(at(b));
      put({ samples: OPEN, beat: b + 0.5, gain: 0.12, pan: 0.2 });
      if (b % 2 === 1) put({ samples: CLAP, beat: b, gain: 0.45 });
    }
    if (type === "build" && b % 4 === 0) {
      put({ samples: KICK, beat: b, gain: 0.3 });
      film.kicks.push(at(b));
    }
  }
  for (const s of sections.filter((x) => x.type === "build")) {
    const from = Math.max(s.from, s.to - 4);
    for (let q = 0; q < (s.to - from) * 4; q++) {
      const b = from + q / 4;
      const k = q / ((s.to - from) * 4);
      put({ samples: HAT, beat: b, gain: 0.04 + 0.1 * k, pan: q % 2 ? 0.3 : -0.3 });
      if (b >= s.to - 2 && (b >= s.to - 1 || q % 2 === 0)) put({ samples: CLAP, beat: b, gain: 0.08 + 0.25 * k });
    }
  }
}

/** Track mode: a supplied song on the music bus, starting at its first downbeat (`offset` seconds into the file). */
export function loadTrack({ film, file, offset, rmsDb = -20 }) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-ss", String(Math.max(0, offset)), "-i", file, "-t", String(film.duration), "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg could not decode ${file}: ${r.stderr}`);
  const data = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
  let e = 0;
  for (let i = 0; i < data.length; i++) e += data[i] * data[i];
  const g = 10 ** (rmsDb / 20) / Math.sqrt(e / Math.max(1, data.length) || 1e-12);
  const pad = Math.round(Math.max(0, -offset) * SR);
  for (let i = 0; i * 2 < data.length && i + pad < film.N; i++) {
    const fade = Math.min(1, (film.N - i - pad) / (0.4 * SR));
    film.music.l[i + pad] = data[i * 2] * g * fade;
    film.music.r[i + pad] = data[i * 2 + 1] * g * fade;
  }
  film.track = { file, offset };
}

// ---------- dynamics, reverb, gates ----------
/** Kick sidechain on the music bus, envelope-follower duck under the SFX bus, and an extra dip under big hits. */
export function duck({ film, kickDepth = 0.55, sfxDepth = 0.8, hitDepth = 0 }) {
  const g = new Float32Array(film.N).fill(1);
  for (const k of film.kicks) {
    const s0 = Math.round(k * SR);
    for (let i = 0; i < SR * 0.3 && s0 + i < film.N; i++) g[s0 + i] = Math.min(g[s0 + i], 1 - kickDepth * Math.exp(-(i / SR) * 14));
  }
  if (hitDepth > 0) {
    for (const c of film.log.filter((x) => x.big)) {
      const s0 = Math.round(c.time * SR);
      for (let i = -Math.round(0.03 * SR); i < SR * 1.2; i++) {
        const j = s0 + i;
        if (j < 0 || j >= film.N) continue;
        const k = i < 0 ? 1 + i / (0.03 * SR) : Math.exp(-(i / SR) * 2.5);
        g[j] = Math.min(g[j], 1 - hitDepth * k);
      }
    }
  }
  let env = 0;
  const atk = Math.exp(-1 / (0.004 * SR));
  const rel = Math.exp(-1 / (0.16 * SR));
  for (let i = 0; i < film.N; i++) {
    const x = Math.abs(film.sfx.l[i]) + Math.abs(film.sfx.r[i]);
    env = x > env ? atk * env + (1 - atk) * x : rel * env + (1 - rel) * x;
    const k = g[i] / (1 + sfxDepth * env);
    film.music.l[i] *= k;
    film.music.r[i] *= k;
  }
}

/** ITU-R BS.1770 K-weighted momentary loudness (400 ms windows, 100 ms hop) of interleaved stereo at 48 kHz. */
export function momentary({ data }) {
  const n = data.length / 2;
  const block = SR / 10;
  const blocks = new Float64Array(Math.ceil(n / block));
  for (let ch = 0; ch < 2; ch++) {
    let [x1, x2, y1, y2, z1, z2] = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      const x = data[i * 2 + ch];
      const y = 1.53512485958697 * x - 2.69169618940638 * x1 + 1.19839281085285 * x2 + 1.69065929318241 * y1 - 0.73248077421585 * y2;
      const z = y - 2 * y1 + y2 + 1.99004745483398 * z1 - 0.99007225036621 * z2;
      [x2, x1, y2, y1, z2, z1] = [x1, x, y1, y, z1, z];
      blocks[Math.floor(i / block)] += (z * z) / block;
    }
  }
  return Array.from({ length: Math.max(0, blocks.length - 3) }, (_, k) => {
    const ms = (blocks[k] + blocks[k + 1] + blocks[k + 2] + blocks[k + 3]) / 4;
    return { from: k / 10, to: (k + 4) / 10, lufs: -0.691 + 10 * Math.log10(ms + 1e-20) };
  });
}

/** dB cut per 100 ms block so every window not containing the hit's first second sits `margin` LU under it; null if none needed. */
function crownCuts({ windows, hit, margin }) {
  const near = (w) => w.to >= hit.time && w.from <= hit.time + 0.8;
  const peak = Math.max(...windows.filter(near).map((w) => w.lufs));
  const cut = new Float64Array(windows.length + 4);
  for (const [k, w] of windows.entries()) {
    const over = w.lufs - (peak - margin);
    if (near(w) || over <= 0) continue;
    for (let b = k; b < k + 4; b++) cut[b] = Math.max(cut[b], over + 0.3);
  }
  return cut.some((c) => c > 0) ? cut : null;
}

/** Applies a per-100 ms-block dB cut (interpolated) to the music, sfx and send buses. */
function ride({ film, cut }) {
  for (let i = 0; i < film.N; i++) {
    const x = (i / SR) * 10 - 0.5;
    const b = Math.max(0, Math.floor(x));
    const f = Math.min(1, Math.max(0, x - b));
    const g = 10 ** (-((cut[b] ?? 0) * (1 - f) + (cut[b + 1] ?? 0) * f) / 20);
    for (const bus of [film.music, film.sfx, film.send]) {
      bus.l[i] *= g;
      bus.r[i] *= g;
    }
  }
}

/** Freeverb-style plate: 8 damped combs into 4 allpasses; `spread` detunes the right channel. */
export function plate({ input, spread }) {
  const pre = Math.round(0.018 * SR);
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({ buf: new Float32Array(d + spread), i: 0, store: 0 }));
  const allpasses = [556, 441, 341, 225].map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
  const out = new Float32Array(input.length);
  for (let n = 0; n < input.length; n++) {
    const x = n >= pre ? input[n - pre] * 0.03 : 0;
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.store = y * 0.72 + c.store * 0.28;
      c.buf[c.i] = x + c.store * 0.86;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    for (const a of allpasses) {
      const y = a.buf[a.i];
      a.buf[a.i] = s + y * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      s = y - s;
    }
    out[n] = s;
  }
  return out;
}

/** Sums music + sfx + plate into interleaved stereo float, with a short fade at the very end. */
export function mixdown({ film, wet = 0.9 }) {
  const wl = plate({ input: film.send.l, spread: 0 });
  const wr = plate({ input: film.send.r, spread: 23 });
  const out = new Float32Array(film.N * 2);
  for (let i = 0; i < film.N; i++) {
    const fade = Math.min(1, (film.N - i) / (SR * 0.25));
    out[i * 2] = (film.music.l[i] + film.sfx.l[i] + wl[i] * wet) * fade;
    out[i * 2 + 1] = (film.music.r[i] + film.sfx.r[i] + wr[i] * wet) * fade;
  }
  return out;
}

/** Gate windows in seconds: [beat − frames/fps, beat). */
export const gateWindows = ({ grid }) => (grid.gates ?? []).map((g) => ({ beat: g.beat, frames: g.frames, from: (g.beat * 60) / grid.bpm - g.frames / (grid.fps ?? 60), to: (g.beat * 60) / grid.bpm }));

/** True digital silence inside each gate (3 ms fade-out before it); the hit after it starts clean. */
export function applyGates({ film, data }) {
  const ramp = Math.round(0.003 * SR);
  for (const w of gateWindows({ grid: film.grid })) {
    const a = Math.round(w.from * SR);
    const b = Math.round(w.to * SR);
    for (let i = Math.max(0, a - ramp); i < Math.min(film.N, b); i++) {
      const k = i < a ? (a - i) / ramp : 0;
      data[i * 2] *= k;
      data[i * 2 + 1] *= k;
    }
  }
  return data;
}

// ---------- mastering ----------
const ffmpeg = ({ args, input }) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { input, maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg ${args.join(" ")} failed:\n${r.stderr}`);
  return r;
};
const rawInput = ["-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", "pipe:0"];
const asBuffer = (f32) => Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength);

/** EBU R128 of a file or of interleaved stereo float at SR: { I, LRA, TP }. */
export function measureLoudness({ file, data }) {
  const input = data ? rawInput : ["-i", file];
  const err = ffmpeg({ args: [...input, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], input: data ? asBuffer(data) : undefined }).stderr.toString();
  const tail = err.slice(err.lastIndexOf("Summary:"));
  const num = (re) => Number((re.exec(tail) ?? [])[1]);
  return { I: num(/I:\s+(-?[\d.]+|-inf) LUFS/), LRA: num(/LRA:\s+(-?[\d.]+) LU/), TP: num(/Peak:\s+(-?[\d.]+|-inf) dBFS/) };
}

export const MASTER_CHAIN = "highpass=f=28:poles=2,equalizer=f=280:t=q:w=1.2:g=-1.5,equalizer=f=11000:t=h:w=0.7:g=2,acompressor=threshold=-16dB:ratio=1.6:attack=12:release=140:makeup=1";

/**
 * Master: highpass, gentle EQ, glue compression, static gain, limiter, then gates. Loudness and true peak are
 * measured after the whole chain and gain/ceiling iterated until I ≈ target and TP ≤ truePeak. With `hit`, any
 * mastered 400 ms window that rivals the hit is ridden down (pre-chain) so the hit stays the loudest moment.
 */
export function master({ film, outFile, hit, target = -14, truePeak = -2, margin = 1 }) {
  let mix = mixdown({ film });
  const pre = measureLoudness({ data: mix });
  let gain = target - (Number.isFinite(pre.I) ? pre.I : -30);
  let ceiling = truePeak - 1;
  let data;
  let m;
  let rides = 0;
  for (let pass = 0; pass < 12; pass++) {
    const chain = `${MASTER_CHAIN},volume=${gain.toFixed(2)}dB,alimiter=limit=${10 ** (ceiling / 20)}:level=false:latency=true:attack=1:release=60`;
    const out = ffmpeg({ args: [...rawInput, "-af", chain, "-f", "f32le", "-ar", String(SR), "-ac", "2", "pipe:1"], input: asBuffer(mix) }).stdout;
    data = new Float32Array(film.N * 2);
    data.set(new Float32Array(out.buffer, out.byteOffset, Math.min(film.N * 2, Math.floor(out.length / 4))));
    applyGates({ film, data });
    m = measureLoudness({ data });
    const cut = hit && rides < 6 ? crownCuts({ windows: momentary({ data }), hit, margin }) : null;
    if (cut) {
      ride({ film, cut });
      mix = mixdown({ film });
      rides++;
      continue;
    }
    const tpOk = m.TP <= truePeak - 0.1;
    if (Math.abs(m.I - target) <= 0.15 && tpOk) break;
    if (!tpOk) ceiling -= m.TP - (truePeak - 0.3);
    gain += target - m.I;
  }
  mkdirSync(dirname(outFile), { recursive: true });
  ffmpeg({ args: ["-v", "error", "-y", ...rawInput, "-c:a", "pcm_s24le", outFile], input: asBuffer(data) });
  const final = measureLoudness({ file: outFile });
  return { ...final, target, truePeakLimit: truePeak, gainDb: +gain.toFixed(2), ceilingDb: +ceiling.toFixed(2), rides };
}

/** Mono float32 SFX-only stem (dry, pre-master) for pitch checks. */
export function writeStem({ film, outFile }) {
  const mono = new Float32Array(film.N);
  for (let i = 0; i < film.N; i++) mono[i] = (film.sfx.l[i] + film.sfx.r[i]) / 2;
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, asBuffer(mono));
}

/** The cue the film builds to: the big hit on the last gate's beat, else the latest big hit. */
export function biggestHit({ film }) {
  const gates = film.grid.gates ?? [];
  const big = film.log.filter((c) => c.big);
  const last = gates.length ? Math.max(...gates.map((g) => g.beat)) : null;
  return big.find((c) => c.beat === last) ?? big.at(-1) ?? null;
}
