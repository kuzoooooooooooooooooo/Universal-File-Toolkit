export function parseRanges(input: string, pageCount: number): number[][] {
  const groups: number[][] = [];
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) throw new Error("Empty page range");
  for (const part of parts) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) throw new Error(`Invalid range: "${part}"`);
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    if (start < 1 || end < 1) throw new Error(`Pages start at 1: "${part}"`);
    if (start > pageCount || end > pageCount) {
      throw new Error(`Page "${part}" out of bounds (document has ${pageCount})`);
    }
    if (start > end) throw new Error(`Invalid range: "${part}"`);
    const arr: number[] = [];
    for (let p = start; p <= end; p++) arr.push(p);
    groups.push(arr);
  }
  return groups;
}
