export const fileLimits = {
  defaultMaxSize: 500 * 1024 * 1024,
  imageMaxSize: 100 * 1024 * 1024,
  pdfMaxSize: 200 * 1024 * 1024,
  mediaMaxSize: 500 * 1024 * 1024,
  videoMaxSize: 100 * 1024 * 1024,
  documentMaxSize: 100 * 1024 * 1024,
  archiveMaxExtractSize: 1024 * 1024 * 1024,
  archiveMaxFiles: 10_000,
  archiveMaxDepth: 10,
} as const;

export const processingLimits = {
  maxWorkers: 4,
  timeoutMs: 10 * 60 * 1000,
} as const;
