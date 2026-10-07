import { kinetic } from "../../engine/type.js";
import { el } from "./fx.js";

const WORDS = [
  { cue: "word-1", text: "Push." },
  { cue: "word-2", text: "Preview." },
  { cue: "word-3", text: "Ship.", accent: true },
];

/** Three words land on the word cues; they cascade out as the carried pill takes the frame. */
export const hook = {
  id: "hook",
  from: 0,
  to: 4,
  build(root, ctx) {
    const { W, H, portrait, unit } = ctx.layout;
    const size = portrait ? Math.round(W * 0.185) : Math.round(176 * unit);
    const box = el({
      tag: "div",
      css: `position:absolute;left:0;width:${W}px;display:flex;justify-content:center;align-items:${portrait ? "center" : "baseline"};flex-direction:${portrait ? "column" : "row"};gap:${portrait ? 0 : size * 0.3}px;top:${portrait ? H * 0.2 : H * 0.29}px;`,
      parent: root,
    });
    const words = WORDS.map((w) => {
      const slot = el({ tag: "div", css: "position:relative;", parent: box });
      const color = w.accent ? ctx.look.accent : ctx.look.ink;
      return { cue: w.cue, type: kinetic(slot, { lines: [{ text: w.text, color }], size, weight: 680, align: "center" }) };
    });
    return {
      seek(ctx) {
        const out = ctx.cue("to-product") - 0.1;
        for (const w of words) ctx.reportMotion(w.type.seek({ t: ctx.t, at: ctx.cue(w.cue), out }).motion);
      },
    };
  },
};
