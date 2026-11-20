"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { detectFormat } from "@/lib/file-detection/magic-bytes";
import { stageFile } from "@/lib/file-staging";
import { getMatchingTools } from "@/lib/registry/tool-registry";
import { formatBytes } from "@/lib/utils/file-helpers";
import type { ToolDefinition } from "@/types/tool";

export function DropZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [candidates, setCandidates] = useState<ToolDefinition[] | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const lastFileRef = useRef<File | null>(null);

  const openTool = (tool: ToolDefinition, file: File) => {
    stageFile(file);
    router.push(`/tools/${tool.id}`);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    lastFileRef.current = file;
    const detected = await detectFormat(file);
    const ext = detected?.ext ?? "";
    const matches = getMatchingTools(ext);
    if (matches.length === 0) {
      setCandidates(null);
      setInfo(`.${ext || "unknown"} (${formatBytes(file.size)}): no supported tool yet for this format.`);
      return;
    }
    setInfo(`Detected .${ext} · ${formatBytes(file.size)}`);
    if (matches.length === 1) {
      openTool(matches[0], file);
    } else {
      setCandidates(matches);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
          drag ? "border-primary bg-secondary/60" : "border-border bg-card/50"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <UploadCloud className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-foreground">Drop any file here</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          We detect the format locally by file signature and route it to the right tool.
          Nothing is uploaded.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Select file
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {info && <p className="mt-4 text-xs text-muted-foreground">{info}</p>}
        {candidates && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {candidates.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  if (lastFileRef.current) openTool(tool, lastFileRef.current);
                }}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/60"
              >
                {tool.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
