import { cpSync, mkdirSync } from "node:fs";
const src = "node_modules/@ffmpeg/core/dist/umd";
const dest = "public/ffmpeg";
mkdirSync(dest, { recursive: true });
for (const f of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  cpSync(`${src}/${f}`, `${dest}/${f}`);
}
console.log("ffmpeg core copied to public/ffmpeg");
