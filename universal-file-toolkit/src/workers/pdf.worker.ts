import { PDFDocument } from "pdf-lib";
import { zipSync } from "fflate";
import { parseRanges } from "@/lib/utils/ranges";
import { baseName, sanitizeFilename } from "@/lib/utils/file-helpers";

interface Req {
  id: number;
  op: "merge" | "split" | "images-to-pdf";
  buffers: ArrayBuffer[];
  names: string[];
  ranges?: string;
}

const wself = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

const post = (id: number, msg: unknown, transfer?: Transferable[]) =>
  wself.postMessage({ id, ...msg }, transfer);

const toBuffer = (u8: Uint8Array): ArrayBuffer => u8.slice().buffer as ArrayBuffer;

async function merge(req: Req) {
  const out = await PDFDocument.create();
  for (let i = 0; i < req.buffers.length; i++) {
    const src = await PDFDocument.load(req.buffers[i], { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    post(req.id, {
      type: "progress",
      percent: Math.round(((i + 1) / req.buffers.length) * 80),
      stage: `Copying ${req.names[i]}`,
    });
  }
  const bytes = await out.save();
  const name = `${sanitizeFilename(baseName(req.names[0]))}-merged.pdf`;
  post(req.id, {
    type: "done",
    buffer: toBuffer(bytes),
    mime: "application/pdf",
    filename: name,
  }, [toBuffer(bytes).slice(0)]);
}

async function split(req: Req) {
  const src = await PDFDocument.load(req.buffers[0], { ignoreEncryption: true });
  const total = src.getPageCount();
  const groups = parseRanges(req.ranges ?? "1", total);
  post(req.id, { type: "progress", percent: 20, stage: `Document has ${total} pages` });

  const parts: { name: string; bytes: Uint8Array }[] = [];
  for (let g = 0; g < groups.length; g++) {
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(
      src,
      groups[g].map((n) => n - 1)
    );
    pages.forEach((p) => doc.addPage(p));
    const bytes = await doc.save();
    const label =
      groups[g].length === 1
        ? `p${groups[g][0]}`
        : `p${groups[g][0]}-${groups[g][groups[g].length - 1]}`;
    parts.push({ name: `${label}.pdf`, bytes });
    post(req.id, {
      type: "progress",
      percent: 20 + Math.round(((g + 1) / groups.length) * 60),
      stage: `Building ${label}.pdf`,
    });
  }

  if (parts.length === 1) {
    const name = `${sanitizeFilename(baseName(req.names[0]))}-${parts[0].name}`;
    const buf = toBuffer(parts[0].bytes);
    post(req.id, { type: "done", buffer: buf, mime: "application/pdf", filename: name }, [buf]);
  } else {
    const zip = zipSync(
      Object.fromEntries(parts.map((p) => [p.name, p.bytes]))
    );
    const buf = toBuffer(zip);
    const name = `${sanitizeFilename(baseName(req.names[0]))}-split.zip`;
    post(req.id, { type: "done", buffer: buf, mime: "application/zip", filename: name }, [buf]);
  }
}

async function imagesToPdf(req: Req) {
  const out = await PDFDocument.create();
  for (let i = 0; i < req.buffers.length; i++) {
    const bytes = new Uint8Array(req.buffers[i]);
    const name = req.names[i].toLowerCase();
    let img;
    if (name.endsWith(".png")) {
      img = await out.embedPng(bytes);
    } else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
      img = await out.embedJpg(bytes);
    } else {
      const bitmap = await createImageBitmap(new Blob([bytes]));
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const png = await canvas.convertToBlob({ type: "image/png" });
      img = await out.embedPng(new Uint8Array(await png.arrayBuffer()));
    }
    const w = img.width * 0.75;
    const h = img.height * 0.75;
    const page = out.addPage([w, h]);
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });
    post(req.id, {
      type: "progress",
      percent: Math.round(((i + 1) / req.buffers.length) * 80),
      stage: `Adding ${req.names[i]}`,
    });
  }
  const saved = await out.save();
  const buf = toBuffer(saved);
  const name = `${sanitizeFilename(baseName(req.names[0]))}-combined.pdf`;
  post(req.id, { type: "done", buffer: buf, mime: "application/pdf", filename: name }, [buf]);
}

wself.onmessage = async (e: MessageEvent) => {
  const req = e.data as Req;
  try {
    if (req.op === "merge") await merge(req);
    else if (req.op === "split") await split(req);
    else await imagesToPdf(req);
  } catch (err) {
    post(req.id, {
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
