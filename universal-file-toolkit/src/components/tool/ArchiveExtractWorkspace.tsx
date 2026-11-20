"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, FileArchive } from "lucide-react";
import type { ToolDefinition } from "@/types/tool";
import { fileLimits } from "@/config/limits";
import { detectFormat } from "@/lib/file-detection/magic-bytes";
import { formatBytes } from "@/lib/utils/file-helpers";
import { FileDropZone } from "./FileDropZone";
import { ProcessingProgress } from "./ProcessingProgress";
import { ResultPanel, type ResultState } from "./ResultPanel";

interface Entry {
  name: string;
  size: number;
}

interface WorkerMsg {
  id: number;
  type: "entries" | "progress" | "done" | "error";
  entries?: Entry[];
  percent?: number;
  stage?: string;
  buffer?: ArrayBuffer;
  mime?: string;
  filename?: string;
  error?: string;
}

type Status = "idle" | "listing" | "listed" | "extracting" | "done" | "error";

export function ArchiveExtractWorkspace({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ percent: 0, stage: "" });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const urlRef = useRef<string | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const getWorker = () =>
    workerRef.current ??
    (workerRef.current = new Worker(
      new URL("../../workers/archive.worker.ts", import.meta.url),
      { type: "module" }
    ));

  const acceptFile = useCallback(
    async (f: File) => {
      setError(null);
      setResult(null);
      setEntries([]);
      if (f.size > tool.maxFileSize) {
        setError(`File too large. Limit: ${formatBytes(tool.maxFileSize)}.`);
        return;
      }
      const det = await detectFormat(f);
      if (!det || det.ext !== "zip") {
        setError(`Unsupported input .${det?.ext ?? "unknown"}. Expected: zip.`);
        return;
      }
      setFile(f);
      setStatus("listing");
      setProgress({ percent: 30, stage: "Reading archive directory" });

      const id = ++idRef.current;
      const worker = getWorker();
      const handler = (e: MessageEvent) => {
        const msg = e.data as WorkerMsg;
        if (msg.id !== id) return;
        if (msg.type === "entries") {
          const filesOnly = (msg.entries ?? []).filter((en) => !en.name.endsWith("/"));
          const total = filesOnly.reduce((s, en) => s + en.size, 0);
          if (filesOnly.length > fileLimits.archiveMaxFiles) {
            setError(`Too many entries: ${filesOnly.length} (limit ${fileLimits.archiveMaxFiles}). Possible zip bomb.`);
            setStatus("error");
          } else if (total > fileLimits.archiveMaxExtractSize) {
            setError(`Uncompressed size ${formatBytes(total)} exceeds limit ${formatBytes(fileLimits.archiveMaxExtractSize)}. Possible zip bomb.`);
            setStatus("error");
          } else {
            setEntries(filesOnly);
            setSelected(new Set(filesOnly.map((en) => en.name)));
            setStatus("listed");
          }
          worker.removeEventListener("message", handler);
        } else if (msg.type === "error") {
          setError(msg.error ?? "Archive error");
          setStatus("error");
          worker.removeEventListener("message", handler);
        }
      };
      worker.addEventListener("message", handler);
      const buf = await f.arrayBuffer();
      worker.postMessage({ id, op: "list", buffers: [buf], names: [f.name] }, [buf]);
    },
    [tool]
  );

  const extract = useCallback(async () => {
    if (!file || selected.size === 0) return;
    setStatus("extracting");
    setError(null);
    setProgress({ percent: 20, stage: "Extracting selected files" });

    const id = ++idRef.current;
    const worker = getWorker();
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
        setResult({
          url,
          filename: msg.filename!,
          size: blob.size,
          originalSize: file.size,
          mime: msg.mime!,
        });
        setStatus("done");
        worker.removeEventListener("message", handler);
      } else if (msg.type === "error") {
        setError(msg.error ?? "Extraction error");
        setStatus("error");
        worker.removeEventListener("message", handler);
      }
    };
    worker.addEventListener("message", handler);
    const buf = await file.arrayBuffer();
    worker.postMessage(
      { id, op: "extract", buffers: [buf], names: [file.name], selected: Array.from(selected) },
      [buf]
    );
  }, [file, selected]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const reset = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setResult(null);
    setEntries([]);
    setSelected(new Set());
    setFile(null);
    setStatus("idle");
    setError(null);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Entries are listed without full decompression · Extraction limits:{" "}
        {fileLimits.archiveMaxFiles} files / {formatBytes(fileLimits.archiveMaxExtractSize)} ·
        Filenames are sanitized on download
      </p>

      <div className="mt-8 space-y-6">
        {!file && (
          <FileDropZone accept=".zip" hint="Supported: zip" onFile={(f) => void acceptFile(f)} />
        )}

        {(status === "listing" || status === "extracting") && (
          <ProcessingProgress percent={progress.percent} stage={progress.stage} onCancel={reset} />
        )}

        {status === "listed" && file && (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileArchive className="h-4 w-4 text-primary" />
              {file.name}
              <span className="text-xs text-muted-foreground">
                {entries.length} files
              </span>
            </div>
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {entries.map((en) => (
                <li key={en.name} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(en.name)}
                    onChange={() => toggle(en.name)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="flex-1 truncate text-foreground">{en.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(en.size)}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void extract()}
              disabled={selected.size === 0}
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              {selected.size === 1 ? "Download file" : `Package ${selected.size} files as ZIP`}
            </button>
          </div>
        )}

        {status === "done" && result && <ResultPanel result={result} onReset={reset} />}

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
