import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [kind] = process.argv.slice(2);

if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set. The edit renders without music and sound effects.");
  process.exit(1);
}

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const toBuffer = async (stream) => Buffer.from(await new Response(stream).arrayBuffer());

const kit = {
  whoosh: [0.6, "fast airy whoosh transition, clean, short"],
  swish: [0.5, "soft quick swish, subtle UI motion"],
  pop: [0.5, "short soft bubble pop, playful UI"],
  ding: [1.2, "bright gentle notification ding"],
  impact: [1.2, "deep soft cinematic impact hit, short tail"],
  whip: [0.5, "very fast whip pan swoosh"],
  riser: [1.8, "short tension riser building up, ends abruptly"],
  click: [0.5, "single crisp mouse click"],
  typing: [1.5, "fast typing on a quiet laptop keyboard, close mic, dry"],
};

if (kind === "sfx") {
  const dir = path.join(root, "public/sfx");
  mkdirSync(dir, { recursive: true });
  for (const [name, [seconds, text]] of Object.entries(kit)) {
    const out = path.join(dir, `${name}.mp3`);
    if (existsSync(out)) continue;
    const stream = await client.textToSoundEffects.convert({ text, durationSeconds: seconds, promptInfluence: 0.6 });
    await writeFile(out, await toBuffer(stream));
    console.log(`written ${out}`);
  }
} else if (kind === "music") {
  const plan = JSON.parse(await readFile(path.join(root, "src/edit/score.json"), "utf8"));
  const stream = await client.music.compose({
    modelId: "music_v1",
    compositionPlan: plan,
    respectSectionsDurations: true,
    outputFormat: "mp3_44100_192",
  });
  const out = path.join(root, "public/music.mp3");
  await writeFile(out, await toBuffer(stream));
  console.log(`written ${out}`);
} else {
  console.error("Usage: node scripts/audio.mjs music|sfx");
  process.exit(1);
}
