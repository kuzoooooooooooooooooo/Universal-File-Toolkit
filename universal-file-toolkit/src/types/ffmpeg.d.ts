declare module "@/vendor/ffmpeg/index.js" {
  export class FFmpeg {
    load(opts?: {
      coreURL?: string;
      wasmURL?: string;
      workerURL?: string;
      classWorkerURL?: string;
    }): Promise<boolean>;
    on(event: "progress", cb: (e: { progress: number; time: number }) => void): void;
    on(event: "log", cb: (e: { type: string; message: string }) => void): void;
    off(event: "progress", cb: (e: { progress: number; time: number }) => void): void;
    off(event: "log", cb: (e: { type: string; message: string }) => void): void;
    writeFile(path: string, data: Uint8Array | string): Promise<boolean>;
    readFile(path: string): Promise<Uint8Array | string>;
    deleteFile(path: string): Promise<boolean>;
    exec(args: string[], timeout?: number): Promise<number>;
    terminate(): void;
  }
}
