// Display-only helpers for grouped/empty verses. Never alters scripture text.
const GROUP_RE = /^\s*\[(\d+)-(\d+)\]\s*/;

export function parseGroupMarker(text: string): { start: number; end: number; rest: string } | null {
  const m = GROUP_RE.exec(text);
  if (!m) return null;
  return { start: Number(m[1]), end: Number(m[2]), rest: text.slice(m[0].length) };
}

/** For an empty verse at index i, find a preceding "[a-b]" marker whose range covers verse i+1. */
export function findGroupCover(verses: string[], i: number): { start: number; end: number } | null {
  const vNum = i + 1;
  for (let j = i - 1; j >= 0; j--) {
    const g = parseGroupMarker(verses[j] ?? "");
    if (g) return g.start <= vNum && vNum <= g.end ? { start: g.start, end: g.end } : null;
    if ((verses[j] ?? "").trim()) return null;
  }
  return null;
}
