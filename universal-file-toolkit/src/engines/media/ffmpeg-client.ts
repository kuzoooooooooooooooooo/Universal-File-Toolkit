import { FFmpeg } from "@/vendor/ffmpeg/index.js";
import { FFMPEG_BASE } from "@/config/ffmpeg-assets";

export interface EngineState {
  phase: "idle" | "downloading" | "initializing" | "ready" | "error";
  received: number;
  total: number;
}

let state: EngineState = { phase: "idle", received: 0, total: 0 };
const listeners = new Set<(s: EngineState) => void>();
function set(patch: Partial<EngineState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}
export function getEngineState(): EngineState { return state; }
export function subscribeEngine(cb: (s: EngineState) => void): () => void {
  listeners.add(cb);
  cb(state);
  return () => { listeners.delete(cb); };
}

let instance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function fetchBlobURL(url: string, mime: string, onBytes?: (r: number, t: number) => void): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body) return URL.createObjectURL(await res.blob());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onBytes?.(received, total);
  }
  return URL.createObjectURL(new Blob(chunks as unknown as BlobPart[], { type: mime }));
}

export function getFFmpeg(): Promise<FFmpeg> {
  if (instance) return Promise.resolve(instance);
  if (!loadPromise) {
    loadPromise = (async () => {
      const ff = new FFmpeg();
      set({ phase: "downloading", received: 0, total: 0 });
      const coreURL = await fetchBlobURL(`${FFMPEG_BASE}/ffmpeg-core.js`, "text/javascript");
      const wasmURL = await fetchBlobURL(`${FFMPEG_BASE}/ffmpeg-core.wasm`, "application/wasm", (r, t) => set({ received: r, total: t }));
      set({ phase: "initializing" });
      await ff.load({ coreURL, wasmURL });
      instance = ff;
      set({ phase: "ready" });
      return ff;
    })();
    loadPromise.catch(() => { loadPromise = null; set({ phase: "error" }); });
  }
  return loadPromise;
}

export function terminateFFmpeg(): void {
  instance?.terminate();
  instance = null;
  loadPromise = null;
  set({ phase: "idle", received: 0, total: 0 });
}
