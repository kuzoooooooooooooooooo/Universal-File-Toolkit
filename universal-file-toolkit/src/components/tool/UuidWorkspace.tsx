"use client";

import { useState } from "react";
import { Check, Copy, Download, Play } from "lucide-react";
import type { ToolDefinition } from "@/types/tool";
import { downloadBlob } from "@/lib/utils/file-helpers";

export function UuidWorkspace({ tool }: { tool: ToolDefinition }) {
  const [count, setCount] = useState(5);
  const [list, setList] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = () => {
    const n = Math.min(Math.max(count, 1), 1000);
    setList(Array.from({ length: n }, () => crypto.randomUUID()));
  };

  const copy = async (i: number, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(list.join("\n"));
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>

      <div className="mt-8 space-y-6">
        <label className="block text-xs text-muted-foreground">
          Count (1–1000)
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-32 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          />
        </label>

        <button
          type="button"
          onClick={generate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Play className="h-4 w-4" />
          Generate
        </button>

        {list.length > 0 && (
          <>
            <ul className="space-y-1">
              {list.map((uuid, i) => (
                <li
                  key={uuid}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
                >
                  <code className="flex-1 font-mono text-xs text-foreground">{uuid}</code>
                  <button
                    type="button"
                    onClick={() => void copy(i, uuid)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Copy ${uuid}`}
                  >
                    {copied === i ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void copyAll()}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-4 w-4" />
                Copy all
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadBlob(new Blob([list.join("\n")], { type: "text/plain" }), "uuids.txt")
                }
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                Download .txt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
