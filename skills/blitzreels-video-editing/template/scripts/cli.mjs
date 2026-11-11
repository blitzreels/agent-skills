import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = "src/index.ts";
const [command, ...rest] = process.argv.slice(2);

const usage = `Usage:
  npm run edit -- prepare <raw-video> [--language fr] [--model small] [--frame-x 0.5]
  npm run edit -- studio
  npm run edit -- stills <seconds...>
  npm run edit -- render
  npm run edit -- music        (needs ELEVENLABS_API_KEY; composes src/edit/score.json)
  npm run edit -- sfx          (needs ELEVENLABS_API_KEY; generates the sound kit once)`;

const run = ({ bin, args }) => {
  const result = spawnSync(bin, args, { cwd: root, stdio: "inherit" });
  process.exit(result.status ?? 1);
};

if (command === "prepare") run({ bin: "uv", args: ["run", "scripts/prepare.py", ...rest] });
if (command === "music" || command === "sfx") run({ bin: "node", args: ["scripts/audio.mjs", command] });

if (!existsSync(path.join(root, "public/talk.mp4"))) {
  console.error("Missing public/talk.mp4. Run: npm run edit -- prepare <raw-video>");
  process.exit(1);
}

if (command === "studio") run({ bin: "npx", args: ["remotion", "studio", entry, "--port", "3219", "--no-open"] });
if (command === "render") run({ bin: "npx", args: ["remotion", "render", entry, "short", "out/short.mp4", "--crf=18"] });

if (command === "stills") {
  const { bundle } = await import("@remotion/bundler");
  const { selectComposition, renderStill } = await import("@remotion/renderer");
  const outDir = path.join(root, "out/stills");
  mkdirSync(outDir, { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.join(root, entry), publicDir: path.join(root, "public") });
  const composition = await selectComposition({ serveUrl, id: "short" });
  const files = [];
  for (const seconds of rest.map(Number)) {
    const output = path.join(outDir, `${seconds.toFixed(2).padStart(7, "0")}.jpg`);
    await renderStill({
      serveUrl,
      composition,
      frame: Math.min(composition.durationInFrames - 1, Math.round(seconds * composition.fps)),
      output,
      imageFormat: "jpeg",
      jpegQuality: 80,
      scale: 0.5,
    });
    files.push(output);
  }
  const columns = Math.min(5, files.length);
  const tileWidth = Math.round(composition.width * 0.5);
  const tileHeight = Math.round(composition.height * 0.5);
  const sheet = path.join(outDir, "sheet.jpg");
  if (files.length > 1) {
    spawnSync("ffmpeg", [
      "-v", "error", "-y",
      ...files.flatMap((file) => ["-i", file]),
      "-filter_complex",
      `${files.map((_, i) => `[${i}]`).join("")}xstack=inputs=${files.length}:layout=${files
        .map((_, i) => `${(i % columns) * tileWidth}_${Math.floor(i / columns) * tileHeight}`)
        .join("|")}:fill=black`,
      sheet,
    ]);
  }
  console.log(files.length > 1 ? `sheet: ${sheet}` : files[0]);
  process.exit(0);
}

console.log(usage);
process.exit(1);
