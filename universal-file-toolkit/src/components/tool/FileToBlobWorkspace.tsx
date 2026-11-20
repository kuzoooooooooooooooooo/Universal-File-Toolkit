"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolDefinition } from "@/types/tool";
import { BLOB_TRANSFORMS } from "@/engines/document/transforms";
import { detectFormat } from "@/lib/file-detection/magic-bytes";
import { formatBytes } from "@/lib/utils/file-helpers";
import { FileDropZone } from "./FileDropZone";
import { ResultPanel, type ResultState } from "./ResultPanel";

export function FileToBlobWorkspace({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [computing, setComputing] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
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
      const det = await detectFormat(f);
      if (!det || !tool.inputFormats.includes(det.ext)) {
        setError(
          `Unsupported input .${det?.ext ?? "unknown"}. This tool accepts: ${tool.inputFormats.join(", ")}.`
        );
        return;
      }
      const transform = BLOB_TRANSFORMS[tool.id];
      if (!transform) {
        setError("Transform not implemented for this tool");
        return;
      }
      setFile(f);
      setComputing(true);
      try {
        const { blob, filename } = await transform(f);
        const url = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setResult({
          url,
          filename,
          size: blob.size,
          originalSize: f.size,
          mime: blob.type,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setComputing(false);
      }
    },
    [tool]
  );

  const reset = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setResult(null);
    setFile(null);
    setError(null);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Accepts: {tool.inputFormats.join(", ")} · Processed locally
      </p>

      <div className="mt-8 space-y-6">
        {!file && (
          <FileDropZone
            accept={tool.inputFormats.map((e) => `.${e}`).join(",")}
            hint={`Supported: ${tool.inputFormats.join(", ")}`}
            onFile={(f) => void acceptFile(f)}
          />
        )}

        {computing && <p className="text-sm text-muted-foreground">Converting...</p>}

        {result && <ResultPanel result={result} onReset={reset} />}

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
