export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, k) => a + (b - a) * k;

export function mix(a, b, k) {
  if (typeof a === "number") return lerp(a, b, k);
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], k));
  const out = {};
  for (const key of Object.keys(a)) out[key] = mix(a[key], b[key], k);
  return out;
}

const bezier = ([x1, y1, x2, y2]) => {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const sx = (s) => ((ax * s + bx) * s + cx) * s;
  const sy = (s) => ((ay * s + by) * s + cy) * s;
  const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(s) - x;
      if (Math.abs(err) < 1e-7) return sy(s);
      const d = dx(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    let lo = 0;
    let hi = 1;
    s = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(s);
      if (Math.abs(v - x) < 1e-7) break;
      if (v < x) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return sy(s);
  };
};

export const ease = {
  linear: (x) => clamp(x, 0, 1),
  outExpo: bezier([0.16, 1, 0.3, 1]),
  inExpo: bezier([0.7, 0, 0.84, 0]),
  snap: bezier([0.2, 0, 0, 1]),
  glide: bezier([0.65, 0, 0.35, 1]),
  outCubic: bezier([0.33, 1, 0.68, 1]),
  inOutCubic: bezier([0.65, 0, 0.35, 1]),
  charIn: bezier([0.16, 1, 0.3, 1]),
};

/** 0→1 over [from, to], eased and clamped. */
export function prog({ t, from, to, ease: fn }) {
  if (t <= from) return fn(0);
  if (t >= to) return fn(1);
  return fn((t - from) / (to - from));
}

const PRESETS = {
  snappy: { zeta: 0.9, omega: 30 },
  default: { zeta: 0.82, omega: 18 },
  heavy: { zeta: 1, omega: 11 },
  playful: { zeta: 0.55, omega: 16 },
};

/** Closed-form damped spring step response, 0 before `at`, settling to 1. */
export function spring({ t, at, preset }) {
  const { zeta, omega } = PRESETS[preset];
  const x = t - at;
  if (x <= 0) return 0;
  if (zeta >= 1) return 1 - Math.exp(-omega * x) * (1 + omega * x);
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * x) * (Math.cos(wd * x) + ((zeta * omega) / wd) * Math.sin(wd * x));
}

const addScaled = ({ base, a, b, k }) => {
  if (typeof base === "number") return base + (b - a) * k;
  if (Array.isArray(base)) return base.map((v, i) => addScaled({ base: v, a: a[i], b: b[i], k }));
  const out = {};
  for (const key of Object.keys(base)) out[key] = addScaled({ base: base[key], a: a[key], b: b[key], k });
  return out;
};

/** A value whose target changes several times; each change adds its own spring, so motion stays continuous and seekable. */
export function track({ t, changes, preset }) {
  let value = changes[0].value;
  for (let i = 1; i < changes.length; i++) {
    const k = spring({ t, at: changes[i].at, preset: changes[i].preset ?? preset });
    if (k === 0) continue;
    value = addScaled({ base: value, a: changes[i - 1].value, b: changes[i].value, k });
  }
  return value;
}

const hashString = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const hash = (n) => {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

const seedOf = (seed) => (typeof seed === "number" ? Math.floor(seed * 7919) : hashString(String(seed)));

/** Seeded random in [0, 1). */
export const rand = ({ seed }) => hash(seedOf(seed));

/** Smooth seeded 1D value noise in [-1, 1]. */
export function noise({ seed, t, freq }) {
  const s = seedOf(seed);
  const x = t * freq;
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * f * (f * (f * 6 - 15) + 10);
  const a = hash(s + i * 374761393) * 2 - 1;
  const b = hash(s + (i + 1) * 374761393) * 2 - 1;
  return a + (b - a) * u;
}

export const stagger = ({ index, step }) => index * step;

/** Speed in px/frame of a pure function of time returning a number, {x, y} or an array. */
export function pxPerFrame({ fn, t, fps }) {
  const a = fn(t);
  const b = fn(t - 1 / fps);
  if (typeof a === "number") return Math.abs(a - b);
  if (Array.isArray(a)) return Math.hypot(...a.map((v, i) => v - b[i]));
  return Math.hypot(a.x - b.x, a.y - b.y);
}
