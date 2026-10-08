#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
};

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

export const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const BLOOM = 0.15;

export const readConfig = (studio) => JSON.parse(fs.readFileSync(path.join(studio, "film.config.json"), "utf8"));

/** Loads playwright and sharp from the studio's node_modules (scripts live in the skill, deps in the studio). */
export async function studioDeps(studio) {
  const require = createRequire(path.join(studio, "package.json"));
  const load = async (name) => {
    try {
      const mod = await import(pathToFileURL(require.resolve(name)).href);
      return mod.default ?? mod;
    } catch (err) {
      throw new Error(`cannot load "${name}" from ${studio}/node_modules: run npm install in the studio (${err.message})`);
    }
  };
  return { playwright: await load("playwright"), sharp: await load("sharp") };
}

const SERVED = [/^src\//, /^assets\//, /^(grid|film\.config)\.json$/];

/** Local page server: loopback only, exact Host (no DNS rebinding), and only the film's own files (never .env or audio keys). */
function serve(root) {
  let host = "";
  const server = http.createServer((req, res) => {
    let rel;
    try {
      rel = path.relative(root, path.resolve(root, `.${decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname)}`)).split(path.sep).join("/");
    } catch {
      rel = "..";
    }
    const allowed = req.headers.host === host && !rel.startsWith("..") && !path.isAbsolute(rel) && !rel.split("/").some((p) => p.startsWith(".")) && SERVED.some((re) => re.test(rel));
    if (!allowed) {
      res.writeHead(403).end();
      return;
    }
    const file = path.join(root, rel);
    const realRoot = fs.realpathSync(root);
    fs.stat(file, (err, st) => {
      const real = err ? "" : fs.realpathSync(file);
      if (err || !st.isFile() || path.relative(realRoot, real).startsWith("..")) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
      fs.createReadStream(file).pipe(res);
    });
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      host = `127.0.0.1:${server.address().port}`;
      resolve({ server, port: server.address().port });
    }),
  );
}

// ------------------------------------------------------------------ machine-wide render lock
const LOCK_DIR = path.join(os.homedir(), ".cache", "launch-film", "locks");
const MAX_RENDERS = 2;

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
};

const readLocks = () =>
  fs
    .readdirSync(LOCK_DIR)
    .filter((f) => f.endsWith(".lock"))
    .map((f) => {
      const file = path.join(LOCK_DIR, f);
      try {
        return { file, ...JSON.parse(fs.readFileSync(file, "utf8")) };
      } catch {
        return { file, pid: Number(f.split(".")[0]), started: 0, label: "?" };
      }
    });

/** Waits for one of the machine's render slots (at most 2 renders at once); returns a release function. */
export async function acquireLock({ label }) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
  const mine = path.join(LOCK_DIR, `${process.pid}.lock`);
  const release = () => fs.rmSync(mine, { force: true });
  let announced = 0;
  for (;;) {
    for (const l of readLocks()) if (l.pid !== process.pid && !alive(l.pid)) fs.rmSync(l.file, { force: true });
    const others = readLocks().filter((l) => l.pid !== process.pid);
    if (others.length < MAX_RENDERS) {
      fs.writeFileSync(mine, JSON.stringify({ pid: process.pid, started: Date.now(), label }));
      const order = readLocks().sort((a, b) => a.started - b.started || a.pid - b.pid);
      if (order.findIndex((l) => l.pid === process.pid) < MAX_RENDERS) {
        process.on("exit", release);
        for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(130));
        return release;
      }
      release();
    }
    if (Date.now() - announced > 15000) {
      console.log(`waiting for a render slot: ${others.length} renders running (${others.map((o) => `pid ${o.pid} ${o.label}`).join(", ")})`);
      announced = Date.now();
    }
    await sleep(1000 + (process.pid % 7) * 100);
  }
}

