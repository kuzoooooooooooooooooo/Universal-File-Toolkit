import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
const ver = JSON.parse(readFileSync("node_modules/@ffmpeg/core/package.json", "utf8")).version;
const coreDest = `public/ffmpeg/v${ver}`;
mkdirSync(coreDest, { recursive: true });
for (const f of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) cpSync(`node_modules/@ffmpeg/core/dist/esm/${f}`, `${coreDest}/${f}`);
writeFileSync("src/config/ffmpeg-assets.ts", `export const FFMPEG_BASE = "/ffmpeg/v${ver}";\n`);
const vendorDest = "src/vendor/ffmpeg";
mkdirSync(vendorDest, { recursive: true });
for (const f of readdirSync("node_modules/@ffmpeg/ffmpeg/dist/esm")) if (f.endsWith(".js")) cpSync(`node_modules/@ffmpeg/ffmpeg/dist/esm/${f}`, `${vendorDest}/${f}`);
const cp = `${vendorDest}/classes.js`;
let c = readFileSync(cp, "utf8");
const cb = c;
c = c.replace(/classWorkerURL\s*\?\s*new Worker\(new URL\(classWorkerURL, import\.meta\.url\),\s*\{[^}]*\}\)\s*:/, "");
if (c === cb) { console.error("PATCH FAILED classes.js"); process.exit(1); }
writeFileSync(cp, c);
const wp = `${vendorDest}/worker.js`;
let w = readFileSync(wp, "utf8");
const wb = w;
w = w.replace("/* @vite-ignore */", "/* turbopackIgnore: true */");
if (w === wb) { console.error("PATCH FAILED worker.js"); process.exit(1); }
writeFileSync(wp, w);
console.log(`ffmpeg core v${ver} copied; vendor patched; assets config generated`);
