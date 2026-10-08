import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings as SettingsIcon,
  Share2,
  Star,
  X,
  Copy,
  Image as ImageIcon,
  Check,
  Clock,
  MessageSquare,
  Loader2,
  Link2,
} from "lucide-react";
import { fetchIndex, fetchBook, ENGLISH_NAMES, type BookMeta } from "@/lib/bible";

interface ReaderSearch {
  b: number;
  c: number;
  v?: number;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "తెలుగు సమాంతర బైబిల్ | Parallel Bible Reader" },
      { name: "description", content: "Read and compare Telugu Bible translations verse by verse with an offline King James Version." },
      { property: "og:title", content: "తెలుగు సమాంతర బైబిల్ | Parallel Bible Reader" },
      { property: "og:description", content: "Read and compare Telugu Bible translations verse by verse with an offline King James Version." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): ReaderSearch => ({
    b: Number(search.b) || 470,
    c: Number(search.c) || 1,
    v: search.v ? Number(search.v) : undefined,
  }),
  component: Reader,
});

type Theme = "light" | "sepia" | "paper" | "forest" | "dark" | "midnight";
type TeluguKey = "telov" | "erv" | "telirv";
type EnglishKey = "kjv";
type ColKey = TeluguKey | EnglishKey;
type FontSize = "sm" | "md" | "lg" | "xl";
type LineSpacing = "tight" | "compact" | "comfortable" | "relaxed" | "spacious";
type VerseSpacing = "tight" | "compact" | "comfortable" | "relaxed" | "spacious";
type FontFamily =
  | "noto-serif" | "noto-sans" | "mandali" | "gurajada" | "ntr"
  | "ramabhadra" | "ponnala" | "suranna" | "suravaram" | "timmana"
  | "chathura" | "dhurjati" | "gidugu" | "lakki-reddy" | "mallanna"
  | "peddana" | "ramaraja" | "sree-krushnadevaraya" | "tenali-ramakrishna"
  | "veturi" | "sirivennela" | "ramaneeya" | "ravi-prakash" | "tana"
  | "annamayya" | "nandakam" | "purushothamaa";

const THEMES: { key: Theme; label: string; swatch: string }[] = [
  { key: "light", label: "Light", swatch: "theme-swatch-light" },
  { key: "sepia", label: "Sepia", swatch: "theme-swatch-sepia" },
  { key: "paper", label: "Paper", swatch: "theme-swatch-paper" },
  { key: "forest", label: "Forest", swatch: "theme-swatch-forest" },
  { key: "dark", label: "Dark", swatch: "theme-swatch-dark" },
  { key: "midnight", label: "Midnight", swatch: "theme-swatch-midnight" },
];

const TELUGU_COLS: { key: TeluguKey; label: string; short: string }[] = [
  { key: "telov", label: "TELOV (BSI)", short: "TELOV" },
  { key: "erv", label: "Easy-to-Read (ERV-te)", short: "ERV-te" },
  { key: "telirv", label: "TEL IRV", short: "TEL IRV" },
];
const ENGLISH_COLS: { key: EnglishKey; label: string; short: string }[] = [
  { key: "kjv", label: "King James Version (KJV)", short: "KJV" },
];
const ALL_COLS: { key: ColKey; label: string; short: string }[] = [
  ...TELUGU_COLS,
  ...ENGLISH_COLS,
];


const FONT_FAMILIES: { key: FontFamily; label: string; css: string }[] = [
  { key: "noto-serif", label: "Noto Serif Telugu", css: '"Noto Serif Telugu", "Noto Serif", serif' },
  { key: "noto-sans", label: "Noto Sans Telugu", css: '"Noto Sans Telugu", "Noto Sans", sans-serif' },
  { key: "mandali", label: "Mandali", css: '"Mandali", sans-serif' },
  { key: "gurajada", label: "Gurajada", css: '"Gurajada", serif' },
  { key: "ntr", label: "NTR", css: '"NTR", sans-serif' },
  { key: "ramabhadra", label: "Ramabhadra", css: '"Ramabhadra", sans-serif' },
  { key: "ponnala", label: "Ponnala", css: '"Ponnala", sans-serif' },
  { key: "suranna", label: "Suranna", css: '"Suranna", serif' },
  { key: "suravaram", label: "Suravaram", css: '"Suravaram", serif' },
  { key: "timmana", label: "Timmana", css: '"Timmana", serif' },
  { key: "chathura", label: "Chathura", css: '"Chathura", sans-serif' },
  { key: "dhurjati", label: "Dhurjati", css: '"Dhurjati", serif' },
  { key: "gidugu", label: "Gidugu", css: '"Gidugu", serif' },
  { key: "lakki-reddy", label: "Lakki Reddy", css: '"Lakki Reddy", cursive' },
  { key: "mallanna", label: "Mallanna", css: '"Mallanna", sans-serif' },
  { key: "peddana", label: "Peddana", css: '"Peddana", serif' },
  { key: "ramaraja", label: "Ramaraja", css: '"Ramaraja", serif' },
  { key: "sree-krushnadevaraya", label: "Sree Krushnadevaraya", css: '"Sree Krushnadevaraya", serif' },
  { key: "tenali-ramakrishna", label: "Tenali Ramakrishna", css: '"Tenali Ramakrishna", serif' },
  { key: "veturi", label: "Veturi", css: '"Veturi", serif' },
  { key: "sirivennela", label: "Sirivennela", css: '"Sirivennela", serif' },
  { key: "ramaneeya", label: "Ramaneeya", css: '"Ramaneeya", serif' },
  { key: "ravi-prakash", label: "Ravi Prakash", css: '"Ravi Prakash", serif' },
  { key: "tana", label: "TANA", css: '"TANA", serif' },
  { key: "annamayya", label: "Annamayya", css: '"Annamayya", serif' },
  { key: "nandakam", label: "Nandakam", css: '"Nandakam", serif' },
  { key: "purushothamaa", label: "Purushothamaa", css: '"Purushothamaa", serif' },
];

