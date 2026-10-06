// Open-source classical commentaries via bible.helloao.org
// All commentaries here are public-domain.

export type CommentaryKey =
  | "matthew-henry"
  | "jamieson-fausset-brown"
  | "john-gill"
  | "keil-delitzsch";

export interface CommentaryMeta {
  key: CommentaryKey;
  label: string;
  short: string;
  otOnly?: boolean;
}

export const COMMENTARIES: CommentaryMeta[] = [
  {
    key: "matthew-henry",
    label: "Matthew Henry Commentary",
    short: "M. Henry",
  },
  {
    key: "jamieson-fausset-brown",
    label: "Jamieson-Fausset-Brown",
    short: "JFB",
  },
  {
    key: "john-gill",
    label: "John Gill's Exposition",
    short: "Gill",
  },
  {
    key: "keil-delitzsch",
    label: "Keil & Delitzsch (OT)",
    short: "K&D",
    otOnly: true,
  },
];

// MyBibleZone numeric book id -> USFM code used by bible.helloao.org
export const USFM: Record<number, string> = {
  10: "GEN", 20: "EXO", 30: "LEV", 40: "NUM", 50: "DEU",
  60: "JOS", 70: "JDG", 80: "RUT", 90: "1SA", 100: "2SA",
  110: "1KI", 120: "2KI", 130: "1CH", 140: "2CH", 150: "EZR",
  160: "NEH", 190: "EST", 220: "JOB", 230: "PSA", 240: "PRO",
  250: "ECC", 260: "SNG", 290: "ISA", 300: "JER", 310: "LAM",
  330: "EZK", 340: "DAN", 350: "HOS", 360: "JOL", 370: "AMO",
  380: "OBA", 390: "JON", 400: "MIC", 410: "NAM", 420: "HAB",
  430: "ZEP", 440: "HAG", 450: "ZEC", 460: "MAL",
  470: "MAT", 480: "MRK", 490: "LUK", 500: "JHN", 510: "ACT",
  520: "ROM", 530: "1CO", 540: "2CO", 550: "GAL", 560: "EPH",
  570: "PHP", 580: "COL", 590: "1TH", 600: "2TH", 610: "1TI",
  620: "2TI", 630: "TIT", 640: "PHM", 650: "HEB", 660: "JAS",
  670: "1PE", 680: "2PE", 690: "1JN", 700: "2JN", 710: "3JN",
  720: "JUD", 730: "REV",
};

interface ContentNode {
  type?: string;
  number?: number;
  content?: unknown;
  text?: string;
}

export interface CommentaryBlock {
  startVerse: number;
  paragraphs: string[];
}

function flatten(nodes: unknown): string {
  if (!nodes) return "";
  if (typeof nodes === "string") return nodes;
  if (Array.isArray(nodes)) return nodes.map(flatten).join(" ");
  if (typeof nodes === "object") {
    const n = nodes as ContentNode;
    if (typeof n.text === "string") return n.text;
    if (n.content) return flatten(n.content);
  }
  return "";
}

export async function fetchCommentaryChapter(
  key: CommentaryKey,
  book: number,
  chapter: number,
): Promise<CommentaryBlock[]> {
  const usfm = USFM[book];
  if (!usfm) return [];
  const url = `https://bible.helloao.org/api/c/${key}/${usfm}/${chapter}.json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    chapter?: { content?: ContentNode[]; introduction?: string };
  };
  const content = data?.chapter?.content ?? [];
  const blocks: CommentaryBlock[] = [];
  let current: CommentaryBlock | null = null;
  for (const node of content) {
    if (node?.type === "verse" && typeof node.number === "number") {
      if (current) blocks.push(current);
      const paras: string[] = [];
      const txt = flatten(node.content).trim();
      if (txt) paras.push(txt);
      current = { startVerse: node.number, paragraphs: paras };
    } else if (current) {
      const txt = flatten(node).trim();
      if (txt) current.paragraphs.push(txt);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

// Pick the block whose startVerse is the greatest value <= verse.
export function blockForVerse(
  blocks: CommentaryBlock[],
  verse: number,
): CommentaryBlock | null {
  let best: CommentaryBlock | null = null;
  for (const b of blocks) {
    if (b.startVerse <= verse && (!best || b.startVerse > best.startVerse)) {
      best = b;
    }
  }
  return best;
}
