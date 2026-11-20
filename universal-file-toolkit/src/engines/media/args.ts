export interface MediaOptions {
  bitrate: string;
  format: string;
  start: number;
  end: number;
  crf?: string;
  width?: number;
  interval?: number;
}

export function outputExt(toolId: string, format: string, inExt: string): string {
  switch (toolId) {
    case "mp3-to-wav": return "wav";
    case "wav-to-mp3": return "mp3";
    case "mp3-to-ogg": return "ogg";
    case "wav-to-flac": return "flac";
    case "audio-compressor": return format === "ogg" ? "ogg" : "mp3";
    case "audio-normalize": return "mp3";
    case "mp4-to-webm": return "webm";
    case "webm-to-mp4": return "mp4";
    case "mp4-to-gif": return "gif";
    case "video-to-mp3": return "mp3";
    case "video-compressor": return "mp4";
    case "video-resizer": return "mp4";
    case "video-thumbnails": return "jpg";
    default: return inExt;
  }
}

export function buildArgs(toolId: string, input: string, output: string, o: MediaOptions): string[] {
  switch (toolId) {
    case "mp3-to-wav":
      return ["-i", input, "-c:a", "pcm_s16le", output];
    case "wav-to-mp3":
      return ["-i", input, "-c:a", "libmp3lame", "-b:a", o.bitrate, output];
    case "mp3-to-ogg":
      return ["-i", input, "-c:a", "libvorbis", "-b:a", o.bitrate, output];
    case "wav-to-flac":
      return ["-i", input, "-c:a", "flac", output];
    case "audio-compressor":
      return ["-i", input, "-c:a", o.format === "ogg" ? "libvorbis" : "libmp3lame", "-b:a", o.bitrate, output];
    case "audio-trimmer":
    case "video-trimmer": {
      const args: string[] = [];
      if (o.start > 0) args.push("-ss", String(o.start));
      args.push("-i", input);
      if (o.end > o.start) args.push("-t", String(o.end - o.start));
      args.push("-c", "copy", output);
      return args;
    }
    case "audio-normalize":
      return ["-i", input, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "libmp3lame", "-b:a", "192k", output];
    case "mp4-to-webm":
      return ["-i", input, "-c:v", "libvpx", "-b:v", "1M", "-c:a", "libvorbis", output];
    case "webm-to-mp4":
      return ["-i", input, "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23", "-c:a", "aac", output];
    case "mp4-to-gif":
      return ["-i", input, "-filter_complex", "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", output];
    case "video-to-mp3":
      return ["-i", input, "-vn", "-c:a", "libmp3lame", "-b:a", o.bitrate, output];
    case "video-compressor":
      return ["-i", input, "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264", "-preset", "ultrafast", "-crf", o.crf ?? "28", "-c:a", "aac", "-b:a", "96k", output];
    case "video-resizer":
      return ["-i", input, "-vf", `scale=${o.width ?? 1280}:-2`, "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23", "-c:a", "aac", output];
    case "video-thumbnails":
      return ["-i", input, "-vf", `fps=1/${o.interval ?? 5},scale=320:-1,tile=3x3`, "-frames:v", "1", output];
    default:
      throw new Error(`Unknown media tool: ${toolId}`);
  }
}
