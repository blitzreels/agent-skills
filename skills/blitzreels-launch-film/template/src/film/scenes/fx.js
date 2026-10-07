import { ease, prog, rand } from "../../engine/motion.js";

const SVG = "http://www.w3.org/2000/svg";

/** Creates an element with inline CSS, appended to `parent`. */
export function el({ tag, css, parent, text }) {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  parent.appendChild(node);
  return node;
}

export function svg({ markup, css, parent }) {
  const wrap = document.createElementNS(SVG, "svg");
  wrap.setAttribute("viewBox", "0 0 24 24");
  wrap.setAttribute("fill", "none");
  wrap.style.cssText = css;
  wrap.innerHTML = markup;
  parent.appendChild(wrap);
  return wrap;
}

/** Thin light rays bursting from a point at a hit: sharp lines, never a blob. */
export function rays({ parent, W, H, count, color, seed }) {
  const wrap = document.createElementNS(SVG, "svg");
  wrap.setAttribute("width", W);
  wrap.setAttribute("height", H);
  wrap.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;overflow:visible;";
  const lines = Array.from({ length: count }, (_, i) => {
    const line = document.createElementNS(SVG, "line");
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-linecap", "round");
    wrap.appendChild(line);
    return {
      line,
      angle: (i / count) * Math.PI * 2 + rand({ seed: `${seed}a${i}` }) * 0.09,
      len: 0.35 + rand({ seed: `${seed}l${i}` }) * 0.65,
      alpha: 0.35 + rand({ seed: `${seed}o${i}` }) * 0.65,
    };
  });
  parent.appendChild(wrap);
  return {
    seek({ t, at, x, y, reach, width }) {
      const progAt = (tt) => prog({ t: tt, from: at, to: at + 0.5, ease: ease.outExpo });
      const p = progAt(t);
      const visible = t >= at && p < 1;
      wrap.style.display = visible ? "" : "none";
      if (!visible) return 0;
      const r0 = reach * (0.12 + p * 0.8);
      for (const r of lines) {
        const r1 = r0 + reach * 0.42 * r.len * (1 - p * 0.5);
        r.line.setAttribute("x1", x + Math.cos(r.angle) * r0);
        r.line.setAttribute("y1", y + Math.sin(r.angle) * r0);
        r.line.setAttribute("x2", x + Math.cos(r.angle) * r1);
        r.line.setAttribute("y2", y + Math.sin(r.angle) * r1);
        r.line.setAttribute("stroke-width", width);
        r.line.setAttribute("stroke-opacity", (1 - p) * r.alpha);
      }
      return (p - progAt(t - 1 / 60)) * reach * 0.8;
    },
  };
}

/** One-hit light flash that peaks on the hit frame and is gone after `frames`. */
export function flash({ parent, accentRgb }) {
  const node = el({ tag: "div", css: "position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;", parent });
  return {
    seek({ t, at, frames, x, y, fps }) {
      const k = t < at ? 0 : Math.exp(-((t - at) * fps) / (frames / 3));
      node.style.display = k < 0.01 ? "none" : "";
      node.style.opacity = String(k);
      node.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.9) 0%, rgba(${accentRgb},0.35) 18%, rgba(${accentRgb},0.08) 40%, transparent 65%)`;
    },
  };
}

export const icons = {
  build: '<path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 7.4 12 12l8-4.6M12 12v9.2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  tests: '<rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" stroke-width="1.6"/><path d="m7.8 12.3 2.8 2.7 5.6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  edge: '<circle cx="12" cy="12" r="8.6" stroke="currentColor" stroke-width="1.6"/><path d="M3.6 12h16.8M12 3.4c2.6 2.4 3.9 5.3 3.9 8.6s-1.3 6.2-3.9 8.6c-2.6-2.4-3.9-5.3-3.9-8.6S9.4 5.8 12 3.4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  check: '<path d="m7 12.4 3.3 3.2L17.2 8.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  arrow: '<path d="M5 12h13.5M13 6.5 18.5 12 13 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};
