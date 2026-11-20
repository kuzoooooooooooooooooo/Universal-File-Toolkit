"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Hash } from "lucide-react";
import type { ToolDefinition } from "@/types/tool";
import { detectFormat } from "@/lib/file-detection/magic-bytes";
import { formatBytes } from "@/lib/utils/file-helpers";
import { FileDropZone } from "./FileDropZone";

const ALGOS = ["SHA-1", "SHA-256", "SHA-512"] as const;

export function HashWorkspace({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<{ algo: string; hex: string }[]>([]);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const compute = useCallback(
    async (f: File) => {
      setError(null);
      setHashes([]);
      if (f.size > tool.maxFileSize) {
        setError(`File too large. Limit: ${formatBytes(tool.maxFileSize)}.`);
        return;
      }
      const det = await detectFormat(f);
      if (!det) {
        setError("Could not read file");
        return;
      }
      setFile(f);
      setComputing(true);
      try {
        const buf = await f.arrayBuffer();
        const results: { algo: string; hex: string }[] = [];
        for (const algo of ALGOS) {
          const digest = await crypto.subtle.digest(algo, buf);
          const hex = Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          results.push({ algo, hex });
        }
        setHashes(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setComputing(false);
      }
    },
    [tool]
  );

  const copy = async (algo: string, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(algo);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Clipboard unavailable");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Computed with Web Crypto API on your device
      </p>

      <div className="mt-8 space-y-6">
        {!file && (
          <FileDropZone hint="Any file" onFile={(f) => void compute(f)} />
        )}

        {computing && <p className="text-sm text-muted-foreground">Computing hashes...</p>}

        {hashes.length > 0 && file && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              {file.name} · {formatBytes(file.size)}
            </p>
            {hashes.map(({ algo, hex }) => (
              <div key={algo} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {algo}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copy(algo, hex)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copied === algo ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied === algo ? "Copied" : "Copy"}
                  </button>
                </div>
                <code className="mt-2 block break-all font-mono text-xs text-foreground">
                  {hex}
                </code>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setHashes([]);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Hash another file
            </button>
          </div>
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
