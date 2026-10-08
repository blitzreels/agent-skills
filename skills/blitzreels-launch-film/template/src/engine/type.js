import { clamp, ease, prog } from "./motion.js";

const STAGGER = 0.022;
const FIGURE_SPACE = "\u2007";
const ALIGN = {
  left: { items: "flex-start", origin: "0% 50%" },
  center: { items: "center", origin: "50% 50%" },
  right: { items: "flex-end", origin: "100% 50%" },
};
const frame = () => 1 / (globalThis.__film?.fps ?? 60);

const charState = ({ t, at, out, line, index }) => {
  const start = at + line * 0.05 + index * STAGGER;
  const p = prog({ t, from: start, to: start + 0.55, ease: ease.charIn });
  const exitAt = out - 0.24 + index * STAGGER * 0.5;
  const q = prog({ t, from: exitAt, to: exitAt + 0.24, ease: ease.inExpo });
  return { p, q, rise: (1 - p) * 0.62 - q * 0.5 };
};

/**
 * Per-character type animator: each glyph rises, unfolds from -78° and de-blurs on a 22 ms stagger,
 * lines overlap by 50 ms, the hold drifts tracking and scale, and the exit cascades upward from `out`.
 */
export function kinetic(el, { lines, size, weight, align }) {
  const wrap = document.createElement("div");
  wrap.style.cssText = `display:flex;flex-direction:column;perspective:${size * 6}px;white-space:nowrap;`;
  const { items, origin } = ALIGN[align] ?? ALIGN.left;
  wrap.style.alignItems = items;
  wrap.style.transformOrigin = origin;
  const chars = [];
  const rows = [];
  let index = 0;
  lines.forEach((line, li) => {
    const row = document.createElement("div");
    row.style.cssText = `font-family:var(--display);font-weight:${weight};font-size:${size}px;line-height:1.02;color:${line.color};font-feature-settings:"ss01","tnum";`;
    line.text.split(" ").forEach((word, wi, words) => {
      const w = document.createElement("span");
      w.style.cssText = "display:inline-block;transform-style:preserve-3d;";
      if (wi < words.length - 1) w.style.marginRight = "0.24em";
      for (const ch of word) {
        const c = document.createElement("span");
        c.textContent = ch;
        c.style.cssText = "display:inline-block;transform-origin:50% 100%;";
        w.appendChild(c);
        chars.push({ el: c, line: li, index: index++ });
      }
      row.appendChild(w);
    });
    rows.push(row);
    wrap.appendChild(row);
  });
  el.appendChild(wrap);

  return {
    seek({ t, at, out }) {
      const hold = clamp((t - at) / Math.max(0.001, Math.min(out, at + 4) - at), 0, 1);
      wrap.style.transform = hold > 0 ? `scale(${1 + 0.025 * hold})` : "";
      for (const row of rows) row.style.letterSpacing = `${-0.04 + 0.008 * hold}em`;
      let motion = 0;
      for (const c of chars) {
        const s = charState({ t, at, out, line: c.line, index: c.index });
        const prev = charState({ t: t - frame(), at, out, line: c.line, index: c.index });
        motion = Math.max(motion, Math.abs(s.rise - prev.rise) * size);
        if (s.p >= 1 && s.q <= 0) {
          c.el.style.transform = "";
          c.el.style.filter = "";
          c.el.style.opacity = "";
          continue;
        }
        const blur = (1 - s.p) * size * 0.06 + s.q * size * 0.045;
        c.el.style.opacity = String(Math.min(1, s.p * 2.2) * (1 - s.q));
        c.el.style.transform = `translateY(${s.rise}em) rotateX(${(1 - s.p) * -78}deg) scale(${0.92 + 0.08 * s.p})`;
        c.el.style.filter = blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : "";
      }
      return { motion };
    },
  };
}

const padLeft = ({ text, width }) => FIGURE_SPACE.repeat(Math.max(0, width - [...text].length)) + text;

/** A number that changes in steps: only changed glyphs flip, the old one up and out, the new one rising in. */
export function stepNumber(el, { steps, size, weight, color }) {
  const width = Math.max(...steps.map((s) => [...s.text].length));
  const padded = steps.map((s) => ({ at: s.at, chars: [...padLeft({ text: s.text, width })] }));
  const wrap = document.createElement("span");
  wrap.style.cssText = `display:inline-flex;align-items:baseline;white-space:pre;font-family:var(--display);font-weight:${weight};font-size:${size}px;line-height:1.1;color:${color};font-variant-numeric:tabular-nums;letter-spacing:-0.04em;`;
  const slots = Array.from({ length: width }, () => {
    const slot = document.createElement("span");
    slot.style.cssText = "position:relative;display:inline-block;overflow:hidden;padding:0.06em 0;margin:-0.06em 0;";
    const next = document.createElement("span");
    next.style.cssText = "display:inline-block;";
    const old = document.createElement("span");
    old.style.cssText = "position:absolute;left:0;top:0.06em;display:inline-block;";
    slot.append(next, old);
    wrap.appendChild(slot);
    return { next, old };
  });
  el.appendChild(wrap);

  return {
    seek({ t }) {
      let k = 0;
      while (k + 1 < padded.length && t >= padded[k + 1].at) k++;
      const cur = padded[k].chars;
      const prev = k > 0 ? padded[k - 1].chars : cur;
      let order = 0;
      let motion = 0;
      slots.forEach((slot, i) => {
        slot.next.textContent = cur[i];
        if (k === 0 || prev[i] === cur[i]) {
          slot.next.style.transform = "";
          slot.next.style.opacity = "";
          slot.old.textContent = "";
          return;
        }
        const from = padded[k].at + order++ * 0.025;
        const p = prog({ t, from, to: from + 0.24, ease: ease.charIn });
        const pp = prog({ t: t - frame(), from, to: from + 0.24, ease: ease.charIn });
        motion = Math.max(motion, (p - pp) * size * 0.8);
        slot.next.style.transform = p < 1 ? `translateY(${((1 - p) * 80).toFixed(3)}%)` : "";
        slot.next.style.opacity = p < 1 ? String(Math.min(1, p * 1.6)) : "";
        slot.old.textContent = p < 1 ? prev[i] : "";
        slot.old.style.transform = `translateY(${(-p * 80).toFixed(3)}%)`;
        slot.old.style.opacity = String(1 - p);
      });
      return { motion };
    },
  };
}
