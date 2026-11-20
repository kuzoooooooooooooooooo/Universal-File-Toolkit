"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle, Play } from "lucide-react";
import { zipSync } from "fflate";
import type { ToolDefinition } from "@/types/tool";
import { detectFormat } from "@/lib/file-detection/magic-bytes";
import { baseName, formatBytes, sanitizeFilename } from "@/lib/utils/file-helpers";
import { FileDropZone } from "./FileDropZone";
import { ProcessingProgress } from "./ProcessingProgress";
import { ResultPanel, type ResultState } from "./ResultPanel";

type Status = "idle" | "processing" | "done" | "error";

export function PdfToJpgWorkspace({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ percent: 0, stage: "" });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState("1.5");
  const [quality, setQuality] = useState(0.8);
  const cancelRef = useRef(false);
  const urlRef = useRef<string | null>(null);

  const acceptFile = useCallback(
    async (f: File) => {
      setError(null);
      if (f.size > tool.maxFileSize) {
        setError(`File too large. Limit: ${formatBytes(tool.maxFileSize)}.`);
        return;
      }
      const det = await detectFormat(f);
      if (!det || det.ext !== "pdf") {
        setError(`Unsupported input .${det?.ext ?? "unknown"}. Expected: pdf.`);
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
    cancelRef.current = false;
    setProgress({ percent: 5, stage: "Loading PDF engine" });

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const data = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data }).promise;
      const total = doc.numPages;
      const pages: Record<string, Uint8Array> = {};

      for (let i = 1; i <= total; i++) {
        if (cancelRef.current) break;
        setProgress({
          percent: 5 + Math.round((i / total) * 90),
          stage: `Rendering page ${i}/${total}`,
        });
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: Number(scale) });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        await page.render({ canvasContext: ctx, viewport }).promise;
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/jpeg", quality)
        );
        if (!blob) throw new Error(`Failed to encode page ${i}`);
        pages[`page-${String(i).padStart(3, "0")}.jpg`] = new Uint8Array(
          await blob.arrayBuffer()
        );
        page.cleanup();
      }
      await doc.destroy();

      if (cancelRef.current) {
        setStatus("idle");
        setProgress({ percent: 0, stage: "" });
        return;
      }

      const names = Object.keys(pages);
      let blob: Blob;
      let filename: string;
      if (names.length === 1) {
        blob = new Blob([pages[names[0]]], { type: "image/jpeg" });
        filename = `${sanitizeFilename(baseName(file.name))}.jpg`;
      } else {
        const zip = zipSync(pages, { level: 0 });
        blob = new Blob([zip], { type: "application/zip" });
        filename = `${sanitizeFilename(baseName(file.name))}-pages.zip`;
      }
      const url = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setResult({
        url,
        filename,
        size: blob.size,
        originalSize: file.size,
        mime: blob.type,
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [file, scale, quality, tool]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

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
        Renders locally with PDF.js · Multi-page output is packaged as ZIP
      </p>

      <div className="mt-8 space-y-6">
        {!file && (
          <FileDropZone
            accept=".pdf"
            hint="Supported: pdf"
            onFile={(f) => void acceptFile(f)}
          />
        )}

        {file && status !== "done" && (
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <p className="text-sm text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs text-muted-foreground">Render scale</span>
                <select
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
                >
                  <option value="1">1x (72 DPI)</option>
                  <option value="1.5">1.5x (108 DPI)</option>
                  <option value="2">2x (144 DPI)</option>
                  <option value="3">3x (216 DPI)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">
                  JPG quality: {quality}
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--primary)]"
                />
              </label>
            </div>

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
