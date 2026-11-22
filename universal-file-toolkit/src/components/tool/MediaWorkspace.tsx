"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Play } from "lucide-react";
import { fetchFile } from "@ffmpeg/util";
import type { ToolDefinition } from "@/types/tool";
import { SETTINGS } from "@/config/tool-settings";
import { detectFormat, EXT_MIME } from "@/lib/file-detection/magic-bytes";
import { baseName, formatBytes, sanitizeFilename } from "@/lib/utils/file-helpers";
import { getFFmpeg, terminateFFmpeg, getEngineState, subscribeEngine } from "@/engines/media/ffmpeg-client";
import { buildArgs, outputExt } from "@/engines/media/args";
import { FileDropZone } from "./FileDropZone";
import { ProcessingProgress } from "./ProcessingProgress";
import { ResultPanel, type ResultState } from "./ResultPanel";

type Status = "idle" | "loading" | "processing" | "done" | "error";

export function MediaWorkspace({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ percent: 0, stage: "" });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, number | string>>(() =>
    Object.fromEntries((SETTINGS[tool.id] ?? []).map((f) => [f.key, f.default]))
  );
  const urlRef = useRef<string | null>(null);
  const logsRef = useRef<string[]>([]);
  const [engine, setEngine] = useState(getEngineState());
  useEffect(() => subscribeEngine(setEngine), []);
  useEffect(() => { const t = setTimeout(() => { void getFFmpeg().catch(() => {}); }, 50); return () => clearTimeout(t); }, []);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const acceptFile = useCallback(async (f: File) => {
    setError(null); setResult(null);
    if (f.size > tool.maxFileSize) { setError(`File too large. Limit ${formatBytes(tool.maxFileSize)}.`); return; }
    const det = await detectFormat(f);
    if (!det || !tool.inputFormats.includes(det.ext)) {
      setError(`Unsupported .${det?.ext ?? "unknown"}. Accepts: ${tool.inputFormats.join(", ")}.`);
      return;
    }
    setFile(f);
  }, [tool]);

  const start = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStatus("loading");
    setProgress({ percent: 2, stage: "Loading engine (first run ~30 MB, then cached)" });
    logsRef.current = [];
    try {
      const ff = await getFFmpeg();
      const onProgress = ({ progress }: { progress: number }) =>
        setProgress({ percent: Math.max(5, Math.min(99, Math.round(progress * 100))), stage: "Converting" });
      const onLog = ({ message }: { message: string }) => {
        logsRef.current.push(message);
        if (logsRef.current.length > 40) logsRef.current.shift();
      };
      ff.on("progress", onProgress);
      ff.on("log", onLog);
      setStatus("processing");
      setProgress({ percent: 5, stage: "Writing file to virtual FS" });
      const inExt = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
      const inName = `input.${inExt}`;
      const ext = outputExt(tool.id, String(values.format ?? ""), inExt);
      const outName = `output.${ext}`;
      await ff.writeFile(inName, await fetchFile(file));
      const code = await ff.exec(buildArgs(tool.id, inName, outName, {
        bitrate: String(values.bitrate ?? "192k"),
        format: String(values.format ?? "mp3"),
        start: Number(values.start ?? 0),
        end: Number(values.end ?? 0),
        crf: String(values.crf ?? "28"),
        width: Number(values.width ?? 1280),
        interval: Number(values.interval ?? 5),
      }));
      ff.off("progress", onProgress);
      ff.off("log", onLog);
      if (code !== 0) throw new Error(logsRef.current.slice(-6).join("\n") || `FFmpeg exit code ${code}`);
      const data = (await ff.readFile(outName)) as Uint8Array;
      const mime = EXT_MIME[ext] ?? "application/octet-stream";
      const blob = new Blob([data.slice().buffer as ArrayBuffer], { type: mime });
      const url = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setResult({ url, filename: `${sanitizeFilename(baseName(file.name))}.${ext}`, size: blob.size, originalSize: file.size, mime });
      setStatus("done");
      await ff.deleteFile(inName).catch(() => {});
      await ff.deleteFile(outName).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [file, values, tool]);

  const cancel = useCallback(() => { terminateFFmpeg(); setStatus("idle"); setProgress({ percent: 0, stage: "" }); }, []);
  const reset = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null; setResult(null); setFile(null); setStatus("idle"); setError(null);
  }, []);

  const fields = SETTINGS[tool.id] ?? [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">FFmpeg.wasm on your device · {engine.phase === "ready" ? "engine ready" : engine.phase === "downloading" ? "downloading engine in background" : "engine loads on first use"}</p>
      <div className="mt-8 space-y-6">
        {!file && (
          <FileDropZone accept={tool.inputFormats.map((e) => `.${e}`).join(",")} hint={`Supported: ${tool.inputFormats.join(", ")}`} onFile={(f) => void acceptFile(f)} />
        )}
        {file && status !== "done" && (
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <p className="text-sm text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            {fields.length > 0 && (
              <div className="mt-5 space-y-4">
                {fields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="text-xs text-muted-foreground">{field.label}</span>
                    {field.type === "select" ? (
                      <select value={String(values[field.key])} onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none">
                        {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type="number" min={0} value={Number(values[field.key])} onChange={(e) => setValues((v) => ({ ...v, [field.key]: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none" />
                    )}
                  </label>
                ))}
              </div>
            )}
            {status === "idle" && (
              <button type="button" onClick={() => void start()} className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                <Play className="h-4 w-4" /> Convert
              </button>
            )}
          </div>
        )}
        {(status === "loading" || status === "processing") && (
          <ProcessingProgress
            percent={status === "loading" ? (engine.total > 0 ? Math.round((engine.received / engine.total) * 100) : 2) : progress.percent}
            stage={status === "loading" ? (engine.phase === "downloading" ? `Downloading engine ${(engine.received / 1048576).toFixed(1)}/${(engine.total / 1048576).toFixed(1)} MB` : engine.phase === "initializing" ? "Initializing engine" : "Loading engine") : progress.stage}
            onCancel={cancel}
          />
        )}
        {status === "done" && result && <ResultPanel result={result} onReset={reset} />}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <p className="whitespace-pre-wrap text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
