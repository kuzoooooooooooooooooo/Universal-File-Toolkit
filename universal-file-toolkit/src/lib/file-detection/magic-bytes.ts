export const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  zip: "application/zip",
  gz: "application/gzip",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
  ogg: "audio/ogg",
  flac: "audio/flac",
  webm: "video/webm",
  json: "application/json",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  html: "text/html",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const eq = (b: Uint8Array, offset: number, arr: number[]): boolean =>
  arr.every((v, i) => b[offset + i] === v);

interface Signature {
  ext: string;
  check: (b: Uint8Array) => boolean;
}

const SIGNATURES: Signature[] = [
  { ext: "png", check: (b) => eq(b, 0, [0x89, 0x50, 0x4e, 0x47]) },
  { ext: "jpg", check: (b) => eq(b, 0, [0xff, 0xd8, 0xff]) },
  { ext: "gif", check: (b) => eq(b, 0, [0x47, 0x49, 0x46, 0x38]) },
  { ext: "pdf", check: (b) => eq(b, 0, [0x25, 0x50, 0x44, 0x46]) },
  { ext: "zip", check: (b) => eq(b, 0, [0x50, 0x4b, 0x03, 0x04]) },
  { ext: "gz", check: (b) => eq(b, 0, [0x1f, 0x8b]) },
  { ext: "webp", check: (b) => eq(b, 0, [0x52, 0x49, 0x46, 0x46]) && eq(b, 8, [0x57, 0x45, 0x42, 0x50]) },
  { ext: "wav", check: (b) => eq(b, 0, [0x52, 0x49, 0x46, 0x46]) && eq(b, 8, [0x57, 0x41, 0x56, 0x45]) },
  { ext: "mp3", check: (b) => eq(b, 0, [0x49, 0x44, 0x33]) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) },
  { ext: "mp4", check: (b) => eq(b, 4, [0x66, 0x74, 0x79, 0x70]) },
  { ext: "ogg", check: (b) => eq(b, 0, [0x4f, 0x67, 0x67, 0x53]) },
  { ext: "flac", check: (b) => eq(b, 0, [0x66, 0x4c, 0x61, 0x43]) },
  { ext: "webm", check: (b) => eq(b, 0, [0x1a, 0x45, 0xdf, 0xa3]) },
];

export interface DetectedFormat {
  ext: string;
  mime: string;
}

async function refineZipContainer(file: File): Promise<string> {
  try {
    const { Unzip } = await import("fflate");
    const data = new Uint8Array(await file.arrayBuffer());
    const names: string[] = [];
    const unzip = new Unzip((fh) => {
      names.push(fh.name);
    });
    unzip.push(data, true);
    if (names.includes("word/document.xml")) return "docx";
    if (names.includes("xl/workbook.xml")) return "xlsx";
    return "zip";
  } catch {
    return "zip";
  }
}

export async function detectFormat(file: File): Promise<DetectedFormat | null> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  let ext: string | null = null;
  for (const sig of SIGNATURES) {
    if (sig.check(header)) {
      ext = sig.ext;
      break;
    }
  }
  if (ext === "zip") {
    ext = await refineZipContainer(file);
  }
  if (!ext) {
    const match = /\.([a-z0-9]+)$/i.exec(file.name);
    ext = match ? match[1].toLowerCase() : null;
  }
  if (!ext) return null;
  return { ext, mime: EXT_MIME[ext] ?? file.type ?? "application/octet-stream" };
}
