#!/usr/bin/env node
// Finds the product's brand colour candidates from its real assets and site, so the film's accent is the brand's, not a default.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { lookup as dnsLookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP } from "node:net";
import { parseArgs } from "./render.mjs";

const IMAGE = /\.(png|jpe?g|webp|svg)$/i;

const toHex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const fromHex = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const hsl = ([r, g, b]) => {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s, l };
};
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = ({ a, b }) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return Math.round(((x + 0.05) / (y + 0.05)) * 10) / 10;
};
const branded = (rgb) => {
  const { s, l } = hsl(rgb);
  return s > 0.3 && l > 0.18 && l < 0.88;
};

const fromImages = async ({ files, sharp }) => {
  const bins = new Map();
  let total = 0;
  for (const file of files) {
    const { data, info } = await sharp(file).resize(96, 96, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i + 3] < 200) continue;
      const rgb = [data[i], data[i + 1], data[i + 2]];
      if (!branded(rgb)) continue;
      const { h, l } = hsl(rgb);
      const key = `${Math.round(h / 12)}:${Math.round(l * 4)}`;
      const bin = bins.get(key) ?? { sum: [0, 0, 0], n: 0, files: new Set() };
      rgb.forEach((v, k) => (bin.sum[k] += v));
      bin.n++;
      bin.files.add(path.basename(file));
      bins.set(key, bin);
      total++;
    }
  }
  return [...bins.values()].map((bin) => ({
    rgb: bin.sum.map((v) => v / bin.n),
    weight: bin.n / Math.max(1, total),
    source: `images: ${[...bin.files].slice(0, 3).join(", ")}`,
  }));
};

const BLOCKED = new BlockList();
for (const [net, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]]) BLOCKED.addSubnet(net, bits, "ipv4");
for (const [net, bits] of [["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64], ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]]) BLOCKED.addSubnet(net, bits, "ipv6");

const publicAddress = ({ address, family }) => !BLOCKED.check(address, family === 6 || family === "IPv6" ? "ipv6" : "ipv4");

/** dns lookup that only ever hands the socket a public address, so the checked IP is the one connected to (no rebinding window). */
const safeLookup = (hostname, options, callback) => {
  dnsLookup(hostname, { all: true }, (err, addrs) => {
    if (err) return callback(err);
    const ok = addrs.filter(publicAddress);
    if (!ok.length || ok.length !== addrs.length) return callback(new Error(`refusing private or local address: ${hostname}`));
    if (options && options.all) return callback(null, ok);
    callback(null, ok[0].address, ok[0].family);
  });
};

/** Fetches a public http(s) page only: every connection and redirect goes through safeLookup, 3 MB cap, 15 s timeout. */
const safeGet = ({ url, hops }) =>
  new Promise((resolve, reject) => {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return reject(new Error(`only http(s) URLs: ${url}`));
    const bare = u.hostname.replace(/^\[|\]$/g, "");
    if (isIP(bare) && !publicAddress({ address: bare, family: isIP(bare) })) {
      return reject(new Error(`refusing private or local address: ${u.hostname}`));
    }
    const req = (u.protocol === "https:" ? https : http).get(u, { lookup: safeLookup, timeout: 15000, headers: { "user-agent": "Mozilla/5.0 launch-film" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (hops <= 0) return reject(new Error("too many redirects"));
        return resolve(safeGet({ url: new URL(res.headers.location, u).href, hops: hops - 1 }));
      }
      const chunks = [];
      let size = 0;
      res.on("data", (c) => {
        size += c.length;
        if (size > 3 * 1024 * 1024) return req.destroy(new Error(`too large: ${u.href}`));
        chunks.push(c);
      });
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error(`timeout: ${u.href}`)));
    req.on("error", reject);
  });

const fromSite = async ({ url }) => {
  const found = new Map();
  const add = ({ hex, weight, source }) => {
    const rgb = fromHex(hex);
    if (!branded(rgb)) return;
    const key = toHex(rgb);
    const cur = found.get(key) ?? { rgb, weight: 0, source };
    cur.weight += weight;
    found.set(key, cur);
  };
  const get = (u) => safeGet({ url: u, hops: 3 });
  const html = await get(url);
  for (const m of html.matchAll(/<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-f]{3,6})["']/gi)) add({ hex: m[1], weight: 50, source: "meta theme-color" });
  const sheets = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)].map((m) => new URL(m[1], url).href).slice(0, 4);
  const css = [html, ...(await Promise.all(sheets.map((s) => get(s).catch(() => ""))))].join("\n");
  for (const m of css.matchAll(/--[\w-]*(?:brand|primary|accent)[\w-]*\s*:\s*(#[0-9a-f]{3,6})\b/gi)) add({ hex: m[1], weight: 20, source: "css brand/primary/accent variable" });
  for (const m of css.matchAll(/#[0-9a-f]{6}\b/gi)) add({ hex: m[0], weight: 0.2, source: "css frequency" });
  const total = [...found.values()].reduce((n, c) => n + c.weight, 0) || 1;
  return [...found.values()].map((c) => ({ ...c, weight: c.weight / total }));
};

const merge = (cands) => {
  const out = [];
  for (const c of cands.sort((a, b) => b.weight - a.weight)) {
    const near = out.find((o) => Math.hypot(...o.rgb.map((v, k) => v - c.rgb[k])) < 38);
    if (near) {
      near.weight += c.weight;
      if (!near.source.includes(c.source.split(":")[0])) near.source += ` + ${c.source}`;
    } else out.push({ ...c });
  }
  return out;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.studio) throw new Error("usage: brand-colors.mjs --studio DIR [--images a.png,b.png] [--url https://site]");
  const studio = path.resolve(args.studio);
  const sharp = createRequire(path.join(studio, "package.json"))("sharp");
  const files = args.images
    ? String(args.images).split(",").map((f) => path.resolve(studio, f))
    : fs.readdirSync(path.join(studio, "assets")).filter((f) => IMAGE.test(f)).map((f) => path.join(studio, "assets", f));
  const cands = [
    ...(files.length ? await fromImages({ files: files.filter((f) => !f.endsWith(".svg")), sharp }) : []),
    ...(args.url ? (await fromSite({ url: String(args.url) }).catch((e) => (console.error(`site: ${e.message}`), []))) : []),
  ];
  const merged = merge(cands);
  const sum = merged.reduce((n, c) => n + c.weight, 0) || 1;
  const ranked = merged
    .map((c) => ({ ...c, weight: c.weight / sum }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((c) => {
      const { h, s, l } = hsl(c.rgb);
      return {
        hex: toHex(c.rgb),
        share: Math.round(c.weight * 100),
        hue: Math.round(h),
        saturation: Math.round(s * 100),
        lightness: Math.round(l * 100),
        contrastOnVoid: contrast({ a: c.rgb, b: [5, 5, 6] }),
        contrastOnPaper: contrast({ a: c.rgb, b: [239, 237, 232] }),
        source: c.source,
      };
    });
  for (const c of ranked) console.log(`${c.hex}  ${String(c.share).padStart(3)}%  on void ${c.contrastOnVoid}:1  on paper ${c.contrastOnPaper}:1  ${c.source}`);
  if (!ranked.length) console.log("no saturated brand colour found: ask the user for the hex");
  console.log(JSON.stringify({ candidates: ranked }));
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
