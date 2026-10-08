import { clamp, ease, mix, noise, prog, pxPerFrame, spring, track } from "../../engine/motion.js";
import { glLayer, rgb, shaders } from "../../engine/gl.js";
import { reflect, surface } from "../../engine/looks.js";
import { stepNumber } from "../../engine/type.js";
import { el, icons, rays, svg } from "./fx.js";

const ROWS = [
  { cue: "row-1", icon: "build", label: "Build", value: "14.2 s" },
  { cue: "row-2", icon: "tests", label: "Tests", value: "212 passed" },
  { cue: "row-3", icon: "edge", label: "Edge", value: "31 regions" },
];
const CASCADE = 2;
const HOOK_SCALE = 1.9;

const geometry = ({ layout, horizon }) => {
  const { W, H, portrait } = layout;
  if (portrait) {
    const card = { x: 90, y: 300, w: 900, h: 646 };
    const panel = { x: 90, y: horizon - 330, w: 900, h: 330 };
    return { card, panel, pillRest: { x: W / 2, y: H * 0.6 }, light: { x: 860, y: horizon - 360, size: 620 } };
  }
  const card = { x: 250, y: horizon - 560, w: 780, h: 560 };
  const panel = { x: 1110, y: horizon - 380, w: 560, h: 380 };
  return { card, panel, pillRest: { x: W / 2, y: H * 0.585 }, light: { x: 1600, y: horizon - 400, size: 600 } };
};

const centerOn = ({ rect, s, W, H }) => ({ s, x: W / 2 - (rect.x + rect.w / 2) * s, y: H / 2 - (rect.y + rect.h / 2) * s });

