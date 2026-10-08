import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { fetchBook, type BookMeta, type Version } from "@/lib/bible";

type SearchKey = "telov" | "erv" | "telirv" | "kjv";
const VERSIONS: { key: SearchKey; short: string }[] = [
  { key: "telov", short: "TELOV" },
  { key: "erv", short: "ERV-te" },
  { key: "telirv", short: "TEL IRV" },
  { key: "kjv", short: "KJV" },
];

// One flat in-memory corpus per version: [book, chapter, verse, cleanText]
type Row = [number, number, number, string];
const corpus: Partial<Record<SearchKey, Row[]>> = {};
let loading: Promise<void> | null = null;

const clean = (t: string) =>
  t
    .replace(/<n>[\s\S]*?<\/n>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function loadVersion(key: SearchKey, books: BookMeta[]): Promise<Row[]> {
  const rows: Row[] = [];
  const datas = await Promise.all(
    books.map(async (bk) => {
      // TEL IRV = IRV for the OT, TELNT for the NT
      const v: Version = key === "telirv" && bk.nt ? "telnt" : key;
      try {
        return await fetchBook(v, bk.n);
      } catch {
        return null;
      }
    }),
  );
  datas.forEach((d) => {
    if (!d) return;
    d.chapters.forEach((ch, ci) =>
      ch.forEach((t, vi) => {
        const c = clean(t ?? "");
        if (c) rows.push([d.book, ci + 1, vi + 1, c]);
      }),
    );
  });
  return rows;
}

function ensureCorpus(books: BookMeta[], onProgress: (n: number) => void) {
  if (!loading) {
    let done = 0;
    loading = Promise.all(
      VERSIONS.map(async ({ key }) => {
        corpus[key] = await loadVersion(key, books);
        onProgress(++done);
      }),
    ).then(() => undefined);
  }
  return loading;
}

interface Hit {
  b: number;
  c: number;
  v: number;
  ver: SearchKey;
  text: string;
}

const MAX_HITS = 300;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRe(q)})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <mark key={i} className="search-hit">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function BibleSearch({
  books,
  onOpen,
  onClose,
}: {
  books: BookMeta[];
  onOpen: (b: number, c: number, v: number) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [ready, setReady] = useState(VERSIONS.every((v) => corpus[v.key]));
  const [progress, setProgress] = useState(0);
  const [enabled, setEnabled] = useState<SearchKey[]>(VERSIONS.map((v) => v.key));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (ready || books.length === 0) return;
    ensureCorpus(books, setProgress).then(() => setReady(true));
  }, [books, ready]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  const { hits, total } = useMemo(() => {
    const out: Hit[] = [];
    let total = 0;
    if (!ready || debounced.length < 2) return { hits: out, total };
    const needle = debounced.toLowerCase();
    for (const { key } of VERSIONS) {
      if (!enabled.includes(key)) continue;
      const rows = corpus[key] ?? [];
      for (const r of rows) {
        if (r[3].toLowerCase().includes(needle)) {
          total++;
          if (out.length < MAX_HITS) out.push({ b: r[0], c: r[1], v: r[2], ver: key, text: r[3] });
        }
      }
    }
    // Canonical order, then version order
    const vo = (k: SearchKey) => VERSIONS.findIndex((x) => x.key === k);
    out.sort((a, b) => a.b - b.b || a.c - b.c || a.v - b.v || vo(a.ver) - vo(b.ver));
    return { hits: out, total };
  }, [debounced, ready, enabled]);

  const nameOf = (n: number) => books.find((x) => x.n === n)?.name ?? String(n);
  const toggle = (k: SearchKey) =>
    setEnabled((e) => (e.includes(k) ? (e.length > 1 ? e.filter((x) => x !== k) : e) : [...e, k]));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search the Bible"
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-0 animate-in fade-in sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col border bg-card shadow-lg animate-in zoom-in-95 sm:mt-8 sm:h-[85vh] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="బైబిల్ మొత్తంలో వెతకండి / Search whole Bible"
                aria-label="Search the whole Bible"
                className="w-full rounded-md border bg-background py-2 pl-8 pr-8 text-sm outline-none ring-ring focus:ring-2"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded p-1.5 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {VERSIONS.map((v) => {
              const on = enabled.includes(v.key);
              return (
                <button
                  key={v.key}
                  onClick={() => toggle(v.key)}
                  aria-pressed={on}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {v.short}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {!ready ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing search… {progress}/{VERSIONS.length}
            </div>
          ) : debounced.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Type at least 2 letters to search all four versions.
            </p>
          ) : hits.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No matching verses.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                {total.toLocaleString()} matches
                {total > hits.length ? ` · showing first ${hits.length}` : ""}
              </p>
              <ul className="space-y-1.5">
                {hits.map((h) => (
                  <li key={`${h.ver}-${h.b}-${h.c}-${h.v}`}>
                    <button
                      onClick={() => onOpen(h.b, h.c, h.v)}
                      className="w-full rounded-md border bg-background/50 px-3 py-2 text-left hover:bg-accent/50"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-telugu-serif text-sm font-semibold text-primary">
                          {nameOf(h.b)} {h.c}:{h.v}
                        </span>
                        <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                          {VERSIONS.find((x) => x.key === h.ver)?.short}
                        </span>
                      </span>
                      <span className="scripture mt-1 block text-sm text-foreground/90">
                        <Highlight text={h.text} q={debounced} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
