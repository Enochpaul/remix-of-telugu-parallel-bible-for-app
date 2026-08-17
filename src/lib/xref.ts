// Cross references from openbible.info (CC-BY), pre-processed into per-book JSON.
// Shape: { [chapter]: { [verse]: [[book, chapter, verse, endVerse?], ...] } }

export type XrefTuple = [number, number, number] | [number, number, number, number];
export type XrefBook = Record<string, Record<string, XrefTuple[]>>;

export interface Xref {
  book: number;
  chapter: number;
  verse: number;
  endVerse: number;
}

export async function fetchXrefBook(book: number): Promise<XrefBook> {
  const res = await fetch(`/xref/${book}.json`);
  if (!res.ok) return {};
  return res.json();
}

export function xrefsFor(data: XrefBook | undefined, chapter: number, verse: number): Xref[] {
  const list = data?.[String(chapter)]?.[String(verse)] ?? [];
  return list.map((t) => ({
    book: t[0],
    chapter: t[1],
    verse: t[2],
    endVerse: t.length > 3 ? (t[3] as number) : t[2],
  }));
}
