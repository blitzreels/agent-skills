#!/usr/bin/env node
// Optional generated media for a film (BlitzReels CLI or ElevenLabs), recorded in assets/gen/manifest.json.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "./render.mjs";

const KINDS = {
  blitzreels: ["image", "video", "music", "sound", "voice"],
  elevenlabs: ["music", "sound", "voice"],
};
const PRICING_KIND = { image: "image", video: "video", music: "music", sound: "sound", voice: "voiceover" };
const EXT = { image: "png", video: "mp4", music: "mp3", sound: "mp3", voice: "mp3" };

const run = ({ cmd, args }) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")} failed: ${(r.stderr || r.stdout).trim().slice(-600)}`);
  return r.stdout;
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const flag = ({ name, value }) => (value ? [name, String(value)] : []);

const filmSeconds = ({ grid }) => (grid.bars * 4 * 60) / grid.bpm;
const snapUp = ({ value, allowed }) => allowed.find((a) => a >= value - 1e-6) ?? allowed[allowed.length - 1];
const BLITZ_DURATIONS = { music: [15, 30, 45, 60, 90, 120], sound: [1, 2, 3, 5, 10, 20, 30] };

/** music_v2 composition plan on the film's grid: sections split at the gates, each chunk ≥ 3 s. */
const planFromGrid = ({ grid, prompt }) => {
  const beat = 60 / grid.bpm;
  const total = grid.bars * 4;
  const cuts = [0, ...grid.gates.map((g) => g.beat).filter((b) => b > 0 && b < total), total];
  const labels = ["[Intro]", "[Build]", "[Drop]", "[Outro]", "[Tag]"];
  const chunks = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const ms = Math.round((cuts[i + 1] - cuts[i]) * beat * 1000);
    const last = chunks[chunks.length - 1];
    if (ms < 3000 && last) {
      last.duration_ms += ms;
      continue;
    }
    chunks.push({
      text: `${labels[Math.min(i, labels.length - 1)]}\n{instrumental}`,
      duration_ms: ms,
      positive_styles: [prompt, `${grid.bpm} BPM`, grid.key, "instrumental", "tight", "modern"].filter(Boolean),
      negative_styles: ["vocals", "lyrics", "fade in", "long reverb tail"],
      context_adherence: "high",
    });
  }
  return { chunks };
};

const eleven = async ({ endpoint, body, out }) => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set (put it in the environment or the studio's .env, never in a prompt)");
  const res = await fetch(`https://api.elevenlabs.io${endpoint}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${endpoint} ${res.status}: ${(await res.text()).slice(0, 600)}`);
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
};

const pricing = ({ provider, kind }) => {
  if (provider === "elevenlabs") return "ElevenLabs bills per character (voice) or per generation (music, sound) on the user's plan; check elevenlabs.io/pricing";
  return run({ cmd: "blitzreels", args: ["credits", "pricing", "--kind", PRICING_KIND[kind], "--json"] }).trim();
};

const extractFrames = ({ file, dir, fps, width }) => {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  run({ cmd: "ffmpeg", args: ["-v", "error", "-y", "-i", file, "-vf", `fps=${fps},scale=${width}:-2`, "-q:v", "3", path.join(dir, "%05d.jpg")] });
  return fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
};

const defaultSeconds = ({ kind, grid }) => {
  if (kind === "music") return filmSeconds({ grid });
  if (kind === "sound") return 2;
  return 5;
};

