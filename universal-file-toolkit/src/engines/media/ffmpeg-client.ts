import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let instance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export function getFFmpeg(): Promise<FFmpeg> {
  if (instance) return Promise.resolve(instance);
  if (!loadPromise) {
    loadPromise = (async () => {
      const ff = new FFmpeg();
      const coreURL = await toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript");
      const wasmURL = await toBlobURL("/ffmpeg/ffmpeg-core.wasm", "application/wasm");
      await ff.load({ coreURL, wasmURL });
      instance = ff;
      return ff;
    })();
    loadPromise.catch(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

export function terminateFFmpeg(): void {
  instance?.terminate();
  instance = null;
  loadPromise = null;
}