// ------------------------------------------------------------------ colour + post (Float32, linear light)
const SRGB_TO_LINEAR = new Float32Array(256).map((_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const ENC_SIZE = 8192;
const LINEAR_TO_SRGB = new Float32Array(ENC_SIZE + 1).map((_, i) => {
  const c = i / ENC_SIZE;
  return 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
});

const accumulate = ({ acc, rgb }) => {
  for (let i = 0; i < acc.length; i++) acc[i] += SRGB_TO_LINEAR[rgb[i]];
};

const blurPass = ({ from, to, r, len, lines, stride, step }) => {
  const norm = 1 / (2 * r + 1);
  for (let line = 0; line < lines; line++) {
    for (let c = 0; c < 3; c++) {
      const base = line * stride + c;
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += from[base + Math.min(len - 1, Math.max(0, k)) * step];
      for (let x = 0; x < len; x++) {
        to[base + x * step] = sum * norm;
        sum += from[base + Math.min(len - 1, x + r + 1) * step] - from[base + Math.max(0, x - r) * step];
      }
    }
  }
};

/** Three box passes each way ≈ gaussian; blurs `src` in place. */
const boxBlur = ({ src, w, h, r }) => {
  const tmp = new Float32Array(src.length);
  for (let i = 0; i < 3; i++) {
    blurPass({ from: src, to: tmp, r, len: w, lines: h, stride: w * 3, step: 3 });
    blurPass({ from: tmp, to: src, r, len: h, lines: w, stride: 3, step: w * 3 });
  }
  return src;
};

const addBloom = ({ acc, w, h, strength, threshold }) => {
  const qw = Math.ceil(w / 4);
  const qh = Math.ceil(h / 4);
  const q = new Float32Array(qw * qh * 3);
  const knee = 0.25;
  for (let y = 0; y < h; y++) {
    const qy = y >> 2;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const r = acc[i];
      const g = acc[i + 1];
      const b = acc[i + 2];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (l <= threshold - knee) continue;
      const soft = l < threshold + knee ? ((l - threshold + knee) ** 2) / (4 * knee) : l - threshold;
      const k = soft / Math.max(l, 1e-4) / 16;
      const o = (qy * qw + (x >> 2)) * 3;
      q[o] += r * k;
      q[o + 1] += g * k;
      q[o + 2] += b * k;
    }
  }
  const scale = w / 1920;
  const near = boxBlur({ src: q.slice(), w: qw, h: qh, r: Math.max(1, Math.round(3 * scale)) });
  const far = boxBlur({ src: q, w: qw, h: qh, r: Math.max(2, Math.round(11 * scale)) });
  for (let y = 0; y < h; y++) {
    const fy = Math.min(qh - 1, Math.max(0, (y + 0.5) / 4 - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(qh - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(qw - 1, Math.max(0, (x + 0.5) / 4 - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(qw - 1, x0 + 1);
      const tx = fx - x0;
      const i = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) {
        const s = (arr) =>
          (arr[(y0 * qw + x0) * 3 + c] * (1 - tx) + arr[(y0 * qw + x1) * 3 + c] * tx) * (1 - ty) +
          (arr[(y1 * qw + x0) * 3 + c] * (1 - tx) + arr[(y1 * qw + x1) * 3 + c] * tx) * ty;
        acc[i + c] += strength * (0.6 * s(near) + 0.4 * s(far));
      }
    }
  }
};

/** Hue-preserving grade, then triangular dither and quantise to rgb24. Identity for in-gamut colours. */
const gradeAndQuantise = ({ acc, frame, headroom }) => {
  const out = Buffer.allocUnsafe(acc.length);
  let s = (Math.imul(frame + 1, 0x9e3779b1) ^ 0x5bd1e995) >>> 0 || 1;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  for (let i = 0; i < acc.length; i += 3) {
    let r = acc[i];
    let g = acc[i + 1];
    let b = acc[i + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (l > 1) {
      const mapped = 1 + headroom * (1 - Math.exp(-(l - 1) / headroom));
      const k = mapped / l;
      r *= k;
      g *= k;
      b *= k;
    }
    const m = Math.max(r, g, b);
    if (m > 1) {
      const burn = Math.min(1, (m - 1) * 0.6);
      r = r / m + (1 - r / m) * burn;
      g = g / m + (1 - g / m) * burn;
      b = b / m + (1 - b / m) * burn;
    }
    const ch = [r, g, b];
    for (let c = 0; c < 3; c++) {
      const v = Math.min(1, Math.max(0, ch[c])) * ENC_SIZE;
      const j = Math.min(ENC_SIZE - 1, Math.floor(v));
      const enc = LINEAR_TO_SRGB[j] + (LINEAR_TO_SRGB[j + 1] - LINEAR_TO_SRGB[j]) * (v - j);
      const dither = (rnd() + rnd()) * 0.5 - 0.5;
      out[i + c] = Math.min(255, Math.max(0, Math.round(enc + dither)));
    }
  }
  return out;
};

const samplesFor = (motion) => (motion < 0.6 ? 1 : Math.min(12, Math.max(2, Math.ceil(motion / 3) + 1)));

// ------------------------------------------------------------------ session
/** Opens the studio page(s) in headless Chromium at a format and quality, ready to seek. */
export async function openSession({ studio, format, quality, workers }) {
  const { playwright, sharp } = await studioDeps(studio);
  const config = readConfig(studio);
  const size = config.formats[format];
  if (!size) throw new Error(`format "${format}" not in film.config.json (${Object.keys(config.formats).join(", ")})`);
  const scale = quality === "draft" ? 0.5 : 1;
  const [W, H] = size;
  const w = Math.round(W * scale);
  const h = Math.round(H * scale);
  const { server, port } = await serve(studio);
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ["--force-color-profile=srgb", "--disable-lcd-text", "--font-render-hinting=none", "--hide-scrollbars", "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--ignore-gpu-blocklist"],
  });
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: "dark" });
  const errors = [];
  const pages = await Promise.all(
    Array.from({ length: workers }, async () => {
      const page = await context.newPage();
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.goto(`http://127.0.0.1:${port}/src/index.html?render=1`);
      await page.waitForFunction(() => window.__film !== undefined, null, { timeout: 30000 }).catch(() => {
        throw new Error(`the film page never defined window.__film: ${errors.join(" | ") || "no error captured"}`);
      });
      await page.evaluate(async (f) => {
        await window.__film.ready;
        if (window.__film.format !== f) await window.__film.setFormat(f);
      }, format);
      if (errors.length) throw new Error(`page error: ${errors.join(" | ")}`);
      const cdp = await context.newCDPSession(page);
      return { page, cdp };
    }),
  );
  const meta = await pages[0].page.evaluate(() => {
    const f = window.__film;
    return { fps: f.fps, duration: f.duration, scenes: f.scenes, cues: f.cues, gates: f.gates, slug: f.slug, title: f.title };
  });
  return {
    config,
    sharp,
    pages,
    meta,
    w,
    h,
    W,
    H,
    format,
    quality,
    errors,
    async close() {
      await browser.close();
      server.close();
    },
  };
}

const capture = async ({ session, worker }) => {
  const { data } = await worker.cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, fromSurface: true, captureBeyondViewport: false, clip: { x: 0, y: 0, width: session.W, height: session.H, scale: session.w / session.W } });
  const { data: raw, info } = await session.sharp(Buffer.from(data, "base64")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== session.w || info.height !== session.h) throw new Error(`captured ${info.width}x${info.height}, expected ${session.w}x${session.h}`);
  return raw;
};

