import * as XLSX from "xlsx";
import { marked } from "marked";
import { unzip } from "fflate";

export interface TextTransformResult {
  text: string;
  ext: string;
  mime: string;
}

function csvToJson(text: string): string {
  const wb = XLSX.read(text, { type: "string" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("No sheet found in CSV");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
  });
  if (rows.length === 0) return "[]";
  const [head, ...body] = rows as string[][];
  const objects = body.map((row) =>
    Object.fromEntries(
      head.map((h, i) => [h || `column_${i + 1}`, row[i] ?? ""])
    )
  );
  return JSON.stringify(objects, null, 2);
}

function jsonToCsv(text: string): string {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) {
    throw new Error("JSON must be an array of objects");
  }
  const ws = XLSX.utils.json_to_sheet(data as Record<string, unknown>[]);
  return XLSX.utils.sheet_to_csv(ws);
}

function xlsxToCsv(buffer: ArrayBuffer): string {
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("No sheet found in workbook");
  return XLSX.utils.sheet_to_csv(ws);
}

function csvToXlsx(text: string): Uint8Array {
  const wb = XLSX.read(text, { type: "string" });
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Uint8Array(out);
}

async function docxToTxt(buffer: ArrayBuffer): Promise<string> {
  const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(new Uint8Array(buffer), (err, data) => (err ? reject(err) : resolve(data)));
  });
  const xml = files["word/document.xml"];
  if (!xml) throw new Error("Not a valid DOCX: word/document.xml missing");
  const doc = new DOMParser().parseFromString(
    new TextDecoder().decode(xml),
    "application/xml"
  );
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Malformed word/document.xml");
  }
  const paragraphs = doc.getElementsByTagName("w:p");
  const lines: string[] = [];
  for (const p of Array.from(paragraphs)) {
    let line = "";
    const walk = (node: Element) => {
      for (const child of Array.from(node.children)) {
        const tag = child.tagName;
        if (tag === "w:t") line += child.textContent ?? "";
        else if (tag === "w:tab") line += "\t";
        else if (tag === "w:br" || tag === "w:cr") line += "\n";
        else walk(child);
      }
    };
    walk(p);
    lines.push(line);
  }
  return lines.join("\n");
}

function mdToHtml(text: string): string {
  const body = marked.parse(text, { async: false }) as string;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Markdown export</title>
</head>
<body>
${body}
</body>
</html>
`;
}

export const TEXT_TRANSFORMS: Record<
  string,
  (f: File) => Promise<TextTransformResult>
> = {
  "csv-to-json": async (f) => ({
    text: csvToJson(await f.text()),
    ext: "json",
    mime: "application/json",
  }),
  "json-to-csv": async (f) => ({
    text: jsonToCsv(await f.text()),
    ext: "csv",
    mime: "text/csv",
  }),
  "xlsx-to-csv": async (f) => ({
    text: xlsxToCsv(await f.arrayBuffer()),
    ext: "csv",
    mime: "text/csv",
  }),
  "docx-to-txt": async (f) => ({
    text: await docxToTxt(await f.arrayBuffer()),
    ext: "txt",
    mime: "text/plain",
  }),
  "markdown-to-html": async (f) => ({
    text: mdToHtml(await f.text()),
    ext: "html",
    mime: "text/html",
  }),
};

export const BLOB_TRANSFORMS: Record<
  string,
  (f: File) => Promise<{ blob: Blob; filename: string }>
> = {
  "csv-to-xlsx": async (f) => {
    const bytes = csvToXlsx(await f.text());
    const base = f.name.replace(/\.[^.]+$/, "");
    return {
      blob: new Blob([bytes], { type: EXT_XLSX }),
      filename: `${base}.xlsx`,
    };
  },
};

const EXT_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
