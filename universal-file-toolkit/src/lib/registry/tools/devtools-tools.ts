import { ToolDefinition } from "@/types/tool";
import { fileLimits } from "@/config/limits";

const TEXT_MAX = 5 * 1024 * 1024;

export const devtoolsTools: ToolDefinition[] = [
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate and minify JSON locally",
    category: "devtools",
    inputFormats: ["json", "txt"],
    outputFormats: ["json"],
    icon: "Code",
    keywords: ["json", "format", "validate", "beautify", "minify"],
    maxFileSize: TEXT_MAX,
    supported: true,
    ui: "text",
  },
  {
    id: "base64-encoder-decoder",
    name: "Base64 Encoder / Decoder",
    description: "Encode text to Base64 or decode Base64 back to text",
    category: "devtools",
    inputFormats: ["txt"],
    outputFormats: ["txt"],
    icon: "Code",
    keywords: ["base64", "encode", "decode"],
    maxFileSize: TEXT_MAX,
    supported: true,
    ui: "text",
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Compute SHA-1, SHA-256 and SHA-512 checksums of a file",
    category: "devtools",
    inputFormats: ["*"],
    outputFormats: ["txt"],
    icon: "Code",
    keywords: ["hash", "checksum", "sha256", "sha512", "integrity"],
    maxFileSize: fileLimits.defaultMaxSize,
    supported: true,
    ui: "hash",
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate v4 UUIDs locally, copy or download as list",
    category: "devtools",
    inputFormats: [],
    outputFormats: ["txt"],
    icon: "Code",
    keywords: ["uuid", "guid", "generate", "random"],
    maxFileSize: 0,
    supported: true,
    ui: "uuid",
  },
];
