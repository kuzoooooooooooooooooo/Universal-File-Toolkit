export interface OptionField {
  key: string;
  label: string;
  type: "range" | "number" | "select" | "text";
  min?: number;
  max?: number;
  step?: number;
  default: number | string;
  options?: { value: string; label: string }[];
}

const quality: OptionField = { key: "quality", label: "Quality", type: "range", min: 0.1, max: 1, step: 0.05, default: 0.8 };
const bitrate = (def: string, vals: string[]): OptionField => ({
  key: "bitrate", label: "Bitrate", type: "select", default: def,
  options: vals.map((v) => ({ value: v, label: v })),
});

export const SETTINGS: Record<string, OptionField[]> = {
  "png-to-jpg": [quality],
  "jpg-to-png": [],
  "png-to-webp": [quality],
  "jpg-to-webp": [quality],
  "webp-to-png": [],
  "image-compressor": [
    { key: "format", label: "Output format", type: "select", default: "webp", options: [{ value: "webp", label: "WebP" }, { value: "jpg", label: "JPG" }, { value: "png", label: "PNG" }] },
    quality,
  ],
  "image-resizer": [
    { key: "width", label: "Width px (0 = auto)", type: "number", default: 0 },
    { key: "height", label: "Height px (0 = auto)", type: "number", default: 0 },
  ],
  "split-pdf": [{ key: "ranges", label: "Page ranges (e.g. 1-3,5)", type: "text", default: "1" }],
  "wav-to-mp3": [bitrate("192k", ["128k", "192k", "256k", "320k"])],
  "mp3-to-ogg": [bitrate("128k", ["96k", "128k", "192k"])],
  "audio-compressor": [
    { key: "format", label: "Output format", type: "select", default: "mp3", options: [{ value: "mp3", label: "MP3" }, { value: "ogg", label: "OGG" }] },
    bitrate("96k", ["64k", "96k", "128k"]),
  ],
  "audio-trimmer": [
    { key: "start", label: "Start (seconds)", type: "number", default: 0 },
    { key: "end", label: "End (seconds, 0 = to end)", type: "number", default: 0 },
  ],
  "video-to-mp3": [bitrate("192k", ["128k", "192k", "256k", "320k"])],
  "video-compressor": [{ key: "crf", label: "CRF (higher = smaller file)", type: "select", default: "28", options: [{ value: "23", label: "23 (better quality)" }, { value: "28", label: "28 (balanced)" }, { value: "32", label: "32 (smaller)" }] }],
  "video-resizer": [{ key: "width", label: "Target width px", type: "number", default: 1280 }],
  "video-trimmer": [
    { key: "start", label: "Start (seconds)", type: "number", default: 0 },
    { key: "end", label: "End (seconds, 0 = to end)", type: "number", default: 0 },
  ],
  "video-thumbnails": [{ key: "interval", label: "Frame every N seconds", type: "number", default: 5 }],
};