const seek = ({ worker, t }) => worker.page.evaluate((tt) => window.__film.seek(tt), t);

/** Renders one frame: adaptive 180° shutter sub-frames (final), accumulated in Float32, bloom, grade, dither → rgb24. */
export async function renderFrame({ session, worker, frame, bloom }) {
  const fps = session.meta.fps;
  const t = frame / fps;
  const { motion } = await seek({ worker, t });
  const samples = session.quality === "final" ? samplesFor(motion) : 1;
  const acc = new Float32Array(session.w * session.h * 3);
  accumulate({ acc, rgb: await capture({ session, worker }) });
  for (let i = 1; i < samples; i++) {
    await seek({ worker, t: t - (0.5 / fps) * (i / (samples - 1)) });
    accumulate({ acc, rgb: await capture({ session, worker }) });
  }
  if (samples > 1) for (let i = 0; i < acc.length; i++) acc[i] /= samples;
  if (session.errors.length) throw new Error(`page error at frame ${frame}: ${session.errors.join(" | ")}`);
  if (bloom > 0) addBloom({ acc, w: session.w, h: session.h, strength: bloom, threshold: 0.72 });
  return { rgb: gradeAndQuantise({ acc, frame, headroom: 0.25 }), samples, motion };
}

// ------------------------------------------------------------------ encode
const encoder = ({ w, h, fps, out, quality, audio, from }) => {
  const draft = quality === "draft";
  const args = ["-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", String(fps), "-i", "-"];
  if (audio) args.push("-ss", from.toFixed(4), "-i", audio);
  args.push("-map", "0:v");
  if (audio) args.push("-map", "1:a");
  args.push(
    "-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int",
    "-c:v", "libx264", "-preset", draft ? "veryfast" : "slow", "-crf", draft ? "23" : "18",
    "-x264-params", "aq-mode=3:colorprim=bt709:transfer=bt709:colormatrix=bt709", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
  );
  if (audio) args.push("-c:a", "aac", "-b:a", "192k", "-shortest");
  args.push("-movflags", "+faststart", out);
  const proc = spawn("ffmpeg", args, { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((resolve, reject) => proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))));
  const write = (buf) => new Promise((resolve) => (proc.stdin.write(buf) ? resolve() : proc.stdin.once("drain", resolve)));
  return { write, end: () => (proc.stdin.end(), done) };
};

