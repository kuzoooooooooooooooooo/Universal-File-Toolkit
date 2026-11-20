import { ToolDefinition } from "@/types/tool";
import { fileLimits } from "@/config/limits";

const M = fileLimits.mediaMaxSize;

export const audioTools: ToolDefinition[] = [
  { id: "mp3-to-wav", name: "MP3 to WAV", description: "Decode MP3 to uncompressed WAV audio", category: "audio", inputFormats: ["mp3"], outputFormats: ["wav"], icon: "Music", keywords: ["mp3", "wav", "audio", "convert"], maxFileSize: M, supported: true, ui: "media" },
  { id: "wav-to-mp3", name: "WAV to MP3", description: "Encode WAV audio to MP3 with chosen bitrate", category: "audio", inputFormats: ["wav"], outputFormats: ["mp3"], icon: "Music", keywords: ["wav", "mp3", "audio", "convert"], maxFileSize: M, supported: true, ui: "media" },
  { id: "mp3-to-ogg", name: "MP3 to OGG", description: "Convert MP3 audio to OGG Vorbis", category: "audio", inputFormats: ["mp3"], outputFormats: ["ogg"], icon: "Music", keywords: ["mp3", "ogg", "vorbis", "audio"], maxFileSize: M, supported: true, ui: "media" },
  { id: "wav-to-flac", name: "WAV to FLAC", description: "Lossless compression of WAV audio to FLAC", category: "audio", inputFormats: ["wav"], outputFormats: ["flac"], icon: "Music", keywords: ["wav", "flac", "lossless", "audio"], maxFileSize: M, supported: true, ui: "media" },
  { id: "audio-compressor", name: "Audio Compressor", description: "Re-encode audio at a lower bitrate (MP3 or OGG)", category: "audio", inputFormats: ["mp3", "wav"], outputFormats: ["mp3", "ogg"], icon: "Music", keywords: ["audio", "compress", "bitrate", "mp3", "ogg"], maxFileSize: M, supported: true, ui: "media" },
  { id: "audio-trimmer", name: "Audio Trimmer", description: "Cut a time range from audio without re-encoding", category: "audio", inputFormats: ["mp3", "wav", "ogg", "flac"], outputFormats: ["mp3", "wav", "ogg", "flac"], icon: "Music", keywords: ["audio", "trim", "cut", "range"], maxFileSize: M, supported: true, ui: "media" },
  { id: "audio-normalize", name: "Audio Normalize", description: "Normalize loudness to -16 LUFS (loudnorm)", category: "audio", inputFormats: ["mp3", "wav", "ogg", "flac"], outputFormats: ["mp3"], icon: "Music", keywords: ["audio", "normalize", "loudness", "volume"], maxFileSize: M, supported: true, ui: "media" },
];
