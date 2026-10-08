#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "./render.mjs";

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    const { size, mtimeMs } = fs.statSync(p);
    return [{ path: p, size, mtime: mtimeMs }];
  });
};

const mb = (bytes) => Number((bytes / 1048576).toFixed(2));

const kindOf = ({ rel }) => {
  if (rel.startsWith(`sheets${path.sep}`)) return "sheet";
  if (/-draft-/.test(rel)) return "draft";
  if (/-final-/.test(rel)) return "final";
  return "other";
};

/** Parses versions.md lines like "v3 · passed gate · out/acme-16x9-final-….mp4". */
const readVersions = (studio) => {
  const file = path.join(studio, "versions.md");
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter((line) => /^v\d+\b/.test(line))
    .map((line) => ({
      version: line.match(/^v(\d+)/)[0],
      passed: /passed gate/i.test(line),
      file: line.match(/(out\/\S+?\.mp4)/)?.[1] ?? null,
      line,
    }));
};

function main() {
  const args = parseArgs(process.argv.slice(2));
  const studio = path.resolve(args.studio ?? ".");
  const outDir = path.join(studio, "out");
  const files = walk(outDir).map((f) => ({ ...f, rel: path.relative(outDir, f.path) }));
  const byKind = {};
  for (const f of files) {
    const k = kindOf(f);
    byKind[k] = byKind[k] ?? { count: 0, bytes: 0 };
    byKind[k].count++;
    byKind[k].bytes += f.size;
  }
  const versions = readVersions(studio);
  const outMB = mb(files.reduce((s, f) => s + f.size, 0));
  console.log(`out/ ${outMB} MB`);
  for (const [k, v] of Object.entries(byKind)) console.log(`  ${k.padEnd(6)} ${String(v.count).padStart(4)} files  ${mb(v.bytes)} MB`);
  console.log(versions.length ? "versions.md:" : "versions.md: no entries");
  for (const v of versions) console.log(`  ${v.line}`);

  const cleaned = [];
  let cutoff = null;
  if (args.clean) {
    const gate = [...versions].reverse().find((v) => v.passed && v.file && fs.existsSync(path.join(studio, v.file)));
    if (!gate) console.log("--clean: no gate-passed version with an existing file in versions.md; nothing deleted");
    else {
      cutoff = fs.statSync(path.join(studio, gate.file)).mtimeMs;
      const keep = new Set(versions.filter((v) => v.file).map((v) => path.join(studio, v.file)));
      const sheetDirs = new Set();
      for (const f of files) {
        const kind = kindOf(f);
        if (!["draft", "sheet"].includes(kind) || f.mtime >= cutoff || keep.has(f.path)) continue;
        fs.rmSync(f.path, { force: true });
        cleaned.push({ path: f.rel, sizeMB: mb(f.size) });
        if (kind === "sheet") sheetDirs.add(path.dirname(f.path));
      }
      for (const d of sheetDirs) if (d !== path.join(outDir, "sheets") && fs.existsSync(d) && !fs.readdirSync(d).length) fs.rmdirSync(d);
      console.log(`--clean: removed ${cleaned.length} drafts/sheet files older than ${gate.version} (${gate.file})`);
    }
  }
  console.log(
    JSON.stringify({
      outMB,
      byKind: Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, { count: v.count, MB: mb(v.bytes) }])),
      versions: versions.map(({ version, passed, file }) => ({ version, passed, file })),
      cleaned: cleaned.length,
      freedMB: mb(cleaned.reduce((s, c) => s + c.sizeMB * 1048576, 0)),
    }),
  );
}

main();
