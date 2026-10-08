#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./render.mjs";

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(SKILL, "template");
const SKIP = new Set(["node_modules", "out", ".skill-path"]);

const copy = ({ from, to }) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    if (/\.(wav|f32)$/.test(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copy({ from: src, to: dst });
    else fs.copyFileSync(src, dst);
  }
};

const updateJson = ({ file, update }) => {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  update(data);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dir || !args.title || !args.slug) throw new Error("usage: new-studio.mjs --dir ./launch-film --title X --slug x [--accent #rrggbb] [--demo] [--force]");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(args.slug)) throw new Error(`--slug must be lowercase letters, digits and dashes: "${args.slug}"`);
  const dir = path.resolve(args.dir);
  if (fs.existsSync(dir) && fs.readdirSync(dir).length && !args.force) throw new Error(`${dir} exists and is not empty (pass --force to copy over it)`);

  copy({ from: TEMPLATE, to: dir });
  fs.writeFileSync(path.join(dir, ".skill-path"), SKILL);
  updateJson({
    file: path.join(dir, "film.config.json"),
    update: (config) => {
      if (args.accent && !/^#[0-9a-f]{6}$/i.test(args.accent)) throw new Error(`--accent must be #rrggbb: "${args.accent}"`);
      config.title = args.title;
      config.slug = args.slug;
      if (!args.demo) config.accent = args.accent ?? null;
    },
  });
  updateJson({ file: path.join(dir, "package.json"), update: (pkg) => (pkg.name = `${args.slug}-launch-film`) });
  fs.mkdirSync(path.join(dir, "out"), { recursive: true });

  console.log(`studio created at ${dir}; installing dependencies…`);
  const install = spawnSync("npm", ["install", "--silent", "--no-audit", "--no-fund"], { cwd: dir, stdio: "inherit" });
  if (install.status !== 0) throw new Error("npm install failed");

  console.log(`
next:
  cd ${path.relative(process.cwd(), dir) || "."}
  write brief.md, assets.md, beats.md (gate 1), then grid.json and src/film/scenes/*.js
  npm run draft -- --format 16x9        half-res check render
  npm run sheet -- --format 16x9 --mode beats
  npm run render -- --format 16x9       final, motion blur + post
  npm run render -- --format 9x16`);
  console.log(JSON.stringify({ studio: dir, title: args.title, slug: args.slug, skill: SKILL }));
};

try {
  main();
} catch (err) {
  console.error(err.message);
  console.log(JSON.stringify({ error: err.message }));
  process.exit(1);
}
