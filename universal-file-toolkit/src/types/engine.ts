export interface ProcessingProgress {
  percent: number;
  stage: string;
  bytesProcessed?: number;
  totalBytes?: number;
}

export interface ProcessingResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  originalSize?: number;
  processedSize?: number;
}

export interface ProcessingEngine {
  validate(file: File): Promise<ValidationResult>;
  process(
    file: File,
    options: Record<string, unknown>,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult>;
  cancel(): void;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedFormat?: string;
  fileSize?: number;
}
