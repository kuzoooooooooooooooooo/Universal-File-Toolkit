"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, FilePlus2, Play, Trash2 } from "lucide-react";
import type { ToolDefinition } from "@/types/tool";
import { SETTINGS } from "@/config/tool-settings";
import { detectFormat } from "@/lib/file-detection/magic-bytes";
import { takeStagedFile } from "@/lib/file-staging";
import { formatBytes } from "@/lib/utils/file-helpers";
import { FileDropZone } from "./FileDropZone";
import { ProcessingProgress } from "./ProcessingProgress";
import { ResultPanel, type ResultState } from "./ResultPanel";

type Status = "idle" | "processing" | "done" | "error";

interface WorkerMsg {
  id: number;
  type: "progress" | "done" | "error";
  percent?: number;
  stage?: string;
  buffer?: ArrayBuffer;
  mime?: string;
  filename?: string;
  error?: string;
}

export function MultiFileWorkspace({ tool }: { tool: ToolDefinition }) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ percent: 0, stage: "" });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (SETTINGS[tool.id] ?? [])
        .filter((f) => f.type === "text")
        .map((f) => [f.key, String(f.default)])
    )
  );
  const workerRef = useRef<Worker | null>(null);
  const urlRef = useRef<string | null>(null);
  const idRef = useRef(0);

  const maxFiles = tool.maxFiles ?? 50;
  const minFiles = tool.minFiles ?? 1;
  const acceptAny = tool.inputFormats.includes("*");

  useEffect(() => {
    const staged = takeStagedFile();
    if (staged) setFiles([staged]);
    return () => {
      workerRef.current?.terminate();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const addFiles = useCallback(
    async (list: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(list);
      const next: File[] = [];
      for (const f of incoming) {
        if (tool.maxFileSize > 0 && f.size > tool.maxFileSize) {
          setError(`${f.name}: too large (limit ${formatBytes(tool.maxFileSize)})`);
          continue;
        }
        if (!acceptAny) {
          const det = await detectFormat(f);
          if (!det || !tool.inputFormats.includes(det.ext)) {
            setError(`${f.name}: unsupported .${det?.ext ?? "unknown"}`);
            continue;
          }
        }
        next.push(f);
      }
      setFiles((prev) => [...prev, ...next].slice(0, maxFiles));
    },
    [tool, maxFiles, acceptAny]
  );

  const start = useCallback(async () => {
    if (files.length < minFiles) {
      setError(`This tool needs at least ${minFiles} file(s).`);
      return;
    }
    setStatus("processing");
    setError(null);
    setProgress({ percent: 5, stage: "Reading files" });

    const workerUrl =
      tool.worker === "archive"
        ? new URL("../../workers/archive.worker.ts", import.meta.url)
        : new URL("../../workers/pdf.worker.ts", import.meta.url);
    const worker =
      workerRef.current ??
      (workerRef.current = new Worker(workerUrl, { type: "module" }));
    workerRef.current.onerror = (ev) => {
      setError(`Worker failed to load: ${ev.message || "unknown worker error"}`);
      setStatus("error");
    };
    const id = ++idRef.current;

    const handler = (e: MessageEvent) => {
      const msg = e.data as WorkerMsg;
      if (msg.id !== id) return;
      if (msg.type === "progress") {
        setProgress({ percent: msg.percent ?? 0, stage: msg.stage ?? "" });
      } else if (msg.type === "done") {
        const blob = new Blob([msg.buffer!], { type: msg.mime });
        const url = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        const total = files.reduce((s, f) => s + f.size, 0);
        setResult({
          url,
          filename: msg.filename!,
          size: blob.size,
          originalSize: total,
          mime: msg.mime!,
        });
        setStatus("done");
        worker.removeEventListener("message", handler);
      } else {
        setError(msg.error ?? "Unknown error");
        setStatus("error");
        worker.removeEventListener("message", handler);
      }
    };
    worker.addEventListener("message", handler);

    const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
    setProgress({ percent: 10, stage: "Processing" });
    worker.postMessage(
      {
        id,
        op: tool.workerOp,
        buffers,
        names: files.map((f) => f.name),
        ranges: values.ranges ?? "1",
      },
      buffers
    );
  }, [files, minFiles, values, tool]);

  const cancel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus("idle");
    setProgress({ percent: 0, stage: "" });
  }, []);

  const reset = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setResult(null);
    setFiles([]);
    setStatus("idle");
    setError(null);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Accepts: {acceptAny ? "any file" : tool.inputFormats.join(", ")} ·{" "}
        {minFiles}–{maxFiles} files · Processed locally
      </p>

      <div className="mt-8 space-y-6">
        {files.length < maxFiles && status !== "processing" && (
          <FileDropZone
            accept={acceptAny ? undefined : tool.inputFormats.map((e) => `.${e}`).join(",")}
            hint={acceptAny ? "Any files" : `Supported: ${tool.inputFormats.join(", ")}`}
            multiple
            onFiles={(list) => void addFiles(list)}
          />
        )}

        {files.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <ul className="space-y-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-3 text-sm">
                  <FilePlus2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 truncate text-foreground">{f.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(f.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(SETTINGS[tool.id] ?? []).filter((f) => f.type === "text").map((field) => (
          <label key={field.key} className="block">
            <span className="text-xs text-muted-foreground">{field.label}</span>
            <input
              type="text"
              value={values[field.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.key]: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
            />
          </label>
        ))}

        {status === "idle" && files.length > 0 && (
          <button
            type="button"
            onClick={() => void start()}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Play className="h-4 w-4" />
            Convert
          </button>
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
