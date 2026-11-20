interface WorkerRequest {
  id: number;
  buffer: ArrayBuffer;
  options: {
    mime: string;
    quality: number;
    width: number;
    height: number;
    fillBackground: boolean;
  };
}

const workerSelf = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

workerSelf.onmessage = async (e: MessageEvent) => {
  const { id, buffer, options } = e.data as WorkerRequest;
  const post = (msg: unknown, transfer?: Transferable[]) =>
    workerSelf.postMessage(msg, transfer);

  try {
    post({ id, type: "progress", percent: 15, stage: "Decoding image" });
    const blob = new Blob([buffer]);
    const bitmap = await createImageBitmap(blob);

    let w = bitmap.width;
    let h = bitmap.height;
    if (options.width > 0 || options.height > 0) {
      if (options.width > 0 && options.height > 0) {
        w = options.width;
        h = options.height;
      } else if (options.width > 0) {
        w = options.width;
        h = Math.round((bitmap.height * options.width) / bitmap.width);
      } else {
        h = options.height;
        w = Math.round((bitmap.width * options.height) / bitmap.height);
      }
    }

    post({ id, type: "progress", percent: 45, stage: "Rendering" });
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    if (options.fillBackground) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    post({ id, type: "progress", percent: 75, stage: "Encoding" });
    const out = await canvas.convertToBlob({
      type: options.mime,
      quality: options.quality,
    });
    const ab = await out.arrayBuffer();
    post({ id, type: "done", buffer: ab }, [ab]);
  } catch (err) {
    post({
      id,
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