const CONTACT_EMAIL = "enochpaultheking@gmail.com";

const LS = {
  theme: "tb.theme",
  visible: "tb.visible",
  lastRead: "tb.lastRead",
  bookmarks: "tb.bookmarks",
  fontSize: "tb.fontSize",
  lineSpacing: "tb.lineSpacing",
  verseSpacing: "tb.verseSpacing",
  diff: "tb.diffHighlight",
  fontFamily: "tb.fontFamily",
  recents: "tb.recents",
};

const FONT_SIZE_PX: Record<FontSize, string> = {
  sm: "0.95rem",
  md: "1.0625rem",
  lg: "1.2rem",
  xl: "1.4rem",
};
const LINE_LEADING: Record<LineSpacing, string> = {
  tight: "1.35",
  compact: "1.55",
  comfortable: "2",
  relaxed: "2.2",
  spacious: "2.4",
};
const LINE_SPACING_OPTIONS: { value: LineSpacing; label: string }[] = [
  { value: "tight", label: "Tight" },
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "relaxed", label: "Relaxed" },
  { value: "spacious", label: "Spacious" },
];
const VERSE_GAP: Record<VerseSpacing, string> = {
  tight: "0rem",
  compact: "0.25rem",
  comfortable: "0.75rem",
  relaxed: "1.25rem",
  spacious: "1.75rem",
};
const VERSE_SPACING_OPTIONS: { value: VerseSpacing; label: string }[] = [
  { value: "tight", label: "Tight" },
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "relaxed", label: "Relaxed" },
  { value: "spacious", label: "Spacious" },
];

interface Recent { b: number; c: number; name?: string; ts: number; }

interface Bookmark {
  b: number;
  c: number;
  v: number;
  text?: string;
  bookName?: string;
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(LS.theme);
  return THEMES.some((theme) => theme.key === v) ? (v as Theme) : "light";
}
function loadVisible(): ColKey[] {
  if (typeof window === "undefined") return ["telov", "erv", "telirv"];
  try {
    const v = JSON.parse(localStorage.getItem(LS.visible) || "");
    if (Array.isArray(v) && v.length) return v.filter((x) => ALL_COLS.some((c) => c.key === x));
  } catch {}
  return ["telov", "erv", "telirv"];
}
function loadFontSize(): FontSize {
  const v = typeof window !== "undefined" ? localStorage.getItem(LS.fontSize) : null;
  return v === "sm" || v === "lg" || v === "xl" ? v : "md";
}
function loadLineSpacing(): LineSpacing {
  const v = typeof window !== "undefined" ? localStorage.getItem(LS.lineSpacing) : null;
  return LINE_SPACING_OPTIONS.some((option) => option.value === v)
    ? (v as LineSpacing)
    : "comfortable";
}
function loadVerseSpacing(): VerseSpacing {
  const v = typeof window !== "undefined" ? localStorage.getItem(LS.verseSpacing) : null;
  return VERSE_SPACING_OPTIONS.some((option) => option.value === v)
    ? (v as VerseSpacing)
    : "compact";
}
function loadDiff(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(LS.diff) === "1";
}
function loadFontFamily(): FontFamily {
  if (typeof window === "undefined") return "noto-serif";
  const v = localStorage.getItem(LS.fontFamily);
  return (FONT_FAMILIES.find((f) => f.key === v)?.key) ?? "noto-serif";
}
function loadRecents(): Recent[] {
  return loadJSON<Recent[]>(LS.recents, []);
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.remove("theme-dark", "theme-sepia", "theme-paper", "theme-forest", "theme-midnight");
  if (t !== "light") el.classList.add(`theme-${t}`);
}
function applyReading(fs: FontSize, ls: LineSpacing, vs: VerseSpacing, ff: FontFamily) {
  if (typeof document === "undefined") return;
  const s = document.documentElement.style;
  s.setProperty("--scripture-size", FONT_SIZE_PX[fs]);
  s.setProperty("--scripture-leading", LINE_LEADING[ls]);
  s.setProperty("--verse-gap", VERSE_GAP[vs]);
  const font = FONT_FAMILIES.find((f) => f.key === ff)?.css ?? FONT_FAMILIES[0].css;
  s.setProperty("--scripture-font", font);
}

