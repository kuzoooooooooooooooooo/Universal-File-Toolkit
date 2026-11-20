export type ToolCategory =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "devtools";

export type ToolUI =
  | "single-file"
  | "multi-file"
  | "text"
  | "pdf-render"
  | "archive-extract"
  | "hash"
  | "uuid"
  | "file-to-text"
  | "file-to-blob"
  | "media";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  inputFormats: string[];
  outputFormats: string[];
  icon: string;
  keywords: string[];
  maxFileSize: number;
  supported: boolean;
  ui?: ToolUI;
  minFiles?: number;
  maxFiles?: number;
  worker?: "pdf" | "archive";
  workerOp?: string;
  enginePath?: string;
}

export interface ToolCategoryMeta {
  id: ToolCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}
