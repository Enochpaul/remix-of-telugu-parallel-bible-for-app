import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings as SettingsIcon,
  Share2,
  X,
  Copy,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { fetchIndex, fetchBook, ENGLISH_NAMES, type BookMeta, type Version } from "@/lib/bible";

interface ReaderSearch {
  b: number;
  c: number;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): ReaderSearch => ({
    b: Number(search.b) || 470,
    c: Number(search.c) || 1,
  }),
  component: Reader,
});

type Theme = "light" | "dark" | "sepia";
type ColKey = "telov" | "erv" | "telirv";

const ALL_COLS: { key: ColKey; label: string }[] = [
  { key: "telov", label: "TELOV (పాత అనువాదం)" },
  { key: "erv", label: "Easy-to-Read (ERV-te)" },
  { key: "telirv", label: "TEL IRV" },
];

const LS = {
  theme: "tb.theme",
  visible: "tb.visible",
  lastRead: "tb.lastRead",
};

function loadTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(LS.theme);
  return v === "dark" || v === "sepia" ? v : "light";
}
function loadVisible(): ColKey[] {
  if (typeof window === "undefined") return ["telov", "erv", "telirv"];
  try {
    const v = JSON.parse(localStorage.getItem(LS.visible) || "");
    if (Array.isArray(v) && v.length) return v.filter((x) => ALL_COLS.some((c) => c.key === x));
  } catch {}
  return ["telov", "erv", "telirv"];
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.remove("theme-dark", "theme-sepia");
  if (t === "dark") el.classList.add("theme-dark");
  if (t === "sepia") el.classList.add("theme-sepia");
}

function Reader() {
  const { b, c } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  // Restore last position on first mount (only if using default entry)
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(LS.lastRead);
      if (!raw) return;
      const saved = JSON.parse(raw) as { b: number; c: number; scroll?: number };
      if (saved?.b && saved?.c && (b !== saved.b || c !== saved.c) && b === 470 && c === 1) {
        navigate({ search: { b: saved.b, c: saved.c }, replace: true });
        setTimeout(() => window.scrollTo({ top: saved.scroll ?? 0 }), 100);
      } else if (saved?.scroll) {
        setTimeout(() => window.scrollTo({ top: saved.scroll ?? 0 }), 100);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [visible, setVisible] = useState<ColKey[]>(() => loadVisible());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [shareState, setShareState] = useState<{ verseIdx: number } | null>(null);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(LS.theme, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem(LS.visible, JSON.stringify(visible)); } catch {}
  }, [visible]);

  const indexQuery = useQuery({ queryKey: ["index"], queryFn: fetchIndex });
  const books = indexQuery.data;
  const meta = useMemo(() => books?.find((x) => x.n === b), [books, b]);
  const isNT = meta?.nt ?? b >= 470;

  const ervQuery = useQuery({ queryKey: ["erv", b], queryFn: () => fetchBook("erv", b) });
  const telovQuery = useQuery({ queryKey: ["telov", b], queryFn: () => fetchBook("telov", b) });
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

  const versesByKey: Record<ColKey, string[]> = {
    telov: telovVerses,
    erv: ervVerses,
    telirv: isNT ? telntVerses : telirvVerses,
  };

  const allColumns = ALL_COLS.map((c) => ({ ...c, verses: versesByKey[c.key] }));
  const activeColumns = allColumns.filter((c) => visible.includes(c.key));
  const columns = activeColumns.length ? activeColumns : allColumns;

  const verseCount = Math.max(0, ...columns.map((c) => c.verses.length));
  const loading =
    ervQuery.isLoading ||
    telovQuery.isLoading ||
    telirvQuery.isLoading ||
    (isNT && telntQuery.isLoading);

  const gridCols =
    columns.length === 1
      ? "md:grid-cols-1"
      : columns.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  const q = query.trim().toLowerCase();
  const filteredIdx = useMemo(() => {
    if (!q) return null;
    const arr: number[] = [];
    for (let i = 0; i < verseCount; i++) {
      if (columns.some((col) => (col.verses[i] ?? "").toLowerCase().includes(q))) arr.push(i);
    }
    return arr;
  }, [q, columns, verseCount]);

  // Persist last-read position (throttled via scroll listener + on chapter change)
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

  const reference = `${meta?.name ?? ""} ${chapter}`;
  const englishRef = `${ENGLISH_NAMES[b] ?? ""} ${chapter}`;

  return (
    <div className="min-h-screen">
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
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="rounded-md border bg-card p-1.5 transition-colors hover:bg-accent"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8">
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
          <ol className="space-y-1">
            {(filteredIdx ?? Array.from({ length: verseCount }, (_, i) => i)).map((i) => (
              <li
                key={i}
                className={`group relative grid grid-cols-1 gap-x-6 gap-y-1 rounded-md px-2 py-2 transition-colors hover:bg-accent/40 ${gridCols}`}
              >
                {columns.map((col, ci) => (
                  <p
                    key={col.label}
                    className={
                      ci === 0
                        ? "scripture"
                        : "scripture border-t border-dashed pt-1 md:border-t-0 md:border-l md:pl-6 md:pt-0"
                    }
                  >
                    <VerseNum n={i + 1} className={ci === 0 ? "" : "md:hidden"} />
                    <Highlighted text={col.verses[i] ?? ""} q={q} />
                  </p>
                ))}
                <button
                  onClick={() => setShareState({ verseIdx: i })}
                  aria-label={`Share verse ${i + 1}`}
                  className="absolute right-1 top-1 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
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

      {settingsOpen && (
        <SettingsPanel
          theme={theme}
          setTheme={setTheme}
          visible={visible}
          setVisible={setVisible}
          onClose={() => setSettingsOpen(false)}
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

function SettingsPanel({
  theme,
  setTheme,
  visible,
  setVisible,
  onClose,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  visible: ColKey[];
  setVisible: (v: ColKey[]) => void;
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
        className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg animate-in zoom-in-95"
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
            {(["light", "sepia", "dark"] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold">Visible translations</p>
          <div className="space-y-2">
            {ALL_COLS.map((col) => {
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
          <p className="mt-2 text-xs text-muted-foreground">Choose 1–3 translations to display.</p>
        </section>
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

    const bg = theme === "dark" ? "#1c1a17" : theme === "sepia" ? "#efe4ce" : "#faf6ec";
    const fg = theme === "dark" ? "#f0ead8" : "#2a1f18";
    const accent = theme === "dark" ? "#e0b464" : "#7a2418";
    const muted = theme === "dark" ? "#b0a68e" : "#7a6b58";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // border frame
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // reference header
    ctx.fillStyle = accent;
    ctx.font = "600 32px 'Noto Serif Telugu', serif";
    ctx.textAlign = "center";
    ctx.fillText(`${reference}:${verseNumber}`, w / 2, 130);
    ctx.fillStyle = muted;
    ctx.font = "400 22px 'Noto Sans', sans-serif";
    ctx.fillText(`${englishRef}:${verseNumber}`, w / 2, 168);

    // divider
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 60, 200);
    ctx.lineTo(w / 2 + 60, 200);
    ctx.stroke();

    // verse text (wrap)
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

    // footer
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
