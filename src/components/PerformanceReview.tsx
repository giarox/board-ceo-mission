import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  X,
} from "lucide-react";
import {
  OPERATIONS,
  QUICK_TAGS,
  SCORE_SCALE,
  STATUS_LABEL,
  statusFromRuntime,
  type Review,
  type OpStatus,
} from "@/lib/operations";
import { useAllOpRuntimes } from "@/lib/op-runtime";
import { useLocalState } from "@/lib/use-local-state";

type StoredVerdict = {
  createdAt: number;
  total: number;
  max: number;
  avg: number;
  scoredCount: number;
  closedCount: number;
  approved: boolean;
  details: { code: string; name: string; score: number | null }[];
};

export function PerformanceReview({
  reviews,
  setReviews,
}: {
  reviews: Record<string, Review>;
  setReviews: (r: Record<string, Review>) => void;
}) {
  const [mode, setMode] = useState<"list" | "review">("list");
  const [idx, setIdx] = useState(0);
  const [verdict, setVerdict] = useLocalState<StoredVerdict | null>(
    "verdict:v1",
    null,
  );

  const runtimes = useAllOpRuntimes();
  const statuses: Record<string, OpStatus> = useMemo(() => {
    const m: Record<string, OpStatus> = {};
    for (const o of OPERATIONS) m[o.code] = statusFromRuntime(runtimes[o.code]);
    return m;
  }, [runtimes]);

  const openReview = (i: number) => {
    setIdx(i);
    setMode("review");
  };

  const createVerdict = () => {
    const scored = OPERATIONS.map((o) => reviews[o.code]?.score).filter(
      (s): s is number => s != null,
    );
    const total = scored.reduce((a, b) => a + b, 0);
    const max = Math.max(1, scored.length) * 5;
    const avg = scored.length ? total / scored.length : 0;
    const closedCount = OPERATIONS.filter((o) =>
      ["done", "expired"].includes(statuses[o.code]),
    ).length;

    setVerdict({
      createdAt: Date.now(),
      total,
      max,
      avg,
      scoredCount: scored.length,
      closedCount,
      approved: scored.length > 0 ? avg >= 3 : false,
      details: OPERATIONS.map((o) => ({
        code: o.code,
        name: o.name,
        score: reviews[o.code]?.score ?? null,
      })),
    });
    setMode("list");
    window.setTimeout(
      () => document.getElementById("final-verdict")?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  if (mode === "list") {
    return (
      <ListView
        reviews={reviews}
        statuses={statuses}
        onOpen={openReview}
        onVerdict={createVerdict}
        verdict={verdict}
        onClearVerdict={() => setVerdict(null)}
      />
    );
  }

  return (
    <ReviewCarousel
      reviews={reviews}
      setReviews={setReviews}
      statuses={statuses}
      startIndex={idx}
      onBack={() => setMode("list")}
      onVerdict={createVerdict}
    />
  );
}

/* ──────────────────────────── LIST VIEW ──────────────────────────── */

function ListView({
  reviews,
  statuses,
  onOpen,
  onVerdict,
  verdict,
  onClearVerdict,
}: {
  reviews: Record<string, Review>;
  statuses: Record<string, OpStatus>;
  onOpen: (i: number) => void;
  onVerdict: () => void;
  verdict: StoredVerdict | null;
  onClearVerdict: () => void;
}) {
  const votedCount = OPERATIONS.filter((o) => reviews[o.code]?.score != null).length;
  const activatedCount = OPERATIONS.filter(
    (o) => statuses[o.code] !== "idle",
  ).length;
  const closedCount = OPERATIONS.filter((o) =>
    ["done", "expired"].includes(statuses[o.code]),
  ).length;
  const canCreateVerdict = closedCount > 0 || votedCount > 0;

  // Sort: activated/expired first, then done, then idle. Voted goes to the bottom.
  const order = [...OPERATIONS].sort((a, b) => {
    const score = (code: string) => {
      const voted = reviews[code]?.score != null ? 1 : 0;
      const st = statuses[code];
      const stRank =
        st === "running" || st === "expired" ? 0 : st === "done" ? 1 : 2;
      return voted * 10 + stRank;
    };
    return score(a.code) - score(b.code);
  });

  return (
    <section className="bg-paper-2 px-5 pb-16 pt-10">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between font-mono-tight text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          <span>DOC-006 · Performance Review</span>
          <span>
            {votedCount} / {OPERATIONS.length} valutate
          </span>
        </div>
        <h2 className="font-display mt-2 text-3xl text-ink">Performance Index</h2>
        <p className="mt-1 text-[14px] leading-snug text-ink-soft">
          Tap an Operation to open its review card. Closed or active Operations stay
          on top, so the Board can move fast.
        </p>

        {/* Counters */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Counter label="Active" value={activatedCount} />
          <Counter label="Closed" value={closedCount} tone="ok" />
          <Counter label="Rated" value={votedCount} tone="muted" />
        </div>

        {/* List */}
        <ul className="mt-5 space-y-2">
          {order.map((op) => {
            const st = statuses[op.code];
            const voted = reviews[op.code]?.score != null;
            const score = reviews[op.code]?.score;
            const i = OPERATIONS.findIndex((x) => x.code === op.code);
            return (
              <li key={op.code}>
                <button
                  onClick={() => onOpen(i)}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-border bg-card px-3.5 py-3.5 text-left shadow-[0_4px_18px_-14px_rgba(0,0,0,0.55)] transition-colors active:scale-[0.99] hover:border-night/50"
                >
                  <StatusDot status={st} voted={voted} />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                      {op.code}
                    </div>
                    <div className="font-display truncate text-base leading-tight text-ink">
                      {op.name}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-soft">
                      <StatusChip status={st} />
                      {voted && (
                        <span className="rounded-md bg-night px-2.5 py-1 font-mono-tight text-[10px] uppercase tracking-widest text-paper">
                          Rating {score}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-lg bg-night px-3 py-2 font-mono-tight text-[10px] uppercase tracking-widest text-paper">
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Verdict CTA */}
        <button
          onClick={onVerdict}
          disabled={!canCreateVerdict}
          className="font-display mt-6 flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-night text-xl text-paper active:scale-[0.98] disabled:opacity-40"
        >
          Create Verdict
        </button>
        {!canCreateVerdict ? (
          <p className="mt-2 text-center text-[12px] text-ink-soft">
            Close at least one Operation or add one rating to generate the Board outcome.
          </p>
        ) : (
          <p className="mt-2 text-center text-[12px] text-ink-soft">
            The Board can deliberate with {closedCount} closed Operation
            {closedCount === 1 ? "" : "s"} and {votedCount} rating
            {votedCount === 1 ? "" : "s"}.
          </p>
        )}

        {verdict && <ResultScreen verdict={verdict} onClear={onClearVerdict} />}
      </div>
    </section>
  );
}

function Counter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "muted";
}) {
  return (
    <div
      className={
        "rounded-xl border p-3 " +
        (tone === "ok"
          ? "border-approve/40 bg-approve/10"
          : tone === "muted"
            ? "border-border bg-card"
            : "border-stamp/40 bg-stamp/10")
      }
    >
      <div className="font-mono-tight text-[9px] uppercase tracking-widest text-ink-soft">
        {label}
      </div>
      <div className="font-display mt-0.5 text-2xl text-ink tabular-nums">{value}</div>
    </div>
  );
}

function StatusDot({ status, voted }: { status: OpStatus; voted: boolean }) {
  if (voted)
    return (
      <CheckCircle2 className="h-7 w-7 shrink-0 text-approve" strokeWidth={2.2} />
    );
  if (status === "running")
    return <Clock className="h-7 w-7 shrink-0 animate-pulse text-night" />;
  if (status === "expired")
    return <AlertTriangle className="h-7 w-7 shrink-0 text-stamp" />;
  if (status === "done")
    return <CheckCircle2 className="h-7 w-7 shrink-0 text-night" />;
  return <Circle className="h-7 w-7 shrink-0 text-ink/25" />;
}

function StatusChip({ status }: { status: OpStatus }) {
  const styles: Record<OpStatus, string> = {
    idle: "border-ink/25 bg-paper-2 text-ink",
    running: "border-night bg-night text-paper",
    done: "border-approve bg-approve text-white",
    expired: "border-stamp bg-stamp text-white",
  };
  return (
    <span
      className={
        "rounded-md border px-2.5 py-1 font-mono-tight text-[10px] font-bold uppercase tracking-widest shadow-sm " +
        styles[status]
      }
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ──────────────────────────── CAROUSEL REVIEW ──────────────────────────── */

function ReviewCarousel({
  reviews,
  setReviews,
  statuses,
  startIndex,
  onBack,
  onVerdict,
}: {
  reviews: Record<string, Review>;
  setReviews: (r: Record<string, Review>) => void;
  statuses: Record<string, OpStatus>;
  startIndex: number;
  onBack: () => void;
  onVerdict: () => void;
}) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    align: "center",
    containScroll: "trimSnaps",
    startIndex,
  });
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
  }, [embla]);

  const setReview = (code: string, patch: Partial<Review>) => {
    const cur = reviews[code] ?? { score: null, tags: [], note: "" };
    setReviews({ ...reviews, [code]: { ...cur, ...patch } });
  };
  const closedCount = OPERATIONS.filter((o) =>
    ["done", "expired"].includes(statuses[o.code]),
  ).length;
  const votedCount = OPERATIONS.filter((o) => reviews[o.code]?.score != null).length;
  const canCreateVerdict = closedCount > 0 || votedCount > 0;

  return (
    <section className="bg-paper-2 px-4 pb-16 pt-10">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between font-mono-tight text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-md bg-ink/5 px-2 py-1 hover:bg-ink/10 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" /> Indice
          </button>
          <span>
            {index + 1} / {OPERATIONS.length}
          </span>
        </div>
        <h2 className="font-display mt-2 px-1 text-3xl text-ink">Performance Review</h2>
        <p className="mt-1 px-1 text-[14px] text-ink-soft">
          Swipe through the cards, rate what happened, and keep every entry editable.
        </p>

        {/* arrows + counter — stesso pattern di Operation */}
        <div className="mt-5 flex items-center justify-between px-1">
          <button
            onClick={() => embla?.scrollPrev()}
            disabled={index === 0}
            aria-label="Review precedente"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 bg-card active:scale-95 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <div className="font-display text-lg tabular-nums text-ink">
            {OPERATIONS[index].code}
          </div>
          <button
            onClick={() => embla?.scrollNext()}
            disabled={index === OPERATIONS.length - 1}
            aria-label="Review successiva"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 bg-card active:scale-95 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5 text-ink" />
          </button>
        </div>

        {/* embla peek */}
        <div className="mt-4 overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {OPERATIONS.map((op) => (
              <div key={op.code} className="min-w-0 flex-[0_0_88%]">
                <ReviewCard
                  op={op}
                  status={statuses[op.code]}
                  review={reviews[op.code] ?? { score: null, tags: [], note: "" }}
                  onChange={(p) => setReview(op.code, p)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* dots */}
        <div className="mt-5 flex justify-center gap-2">
          {OPERATIONS.map((o, i) => {
            const voted = reviews[o.code]?.score != null;
            return (
              <button
                key={o.code}
                onClick={() => embla?.scrollTo(i)}
                aria-label={`Vai a review ${i + 1}`}
                className={
                  "h-2.5 rounded-full transition-all " +
                  (i === index
                    ? "w-8 bg-night"
                    : voted
                      ? "w-2.5 bg-approve"
                      : "w-2.5 bg-ink/25")
                }
              />
            );
          })}
        </div>

        <button
          onClick={onVerdict}
          disabled={!canCreateVerdict}
          className="font-display mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-night bg-card text-lg text-night active:scale-[0.98] disabled:opacity-40"
        >
          Create Verdict
        </button>
        {!canCreateVerdict && (
          <p className="mt-2 text-center text-[12px] text-ink-soft">
            Close at least one Operation or add one rating before creating the outcome.
          </p>
        )}
      </div>
    </section>
  );
}

function ReviewCard({
  op,
  status,
  review,
  onChange,
}: {
  op: (typeof OPERATIONS)[number];
  status: OpStatus;
  review: Review;
  onChange: (p: Partial<Review>) => void;
}) {
  const toggleTag = (t: string) =>
    onChange({
      tags: review.tags.includes(t)
        ? review.tags.filter((x) => x !== t)
        : [...review.tags, t],
    });
  const hasInput =
    review.score != null || review.tags.length > 0 || review.note.trim().length > 0;
  const clearReview = () => onChange({ score: null, tags: [], note: "" });

  return (
    <article className="rounded-2xl bg-card p-5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between">
        <div className="font-mono-tight text-[11px] uppercase tracking-[0.18em] text-stamp">
          {op.code}
        </div>
        <StatusChip status={status} />
      </div>
      <h3 className="font-display mt-1 text-2xl leading-tight text-ink">{op.name}</h3>
      <p className="mt-2 text-[14px] leading-snug text-ink-soft">
        Obiettivo: {op.success}
      </p>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="font-mono-tight text-[10px] uppercase tracking-widest text-ink-soft">
            Board Rating
          </div>
          {review.score != null && (
            <button
              onClick={() => onChange({ score: null })}
              className="flex items-center gap-1 rounded-md border border-border bg-paper-2 px-2 py-1 text-[12px] font-semibold text-ink active:scale-95"
            >
              <X className="h-3.5 w-3.5" /> clear
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {SCORE_SCALE.map((s) => {
            const active = review.score === s.v;
            return (
              <button
                key={s.v}
                onClick={() => onChange({ score: active ? null : s.v })}
                className={
                  "font-display flex h-16 items-center justify-center rounded-xl text-3xl transition-all active:scale-95 " +
                  (active
                    ? s.tone === "bad"
                      ? "bg-stamp text-white"
                      : s.tone === "mid"
                        ? "bg-warn text-ink"
                        : s.tone === "ok"
                          ? "bg-night text-paper"
                          : "bg-approve text-white"
                    : "bg-paper-2 text-ink hover:bg-ink/10")
                }
              >
                {s.v}
              </button>
            );
          })}
        </div>
        {review.score != null && (
          <div className="mt-3 rounded-lg bg-ink/5 px-3 py-2 text-[14px] text-ink">
            <span className="font-display">{review.score}</span> —{" "}
            {SCORE_SCALE[review.score].label}.{" "}
            <span className="text-ink-soft">{SCORE_SCALE[review.score].desc}</span>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="font-mono-tight text-[10px] uppercase tracking-widest text-ink-soft">
          Quick Tags (optional)
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_TAGS.map((t) => {
            const active = review.tags.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={
                  "rounded-full border px-3.5 py-2 text-sm transition-colors active:scale-95 " +
                  (active
                    ? "border-night bg-night text-paper shadow-sm"
                    : "border-ink/20 bg-paper-2 text-ink")
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <details className="mt-5 rounded-lg bg-paper-2 p-3">
        <summary className="font-mono-tight cursor-pointer text-[11px] uppercase tracking-widest text-ink-soft">
          Free Notes (optional)
        </summary>
        <textarea
          value={review.note}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder="Verbalizza, se ne hai la forza."
          rows={3}
          className="mt-2 w-full resize-none rounded-md border border-border bg-card p-3 text-[15px] outline-none focus:ring-2 focus:ring-night"
        />
      </details>

      {hasInput && (
        <button
          onClick={clearReview}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-stamp bg-stamp/10 py-3 font-display text-base text-stamp active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" /> Reset Review Card
        </button>
      )}
    </article>
  );
}

/* ──────────────────────────── RESULT ──────────────────────────── */

function ResultScreen({
  verdict,
  onClear,
}: {
  verdict: StoredVerdict;
  onClear: () => void;
}) {
  const share = async () => {
    const text = `MAS 2026 — Berlin Edition\nVerdetto: ${
      verdict.approved
        ? "APPROVATO ALLA MARRIAGE ACQUISITION"
        : "APPROVATO CON RISERVA (ma tanto ormai è troppo tardi)"
    }\nScore: ${verdict.total}/${verdict.max} — average ${verdict.avg.toFixed(2)}`;
    try {
      if (navigator.share) await navigator.share({ title: "MAS 2026", text });
      else {
        await navigator.clipboard.writeText(text);
        alert("Esito copiato negli appunti.");
      }
    } catch {
      // Share cancellation is not actionable for the Board.
    }
  };

  return (
    <section
      id="final-verdict"
      className="night-bg mt-8 scroll-mt-28 rounded-2xl px-5 py-8 text-paper"
    >
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono-tight text-[11px] uppercase tracking-[0.18em] text-paper/60">
            DOC-007 · Final Outcome
          </div>
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-md border border-paper/25 bg-paper/10 px-2.5 py-1.5 text-[12px] font-semibold text-paper active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Undo
          </button>
        </div>
        <h2 className="font-display mt-2 text-3xl">Board Decision</h2>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Score" value={`${verdict.total}`} sub={`/ ${verdict.max}`} />
          <Stat label="Average" value={verdict.avg.toFixed(2)} sub="/ 5" />
          <Stat
            label="Closed Ops"
            value={`${verdict.closedCount}`}
            sub={`/ ${OPERATIONS.length}`}
          />
          <Stat
            label="Outcome"
            value={verdict.approved ? "OK" : "RIS."}
            sub=""
            tone={verdict.approved ? undefined : "bad"}
          />
        </div>

        <div className="relative mt-10 rounded-2xl border border-paper/15 bg-paper/[0.04] p-8 text-center">
          <div
            className={
              "font-display mx-auto inline-block rounded-md border-[3px] px-6 py-3 text-3xl uppercase stamp-animate " +
              (verdict.approved ? "border-approve text-approve" : "border-warn text-warn")
            }
            style={{ letterSpacing: "0.08em" }}
          >
            {verdict.approved ? "Approved" : "Approved w/ reserve"}
          </div>
          <p className="font-display mt-6 text-xl leading-tight text-paper">
            {verdict.approved
              ? "APPROVATO ALLA MARRIAGE ACQUISITION"
              : "APPROVATO CON RISERVA, MA TANTO ORMAI È TROPPO TARDI"}
          </p>
          <p className="font-mono-tight mt-3 text-[11px] uppercase tracking-widest text-paper/60">
            Board decision · Berlin, 2026
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <button
            onClick={share}
            className="font-display flex h-16 items-center justify-center gap-2 rounded-xl bg-paper text-xl text-night active:scale-[0.98]"
          >
            <Share2 className="h-5 w-5" /> Share Outcome
          </button>
          <button
            onClick={onClear}
            className="font-display flex h-16 items-center justify-center rounded-xl border-2 border-paper/30 px-5 text-paper active:scale-95"
          >
            Delete
          </button>
        </div>

        <div className="mt-10">
          <div className="font-mono-tight text-[11px] uppercase tracking-widest text-paper/60">
            Operation Detail
          </div>
          <div className="mt-3 space-y-2">
            {verdict.details.map((o) => {
              return (
                <div
                  key={o.code}
                  className="flex items-center gap-3 rounded-lg bg-paper/[0.05] px-3 py-2.5"
                >
                  <div className="font-mono-tight text-[10px] uppercase tracking-widest text-paper/50">
                    {o.code}
                  </div>
                  <div className="min-w-0 flex-1 truncate text-[15px]">{o.name}</div>
                  <div className="font-display text-2xl">{o.score ?? "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "bad";
}) {
  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (tone === "bad"
          ? "border-stamp bg-stamp/15"
          : "border-paper/15 bg-paper/[0.04]")
      }
    >
      <div className="font-mono-tight text-[10px] uppercase tracking-widest text-paper/55">
        {label}
      </div>
      <div className="font-display mt-1 flex items-baseline gap-1">
        <span className="text-4xl">{value}</span>
        {sub && <span className="text-base text-paper/50">{sub}</span>}
      </div>
    </div>
  );
}
