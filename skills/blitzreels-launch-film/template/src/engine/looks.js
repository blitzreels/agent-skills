import { glLayer, rgb } from "./gl.js";

const LOOKS = {
  void: {
    bg: "#050506",
    ink: "rgba(255,255,255,0.95)",
    muted: "rgba(255,255,255,0.58)",
    faint: "rgba(255,255,255,0.32)",
    line: "rgba(255,255,255,0.08)",
    card: "linear-gradient(180deg, #17171b 0%, #101013 100%)",
    cardRim: "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.075)",
    pill: "linear-gradient(180deg, #1c1c21 0%, #131317 100%)",
    shadow: "rgba(0,0,0,0)",
    floorGrid: 0.13,
    horizonGlow: 0.9,
    sky: [0.032, 0.034, 0.04],
    floor: [0.012, 0.012, 0.014],
  },
  paper: {
    bg: "#efede8",
    ink: "rgba(14,14,16,0.94)",
    muted: "rgba(14,14,16,0.56)",
    faint: "rgba(14,14,16,0.32)",
    line: "rgba(14,14,16,0.09)",
    card: "linear-gradient(180deg, #ffffff 0%, #f7f6f3 100%)",
    cardRim: "inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(14,14,16,0.08)",
    pill: "linear-gradient(180deg, #ffffff 0%, #f3f2ee 100%)",
    shadow: "rgba(40,32,20,0.16)",
    floorGrid: 0.07,
    horizonGlow: 0.35,
    sky: [0.955, 0.948, 0.93],
    floor: [0.9, 0.892, 0.872],
  },
  glass: {
    bg: "#04060a",
    ink: "rgba(255,255,255,0.96)",
    muted: "rgba(225,235,255,0.6)",
    faint: "rgba(225,235,255,0.34)",
    line: "rgba(200,220,255,0.1)",
    card: "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.035) 48%, rgba(255,255,255,0.06))",
    cardRim: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 0 0 1px rgba(255,255,255,0.09)",
    pill: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
    shadow: "rgba(0,0,0,0)",
    floorGrid: 0.1,
    horizonGlow: 0.7,
    sky: [0.03, 0.04, 0.07],
    floor: [0.01, 0.012, 0.02],
  },
};

/** Palette and surface tokens for a look preset plus the film's single accent. */
export function lookTokens({ name, accent, palette }) {
  if (!LOOKS[name]) throw new Error(`unknown look "${name}" (void | paper | glass)`);
  const base = { ...LOOKS[name], ...palette };
  const [r, g, b] = rgb(accent).map((v) => Math.round(v * 255));
  return { ...base, name, accent, accentRgb: `${r},${g},${b}`, dark: name !== "paper" };
}

/** Applies the look's rim-lit surface to an element: kind "card" | "pill". */
export function surface(el, { tokens, kind, radius }) {
  el.style.background = kind === "pill" ? tokens.pill : tokens.card;
  el.style.borderRadius = `${radius}px`;
  const lift = tokens.dark ? "" : `, 0 1px 2px ${tokens.shadow}, 0 18px 40px -18px ${tokens.shadow}`;
  el.style.boxShadow = tokens.cardRim + lift;
  if (tokens.name === "glass") el.style.backdropFilter = "blur(24px) saturate(150%)";
}

/** Soft elliptical contact shadow (paper) or floor light (dark looks) under an object standing on the horizon. */
export function contactShadow(parent, { tokens }) {
  const el = document.createElement("div");
  el.style.cssText = "position:absolute;pointer-events:none;border-radius:50%;";
  el.style.background = tokens.dark
    ? `radial-gradient(50% 50% at 50% 50%, rgba(${tokens.accentRgb},0.10), transparent 70%)`
    : `radial-gradient(50% 50% at 50% 50%, ${tokens.shadow}, transparent 70%)`;
  parent.appendChild(el);
  return {
    seek({ x, y, width, opacity }) {
      el.style.left = `${x - width / 2}px`;
      el.style.top = `${y - width * 0.035}px`;
      el.style.width = `${width}px`;
      el.style.height = `${width * 0.07}px`;
      el.style.opacity = String(opacity);
    },
  };
}

