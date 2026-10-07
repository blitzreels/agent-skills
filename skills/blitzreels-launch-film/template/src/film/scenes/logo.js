import { clamp, ease, noise, prog, spring } from "../../engine/motion.js";
import { kinetic } from "../../engine/type.js";
import { surface } from "../../engine/looks.js";
import { el, flash, icons, rays, svg } from "./fx.js";

const MARK = (accent) => `
  <svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block">
    <rect x="2" y="2" width="96" height="96" rx="26" fill="${accent}"/>
    <path d="M29 73 50 27l21 46" fill="none" stroke="#03130c" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="50" cy="61" r="6.5" fill="#03130c"/>
  </svg>`;

/** Logo slams in on the hit, the kinetic wordmark joins it, the CTA rises; the hold keeps breathing. */
export const logo = {
  id: "logo",
  from: 12,
  to: 16,
  build(root, ctx) {
    const { layout, look, cue } = ctx;
    const { W, H, portrait, unit } = layout;
    const markSize = portrait ? 236 : Math.round(156 * unit);
    const typeSize = portrait ? 230 : Math.round(196 * unit);
    const gap = portrait ? 34 : Math.round(44 * unit);

    const group = el({ tag: "div", css: `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% 45%;`, parent: root });
    const mark = el({ tag: "div", css: `position:absolute;left:0;top:0;width:${markSize}px;height:${markSize}px;`, parent: group });
    mark.innerHTML = MARK(look.accent);
    const wordBox = el({ tag: "div", css: "position:absolute;left:0;top:0;", parent: group });
    const word = kinetic(wordBox, { lines: [{ text: "Acme", color: look.ink }], size: typeSize, weight: 680, align: "left" });
    const wordW = wordBox.offsetWidth;
    const wordH = wordBox.offsetHeight;

    const ctaH = portrait ? 92 : 72;
    const iconSize = portrait ? 34 : 28;
    const cta = el({ tag: "div", css: `position:absolute;left:0;top:0;display:flex;align-items:center;gap:${portrait ? 28 : 26}px;`, parent: group });
    const button = el({ tag: "div", css: `position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;height:${ctaH}px;padding:0 ${portrait ? 40 : 32}px;border-radius:999px;background:${look.accent};color:#03130c;font:620 ${portrait ? 36 : 28}px var(--display);letter-spacing:-0.02em;white-space:nowrap;`, parent: cta, text: "Start free" });
    svg({ markup: icons.arrow, css: `width:${iconSize}px;height:${iconSize}px;`, parent: button });
    const sheen = el({ tag: "div", css: "position:absolute;top:-50%;bottom:-50%;width:40%;transform:rotate(18deg);background:linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);", parent: button });
    const domain = el({ tag: "div", css: `height:${ctaH}px;display:flex;align-items:center;padding:0 ${portrait ? 34 : 28}px;font:500 ${portrait ? 30 : 24}px var(--mono);color:${look.ink};white-space:nowrap;`, parent: cta, text: "acme.dev" });
    surface(domain, { tokens: look, kind: "pill", radius: 999 });
    const ctaW = cta.offsetWidth;

    const burst = rays({ parent: root, W, H, count: 48, color: look.accent, seed: "logo" });
    const hitFlash = flash({ parent: root, accentRgb: look.accentRgb });

    const centerY = portrait ? H * 0.36 : H * 0.42;
    const solo = { x: W / 2 - markSize / 2, y: centerY - markSize / 2 };
    const lock = portrait
      ? { x: W / 2 - markSize / 2, y: centerY - (markSize + gap + wordH * 0.9) / 2 }
      : { x: W / 2 - (markSize + gap + wordW) / 2, y: centerY - markSize / 2 };
    const wordPos = portrait
      ? { x: W / 2 - wordW / 2, y: lock.y + markSize + gap - wordH * 0.08 }
      : { x: lock.x + markSize + gap, y: centerY - wordH * 0.53 };
    const ctaPos = { x: W / 2 - ctaW / 2, y: portrait ? wordPos.y + wordH + 120 : H * 0.64 };

    const hit = cue("logo-hit");
    const wm = cue("wordmark");
    const ctaAt = cue("cta");
    const markAt = (t) => {
      const slide = spring({ t, at: wm - 0.05, preset: "default" });
      return { x: solo.x + (lock.x - solo.x) * slide, y: solo.y + (lock.y - solo.y) * slide, s: 1.42 - 0.42 * spring({ t, at: hit, preset: "heavy" }) };
    };

    return {
      seek(ctx) {
        const { t, ambient } = ctx;
        root.style.visibility = t < hit ? "hidden" : "";
        if (t < hit) return;
        const breathe = prog({ t, from: hit, to: ctx.duration, ease: ease.linear });
        group.style.transform = `scale(${1 + 0.022 * breathe}) translateY(${noise({ seed: "drift", t: ambient, freq: 0.4 }) * 2}px)`;

        const m = markAt(t);
        mark.style.transform = `translate(${m.x}px, ${m.y}px) scale(${m.s})`;
        mark.style.opacity = String(clamp((t - hit) * ctx.fps / 2, 0, 1));
        const mp = markAt(t - 1 / ctx.fps);
        ctx.reportMotion(Math.hypot(m.x - mp.x, m.y - mp.y) + Math.abs(m.s - mp.s) * markSize);

        wordBox.style.transform = `translate(${wordPos.x}px, ${wordPos.y}px)`;
        ctx.reportMotion(word.seek({ t, at: wm + 0.03, out: Infinity }).motion);

        const rise = spring({ t, at: ctaAt, preset: "snappy" });
        const riseP = spring({ t: t - 1 / ctx.fps, at: ctaAt, preset: "snappy" });
        cta.style.transform = `translate(${ctaPos.x}px, ${ctaPos.y + (1 - rise) * 46}px)`;
        cta.style.opacity = String(clamp(rise * 1.5, 0, 1));
        ctx.reportMotion(Math.abs(rise - riseP) * 46);
        const sweep = prog({ t, from: ctaAt + 0.2, to: ctaAt + 0.95, ease: ease.snap });
        sheen.style.left = `${-50 + sweep * 170}%`;
        sheen.style.display = sweep > 0 && sweep < 1 ? "" : "none";

        const cx = solo.x + markSize / 2;
        const cy = solo.y + markSize / 2;
        ctx.reportMotion(burst.seek({ t, at: hit, x: cx, y: cy, reach: Math.max(W, H) * 0.42, width: 1.6 }));
        hitFlash.seek({ t, at: hit, frames: 10, x: cx, y: cy, fps: ctx.fps });
      },
    };
  },
};
