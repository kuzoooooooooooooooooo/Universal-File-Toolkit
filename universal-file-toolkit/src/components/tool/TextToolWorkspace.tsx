"use client";

import { useState } from "react";
import { Check, Copy, Download, Play } from "lucide-react";
import type { ToolDefinition } from "@/types/tool";
import { downloadBlob } from "@/lib/utils/file-helpers";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function TextToolWorkspace({ tool }: { tool: ToolDefinition }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState("2");
  const [mode, setMode] = useState("encode");
  const [copied, setCopied] = useState(false);

  const run = () => {
    setError(null);
    setOutput("");
    try {
      if (tool.id === "json-formatter") {
        const parsed: unknown = JSON.parse(input);
        const space = indent === "tab" ? "\t" : Number(indent);
        setOutput(JSON.stringify(parsed, null, space));
      } else if (mode === "encode") {
        setOutput(bytesToBase64(new TextEncoder().encode(input)));
      } else {
        const bytes = base64ToBytes(input);
        setOutput(new TextDecoder().decode(bytes));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const minify = () => {
    setError(null);
    try {
      setOutput(JSON.stringify(JSON.parse(input)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Clipboard unavailable in this context");
    }
  };

  const download = () => {
    const isJson = tool.id === "json-formatter";
    downloadBlob(
      new Blob([output], { type: isJson ? "application/json" : "text/plain" }),
      isJson ? "formatted.json" : "output.txt"
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>

      <div className="mt-8 space-y-4">
        {tool.id === "json-formatter" ? (
          <div className="flex gap-3">
            <label className="text-xs text-muted-foreground">
              Indent
              <select
                value={indent}
                onChange={(e) => setIndent(e.target.value)}
                className="mt-1 block rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none"
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tab</option>
              </select>
            </label>
          </div>
        ) : (
          <label className="text-xs text-muted-foreground">
            Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="mt-1 block rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none"
            >
              <option value="encode">Text → Base64</option>
              <option value="decode">Base64 → Text</option>
            </select>
          </label>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          placeholder="Paste input here..."
          className="w-full rounded-xl border border-border bg-card p-4 font-mono text-sm text-foreground outline-none focus:border-primary/60"
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={run}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Play className="h-4 w-4" />
            {tool.id === "json-formatter" ? "Format" : "Convert"}
          </button>
          {tool.id === "json-formatter" && (
            <button
              type="button"
              onClick={minify}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Minify
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {output && (
          <>
            <textarea
              value={output}
              readOnly
              rows={10}
              className="w-full rounded-xl border border-border bg-secondary p-4 font-mono text-sm text-foreground outline-none"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void copy()}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={download}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