// Simple Telugu/latin word tokenizer preserving punctuation
function tokenize(text: string): string[] {
  // split on whitespace, but also separate leading/trailing punctuation
  return text.split(/(\s+)/);
}
function normalize(word: string): string {
  return word.toLowerCase().replace(/[.,;:!?"'()\[\]{}—–\-\u0964\u0965]/g, "");
}

function Reader() {
  const { b, c, v: focusVerse } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(LS.lastRead);
      if (!raw) return;
      const saved = JSON.parse(raw) as { b: number; c: number; scroll?: number };
      if (saved?.b && saved?.c && (b !== saved.b || c !== saved.c) && b === 470 && c === 1 && !focusVerse) {
        navigate({ search: { b: saved.b, c: saved.c }, replace: true });
        setTimeout(() => window.scrollTo({ top: saved.scroll ?? 0 }), 100);
      } else if (saved?.scroll && !focusVerse) {
        setTimeout(() => window.scrollTo({ top: saved.scroll ?? 0 }), 100);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [visible, setVisible] = useState<ColKey[]>(() => loadVisible());
  const [fontSize, setFontSize] = useState<FontSize>(() => loadFontSize());
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(() => loadLineSpacing());
  const [verseSpacing, setVerseSpacing] = useState<VerseSpacing>(() => loadVerseSpacing());
  const [diffOn, setDiffOn] = useState<boolean>(() => loadDiff());
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => loadFontFamily());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [recentsOpen, setRecentsOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [shareState, setShareState] = useState<{ verseIdx: number } | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadJSON<Bookmark[]>(LS.bookmarks, []));
  const [recents, setRecents] = useState<Recent[]>(() => loadRecents());


  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(LS.theme, theme); } catch {}
  }, [theme]);
  useEffect(() => {
    applyReading(fontSize, lineSpacing, verseSpacing, fontFamily);
    try {
      localStorage.setItem(LS.fontSize, fontSize);
      localStorage.setItem(LS.lineSpacing, lineSpacing);
      localStorage.setItem(LS.verseSpacing, verseSpacing);
      localStorage.setItem(LS.fontFamily, fontFamily);
    } catch {}
  }, [fontSize, lineSpacing, verseSpacing, fontFamily]);
  useEffect(() => {
    try { localStorage.setItem(LS.visible, JSON.stringify(visible)); } catch {}
  }, [visible]);
  useEffect(() => {
    try { localStorage.setItem(LS.bookmarks, JSON.stringify(bookmarks)); } catch {}
  }, [bookmarks]);
  useEffect(() => {
    try { localStorage.setItem(LS.diff, diffOn ? "1" : "0"); } catch {}
  }, [diffOn]);
  useEffect(() => {
    try { localStorage.setItem(LS.recents, JSON.stringify(recents)); } catch {}
  }, [recents]);


  const indexQuery = useQuery({ queryKey: ["index"], queryFn: fetchIndex });
  const books = indexQuery.data;
  const meta = useMemo(() => books?.find((x) => x.n === b), [books, b]);
  const isNT = meta?.nt ?? b >= 470;

  const ervQuery = useQuery({ queryKey: ["erv", b], queryFn: () => fetchBook("erv", b) });
  const telovQuery = useQuery({ queryKey: ["telov", b], queryFn: () => fetchBook("telov", b) });
  const { data: telovNotes } = useQuery({
    queryKey: ["telov-notes"],
    queryFn: async () => (await fetch("/bible/telov-notes.json")).json() as Promise<Record<string, string>>,
    staleTime: Infinity,
  });
  const telntQuery = useQuery({
    queryKey: ["telnt", b],
    queryFn: () => fetchBook("telnt", b),
    enabled: isNT,
  });
  const telirvQuery = useQuery({ queryKey: ["telirv", b], queryFn: () => fetchBook("telirv", b) });

  const chapter = Math.min(c, meta?.ch ?? c);
  const ervVerses = ervQuery.data?.chapters[chapter - 1] ?? [];
  const telovVerses = telovQuery.data?.chapters[chapter - 1] ?? [];
  const telirvVerses = telirvQuery.data?.chapters[chapter - 1] ?? [];
  const telntVerses = isNT ? (telntQuery.data?.chapters[chapter - 1] ?? []) : [];

  const kjvQuery = useQuery({
    queryKey: ["kjv", b],
    queryFn: () => fetchBook("kjv", b),
    enabled: visible.includes("kjv"),
  });

  const versesByKey: Record<ColKey, string[]> = {
    telov: telovVerses,
    erv: ervVerses,
    telirv: isNT ? telntVerses : telirvVerses,
    kjv: kjvQuery.data?.chapters[chapter - 1] ?? [],
  };

  const allColumns = ALL_COLS.map((c) => ({ ...c, verses: versesByKey[c.key] }));
  const activeColumns = allColumns.filter((c) => visible.includes(c.key));
  const columns = activeColumns.length ? activeColumns : allColumns.filter((c) => TELUGU_COLS.some((t) => t.key === c.key));

  const verseCount = Math.max(0, ...columns.map((c) => c.verses.length));
  const loading =
    ervQuery.isLoading ||
    telovQuery.isLoading ||
    telirvQuery.isLoading ||
    (isNT && telntQuery.isLoading) ||
    (visible.includes("kjv") && kjvQuery.isLoading);

  const gridColsMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
    7: "md:grid-cols-7",
  };
  const gridCols = gridColsMap[columns.length] ?? "md:grid-cols-3";


  const q = query.trim().toLowerCase();
  const filteredIdx = useMemo(() => {
    if (!q) return null;
    const arr: number[] = [];
    for (let i = 0; i < verseCount; i++) {
      if (columns.some((col) => (col.verses[i] ?? "").toLowerCase().includes(q))) arr.push(i);
    }
    return arr;
  }, [q, columns, verseCount]);

  // Persist last-read position
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(
          LS.lastRead,
          JSON.stringify({ b, c: chapter, scroll: window.scrollY }),
        );
      } catch {}
    };
    save();
    let t: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (t) return;
      t = setTimeout(() => {
        save();
        t = null;
      }, 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [b, chapter]);

  // Track recent chapters
  useEffect(() => {
    if (!meta) return;
    setRecents((cur) => {
      const filtered = cur.filter((r) => !(r.b === b && r.c === chapter));
      const next = [{ b, c: chapter, name: meta.name, ts: Date.now() }, ...filtered];
      return next.slice(0, 12);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b, chapter, meta?.name]);

  // Scroll to focused verse (from bookmark nav)
  useEffect(() => {
    if (!focusVerse || loading) return;
    const el = document.getElementById(`v-${focusVerse}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-gold");
      setTimeout(() => el.classList.remove("ring-2", "ring-gold"), 2200);
    }
  }, [focusVerse, loading, b, chapter]);

  const go = (nb: number, nc: number) => {
    navigate({ search: { b: nb, c: nc } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prev = () => {
    if (chapter > 1) return go(b, chapter - 1);
    const i = books?.findIndex((x) => x.n === b) ?? -1;
    if (books && i > 0) go(books[i - 1].n, books[i - 1].ch);
  };
  const next = () => {
    if (meta && chapter < meta.ch) return go(b, chapter + 1);
    const i = books?.findIndex((x) => x.n === b) ?? -1;
    if (books && i >= 0 && i < books.length - 1) go(books[i + 1].n, 1);
  };

  const bookmarkSet = useMemo(
    () => new Set(bookmarks.map((x) => `${x.b}:${x.c}:${x.v}`)),
    [bookmarks],
  );
  const toggleBookmark = useCallback(
    (verseIdx: number) => {
      const v = verseIdx + 1;
      const key = `${b}:${chapter}:${v}`;
      setBookmarks((cur) => {
        if (cur.some((x) => `${x.b}:${x.c}:${x.v}` === key)) {
          return cur.filter((x) => `${x.b}:${x.c}:${x.v}` !== key);
        }
        const text = columns[0]?.verses[verseIdx] ?? "";
        return [
          ...cur,
          { b, c: chapter, v, text: text.slice(0, 220), bookName: meta?.name },
        ];
      });
    },
    [b, chapter, columns, meta?.name],
  );

  const reference = `${meta?.name ?? ""} ${chapter}`;
  const englishRef = `${ENGLISH_NAMES[b] ?? ""} ${chapter}`;

  // Compute diff word sets per verse (only when enabled and >=2 cols)
  const diffSets = useMemo(() => {
    if (!diffOn || columns.length < 2) return null;
    const sets: Array<Set<string>[]> = [];
    for (let i = 0; i < verseCount; i++) {
      const perCol = columns.map((c) => {
        const set = new Set<string>();
        for (const w of tokenize(c.verses[i] ?? "")) {
          const n = normalize(w);
          if (n) set.add(n);
        }
        return set;
      });
      sets.push(perCol);
    }
    return sets;
  }, [diffOn, columns, verseCount]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5 shrink-0" aria-hidden />
            <h1 className="font-telugu-serif text-base font-bold sm:text-lg">తెలుగు బైబిల్</h1>
          </div>

          <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:ml-2 sm:w-auto sm:flex-1 sm:max-w-md">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="వచనం వెతకండి..."
                aria-label="వచనం వెతకండి"
                className="w-full rounded-md border bg-background py-1.5 pl-8 pr-8 text-sm outline-none ring-ring focus:ring-2"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <BookSelect books={books} value={b} onChange={(nb) => go(nb, 1)} />
            <ChapterSelect count={meta?.ch ?? 1} value={chapter} onChange={(nc) => go(b, nc)} />
            <button
              onClick={() => setFavoritesOpen(true)}
              aria-label="Favorites"
              title="Favorites"
              className="relative rounded-md border bg-card p-1.5 transition-colors hover:bg-accent"
            >
              <Star className="h-4 w-4" />
              {bookmarks.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-tight">
                  {bookmarks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setRecentsOpen(true)}
              aria-label="Recent"
              title="Recent chapters"
              className="rounded-md border bg-card p-1.5 transition-colors hover:bg-accent"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="rounded-md border bg-card p-1.5 transition-colors hover:bg-accent"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8">
        <div className="mb-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-verse-number">
            {englishRef}
          </p>
          <h2 className="font-telugu-serif mt-1 text-2xl font-bold text-primary sm:text-3xl">
            {reference}
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-gold" />
          {q && (
            <p className="mt-3 text-xs text-muted-foreground">
              {filteredIdx?.length ?? 0} matching verse{(filteredIdx?.length ?? 0) === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <div className={`mb-6 hidden gap-6 border-b pb-2 md:grid ${gridCols}`}>
          {columns.map((col) => (
            <p key={col.label} className="text-center text-sm font-semibold text-muted-foreground">
              {col.label}
            </p>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4" aria-busy>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <ol className="verse-list">
            {(filteredIdx ?? Array.from({ length: verseCount }, (_, i) => i)).map((i) => {
              const vNum = i + 1;
              const isBookmarked = bookmarkSet.has(`${b}:${chapter}:${vNum}`);
              return (
                <li
                  id={`v-${vNum}`}
                  key={i}
                  className={`verse-row group relative grid grid-cols-1 gap-x-6 gap-y-2 rounded-md border-b border-border/70 px-1 py-0 pr-9 transition-colors hover:bg-accent/40 md:border-b-0 md:px-2 ${gridCols}`}
                >
                  {columns.map((col, ci) => (
                    <p
                      key={col.label}
                      className={
                        ci === 0
                          ? "translation-text scripture border-l-2 border-primary/60 bg-muted/35 px-3 py-2 md:border-l-0 md:bg-transparent md:px-0 md:py-0"
                          : "translation-text scripture border-l-2 border-gold/70 bg-muted/35 px-3 py-2 md:border-l md:border-t-0 md:bg-transparent md:py-0 md:pl-6"
                      }
                    >
                      <span className="mb-1 flex items-center gap-2 md:hidden">
                        <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-secondary-foreground">
                          {col.label}
                        </span>
                        <VerseNum n={vNum} />
                      </span>
                      <VerseNum n={vNum} className="hidden md:inline" />
                      <VerseText
                        text={col.verses[i] ?? ""}
                        q={q}
                        diffSets={diffSets ? diffSets[i] : null}
                        colIdx={ci}
                        noteKey={col.short === "TELOV" ? `${b}:${chapter}:${vNum}` : undefined}
                        notes={telovNotes}
                      />
                    </p>
                  ))}
                  <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      onClick={() => toggleBookmark(i)}
                      aria-label={isBookmarked ? `Remove bookmark verse ${vNum}` : `Bookmark verse ${vNum}`}
                      className={`rounded p-1 hover:bg-accent ${isBookmarked ? "text-gold opacity-100" : "text-muted-foreground hover:text-foreground"}`}
                      style={isBookmarked ? { opacity: 1 } : undefined}
                    >
                      <Star className="h-3.5 w-3.5" fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => setShareState({ verseIdx: i })}
                      aria-label={`Share verse ${vNum}`}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {isBookmarked && (
                    <span className="pointer-events-none absolute left-0 top-2 h-[calc(100%-1rem)] w-0.5 rounded bg-gold" aria-hidden />
                  )}
                </li>
              );
            })}
            {q && filteredIdx?.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                No verses match "{query}" in this chapter.
              </li>
            )}
          </ol>
        )}

        <nav className="mt-10 flex items-center justify-between">
          <button
            onClick={prev}
            className="inline-flex items-center gap-1 rounded-md border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden /> మునుపటి
          </button>
          <button
            onClick={next}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            తదుపరి <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      </main>

      <footer className="border-t bg-card/60">
        <div className="mx-auto max-w-4xl space-y-3 px-4 py-4 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span />
            <button
              onClick={() => setCommentOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-[11px] font-medium text-foreground/70 hover:bg-accent"
            >
              <MessageSquare className="h-3 w-3" aria-hidden /> Send a comment
            </button>
          </div>
          <p>
            <span className="font-semibold text-foreground/80">Copyright Notice:</span>{" "}
            This website is provided solely for personal Bible study, comparison, education, and research purposes.
            All Bible translation copyrights remain the property of their respective copyright holders. No copyright
            infringement is intended. If you are a copyright owner and have any concerns regarding the use of your
            content, please contact{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Copyright%20concern%20-%20Telugu%20Parallel%20Bible`}
              className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            so that the matter can be addressed promptly.
          </p>
        </div>
      </footer>

      {settingsOpen && (
        <SettingsPanel
          theme={theme}
          setTheme={setTheme}
          visible={visible}
          setVisible={setVisible}
          fontSize={fontSize}
          setFontSize={setFontSize}
          lineSpacing={lineSpacing}
          setLineSpacing={setLineSpacing}
          verseSpacing={verseSpacing}
          setVerseSpacing={setVerseSpacing}
          diffOn={diffOn}
          setDiffOn={setDiffOn}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {recentsOpen && (
        <RecentsPanel
          recents={recents}
          onOpen={(r) => {
            setRecentsOpen(false);
            navigate({ search: { b: r.b, c: r.c } });
          }}
          onClear={() => setRecents([])}
          onClose={() => setRecentsOpen(false)}
        />
      )}

      {commentOpen && (
        <CommentDialog onClose={() => setCommentOpen(false)} />
      )}

      {favoritesOpen && (
        <FavoritesPanel
          bookmarks={bookmarks}
          onRemove={(bm) =>
            setBookmarks((cur) =>
              cur.filter((x) => !(x.b === bm.b && x.c === bm.c && x.v === bm.v)),
            )
          }
          onClear={() => setBookmarks([])}
          onOpen={(bm) => {
            setFavoritesOpen(false);
            navigate({ search: { b: bm.b, c: bm.c, v: bm.v } });
          }}
          onClose={() => setFavoritesOpen(false)}
        />
      )}

      {shareState && (
        <ShareDialog
          onClose={() => setShareState(null)}
          verseNumber={shareState.verseIdx + 1}
          reference={reference}
          englishRef={englishRef}
          columns={columns.map((c) => ({
            label: c.label,
            text: c.verses[shareState.verseIdx] ?? "",
          }))}
          theme={theme}
        />
      )}

    </div>
  );
}

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const toSup = (n: string) => n.replace(/\d/g, (d) => SUPERSCRIPTS[+d]);

function VerseText({
  text,
  q,
  diffSets,
  colIdx,
  noteKey,
  notes,
}: {
  text: string;
  q: string;
  diffSets: Set<string>[] | null;
  colIdx: number;
  noteKey?: string;
  notes?: Record<string, string>;
}) {
  if (noteKey && /\[\d+\]/.test(text)) {
    const parts = text.split(/\s?\[(\d+)\]/);
    return (
      <>
        {parts.map((p, idx) => {
          if (idx % 2 === 0)
            return p ? (
              <VerseText key={idx} text={p} q={q} diffSets={diffSets} colIdx={colIdx} />
            ) : null;
          const note = notes?.[`${noteKey}:${p}`];
          return (
            <Popover key={idx}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Footnote ${p}`}
                  className="mx-0.5 align-super text-[0.7em] font-semibold text-primary hover:underline"
                >
                  {toSup(p)}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-sm">
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  TELOV (BSI) footnote {p}
                </div>
                <div className="scripture">{note ?? "—"}</div>
              </PopoverContent>
            </Popover>
          );
        })}
      </>
    );
  }
  // Priority: if search query, only show search highlight (skip diff to avoid clash).
  if (q) return <Highlighted text={text} q={q} />;
  if (!diffSets) return <>{text}</>;
  const own = diffSets[colIdx];
  const others = diffSets.filter((_, i) => i !== colIdx);
  const tokens = tokenize(text);
  return (
    <>
      {tokens.map((tok, idx) => {
        if (/^\s+$/.test(tok)) return tok;
        const n = normalize(tok);
        if (!n) return tok;
        const inAllOthers = others.length > 0 && others.every((s) => s.has(n));
        if (inAllOthers) return tok;
        return (
          <mark key={idx} className="diff-hit">
            {tok}
          </mark>
        );
      })}
    </>
  );
}

function Highlighted({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} className="search-hit">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

function VerseNum({ n, className = "" }: { n: number; className?: string }) {
  return (
    <sup className={`mr-1.5 select-none text-[0.7rem] font-bold text-verse-number ${className}`}>
      {n}
    </sup>
  );
}

function BookSelect({
  books,
  value,
  onChange,
}: {
  books?: BookMeta[];
  value: number;
  onChange: (n: number) => void;
}) {
  const ot = books?.filter((x) => !x.nt) ?? [];
  const nt = books?.filter((x) => x.nt) ?? [];
  return (
    <select
      aria-label="గ్రంథం ఎంచుకోండి"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="max-w-[9rem] rounded-md border bg-card px-2 py-1.5 text-sm font-medium outline-none ring-ring focus:ring-2 sm:max-w-none"
    >
      <optgroup label="పాత నిబంధన">
        {ot.map((x) => (
          <option key={x.n} value={x.n}>{x.name}</option>
        ))}
      </optgroup>
      <optgroup label="క్రొత్త నిబంధన">
        {nt.map((x) => (
          <option key={x.n} value={x.n}>{x.name}</option>
        ))}
      </optgroup>
    </select>
  );
}

function ChapterSelect({
  count,
  value,
  onChange,
}: {
  count: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <select
      aria-label="అధ్యాయం ఎంచుకోండి"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-md border bg-card px-2 py-1.5 text-sm font-medium outline-none ring-ring focus:ring-2"
    >
      {Array.from({ length: count }).map((_, i) => (
        <option key={i} value={i + 1}>{i + 1}</option>
      ))}
    </select>
  );
}

function SegmentedButtons<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (t: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md border px-2 py-2 text-xs font-medium capitalize transition-colors ${
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card hover:bg-accent"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SettingsPanel({
  theme,
  setTheme,
  visible,
  setVisible,
  fontSize,
  setFontSize,
  lineSpacing,
  setLineSpacing,
  verseSpacing,
  setVerseSpacing,
  diffOn,
  setDiffOn,
  fontFamily,
  setFontFamily,
  onClose,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  visible: ColKey[];
  setVisible: (v: ColKey[]) => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;
  lineSpacing: LineSpacing;
  setLineSpacing: (l: LineSpacing) => void;
  verseSpacing: VerseSpacing;
  setVerseSpacing: (v: VerseSpacing) => void;
  diffOn: boolean;
  setDiffOn: (v: boolean) => void;
  fontFamily: FontFamily;
  setFontFamily: (f: FontFamily) => void;
  onClose: () => void;
}) {
  const toggle = (k: ColKey) => {
    setVisible(
      visible.includes(k)
        ? visible.filter((x) => x !== k)
        : [...visible, k].sort(
            (a, b) => ALL_COLS.findIndex((c) => c.key === a) - ALL_COLS.findIndex((c) => c.key === b),
          ),
    );
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border bg-card p-6 shadow-lg animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-telugu-serif text-lg font-bold text-primary">Settings</h3>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <section className="mb-6">
          <p className="mb-2 text-sm font-semibold">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((option) => (
              <button
                key={option.key}
                onClick={() => setTheme(option.key)}
                aria-pressed={theme === option.key}
                className={`flex min-h-12 items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  theme === option.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent"
                }`}
              >
                <span className={`h-4 w-4 shrink-0 rounded-full border border-current/25 ${option.swatch}`} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label htmlFor="verse-spacing" className="text-sm font-semibold">Space between verses</label>
            <span className="text-xs font-medium text-primary">
              {VERSE_SPACING_OPTIONS.find((option) => option.value === verseSpacing)?.label}
            </span>
          </div>
          <Slider
            id="verse-spacing"
            min={0}
            max={VERSE_SPACING_OPTIONS.length - 1}
            step={1}
            value={[Math.max(0, VERSE_SPACING_OPTIONS.findIndex((option) => option.value === verseSpacing))]}
            onValueChange={([value]) => {
              const option = VERSE_SPACING_OPTIONS[value ?? 1];
              if (option) setVerseSpacing(option.value);
            }}
            aria-label="Space between verses"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>Tight</span>
            <span>Spacious</span>
          </div>
        </section>

        <section className="mb-6">
          <p className="mb-2 text-sm font-semibold">Font size</p>
          <SegmentedButtons<FontSize>
            value={fontSize}
            onChange={setFontSize}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
              { value: "xl", label: "X-Large" },
            ]}
          />
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label htmlFor="line-spacing" className="text-sm font-semibold">Line spacing</label>
            <span className="text-xs font-medium text-primary">
              {LINE_SPACING_OPTIONS.find((option) => option.value === lineSpacing)?.label}
            </span>
          </div>
          <Slider
            id="line-spacing"
            min={0}
            max={LINE_SPACING_OPTIONS.length - 1}
            step={1}
            value={[Math.max(0, LINE_SPACING_OPTIONS.findIndex((option) => option.value === lineSpacing))]}
            onValueChange={([value]) => {
              const option = LINE_SPACING_OPTIONS[value ?? 2];
              if (option) setLineSpacing(option.value);
            }}
            aria-label="Line spacing"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>Tight</span>
            <span>Spacious</span>
          </div>
        </section>

        <section className="mb-6">
          <p className="mb-2 text-sm font-semibold">Telugu font</p>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as FontFamily)}
            className="w-full rounded-md border bg-card px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.key} value={f.key} style={{ fontFamily: f.css }}>
                {f.label}
              </option>
            ))}
          </select>
          <p
            className="mt-2 rounded-md border bg-background/60 p-2 text-sm"
            style={{ fontFamily: FONT_FAMILIES.find((f) => f.key === fontFamily)?.css }}
          >
            ఆదియందు దేవుడు భూమ్యాకాశములను సృజించెను.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Additional Unicode fonts courtesy of{" "}
            <a
              href="http://freetelugufonts.com/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              FreeTeluguFonts.com
            </a>.
          </p>
        </section>

        <section className="mb-6">
          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-md border bg-card p-3">
            <span>
              <span className="block text-sm font-semibold">Highlight translation differences</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Subtly highlights words that differ between the visible translations.
              </span>
            </span>
            <input
              type="checkbox"
              checked={diffOn}
              onChange={(e) => setDiffOn(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
            />
          </label>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold">Visible translations</p>
          {(["Telugu", "English"] as const).map((group) => {
            const list = group === "Telugu" ? TELUGU_COLS : ENGLISH_COLS;
            return (
              <div key={group} className="mb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                <div className="space-y-2">
                  {list.map((col) => {
                    const on = visible.includes(col.key);
                    const isLast = on && visible.length === 1;
                    return (
                      <label
                        key={col.key}
                        className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm ${
                          on ? "border-primary/50 bg-accent/30" : "bg-card"
                        } ${isLast ? "opacity-70" : ""}`}
                      >
                        <span>{col.label}</span>
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={isLast}
                          onChange={() => toggle(col.key)}
                          className="h-4 w-4 accent-[var(--color-primary)]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className="mt-1 text-xs text-muted-foreground">
            Choose any combination. All translations are stored on the device and work offline.
          </p>
        </section>



      </div>
    </div>
  );
}

function FavoritesPanel({
  bookmarks,
  onOpen,
  onRemove,
  onClear,
  onClose,
}: {
  bookmarks: Bookmark[];
  onOpen: (bm: Bookmark) => void;
  onRemove: (bm: Bookmark) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<number, Bookmark[]>();
    for (const bm of bookmarks) {
      const list = map.get(bm.b) ?? [];
      list.push(bm);
      map.set(bm.b, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([bookNum, list]) => ({
        bookNum,
        name: list[0].bookName ?? ENGLISH_NAMES[bookNum] ?? String(bookNum),
        items: [...list].sort((a, b) => a.c - b.c || a.v - b.v),
      }));
  }, [bookmarks]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Favorites"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-telugu-serif text-lg font-bold text-primary">Favorites</h3>
            <p className="text-xs text-muted-foreground">
              {bookmarks.length} bookmarked verse{bookmarks.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {bookmarks.length > 0 && (
              <button
                onClick={onClear}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No favorites yet. Tap the ⭐ next to any verse to save it here.
          </p>
        ) : (
          <div className="space-y-5">
            {grouped.map((g) => (
              <section key={g.bookNum}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-verse-number">
                  {g.name}
                </p>
                <ul className="space-y-2">
                  {g.items.map((bm) => (
                    <li
                      key={`${bm.b}-${bm.c}-${bm.v}`}
                      className="group flex items-start justify-between gap-3 rounded-md border bg-background/50 p-3 hover:bg-accent/40"
                    >
                      <button
                        onClick={() => onOpen(bm)}
                        className="flex-1 text-left"
                      >
                        <p className="text-xs font-semibold text-primary">
                          {g.name} {bm.c}:{bm.v}
                        </p>
                        {bm.text && (
                          <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{bm.text}</p>
                        )}
                      </button>
                      <button
                        onClick={() => onRemove(bm)}
                        aria-label="Remove bookmark"
                        className="rounded p-1 text-muted-foreground opacity-60 hover:bg-accent hover:text-foreground group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShareDialog({
  onClose,
  verseNumber,
  reference,
  englishRef,
  columns,
  theme,
}: {
  onClose: () => void;
  verseNumber: number;
  reference: string;
  englishRef: string;
  columns: { label: string; text: string }[];
  theme: Theme;
}) {
  const [copied, setCopied] = useState<"plain" | "formatted" | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  const plain = columns.map((c) => c.text).filter(Boolean).join("\n\n");
  const formatted =
    columns
      .filter((c) => c.text)
      .map((c) => `${c.text}\n— ${c.label}`)
      .join("\n\n") + `\n\n${reference}:${verseNumber} (${englishRef}:${verseNumber})`;

  const copy = async (kind: "plain" | "formatted") => {
    const text = kind === "plain" ? plain : formatted;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: formatted, title: `${reference}:${verseNumber}` });
      } catch {}
    } else {
      copy("formatted");
    }
  };

  const generateImage = () => {
    const w = 1080;
    const h = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sharePalette: Record<Theme, { bg: string; fg: string; accent: string; muted: string }> = {
      light: { bg: "#faf6ec", fg: "#2a1f18", accent: "#7a2418", muted: "#7a6b58" },
      sepia: { bg: "#efe4ce", fg: "#33251b", accent: "#7b3e20", muted: "#796653" },
      paper: { bg: "#fcfcfa", fg: "#20242b", accent: "#274d7a", muted: "#66707d" },
      forest: { bg: "#e7f0e4", fg: "#223228", accent: "#286044", muted: "#607163" },
      dark: { bg: "#1c1a17", fg: "#f0ead8", accent: "#e0b464", muted: "#b0a68e" },
      midnight: { bg: "#141927", fg: "#eee9dc", accent: "#dfb664", muted: "#aaa99f" },
    };
    const { bg, fg, accent, muted } = sharePalette[theme];

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    ctx.fillStyle = accent;
    ctx.font = "600 32px 'Noto Serif Telugu', serif";
    ctx.textAlign = "center";
    ctx.fillText(`${reference}:${verseNumber}`, w / 2, 130);
    ctx.fillStyle = muted;
    ctx.font = "400 22px 'Noto Sans', sans-serif";
    ctx.fillText(`${englishRef}:${verseNumber}`, w / 2, 168);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 60, 200);
    ctx.lineTo(w / 2 + 60, 200);
    ctx.stroke();

    let y = 260;
    const maxWidth = w - 160;
    for (const col of columns) {
      if (!col.text) continue;
      ctx.fillStyle = fg;
      ctx.font = "500 34px 'Noto Serif Telugu', serif";
      ctx.textAlign = "left";
      y = wrapText(ctx, col.text, 80, y, maxWidth, 52);
      y += 12;
      ctx.fillStyle = muted;
      ctx.font = "italic 20px 'Noto Sans', sans-serif";
      ctx.fillText(`— ${col.label}`, 80, y);
      y += 60;
      if (y > h - 140) break;
    }

    ctx.fillStyle = muted;
    ctx.font = "400 18px 'Noto Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("తెలుగు బైబిల్ · Telugu Parallel Bible", w / 2, h - 70);

    setImgUrl(canvas.toDataURL("image/png"));
  };

  const downloadImage = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `${englishRef.replace(/\s+/g, "-")}-${verseNumber}.png`;
    a.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share verse"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-telugu-serif text-lg font-bold text-primary">
              {reference}:{verseNumber}
            </h3>
            <p className="text-xs text-muted-foreground">{englishRef}:{verseNumber}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 max-h-40 space-y-2 overflow-y-auto rounded-md border bg-background/50 p-3">
          {columns
            .filter((c) => c.text)
            .map((c) => (
              <div key={c.label}>
                <p className="scripture">{c.text}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
              </div>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button onClick={() => copy("plain")} className="inline-flex items-center justify-center gap-1 rounded-md border bg-card px-3 py-2 text-xs font-medium hover:bg-accent">
            {copied === "plain" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Plain
          </button>
          <button onClick={() => copy("formatted")} className="inline-flex items-center justify-center gap-1 rounded-md border bg-card px-3 py-2 text-xs font-medium hover:bg-accent">
            {copied === "formatted" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            With ref
          </button>
          <button onClick={share} className="inline-flex items-center justify-center gap-1 rounded-md border bg-card px-3 py-2 text-xs font-medium hover:bg-accent">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button onClick={generateImage} className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <ImageIcon className="h-3.5 w-3.5" /> Image
          </button>
        </div>

        {imgUrl && (
          <div className="mt-4 space-y-2">
            <img src={imgUrl} alt="Verse preview" className="w-full rounded-md border" />
            <button
              onClick={downloadImage}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Download PNG
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function RecentsPanel({
  recents,
  onOpen,
  onClear,
  onClose,
}: {
  recents: Recent[];
  onOpen: (r: Recent) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recent chapters"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border bg-card p-5 shadow-lg animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-telugu-serif text-lg font-bold text-primary">Recent chapters</h3>
          <div className="flex items-center gap-1">
            {recents.length > 0 && (
              <button
                onClick={onClear}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                Clear
              </button>
            )}
            <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {recents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No recent chapters yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {recents.map((r) => (
              <li key={`${r.b}-${r.c}-${r.ts}`}>
                <button
                  onClick={() => onOpen(r)}
                  className="flex w-full items-center justify-between rounded-md border bg-background/50 px-3 py-2 text-left text-sm hover:bg-accent/50"
                >
                  <span className="font-medium text-foreground">
                    {r.name ?? ENGLISH_NAMES[r.b] ?? r.b} {r.c}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(r.ts).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CommentDialog({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!text.trim()) return;
    const subject = encodeURIComponent("Telugu Parallel Bible — Comment");
    const body = encodeURIComponent(text);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Send a comment"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-telugu-serif text-lg font-bold text-primary">Send a comment</h3>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Your message opens in your email app and is sent privately to the site admin at{" "}
          <span className="font-medium text-foreground/80">{CONTACT_EMAIL}</span>. Only the admin can read it.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Share feedback, a correction, or a suggestion…"
          className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={send}
            disabled={!text.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {sent ? "Opened email…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
