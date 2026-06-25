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

export function PerformanceReview({
  reviews,
  setReviews,
}: {
  reviews: Record<string, Review>;
  setReviews: (r: Record<string, Review>) => void;
}) {
  const [mode, setMode] = useState<"list" | "review">("list");
  const [idx, setIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);

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

  if (showResult) {
    return <ResultScreen reviews={reviews} onBack={() => setShowResult(false)} />;
  }

  if (mode === "list") {
    return (
      <ListView
        reviews={reviews}
        statuses={statuses}
        onOpen={openReview}
        onVerdict={() => setShowResult(true)}
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
      onVerdict={() => setShowResult(true)}
    />
  );
}

/* ──────────────────────────── LIST VIEW ──────────────────────────── */

function ListView({
  reviews,
  statuses,
  onOpen,
  onVerdict,
}: {
  reviews: Record<string, Review>;
  statuses: Record<string, OpStatus>;
  onOpen: (i: number) => void;
  onVerdict: () => void;
}) {
  const votedCount = OPERATIONS.filter((o) => reviews[o.code]?.score != null).length;
  const activatedCount = OPERATIONS.filter(
    (o) => statuses[o.code] !== "idle",
  ).length;

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
        <h2 className="font-display mt-2 text-3xl text-ink">Registro Valutazioni</h2>
        <p className="mt-1 text-[14px] leading-snug text-ink-soft">
          Indice ufficiale delle Operation. Quelle attivate o concluse sono in
          cima: tocca per aprire la scheda di voto. Le altre restano a disposizione,
          per quando il Board cambierà idea.
        </p>

        {/* Counters */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Counter label="Attivate" value={activatedCount} />
          <Counter label="Valutate" value={votedCount} tone="ok" />
          <Counter
            label="In attesa"
            value={OPERATIONS.length - activatedCount}
            tone="muted"
          />
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
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-colors active:scale-[0.99] hover:border-night/30"
                >
                  <StatusDot status={st} voted={voted} />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                      {op.code}
                    </div>
                    <div className="font-display truncate text-base leading-tight text-ink">
                      {op.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
                      <StatusChip status={st} />
                      {voted && (
                        <span className="rounded-full bg-night px-2 py-0.5 font-mono-tight text-[10px] uppercase tracking-widest text-paper">
                          Voto {score}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-ink-soft" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Verdict CTA */}
        <button
          onClick={onVerdict}
          disabled={votedCount === 0}
          className="font-display mt-6 flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-night text-xl text-paper active:scale-[0.98] disabled:opacity-40"
        >
          Calcola verdetto finale
        </button>
        {votedCount < OPERATIONS.length && votedCount > 0 && (
          <p className="mt-2 text-center text-[12px] text-ink-soft">
            Mancano {OPERATIONS.length - votedCount} valutazioni — il Board può
            comunque deliberare con quelle disponibili.
          </p>
        )}
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
    idle: "bg-ink/8 text-ink-soft",
    running: "bg-night text-paper",
    done: "bg-approve/20 text-approve",
    expired: "bg-stamp text-white",
  };
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 font-mono-tight text-[10px] uppercase tracking-widest " +
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
        <h2 className="font-display mt-2 px-1 text-3xl text-ink">Valutazione</h2>
        <p className="mt-1 px-1 text-[14px] text-ink-soft">
          Scorri per scegliere l'Operation da valutare.
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
          className="font-display mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-night bg-card text-lg text-night active:scale-[0.98]"
        >
          Calcola verdetto finale
        </button>
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
        <div className="font-mono-tight text-[10px] uppercase tracking-widest text-ink-soft">
          Voto del Board
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {SCORE_SCALE.map((s) => {
            const active = review.score === s.v;
            return (
              <button
                key={s.v}
                onClick={() => onChange({ score: s.v })}
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
          Etichette rapide (opzionale)
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
                    ? "border-night bg-night text-paper"
                    : "border-border bg-card text-ink")
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
          Note libere (facoltative)
        </summary>
        <textarea
          value={review.note}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder="Verbalizza, se ne hai la forza."
          rows={3}
          className="mt-2 w-full resize-none rounded-md border border-border bg-card p-3 text-[15px] outline-none focus:ring-2 focus:ring-night"
        />
      </details>
    </article>
  );
}

/* ──────────────────────────── RESULT ──────────────────────────── */

function ResultScreen({
  reviews,
  onBack,
}: {
  reviews: Record<string, Review>;
  onBack: () => void;
}) {
  const scored = OPERATIONS.map((o) => reviews[o.code]?.score).filter(
    (s): s is number => s != null,
  );
  const total = scored.reduce((a, b) => a + b, 0);
  const max = OPERATIONS.length * 5;
  const avg = scored.length ? total / scored.length : 0;
  const approved = avg >= 3;

  const share = async () => {
    const text = `MAS 2026 — Berlin Edition\nVerdetto: ${
      approved
        ? "APPROVATO ALLA MARRIAGE ACQUISITION"
        : "APPROVATO CON RISERVA (ma tanto ormai è troppo tardi)"
    }\nPunteggio: ${total}/${max} — media ${avg.toFixed(2)}`;
    try {
      if (navigator.share) await navigator.share({ title: "MAS 2026", text });
      else {
        await navigator.clipboard.writeText(text);
        alert("Esito copiato negli appunti.");
      }
    } catch {}
  };

  return (
    <section className="night-bg text-paper min-h-[100svh] px-6 pb-16 pt-12">
      <div className="mx-auto max-w-xl">
        <div className="font-mono-tight text-[11px] uppercase tracking-[0.18em] text-paper/60">
          DOC-007 · Verdetto Finale
        </div>
        <h2 className="font-display mt-2 text-3xl">Verdetto del Board</h2>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Punteggio" value={`${total}`} sub={`/ ${max}`} />
          <Stat label="Media" value={avg.toFixed(2)} sub="/ 5" />
          <Stat
            label="Operation valutate"
            value={`${scored.length}`}
            sub={`/ ${OPERATIONS.length}`}
          />
          <Stat
            label="Esito"
            value={approved ? "OK" : "RIS."}
            sub=""
            tone={approved ? undefined : "bad"}
          />
        </div>

        <div className="relative mt-10 rounded-2xl border border-paper/15 bg-paper/[0.04] p-8 text-center">
          <div
            className={
              "font-display mx-auto inline-block rounded-md border-[3px] px-6 py-3 text-3xl uppercase stamp-animate " +
              (approved ? "border-approve text-approve" : "border-warn text-warn")
            }
            style={{ letterSpacing: "0.08em" }}
          >
            {approved ? "Approvato" : "Approvato c/ riserva"}
          </div>
          <p className="font-display mt-6 text-xl leading-tight text-paper">
            {approved
              ? "APPROVATO ALLA MARRIAGE ACQUISITION"
              : "APPROVATO CON RISERVA, MA TANTO ORMAI È TROPPO TARDI"}
          </p>
          <p className="font-mono-tight mt-3 text-[11px] uppercase tracking-widest text-paper/60">
            Decisione del Board · Berlino, 2026
          </p>
        </div>

        <div className="mt-8 grid grid-cols-[1fr_auto] gap-3">
          <button
            onClick={share}
            className="font-display flex h-16 items-center justify-center gap-2 rounded-xl bg-paper text-xl text-night active:scale-[0.98]"
          >
            <Share2 className="h-5 w-5" /> Condividi esito
          </button>
          <button
            onClick={onBack}
            className="font-display flex h-16 items-center justify-center rounded-xl border-2 border-paper/30 px-5 text-paper active:scale-95"
          >
            Modifica
          </button>
        </div>

        <div className="mt-10">
          <div className="font-mono-tight text-[11px] uppercase tracking-widest text-paper/60">
            Dettaglio per Operation
          </div>
          <div className="mt-3 space-y-2">
            {OPERATIONS.map((o) => {
              const s = reviews[o.code]?.score;
              return (
                <div
                  key={o.code}
                  className="flex items-center gap-3 rounded-lg bg-paper/[0.05] px-3 py-2.5"
                >
                  <div className="font-mono-tight text-[10px] uppercase tracking-widest text-paper/50">
                    {o.code}
                  </div>
                  <div className="min-w-0 flex-1 truncate text-[15px]">{o.name}</div>
                  <div className="font-display text-2xl">{s ?? "—"}</div>
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
