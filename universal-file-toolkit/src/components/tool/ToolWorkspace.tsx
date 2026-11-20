"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, FileImage, Play } from "lucide-react";
import type { ToolDefinition } from "@/types/tool";
import { SETTINGS, type OptionField } from "@/config/tool-settings";
import { detectFormat, EXT_MIME } from "@/lib/file-detection/magic-bytes";
import { takeStagedFile } from "@/lib/file-staging";
import { formatBytes } from "@/lib/utils/file-helpers";
import { FileDropZone } from "./FileDropZone";
import { ProcessingProgress } from "./ProcessingProgress";
import { ResultPanel, type ResultState } from "./ResultPanel";

type Status = "idle" | "processing" | "done" | "error";

interface WorkerDone {
  id: number;
  type: "done";
  buffer: ArrayBuffer;
}
interface WorkerProgress {
  id: number;
  type: "progress";
  percent: number;
  stage: string;
}
interface WorkerError {
  id: number;
  type: "error";
  error: string;
}
type WorkerMessage = WorkerDone | WorkerProgress | WorkerError;

export function ToolWorkspace({ tool }: { tool: ToolDefinition }) {
  const fields: OptionField[] = SETTINGS[tool.id] ?? [];
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ percent: 0, stage: "" });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, number | string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.default]))
  );
  const workerRef = useRef<Worker | null>(null);
  const urlRef = useRef<string | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const staged = takeStagedFile();
    if (staged) setFile(staged);
    return () => {
      workerRef.current?.terminate();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const acceptFile = useCallback(
    async (f: File) => {
      setError(null);
      setResult(null);
      if (f.size > tool.maxFileSize) {
        setError(`File too large. Limit: ${formatBytes(tool.maxFileSize)}.`);
        return;
      }
      const detected = await detectFormat(f);
      if (!detected || !tool.inputFormats.includes(detected.ext)) {
        setError(
          `Unsupported input .${detected?.ext ?? "unknown"}. This tool accepts: ${tool.inputFormats.join(", ")}.`
        );
        return;
      }
      setFile(f);
    },
    [tool]
  );

  const start = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    setError(null);
    setProgress({ percent: 5, stage: "Starting worker" });

    const worker =
      workerRef.current ??
      (workerRef.current = new Worker(
        new URL("../../workers/image.worker.ts", import.meta.url),
        { type: "module" }
      ));
    const id = ++idRef.current;

    const outFormat = String(values.format ?? tool.outputFormats[0]);
    const options = {
      mime: EXT_MIME[outFormat] ?? "image/png",
      quality: Number(values.quality ?? 0.8),
      width: Number(values.width ?? 0),
      height: Number(values.height ?? 0),
      fillBackground: outFormat === "jpg",
    };

    const handler = (e: MessageEvent) => {
      const msg = e.data as WorkerMessage;
      if (msg.id !== id) return;
      if (msg.type === "progress") {
        setProgress({ percent: msg.percent, stage: msg.stage });
      } else if (msg.type === "done") {
        const blob = new Blob([msg.buffer], { type: options.mime });
        const url = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        const base = file.name.replace(/\.[^.]+$/, "");
        setResult({
          url,
          filename: `${base}.${outFormat}`,
          size: blob.size,
          originalSize: file.size,
          mime: options.mime,
        });
        setStatus("done");
        worker.removeEventListener("message", handler);
      } else {
        setError(msg.error);
        setStatus("error");
        worker.removeEventListener("message", handler);
      }
    };
    worker.addEventListener("message", handler);

    const buf = await file.arrayBuffer();
    worker.postMessage({ id, buffer: buf, options }, [buf]);
  }, [file, values, tool]);

  const cancel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus(file ? "idle" : "idle");
    setProgress({ percent: 0, stage: "" });
  }, [file]);

  const reset = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setResult(null);
    setFile(null);
    setStatus("idle");
    setError(null);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Accepts: {tool.inputFormats.join(", ")} · Outputs:{" "}
        {tool.outputFormats.join(", ")} · Max {formatBytes(tool.maxFileSize)} ·
        Processed locally
      </p>

      <div className="mt-8 space-y-6">
        {!file && (
          <FileDropZone
            accept={tool.inputFormats.map((e) => `.${e}`).join(",")}
            hint={`Supported: ${tool.inputFormats.join(", ")}`}
            onFile={(f) => void acceptFile(f)}
          />
        )}

        {file && status !== "done" && (
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-3">
              <FileImage className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>

            {fields.length > 0 && (
              <div className="mt-6 space-y-4">
                {fields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="text-xs text-muted-foreground">
                      {field.label}
                      {field.type === "range" && `: ${values[field.key]}`}
                    </span>
                    {field.type === "range" && (
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={Number(values[field.key])}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.key]: Number(e.target.value),
                          }))
                        }
                        className="mt-1 w-full accent-[var(--primary)]"
                      />
                    )}
                    {field.type === "number" && (
                      <input
                        type="number"
                        min={0}
                        value={Number(values[field.key])}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.key]: Number(e.target.value),
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
                      />
                    )}
                    {field.type === "select" && (
                      <select
                        value={String(values[field.key])}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [field.key]: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
                      >
                        {field.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                ))}
              </div>
            )}

            {status === "idle" && (
              <button
                type="button"
                onClick={() => void start()}
                className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Play className="h-4 w-4" />
                Convert
              </button>
            )}
          </div>
        )}

        {status === "processing" && (
          <ProcessingProgress
            percent={progress.percent}
            stage={progress.stage}
            onCancel={cancel}
          />
        )}

        {status === "done" && result && (
          <ResultPanel result={result} onReset={reset} />
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
