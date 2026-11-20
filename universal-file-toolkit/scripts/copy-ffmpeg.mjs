import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
const coreSrc = "node_modules/@ffmpeg/core/dist/esm";
const coreDest = "public/ffmpeg";
mkdirSync(coreDest, { recursive: true });
for (const f of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  cpSync(`${coreSrc}/${f}`, `${coreDest}/${f}`);
}
const esmSrc = "node_modules/@ffmpeg/ffmpeg/dist/esm";
const vendorDest = "src/vendor/ffmpeg";
mkdirSync(vendorDest, { recursive: true });
for (const f of readdirSync(esmSrc)) {
  if (f.endsWith(".js")) cpSync(`${esmSrc}/${f}`, `${vendorDest}/${f}`);
}
const classesPath = `${vendorDest}/classes.js`;
let c = readFileSync(classesPath, "utf8");
const cBefore = c;
c = c.replace(/classWorkerURL\s*\?\s*new Worker\(new URL\(classWorkerURL, import\.meta\.url\),\s*\{[^}]*\}\)\s*:/, "");
if (c === cBefore) {
  console.error("PATCH FAILED: dynamic worker branch not found in classes.js");
  process.exit(1);
}
writeFileSync(classesPath, c);
const workerPath = `${vendorDest}/worker.js`;
let w = readFileSync(workerPath, "utf8");
const wBefore = w;
w = w.replace("/* @vite-ignore */", "/* turbopackIgnore: true */");
if (w === wBefore) {
  console.error("PATCH FAILED: vite-ignore comment not found in worker.js");
  process.exit(1);
}
writeFileSync(workerPath, w);
console.log("ffmpeg esm core copied; vendor classes+worker patched");