/** The carried pill becomes the product card; rows build in; a glass panel counts the time down; stillness on the gate. */
export const product = {
  id: "product",
  from: 0,
  to: 12,
  build(root, ctx) {
    const { layout, look, cue, horizon } = ctx;
    const { W, H, portrait } = layout;
    const g = geometry({ layout, horizon });
    const k = g.card.w / 780;
    const fps = ctx.fps;

    const canvas = el({ tag: "canvas", css: `position:absolute;left:0;top:0;width:${W}px;height:${H}px;`, parent: root });
    const light = glLayer(canvas, { fragment: shaders.glass, uniforms: { u_accent: rgb(look.accent), u_radius: 28 } });
    const world = el({ tag: "div", css: "position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;", parent: root });
    const burst = rays({ parent: root, W, H, count: 40, color: look.accent, seed: "hook" });

    const card = el({ tag: "div", css: "position:absolute;overflow:hidden;", parent: world });
    surface(card, { tokens: look, kind: "card", radius: 30 * k });
    if (!portrait) reflect(card, { tokens: look, gap: 0 });
    const inner = el({ tag: "div", css: `position:absolute;left:0;top:0;width:${g.card.w}px;height:${g.card.h}px;`, parent: card });

    const status = el({ tag: "div", css: `position:absolute;right:${40 * k}px;top:${46 * k}px;height:${30 * k}px;width:${170 * k}px;font:500 ${19 * k}px var(--mono);`, parent: inner });
    const building = el({ tag: "div", css: `position:absolute;right:0;top:0;color:${look.muted};white-space:nowrap;`, parent: status, text: "Building…" });
    const live = el({ tag: "div", css: `position:absolute;right:0;top:0;color:${look.accent};white-space:nowrap;display:flex;align-items:center;gap:${10 * k}px;`, parent: status });
    el({ tag: "span", css: `width:${9 * k}px;height:${9 * k}px;border-radius:50%;background:${look.accent};box-shadow:0 0 ${10 * k}px rgba(${look.accentRgb},0.8);`, parent: live });
    el({ tag: "span", css: "", parent: live, text: "Live" });

    const url = el({ tag: "div", css: `position:absolute;left:${40 * k}px;top:${118 * k}px;font:620 ${44 * k}px var(--display);letter-spacing:-0.035em;color:${look.ink};white-space:nowrap;`, parent: inner });
    el({ tag: "span", css: "", parent: url, text: "checkout-7f3a" });
    el({ tag: "span", css: `color:${look.faint};`, parent: url, text: ".acme.dev" });
    const meta = el({ tag: "div", css: `position:absolute;left:${40 * k}px;top:${182 * k}px;font:400 ${19 * k}px var(--mono);color:${look.muted};white-space:nowrap;`, parent: inner, text: "a91c2e  ·  6 files  ·  by mara" });
    const divider = el({ tag: "div", css: `position:absolute;left:${40 * k}px;right:${40 * k}px;top:${236 * k}px;height:1px;background:${look.line};transform-origin:0 50%;`, parent: inner });

    const rows = ROWS.map((r, i) => {
      const top = (256 + i * 88) * k;
      const row = el({ tag: "div", css: `position:absolute;left:0;right:0;top:${top}px;height:${88 * k}px;`, parent: inner });
      const parts = [
        svg({ markup: icons[r.icon], css: `position:absolute;left:${40 * k}px;top:${26 * k}px;width:${34 * k}px;height:${34 * k}px;color:${look.muted};`, parent: row }),
        el({ tag: "div", css: `position:absolute;left:${96 * k}px;top:${24 * k}px;font:540 ${28 * k}px var(--display);letter-spacing:-0.02em;color:${look.ink};`, parent: row, text: r.label }),
        el({ tag: "div", css: `position:absolute;right:${100 * k}px;top:${28 * k}px;font:400 ${23 * k}px var(--mono);color:${look.muted};white-space:nowrap;`, parent: row, text: r.value }),
      ];
      const check = el({ tag: "div", css: `position:absolute;right:${40 * k}px;top:${25 * k}px;width:${36 * k}px;height:${36 * k}px;border-radius:50%;background:${look.accent};color:#04140d;`, parent: row });
      svg({ markup: icons.check, css: "position:absolute;inset:14%;width:72%;height:72%;", parent: check });
      if (i < ROWS.length - 1) parts.unshift(el({ tag: "div", css: `position:absolute;left:${96 * k}px;right:${40 * k}px;bottom:0;height:1px;background:${look.line};`, parent: row }));
      parts.push(check);
      return { cue: r.cue, parts, row };
    });

    const pill = el({ tag: "div", css: `position:absolute;left:0;top:0;height:${50 * k}px;display:flex;align-items:center;gap:${12 * k}px;padding:0 ${20 * k}px 0 ${16 * k}px;font:500 ${21 * k}px var(--mono);color:${look.ink};white-space:nowrap;`, parent: world });
    surface(pill, { tokens: look, kind: "pill", radius: 25 * k });
    const dot = el({ tag: "span", css: `width:${10 * k}px;height:${10 * k}px;border-radius:50%;background:${look.accent};`, parent: pill });
    el({ tag: "span", css: "", parent: pill, text: "feat/checkout" });
    const pillW = pill.offsetWidth;
    const pillH = pill.offsetHeight;

    const panel = el({ tag: "div", css: `position:absolute;width:${g.panel.w}px;height:${g.panel.h}px;`, parent: world });
    const pad = portrait ? 56 : 48;
    el({ tag: "div", css: `position:absolute;left:${pad}px;top:${pad - 4}px;font:500 ${portrait ? 22 : 19}px var(--mono);letter-spacing:0.06em;text-transform:uppercase;color:${look.muted};`, parent: panel, text: "Preview ready in" });
    const numberBox = el({ tag: "div", css: `position:absolute;right:${pad - 4}px;top:${portrait ? 70 : 96}px;`, parent: panel });
    const counter = stepNumber(numberBox, {
      steps: [
        { at: 0, text: "41s" },
        { at: cue("step-1"), text: "18s" },
        { at: cue("step-2"), text: "9s" },
        { at: cue("step-3"), text: "4s" },
      ],
      size: portrait ? 150 : 168,
      weight: 640,
      color: look.ink,
    });
    el({ tag: "div", css: `position:absolute;left:${pad}px;bottom:${pad - 6}px;font:400 ${portrait ? 24 : 21}px var(--display);letter-spacing:-0.01em;color:${look.muted};`, parent: panel, text: "Median across 1,204 branches" });

    const pillHome = { x: g.pillRest.x - pillW / 2, y: g.pillRest.y - pillH / 2 };
    pill.style.transformOrigin = "50% 50%";
    const header = { x: g.card.x + 40 * k, y: g.card.y + 36 * k };
    const toProduct = cue("to-product");
    const land = cue("card-land");
    const step1 = cue("step-1");
    const riser = cue("riser");
    const gate = ctx.gates[0];
    const settle = gate.at - gate.length;
    const panelIn = step1 - 0.42;

    const hookCam = { s: 1, x: 0, y: 0 };
    const cardCam = centerOn({ rect: g.card, s: portrait ? 1.06 : 1.1, W, H });
    const pushCam = centerOn({ rect: g.card, s: portrait ? 1.1 : 1.16, W, H });
    const wideCam = { s: 1, x: 0, y: 0 };
    const camera = (t) => {
      const c = track({
        t,
        changes: [
          { at: 0, value: hookCam },
          { at: toProduct - 0.06, value: cardCam },
          { at: cue("row-1"), value: pushCam },
          { at: step1 - 0.5, value: wideCam },
        ],
        preset: "default",
      });
      const push = prog({ t, from: riser, to: settle, ease: ease.glide }) * (portrait ? 0.05 : 0.045);
      const s = c.s * (1 + push);
      return { s, x: c.x * (1 + push) - (W / 2) * push, y: c.y * (1 + push) - (H / 2) * push };
    };

    const pillAt = (t) => {
      const fly = prog({ t, from: -0.3, to: 0.7, ease: ease.outExpo });
      const start = { x: pillHome.x - W * 0.62, y: pillHome.y + H * 0.2 };
      const hook = mix(start, pillHome, fly);
      const carry = spring({ t, at: toProduct - 0.08, preset: "snappy" });
      return mix(hook, header, carry);
    };

    const cardRect = (t) => {
      const grow = spring({ t, at: land - 0.04, preset: "default" });
      const p = pillAt(t);
      const from = { x: p.x - 40 * k, y: p.y - 36 * k, w: pillW + 80 * k, h: pillH + 72 * k };
      return { ...mix(from, g.card, clamp(grow, 0, 1.2)), on: t >= land - 0.06 };
    };

    const panelRect = (t) => {
      const rise = spring({ t, at: panelIn, preset: "default" });
      return { x: g.panel.x, y: g.panel.y + (1 - rise) * 90, w: g.panel.w, h: g.panel.h, k: clamp(rise, 0, 1) };
    };

    const toScreen = ({ cam, p }) => ({ x: p.x * cam.s + cam.x, y: p.y * cam.s + cam.y });
    const spinAt = (t) => (1 - prog({ t, from: -0.22, to: 0.5, ease: ease.outExpo })) * -16;

    return {
      seek(ctx) {
        const { t, ambient } = ctx;
        root.style.visibility = t >= cue("logo-hit") ? "hidden" : "";
        const cam = camera(t);
        world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;

        const p = pillAt(t);
        const carried = spring({ t, at: toProduct - 0.08, preset: "snappy" });
        const bob = (1 - carried) * noise({ seed: "bob", t: ambient, freq: 0.9 }) * 4;
        const pillScale = HOOK_SCALE + (1 - HOOK_SCALE) * carried;
        pill.style.transform = `translate(${p.x}px, ${p.y + bob}px) rotate(${spinAt(t)}deg) scale(${pillScale})`;
        dot.style.boxShadow = `0 0 ${(8 + 6 * (0.5 + 0.5 * Math.sin(ambient * 5))) * k}px rgba(${look.accentRgb},0.9)`;
        const pillCenter = { x: p.x + pillW / 2, y: p.y + pillH / 2 };
        const hit = toScreen({ cam: camera(0), p: pillCenter });
        ctx.reportMotion(burst.seek({ t, at: 0, x: hit.x + W * 0.04, y: hit.y, reach: Math.max(W, H) * 0.32, width: 1.4 }));

        const r = cardRect(t);
        card.style.display = r.on ? "" : "none";
        card.style.left = `${r.x}px`;
        card.style.top = `${r.y}px`;
        card.style.width = `${r.w}px`;
        card.style.height = `${r.h}px`;
        const reveal = prog({ t, from: land + 0.02, to: land + 0.5, ease: ease.outExpo });
        url.style.opacity = meta.style.opacity = String(reveal);
        url.style.transform = `translateY(${(1 - reveal) * 18 * k}px)`;
        meta.style.transform = `translateY(${(1 - reveal) * 24 * k}px)`;
        divider.style.transform = `scaleX(${prog({ t, from: land + 0.1, to: land + 0.7, ease: ease.outExpo })})`;

        for (const row of rows) {
          const at = cue(row.cue);
          row.parts.forEach((part, i) => {
            const from = at + (i * CASCADE) / fps;
            const q = prog({ t, from, to: from + 0.42, ease: ease.outExpo });
            part.style.opacity = String(Math.min(1, q * 1.6));
            if (i === row.parts.length - 1) {
              const pop = spring({ t, at: from, preset: "playful" });
              part.style.transform = `scale(${0.4 + 0.6 * pop})`;
            } else {
              part.style.transform = `translateY(${(1 - q) * 22 * k}px)`;
            }
          });
          row.row.style.background = `radial-gradient(55% 140% at 40% 50%, rgba(${look.accentRgb},${(0.08 * Math.exp(-Math.max(0, t - at) * 5) * (t >= at ? 1 : 0)).toFixed(4)}), transparent)`;
        }
        const isLive = prog({ t, from: cue("row-3") + 0.08, to: cue("row-3") + 0.4, ease: ease.outExpo });
        building.style.opacity = String(1 - isLive);
        building.style.transform = `translateY(${-isLive * 14 * k}px)`;
        live.style.opacity = String(isLive);
        live.style.transform = `translateY(${(1 - isLive) * 14 * k}px)`;

        const pr = panelRect(t);
        panel.style.transform = `translate(${pr.x}px, ${pr.y}px)`;
        panel.style.opacity = String(clamp(pr.k * 1.4 - 0.2, 0, 1));
        ctx.reportMotion(counter.seek({ t }).motion * cam.s);

        const glow = prog({ t, from: panelIn - 0.2, to: step1 + 0.3, ease: ease.outCubic });
        const swell = prog({ t, from: riser, to: settle, ease: ease.glide });
        const lc = toScreen({ cam, p: { x: g.light.x, y: g.light.y + (1 - pr.k) * 90 } });
        const tl = toScreen({ cam, p: pr });
        light.seek({
          u_t: ambient,
          u_center: [lc.x, lc.y],
          u_size: g.light.size * cam.s,
          u_intensity: glow * (0.5 + 0.22 * swell),
          u_rect: [tl.x, tl.y, pr.w * cam.s, pr.h * cam.s],
          u_radius: 30 * cam.s,
          u_glass: pr.k,
        });
        canvas.style.display = glow > 0 || pr.k > 0 ? "" : "none";

        const corners = (tt) => {
          const c = camera(tt);
          const cr = cardRect(tt);
          const pp = pillAt(tt);
          const pn = panelRect(tt);
          return [
            ...Object.values(toScreen({ cam: c, p: { x: cr.x + cr.w, y: cr.y + cr.h } })),
            ...Object.values(toScreen({ cam: c, p: { x: cr.x, y: cr.y } })),
            ...Object.values(toScreen({ cam: c, p: pp })),
            ...Object.values(toScreen({ cam: c, p: { x: pn.x, y: pn.y } })),
          ];
        };
        const a = corners(t);
        const b = corners(t - 1 / fps);
        let fastest = 0;
        for (let i = 0; i < a.length; i += 2) fastest = Math.max(fastest, Math.hypot(a[i] - b[i], a[i + 1] - b[i + 1]));
        ctx.reportMotion(fastest * pillScale);
        ctx.reportMotion(pxPerFrame({ fn: (tt) => spinAt(tt) * pillW * 0.0087, t, fps }));
      },
    };
  },
};