const fmtTime = (s) => (s >= 60 ? `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s` : `${s.toFixed(1)}s`);

async function render(args) {
  const studio = path.resolve(args.studio ?? ".");
  const format = args.format ?? "16x9";
  const quality = args.quality ?? "final";
  if (!["draft", "final"].includes(quality)) throw new Error("--quality must be draft or final");
  const config = readConfig(studio);
  const bloom = quality === "draft" ? 0 : Number(args.bloom ?? config.post?.bloom ?? BLOOM);
  const workers = Number(args.workers ?? Math.max(1, Math.min(4, Math.floor(os.cpus().length / 4))));
  const out = path.resolve(studio, args.out ?? `out/${config.slug}-${format}-${quality}-${stamp()}.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const release = await acquireLock({ label: `${config.slug} ${format} ${quality}` });
  const started = Date.now();
  const session = await openSession({ studio, format, quality, workers });
  try {
    const { fps, duration } = session.meta;
    const total = Math.round(duration * fps);
    const first = Math.max(0, Math.round(Number(args.from ?? 0) * fps));
    const last = Math.min(total, args.to !== undefined ? Math.round(Number(args.to) * fps) : total);
    if (last <= first) throw new Error(`empty range: frames ${first}..${last}`);
    const wav = path.join(studio, "audio", "score.wav");
    const audio = fs.existsSync(wav) ? wav : null;
    const enc = encoder({ w: session.w, h: session.h, fps, out, quality, audio, from: first / fps });
    console.log(`render ${config.slug} ${format} ${quality} · frames ${first}..${last - 1} · ${session.w}x${session.h} · ${workers} workers${audio ? " · audio" : " · no audio/score.wav"}`);

    const results = new Map();
    let next = first;
    let written = first;
    let sampleSum = 0;
    const waiters = new Set();
    const wait = () => new Promise((r) => waiters.add(r));
    const notify = () => {
      for (const r of waiters) r();
      waiters.clear();
    };
    const work = async (worker) => {
      for (;;) {
        while (next - written > workers * 3) await wait();
        const frame = next++;
        if (frame >= last) return;
        const r = await renderFrame({ session, worker, frame, bloom });
        results.set(frame, r);
        notify();
      }
    };
    const writer = (async () => {
      while (written < last) {
        if (!results.has(written)) {
          await wait();
          continue;
        }
        const r = results.get(written);
        results.delete(written);
        sampleSum += r.samples;
        await enc.write(r.rgb);
        written++;
        notify();
        const n = written - first;
        if (n % 30 === 0 || written === last) {
          const el = (Date.now() - started) / 1000;
          console.log(`frame ${written}/${last} · ${(n / el).toFixed(1)} fps · avg samples ${(sampleSum / n).toFixed(2)} · eta ${fmtTime(((last - written) * el) / n)}`);
        }
      }
    })();
    await Promise.all(session.pages.map(work));
    await writer;
    await enc.end();
    const frames = last - first;
    const seconds = (Date.now() - started) / 1000;
    console.log(JSON.stringify({ out, frames, seconds: Number(seconds.toFixed(1)), avgSamples: Number((sampleSum / frames).toFixed(2)), sizeMB: Number((fs.statSync(out).size / 1048576).toFixed(2)) }));
  } finally {
    await session.close();
    release();
  }
}

async function determinism(args) {
  const studio = path.resolve(args.studio ?? ".");
  const format = args.format ?? "16x9";
  const frame = Number(args.determinism === true ? 100 : args.determinism);
  const release = await acquireLock({ label: "determinism" });
  try {
    const hashes = [];
    for (let run = 0; run < 2; run++) {
      const session = await openSession({ studio, format, quality: "final", workers: 1 });
      try {
        await renderFrame({ session, worker: session.pages[0], frame: Math.max(0, frame - 37), bloom: BLOOM });
        const r = await renderFrame({ session, worker: session.pages[0], frame, bloom: BLOOM });
        hashes.push({ hash: createHash("sha256").update(r.rgb).digest("hex").slice(0, 16), samples: r.samples });
      } finally {
        await session.close();
      }
    }
    console.log(JSON.stringify({ frame, format, hashA: hashes[0].hash, hashB: hashes[1].hash, samples: hashes[0].samples, identical: hashes[0].hash === hashes[1].hash }));
  } finally {
    release();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = parseArgs(process.argv.slice(2));
  (args.determinism ? determinism(args) : render(args)).catch((err) => {
    console.error(err.stack ?? err.message);
    console.log(JSON.stringify({ error: err.message }));
    process.exit(1);
  });
}
