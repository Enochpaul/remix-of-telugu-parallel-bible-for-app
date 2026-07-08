import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchIndex, fetchBook, ENGLISH_NAMES, type BookMeta } from "@/lib/bible";

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

function Reader() {
  const { b, c } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const indexQuery = useQuery({ queryKey: ["index"], queryFn: fetchIndex });
  const books = indexQuery.data;
  const meta = useMemo(() => books?.find((x) => x.n === b), [books, b]);
  const isNT = meta?.nt ?? b >= 470;

  const ervQuery = useQuery({
    queryKey: ["erv", b],
    queryFn: () => fetchBook("erv", b),
  });
  const telovQuery = useQuery({
    queryKey: ["telov", b],
    queryFn: () => fetchBook("telov", b),
  });
  const telntQuery = useQuery({
    queryKey: ["telnt", b],
    queryFn: () => fetchBook("telnt", b),
    enabled: isNT,
  });
  const telirvQuery = useQuery({
    queryKey: ["telirv", b],
    queryFn: () => fetchBook("telirv", b),
  });

  const chapter = Math.min(c, meta?.ch ?? c);
  const ervVerses = ervQuery.data?.chapters[chapter - 1] ?? [];
  const telovVerses = telovQuery.data?.chapters[chapter - 1] ?? [];
  const telirvVerses = telirvQuery.data?.chapters[chapter - 1] ?? [];
  const telntVerses = isNT ? (telntQuery.data?.chapters[chapter - 1] ?? []) : [];
  const verseCount = Math.max(
    ervVerses.length,
    telovVerses.length,
    telirvVerses.length,
    telntVerses.length,
  );
  const loading =
    ervQuery.isLoading ||
    telovQuery.isLoading ||
    telirvQuery.isLoading ||
    (isNT && telntQuery.isLoading);

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

  const columns = isNT
    ? [
        { label: "TELOV (పాత అనువాదం)", verses: telovVerses },
        { label: "TELIRV (IRV 2019)", verses: telirvVerses },
        { label: "Easy-to-Read (ERV-te)", verses: ervVerses },
        { label: "Telugu NT (TELNT)", verses: telntVerses },
      ]
    : [
        { label: "TELOV (పాత అనువాదం)", verses: telovVerses },
        { label: "TELIRV (IRV 2019)", verses: telirvVerses },
        { label: "Easy-to-Read (ERV-te)", verses: ervVerses },
      ];
  const gridCols = isNT ? "md:grid-cols-4" : "md:grid-cols-3";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" aria-hidden />
            <h1 className="font-telugu-serif text-lg font-bold">తెలుగు బైబిల్</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <BookSelect books={books} value={b} onChange={(nb) => go(nb, 1)} />
            <ChapterSelect count={meta?.ch ?? 1} value={chapter} onChange={(nc) => go(b, nc)} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8">
        <div className="mb-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-verse-number">
            {ENGLISH_NAMES[b] ?? ""} {chapter}
          </p>
          <h2 className="font-telugu-serif mt-1 text-2xl font-bold text-primary sm:text-3xl">
            {meta?.name} {chapter}
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-gold" />
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
            {Array.from({ length: verseCount }).map((_, i) => (
              <li
                key={i}
                className={`grid grid-cols-1 gap-x-6 gap-y-1 rounded-md px-2 py-2 transition-colors hover:bg-accent/40 ${gridCols}`}
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
                    {col.verses[i] ?? ""}
                  </p>
                ))}
              </li>
            ))}
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
    </div>
  );
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
      className="max-w-[11rem] rounded-md border bg-card px-2 py-1.5 text-sm font-medium outline-none ring-ring focus:ring-2 sm:max-w-none"
    >
      <optgroup label="పాత నిబంధన">
        {ot.map((x) => (
          <option key={x.n} value={x.n}>
            {x.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="క్రొత్త నిబంధన">
        {nt.map((x) => (
          <option key={x.n} value={x.n}>
            {x.name}
          </option>
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
        <option key={i} value={i + 1}>
          {i + 1}
        </option>
      ))}
    </select>
  );
}
