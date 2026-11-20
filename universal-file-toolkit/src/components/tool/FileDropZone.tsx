"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

interface Props {
  accept?: string;
  hint: string;
  onFile?: (file: File) => void;
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
}

export function FileDropZone({ accept, hint, onFile, onFiles, multiple }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const dispatch = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    if (onFiles) onFiles(files);
    else if (onFile) onFile(files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        dispatch(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
        drag ? "border-primary bg-secondary/60" : "border-border bg-card/50"
      }`}
    >
      <UploadCloud className="h-8 w-8 text-primary" />
      <p className="mt-4 text-sm text-foreground">Drag & drop your file{multiple ? "s" : ""}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Select file{multiple ? "s" : ""}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          dispatch(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