/** Floor reflection of an element standing on the horizon (cheap, GPU-side). */
export function reflect(el, { tokens, gap }) {
  const strength = tokens.dark ? 0.16 : 0.1;
  el.style.webkitBoxReflect = `below ${gap}px linear-gradient(transparent 55%, rgba(0,0,0,${strength}))`;
}

const STAGE = `
uniform float u_t;
uniform float u_dpr;
uniform float u_horizon;
uniform vec3 u_sky;
uniform vec3 u_floor;
uniform vec3 u_accent;
uniform float u_glow;
void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_dpr;
  vec2 size = u_res / u_dpr;
  float h = u_horizon;
  vec3 col;
  if (p.y < h) {
    float k = p.y / h;
    vec2 d = (p - vec2(size.x * 0.5, -size.y * 0.1)) / vec2(size.x * 0.75, size.y * 0.95);
    float cone = exp(-dot(d, d) * 1.6);
    col = u_sky * (0.55 + 0.9 * cone) + u_sky * k * 0.25;
  } else {
    float k = (p.y - h) / (size.y - h + 1.0);
    col = u_floor * (1.0 - 0.4 * k);
  }
  float band = exp(-pow((p.y - h) / (size.y * 0.035), 2.0));
  float across = exp(-pow((p.x - size.x * 0.5) / (size.x * 0.42), 2.0));
  col += u_accent * band * across * 0.05 * u_glow;
  vec2 v = (p - size * 0.5) / size;
  col *= 1.0 - 0.55 * smoothstep(0.35, 0.95, length(v * vec2(1.0, 1.25)));
  outColor = dithered(vec4(col, 1.0), u_t);
}`;

/** The shared environment: lit void, receding hairline floor and a crisp horizon line. */
export function buildStage(root, { tokens, layout }) {
  const { W, H, portrait } = layout;
  const horizon = Math.round(H * (portrait ? 0.7 : 0.77));
  const canvas = document.createElement("canvas");
  canvas.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;`;
  root.appendChild(canvas);
  const sky = glLayer(canvas, {
    fragment: STAGE,
    uniforms: { u_horizon: horizon, u_sky: tokens.sky, u_floor: tokens.floor, u_accent: rgb(tokens.accent), u_glow: tokens.horizonGlow },
  });

  const floorWrap = document.createElement("div");
  floorWrap.style.cssText = `position:absolute;left:0;right:0;top:${horizon}px;bottom:0;overflow:hidden;perspective:${Math.round(H * 0.85)}px;perspective-origin:50% 0%;`;
  const floor = document.createElement("div");
  const cell = Math.round(120 * layout.unit * (portrait ? 1.6 : 1));
  const lineRgb = tokens.dark ? "255,255,255" : "14,14,16";
  floor.style.cssText = `position:absolute;left:-150%;right:-150%;top:0;height:${H * 2.4}px;transform-origin:50% 0%;transform:rotateX(78deg);`;
  floor.style.backgroundImage = `linear-gradient(rgba(${lineRgb},${tokens.floorGrid}) 1px, transparent 1px), linear-gradient(90deg, rgba(${lineRgb},${tokens.floorGrid * 0.75}) 1px, transparent 1px)`;
  floor.style.backgroundSize = `${cell}px ${cell}px`;
  floor.style.maskImage = "linear-gradient(180deg, transparent 0%, black 5%, black 28%, transparent 64%)";
  floorWrap.appendChild(floor);
  root.appendChild(floorWrap);

  const line = document.createElement("div");
  line.style.cssText = `position:absolute;left:0;right:0;top:${horizon - 0.5}px;height:1px;`;
  line.style.background = `linear-gradient(90deg, transparent 4%, rgba(${tokens.accentRgb},0.55) 30%, rgba(${tokens.accentRgb},0.75) 50%, rgba(${tokens.accentRgb},0.55) 70%, transparent 96%)`;
  root.appendChild(line);

  return {
    horizon,
    seek({ t, drift, tint }) {
      sky.seek({ u_t: t, u_accent: rgb(tint) });
      floor.style.backgroundPosition = `0 ${(t * drift) % cell}px`;
    },
  };
}
