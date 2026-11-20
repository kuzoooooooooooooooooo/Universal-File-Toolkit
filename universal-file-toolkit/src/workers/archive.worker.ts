import { zipSync, gzipSync, Unzip } from "fflate";
import { baseName, sanitizeFilename } from "@/lib/utils/file-helpers";
import { EXT_MIME } from "@/lib/file-detection/magic-bytes";

interface Req {
  id: number;
  op: "zip" | "gz" | "list" | "extract";
  buffers: ArrayBuffer[];
  names: string[];
  selected?: string[];
}

interface Entry {
  name: string;
  size: number;
  compressedSize: number;
}

const wself = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

const post = (id: number, msg: unknown, transfer?: Transferable[]) =>
  wself.postMessage({ id, ...msg }, transfer);

const toBuffer = (u8: Uint8Array): ArrayBuffer => u8.slice().buffer as ArrayBuffer;

const mimeFor = (name: string): string => {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return (m && EXT_MIME[m[1].toLowerCase()]) || "application/octet-stream";
};

function listEntries(data: Uint8Array): Entry[] {
  const entries: Entry[] = [];
  const unzip = new Unzip((file) => {
    entries.push({
      name: file.name,
      size: file.size,
      compressedSize: file.compressedSize,
    });
  });
  unzip.push(data, true);
  return entries;
}

function extractSelected(
  data: Uint8Array,
  selected: string[]
): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  const chunks = new Map<string, Uint8Array[]>();
  const unzip = new Unzip((file) => {
    if (!selected.includes(file.name)) return;
    chunks.set(file.name, []);
    file.ondata = (err, dat, final) => {
      if (err) throw err;
      chunks.get(file.name)!.push(dat);
      if (final) {
        const arr = chunks.get(file.name)!;
        const total = arr.reduce((s, c) => s + c.length, 0);
        const merged = new Uint8Array(total);
        let off = 0;
        for (const c of arr) {
          merged.set(c, off);
          off += c.length;
        }
        out.set(file.name, merged);
      }
    };
    file.start();
  });
  unzip.push(data, true);
  return out;
}

wself.onmessage = (e: MessageEvent) => {
  const req = e.data as Req;
  try {
    if (req.op === "list") {
      const entries = listEntries(new Uint8Array(req.buffers[0]));
      post(req.id, { type: "entries", entries });
      return;
    }

    if (req.op === "zip") {
      post(req.id, { type: "progress", percent: 30, stage: "Compressing (large files may take a while)" });
      const files: Record<string, Uint8Array> = {};
      req.names.forEach((name, i) => {
        files[sanitizeFilename(name)] = new Uint8Array(req.buffers[i]);
      });
      const zip = zipSync(files, { level: 6 });
      const base = sanitizeFilename(baseName(req.names[0]));
      const filename = req.names.length === 1 ? `${base}.zip` : `${base}-archive.zip`;
      const buf = toBuffer(zip);
      post(req.id, { type: "done", buffer: buf, mime: "application/zip", filename }, [buf]);
      return;
    }

    if (req.op === "gz") {
      post(req.id, { type: "progress", percent: 30, stage: "Compressing (large files may take a while)" });
      const gz = gzipSync(new Uint8Array(req.buffers[0]), { level: 6 });
      const filename = `${sanitizeFilename(baseName(req.names[0]))}.gz`;
      const buf = toBuffer(gz);
      post(req.id, { type: "done", buffer: buf, mime: "application/gzip", filename }, [buf]);
      return;
    }

    if (req.op === "extract") {
      post(req.id, { type: "progress", percent: 30, stage: "Extracting" });
      const selected = req.selected ?? [];
      const map = extractSelected(new Uint8Array(req.buffers[0]), selected);
      if (selected.length === 1) {
        const bytes = map.get(selected[0]);
        if (!bytes) throw new Error("Entry not found in archive");
        const safe = sanitizeFilename(selected[0].split("/").pop() ?? "file");
        const buf = toBuffer(bytes);
        post(req.id, { type: "done", buffer: buf, mime: mimeFor(safe), filename: safe }, [buf]);
      } else {
        const files: Record<string, Uint8Array> = {};
        for (const name of selected) {
          const bytes = map.get(name);
          if (bytes) files[sanitizeFilename(name.split("/").pop() ?? "file")] = bytes;
        }
        const zip = zipSync(files, { level: 0 });
        const buf = toBuffer(zip);
        const filename = `${sanitizeFilename(baseName(req.names[0]))}-extracted.zip`;
        post(req.id, { type: "done", buffer: buf, mime: "application/zip", filename: filename }, [buf]);
      }
    }
  } catch (err) {
    post(req.id, {
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
