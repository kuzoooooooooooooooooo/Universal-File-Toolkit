"use client";

import { Download, RotateCcw } from "lucide-react";
import { formatBytes, percentSaved } from "@/lib/utils/file-helpers";

export interface ResultState {
  url: string;
  filename: string;
  size: number;
  originalSize: number;
  mime: string;
}

interface Props {
  result: ResultState;
  onReset: () => void;
}

export function ResultPanel({ result, onReset }: Props) {
  const saved = percentSaved(result.originalSize, result.size);
  const isImage = result.mime.startsWith("image/");

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      {isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.url}
          alt="Processed result preview"
          className="mx-auto max-h-64 rounded-lg border border-border/60"
        />
      )}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Original</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatBytes(result.originalSize)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Result</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatBytes(result.size)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Change</p>
          <p
            className={`mt-1 text-sm font-medium ${
              saved > 0 ? "text-success" : "text-warning"
            }`}
          >
            {saved > 0 ? `-${saved}%` : `+${Math.abs(saved)}%`}
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <a
          href={result.url}
          download={result.filename}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Convert another
        </button>
      </div>
    </div>
  );
}