const generate = async ({ args, studio, grid, config, kind, provider, out }) => {
  const seconds = Number(args.duration ?? defaultSeconds({ kind, grid }));
  const prompt = String(args.prompt ?? "");
  if (provider === "blitzreels") {
    const base = ["--output", out, "--json"];
    const aspect = String(args.aspect ?? "16:9");
    const resolution = flag({ name: "--resolution", value: args.resolution });
    const cli = {
      image: ["generate", "images", "--prompt", prompt, "--aspect-ratio", aspect, ...resolution],
      video: ["generate", "videos", "--prompt", prompt, "--duration", String(seconds), "--aspect-ratio", aspect, ...resolution, ...flag({ name: "--source-image", value: args["source-image"] })],
      music: ["generate", "music", "--prompt", `${prompt}. ${grid.bpm} BPM, ${grid.key}, instrumental, energy builds to a drop at the middle, clean ending`.slice(0, 500), "--duration", String(snapUp({ value: seconds, allowed: BLITZ_DURATIONS.music }))],
      sound: ["generate", "sounds", "--prompt", prompt, "--duration", String(snapUp({ value: seconds, allowed: BLITZ_DURATIONS.sound })), "--prompt-influence", String(args.influence ?? 0.6)],
      voice: ["generate", "voiceovers", "--text", prompt, ...flag({ name: "--voice-id", value: args["voice-id"] })],
    }[kind];
    if (args.model) cli.push("--model", String(args.model));
    return { model: args.model ?? "blitzreels default", raw: run({ cmd: "blitzreels", args: [...cli, ...base] }).trim().slice(-400) };
  }
  if (kind === "music") {
    const planPath = args.plan ? path.resolve(studio, String(args.plan)) : "";
    if (planPath && path.relative(studio, planPath).startsWith("..")) throw new Error("--plan must be a file inside the studio");
    const plan = planPath ? readJson(planPath) : planFromGrid({ grid, prompt });
    fs.writeFileSync(out.replace(/\.mp3$/, ".plan.json"), JSON.stringify(plan, null, 2));
    await eleven({ endpoint: "/v1/music?output_format=mp3_48000_320", body: { composition_plan: plan, model_id: "music_v2" }, out });
    return { model: "music_v2", plan: true };
  }
  if (kind === "sound") {
    await eleven({ endpoint: "/v1/sound-generation?output_format=mp3_44100_192", body: { text: prompt, duration_seconds: seconds, prompt_influence: Number(args.influence ?? 0.6), model_id: "eleven_text_to_sound_v2", loop: Boolean(args.loop) }, out });
    return { model: "eleven_text_to_sound_v2" };
  }
  const voice = String(args["voice-id"] ?? config.voiceId ?? "");
  if (!voice) throw new Error("--voice-id is required for ElevenLabs voice (browse elevenlabs.io/app/voice-library, ask the user)");
  const model = String(args.model ?? "eleven_v4");
  await eleven({ endpoint: `/v1/text-to-speech/${voice}?output_format=mp3_44100_192`, body: { text: prompt, model_id: model }, out });
  return { model };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const usage = "usage: generate.mjs --studio DIR --provider blitzreels|elevenlabs --kind image|video|music|sound|voice --name slug --prompt TEXT [--duration s] [--aspect 16:9] [--model ID] [--voice-id ID] [--plan plan.json] [--source-image FILE] [--yes]";
  if (!args.studio || !args.provider || !args.kind || !args.name) throw new Error(usage);
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(String(args.name))) throw new Error(`--name must be a slug (lowercase letters, digits, dashes): "${args.name}"`);
  const provider = String(args.provider);
  const kind = String(args.kind);
  if (!KINDS[provider]?.includes(kind)) throw new Error(`${provider} can't generate ${kind} here (supported: ${JSON.stringify(KINDS)})`);
  const studio = path.resolve(String(args.studio));
  const grid = readJson(path.join(studio, "grid.json"));
  const config = readJson(path.join(studio, "film.config.json"));

  if (!args.yes) {
    console.log(JSON.stringify({ needsConfirmation: true, provider, kind, name: args.name, prompt: args.prompt ?? "", pricing: pricing({ provider, kind }), next: "show the cost to the user (AskUserQuestion), then rerun with --yes" }));
    return;
  }

  const genDir = path.join(studio, "assets", "gen");
  fs.mkdirSync(genDir, { recursive: true });
  const out = path.join(genDir, `${args.name}.${EXT[kind]}`);
  const result = await generate({ args, studio, grid, config, kind, provider, out });
  const entry = { name: String(args.name), kind, provider, prompt: String(args.prompt ?? ""), file: path.relative(studio, out), ...result };

  if (kind === "video") {
    const dir = path.join(genDir, `${args.name}-frames`);
    entry.frames = { dir: path.relative(path.join(studio, "src"), dir), count: extractFrames({ file: out, dir, fps: config.fps, width: Number(args.width ?? 1920) }), fps: config.fps };
  }
  if (kind === "music") {
    const analysis = run({ cmd: process.execPath, args: [path.join(path.dirname(new URL(import.meta.url).pathname), "track-analyze.mjs"), "--track", out] }).trim().split("\n").pop();
    entry.analysis = JSON.parse(analysis);
  }

  const manifestPath = path.join(genDir, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : [];
  fs.writeFileSync(manifestPath, JSON.stringify([...manifest.filter((m) => m.name !== entry.name), entry], null, 2));
  console.log(JSON.stringify(entry));
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
