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

const quality: OptionField = {
  key: "quality",
  label: "Quality",
  type: "range",
  min: 0.1,
  max: 1,
  step: 0.05,
  default: 0.8,
};

export const SETTINGS: Record<string, OptionField[]> = {
  "png-to-jpg": [quality],
  "jpg-to-png": [],
  "png-to-webp": [quality],
  "jpg-to-webp": [quality],
  "webp-to-png": [],
  "image-compressor": [
    {
      key: "format",
      label: "Output format",
      type: "select",
      default: "webp",
      options: [
        { value: "webp", label: "WebP" },
        { value: "jpg", label: "JPG" },
        { value: "png", label: "PNG" },
      ],
    },
    quality,
  ],
  "image-resizer": [
    { key: "width", label: "Width px (0 = auto)", type: "number", default: 0 },
    { key: "height", label: "Height px (0 = auto)", type: "number", default: 0 },
  ],
  "split-pdf": [
    {
      key: "ranges",
      label: "Page ranges (e.g. 1-3,5)",
      type: "text",
      default: "1",
    },
  ],
};
