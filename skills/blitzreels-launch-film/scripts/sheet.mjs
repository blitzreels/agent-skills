#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BLOOM, acquireLock, openSession, parseArgs, readConfig, renderFrame, stamp, studioDeps } from "./render.mjs";

const STRIP = [-12, -6, -3, 0, 3, 6, 12];

const uniqueSorted = (frames) => [...new Set(frames)].sort((a, b) => a - b);
const framePng = ({ dir, frame }) => path.join(dir, `f${String(frame).padStart(4, "0")}.png`);

const plan = ({ mode, meta, list }) => {
  const total = Math.round(meta.duration * meta.fps);
  const clampFrame = (f) => Math.min(total - 1, Math.max(0, f));
  const at = (t) => clampFrame(Math.round(t * meta.fps));
  if (mode === "frames") {
    if (!list.length) throw new Error("--mode frames needs --frames 0,120,240");
    return { rows: [list.map((f) => ({ frame: f, label: "" }))] };
  }
  if (mode === "beats") {
    const marks = new Map();
    const add = ({ frame, label }) => marks.set(frame, [...(marks.get(frame) ?? []), label]);
    for (const s of meta.scenes) {
      add({ frame: at(s.from), label: `${s.id} in` });
      add({ frame: at(s.to), label: `${s.id} out` });
    }
    for (const c of meta.cues) add({ frame: at(c.t), label: c.id });
    for (const g of meta.gates) add({ frame: at(g.at - g.length), label: "gate" });
    const cells = [...marks.entries()].sort((a, b) => a[0] - b[0]).map(([frame, labels]) => ({ frame, label: labels.join(" · ") }));
    return { rows: [cells] };
  }
  if (mode === "strips") {
    const bounds = [...new Set(meta.scenes.flatMap((s) => [s.from, s.to]).filter((t) => t > 0 && t < meta.duration))].sort((a, b) => a - b);
    const name = (t) => {
      const ending = meta.scenes.filter((s) => Math.abs(s.to - t) < 1e-6).map((s) => s.id);
      const starting = meta.scenes.filter((s) => Math.abs(s.from - t) < 1e-6).map((s) => s.id);
      return `${ending.join("+") || "…"} → ${starting.join("+") || "…"}`;
    };
    return {
      rows: bounds.map((t) => STRIP.map((d) => ({ frame: clampFrame(at(t) + d), label: `${d > 0 ? "+" : ""}${d} ${d === 0 ? name(t) : ""}` }))),
    };
  }
  throw new Error("--mode must be beats, strips or frames");
};

const fromVideo = ({ video, frames, dir }) => {
  const unique = uniqueSorted(frames);
  const select = unique.map((f) => `eq(n\\,${f})`).join("+");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lf-sheet-"));
  const res = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", video, "-vf", `select='${select}'`, "-fps_mode", "passthrough", path.join(tmp, "%04d.png")]);
  if (res.status !== 0) throw new Error(`ffmpeg frame extraction failed: ${res.stderr}`);
  const files = new Map();
  unique.forEach((f, i) => {
    const src = path.join(tmp, `${String(i + 1).padStart(4, "0")}.png`);
    if (!fs.existsSync(src)) throw new Error(`frame ${f} is past the end of ${video}`);
    const dst = framePng({ dir, frame: f });
    fs.renameSync(src, dst);
    files.set(f, dst);
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  return files;
};

const fromPage = async ({ session, frames, dir }) => {
  const unique = uniqueSorted(frames);
  const files = new Map();
  let next = 0;
  await Promise.all(
    session.pages.map(async (worker) => {
      while (next < unique.length) {
        const frame = unique[next++];
        const r = await renderFrame({ session, worker, frame, bloom: session.quality === "final" ? BLOOM : 0 });
        const file = framePng({ dir, frame });
        await session.sharp(r.rgb, { raw: { width: session.w, height: session.h, channels: 3 } }).png().toFile(file);
        files.set(frame, file);
      }
    }),
  );
  return files;
};

const compose = async ({ sharp, playwright, rows, files, portrait, title, out }) => {
  const cellW = portrait ? 300 : 520;
  let cols = rows[0].length;
  if (rows.length === 1) cols = portrait ? 6 : 4;
  const cell = async ({ frame, label }) => {
    const buf = await sharp(files.get(frame)).resize({ width: cellW * 2 }).png().toBuffer();
    return `<figure><img src="data:image/png;base64,${buf.toString("base64")}"/><figcaption><b>f${frame}</b> ${label}</figcaption></figure>`;
  };
  const body = [];
  for (const row of rows) body.push(`<section>${(await Promise.all(row.map(cell))).join("")}</section>`);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#141416;color:#e8e8ea;font:15px ui-monospace,Menlo,monospace;}
    h1{font:600 18px ui-monospace,Menlo,monospace;margin:0 0 16px;color:#9a9aa2}
    section{display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:14px;margin-bottom:22px}
    figure{margin:0} img{width:${cellW}px;display:block;border-radius:4px;outline:1px solid #2a2a2e}
    figcaption{margin-top:6px;color:#a8a8b0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} b{color:#fff}
  </style></head><body><h1>${title}</h1>${body.join("")}</body></html>`;
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: cols * (cellW + 14) + 34, height: 400 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const studio = path.resolve(args.studio ?? ".");
  const format = args.format ?? "16x9";
  const mode = args.mode ?? "beats";
  const quality = args.quality ?? "final";
  const list = typeof args.frames === "string" ? args.frames.split(",").map((s) => Number(s.trim())) : [];
  const config = readConfig(studio);
  const name = `${config.slug}-${format}-${mode}-${stamp()}`;
  const dir = path.join(studio, "out", "sheets", name);
  fs.mkdirSync(dir, { recursive: true });
  const { playwright, sharp } = await studioDeps(studio);

  const release = await acquireLock({ label: `${config.slug} sheet ${mode}` });
  let files;
  let rows;
  try {
    const session = await openSession({ studio, format, quality, workers: args.video ? 1 : 3 });
    try {
      ({ rows } = plan({ mode, meta: session.meta, list }));
      const frames = rows.flat().map((c) => c.frame);
      files = args.video ? fromVideo({ video: path.resolve(args.video), frames, dir }) : await fromPage({ session, frames, dir });
    } finally {
      await session.close();
    }
  } finally {
    release();
  }
  const out = path.join(studio, "out", "sheets", `${name}.png`);
  const source = args.video ? path.basename(args.video) : `live ${quality}`;
  await compose({ sharp, playwright, rows, files, portrait: config.formats[format][1] > config.formats[format][0], title: `${config.title} · ${format} · ${mode} · ${source}`, out });
  console.log(JSON.stringify({ sheet: out, frames: rows.flat().map((c) => c.frame), dir }));
}

main().catch((err) => {
  console.error(err.stack ?? err.message);
  console.log(JSON.stringify({ error: err.message }));
  process.exit(1);
});
