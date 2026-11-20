import { ToolDefinition } from "@/types/tool";
import { fileLimits } from "@/config/limits";

const M = fileLimits.videoMaxSize;

export const videoTools: ToolDefinition[] = [
  { id: "mp4-to-webm", name: "MP4 to WebM", description: "Convert MP4 video to WebM (VP8/Vorbis)", category: "video", inputFormats: ["mp4"], outputFormats: ["webm"], icon: "Video", keywords: ["mp4", "webm", "video", "convert"], maxFileSize: M, supported: true, ui: "media" },
  { id: "webm-to-mp4", name: "WebM to MP4", description: "Convert WebM video to MP4 (H.264/AAC)", category: "video", inputFormats: ["webm"], outputFormats: ["mp4"], icon: "Video", keywords: ["webm", "mp4", "video", "convert"], maxFileSize: M, supported: true, ui: "media" },
  { id: "mp4-to-gif", name: "MP4 to GIF", description: "Convert a short MP4 clip to animated GIF (480p, 10 fps)", category: "video", inputFormats: ["mp4"], outputFormats: ["gif"], icon: "Video", keywords: ["mp4", "gif", "animated", "video"], maxFileSize: M, supported: true, ui: "media" },
  { id: "video-to-mp3", name: "Video to MP3", description: "Extract audio track from video as MP3", category: "video", inputFormats: ["mp4", "webm"], outputFormats: ["mp3"], icon: "Video", keywords: ["video", "mp3", "audio", "extract"], maxFileSize: M, supported: true, ui: "media" },
  { id: "video-compressor", name: "Video Compressor", description: "Re-encode video smaller: CRF + max 720p scale", category: "video", inputFormats: ["mp4", "webm"], outputFormats: ["mp4"], icon: "Video", keywords: ["video", "compress", "smaller", "crf"], maxFileSize: M, supported: true, ui: "media" },
  { id: "video-resizer", name: "Video Resizer", description: "Change video resolution by target width", category: "video", inputFormats: ["mp4", "webm"], outputFormats: ["mp4"], icon: "Video", keywords: ["video", "resize", "resolution", "scale"], maxFileSize: M, supported: true, ui: "media" },
  { id: "video-trimmer", name: "Video Trimmer", description: "Cut a time range from video without re-encoding", category: "video", inputFormats: ["mp4", "webm"], outputFormats: ["mp4", "webm"], icon: "Video", keywords: ["video", "trim", "cut", "range"], maxFileSize: M, supported: true, ui: "media" },
  { id: "video-thumbnails", name: "Video Thumbnails", description: "Contact sheet of frames (3x3) as a single JPG", category: "video", inputFormats: ["mp4", "webm"], outputFormats: ["jpg"], icon: "Video", keywords: ["video", "thumbnails", "frames", "contact sheet"], maxFileSize: M, supported: true, ui: "media" },
];
