import { buildStage, lookTokens } from "./looks.js";

const SAFE = {
  landscape: { x: 0.06, top: 0.08, bottom: 0.08 },
  portrait: { x: 0.07, top: 0.12, bottom: 0.18 },
};

const layoutFor = ({ format, W, H }) => {
  const portrait = H > W;
  const m = SAFE[portrait ? "portrait" : "landscape"];
  const x = Math.round(W * m.x);
  const y = Math.round(H * m.top);
  return { format, W, H, unit: W / 1920, portrait, safe: { x, y, w: W - 2 * x, h: H - y - Math.round(H * m.bottom) } };
};

/** Gate-aware clock for ambient drift: slows to a stop before each gate, holds through it, resumes on the hit. */
const ambientClock = ({ gates }) => (t) => {
  const ramp = 0.3;
  let lost = 0;
  for (const g of gates) {
    const start = g.at - g.length;
    if (t < start - ramp) continue;
    if (t < start) lost += (t - (start - ramp)) ** 2 / (2 * ramp);
    else if (t < g.at) lost += ramp / 2 + (t - start);
    else lost += ramp / 2 + g.length;
  }
  return t - lost;
};

const paint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/** Wires scenes, grid and look into the window.__film contract the renderer drives. */
export function defineFilm({ config, grid, scenes }) {
  const fps = config.fps;
  const beatSec = 60 / config.bpm;
  const duration = config.bars * 4 * beatSec;
  const sec = (beat) => beat * beatSec;
  const cueMap = new Map(grid.cues.map((c) => [c.id, sec(c.beat)]));
  const cue = (id) => {
    if (!cueMap.has(id)) throw new Error(`cue "${id}" is not in grid.json`);
    return cueMap.get(id);
  };
  const gates = (grid.gates ?? []).map((g) => ({ at: sec(g.beat), length: g.frames / fps }));
  const ambient = ambientClock({ gates });
  if (!/^#[0-9a-f]{6}$/i.test(config.accent ?? "")) {
    throw new Error("film.config.json: set \"accent\" to the product's brand colour as #rrggbb (node <skill>/scripts/brand-colors.mjs)");
  }
  const tokens = lookTokens({ name: config.look, accent: config.accent, palette: config.palette ?? {} });

  const film = document.getElementById("film");
  document.documentElement.style.setProperty("--display", `"${config.fonts.display}", "Geist", system-ui, sans-serif`);
  document.documentElement.style.setProperty("--mono", `"${config.fonts.mono}", "Geist Mono", ui-monospace, monospace`);
  document.documentElement.style.setProperty("--accent", config.accent);
  document.body.style.background = tokens.bg;

  let mounted = [];
  let stage = null;
  let base = null;
  let current = null;

  const setFormat = async (name) => {
    const size = config.formats[name];
    if (!size) throw new Error(`unknown format "${name}"`);
    const [W, H] = size;
    film.replaceChildren();
    film.style.width = `${W}px`;
    film.style.height = `${H}px`;
    film.style.background = tokens.bg;
    const layout = layoutFor({ format: name, W, H });
    const stageRoot = document.createElement("div");
    stageRoot.className = "layer";
    film.appendChild(stageRoot);
    stage = buildStage(stageRoot, { tokens, layout });
    base = { fps, duration, format: name, W, H, layout, look: tokens, config, grid, cue, sec, gates, horizon: stage.horizon };
    mounted = scenes.map((scene) => {
      const root = document.createElement("div");
      root.className = "layer";
      root.dataset.scene = scene.id;
      film.appendChild(root);
      const instance = scene.build(root, { ...base, t: 0, beat: 0, frame: 0, ambient: 0, reportMotion: () => {} });
      return { scene, root, instance, from: sec(scene.from) - 0.5, to: sec(scene.to) + 0.5 };
    });
    current = name;
    await document.fonts.ready;
    await paint();
  };

  const seek = async (t) => {
    let motion = 0;
    const reportMotion = (px) => {
      if (Number.isFinite(px)) motion = Math.max(motion, px);
    };
    const ctx = { ...base, t, beat: t / beatSec, frame: t * fps, ambient: ambient(t), reportMotion };
    stage.seek({ t: ctx.ambient, drift: config.stageDrift ?? 22, tint: config.accent });
    const pending = [];
    for (const m of mounted) {
      const active = t >= m.from && t <= m.to;
      m.root.style.display = active ? "" : "none";
      if (active) pending.push(m.instance.seek(ctx));
    }
    await Promise.all(pending);
    await paint();
    return { motion };
  };

  const ready = (async () => {
    const families = [config.fonts.display, config.fonts.mono];
    await Promise.all(families.flatMap((f) => ["400", "500", "600", "700"].map((w) => document.fonts.load(`${w} 32px "${f}"`))));
    await document.fonts.ready;
    await setFormat(Object.keys(config.formats)[0]);
    await seek(0);
  })();

  window.__film = {
    fps,
    duration,
    formats: config.formats,
    slug: config.slug,
    title: config.title,
    scenes: scenes.map((s) => ({ id: s.id, from: sec(s.from), to: sec(s.to) })),
    cues: grid.cues.map((c) => ({ id: c.id, t: sec(c.beat) })),
    gates,
    get format() {
      return current;
    },
    ready,
    setFormat,
    seek,
  };

  if (!new URLSearchParams(location.search).has("render")) ready.then(() => preview({ fps, duration, seek }));
}

const preview = ({ fps, duration, seek }) => {
  let frame = 0;
  let playing = false;
  let busy = false;
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;left:0;bottom:0;height:3px;background:var(--accent);z-index:9;";
  document.body.appendChild(bar);
  const show = async () => {
    if (busy) return;
    busy = true;
    bar.style.width = `${(frame / (duration * fps)) * 100}%`;
    await seek(frame / fps);
    busy = false;
  };
  const tick = async () => {
    if (!playing) return;
    frame = (frame + 1) % Math.round(duration * fps);
    await show();
    requestAnimationFrame(tick);
  };
  addEventListener("keydown", (e) => {
    if (e.key === " ") {
      playing = !playing;
      tick();
    }
    if (e.key === "ArrowRight") frame += e.shiftKey ? 10 : 1;
    if (e.key === "ArrowLeft") frame = Math.max(0, frame - (e.shiftKey ? 10 : 1));
    if (e.key.startsWith("Arrow")) show();
  });
};
