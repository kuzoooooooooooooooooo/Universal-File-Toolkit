"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Download, Eye, RotateCcw } from "lucide-react";
import type { ToolDefinition } from "@/types/tool";
import { TEXT_TRANSFORMS } from "@/engines/document/transforms";
import { detectFormat } from "@/lib/file-detection/magic-bytes";
import { baseName, downloadBlob, formatBytes } from "@/lib/utils/file-helpers";
import { FileDropZone } from "./FileDropZone";

export function FileToTextWorkspace({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [outMeta, setOutMeta] = useState<{ ext: string; mime: string } | null>(null);
  const [computing, setComputing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptFile = useCallback(
    async (f: File) => {
      setError(null);
      setOutput(null);
      setPreview(false);
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
      const transform = TEXT_TRANSFORMS[tool.id];
      if (!transform) {
        setError("Transform not implemented for this tool");
        return;
      }
      setFile(f);
      setComputing(true);
      try {
        const res = await transform(f);
        setOutput(res.text);
        setOutMeta({ ext: res.ext, mime: res.mime });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setComputing(false);
      }
    },
    [tool]
  );

  const reset = () => {
    setFile(null);
    setOutput(null);
    setOutMeta(null);
    setError(null);
    setPreview(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
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

        {file && output !== null && outMeta && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                {file.name} · {formatBytes(file.size)}
              </span>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Convert another
              </button>
            </div>

            {preview ? (
              <iframe
                title="HTML preview (sandboxed, scripts disabled)"
                sandbox=""
                srcDoc={output}
                className="h-96 w-full rounded-xl border border-border bg-white"
              />
            ) : (
              <textarea
                value={output}
                readOnly
                rows={14}
                className="w-full rounded-xl border border-border bg-card p-4 font-mono text-sm text-foreground outline-none"
              />
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  downloadBlob(
                    new Blob([output], { type: outMeta.mime }),
                    `${baseName(file.name)}.${outMeta.ext}`
                  );
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download .{outMeta.ext}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    .writeText(output)
                    .then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    })
                    .catch(() => setError("Clipboard unavailable"));
                }}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
              {outMeta.ext === "html" && (
                <button
                  type="button"
                  onClick={() => setPreview((p) => !p)}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                  {preview ? "Show code" : "Preview"}
                </button>
              )}
            </div>
          </>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
