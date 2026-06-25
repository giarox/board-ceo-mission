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
  Plus,
  X,
} from "lucide-react";
import {
  OPERATIONS,
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
  setReview,
}: {
  reviews: Record<string, Review>;
  setReview: (code: string, value: Review) => void;
}) {
  const [mode, setMode] = useState<"list" | "review">("list");
  const [idx, setIdx] = useState(0);
  const [verdict, setVerdict] = useLocalState<StoredVerdict | null>("verdict:v1", null);

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
      ["verified", "completed", "expired"].includes(statuses[o.code]),
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
      setReview={setReview}
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
  const activatedCount = OPERATIONS.filter((o) => statuses[o.code] !== "idle").length;
  const closedCount = OPERATIONS.filter((o) =>
    ["verified", "completed", "expired"].includes(statuses[o.code]),
  ).length;
  const canCreateVerdict = closedCount > 0 || votedCount > 0;

  // Sort: activated/expired first, then done, then idle. Voted goes to the bottom.
  const order = [...OPERATIONS].sort((a, b) => {
    const score = (code: string) => {
      const voted = reviews[code]?.score != null ? 1 : 0;
      const st = statuses[code];
      const stRank = st === "running" || st === "expired" ? 0 : st === "idle" ? 2 : 1;
      return voted * 10 + stRank;
    };
    return score(a.code) - score(b.code);
  });

  return (
    <section className="bg-paper-2 px-5 pb-16 pt-12">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between gap-2 eyebrow text-ink-soft">
          <span>DOC-006 · Performance Review</span>
          <span>
            {votedCount} / {OPERATIONS.length} valutate
          </span>
        </div>
        <h2 className="font-display mt-2 text-3xl text-ink">Performance Review</h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink-soft">
          Tocca una Operation per aprire la scheda di valutazione. Quelle attive o concluse restano
          in cima, così il Board decide senza perdere tempo.
        </p>

        {/* Counters */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Counter label="Attive" value={activatedCount} />
          <Counter label="Concluse" value={closedCount} tone="ok" />
          <Counter label="Valutate" value={votedCount} tone="muted" />
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
                  aria-label={`Apri valutazione ${op.code} — ${op.name}`}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-[0_4px_18px_-14px_rgba(0,0,0,0.55)] transition-colors active:scale-[0.99] hover:border-night/40"
                >
                  <StatusDot status={st} voted={voted} />
                  <div className="min-w-0 flex-1">
                    <div className="eyebrow text-[10px] text-ink-soft">{op.code}</div>
                    <div className="font-display truncate text-base leading-tight text-ink">
                      {op.name}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusChip status={st} />
                      {voted && (
                        <span className="eyebrow rounded-md bg-night px-2 py-1 text-[10px] text-paper">
                          Rating {score}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night/10 text-night"
                  >
                    <ArrowRight className="h-5 w-5" />
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
          className="btn btn-xl btn-primary mt-6 w-full"
        >
          Effettua review
        </button>
        {!canCreateVerdict ? (
          <p className="mt-2.5 text-center text-[13px] leading-relaxed text-ink-soft">
            Chiudi almeno una Operation o inserisci un voto per effettuare la review.
          </p>
        ) : (
          <p className="mt-2.5 text-center text-[13px] leading-relaxed text-ink-soft">
            Il Board può deliberare con {closedCount} Operation concluse e {votedCount} valutazioni.
          </p>
        )}

        {verdict && <ResultScreen verdict={verdict} onClear={onClearVerdict} />}
      </div>
    </section>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone?: "ok" | "muted" }) {
  const dot = tone === "ok" ? "bg-approve" : tone === "muted" ? "bg-ink/30" : "bg-stamp";
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5">
        <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + dot} />
        <span className="eyebrow text-[10px] text-ink-soft">{label}</span>
      </div>
      <div className="font-display mt-1 text-2xl text-ink tabular-nums">{value}</div>
    </div>
  );
}

function StatusDot({ status, voted }: { status: OpStatus; voted: boolean }) {
  if (voted) return <CheckCircle2 className="h-7 w-7 shrink-0 text-approve" strokeWidth={2.2} />;
  if (status === "running") return <Clock className="h-7 w-7 shrink-0 animate-pulse text-night" />;
  if (status === "expired") return <AlertTriangle className="h-7 w-7 shrink-0 text-stamp" />;
  if (status === "completed")
    return <CheckCircle2 className="h-7 w-7 shrink-0 text-approve" strokeWidth={2.2} />;
  if (status === "verified") return <CheckCircle2 className="h-7 w-7 shrink-0 text-approve" />;
  return <Circle className="h-7 w-7 shrink-0 text-ink/25" />;
}

function StatusChip({ status }: { status: OpStatus }) {
  const styles: Record<OpStatus, string> = {
    idle: "border-transparent bg-ink/10 text-ink-soft",
    running: "border-night bg-night text-paper",
    verified: "border-approve bg-approve/15 text-approve",
    completed: "border-approve bg-approve text-white",
    expired: "border-stamp bg-stamp text-white",
  };
  return (
    <span
      className={
        "eyebrow rounded-md border px-2 py-1 text-[10px] font-bold shadow-sm " + styles[status]
      }
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ──────────────────────────── CAROUSEL REVIEW ──────────────────────────── */

function ReviewCarousel({
  reviews,
  setReview,
  statuses,
  startIndex,
  onBack,
  onVerdict,
}: {
  reviews: Record<string, Review>;
  setReview: (code: string, value: Review) => void;
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

  const applyPatch = (code: string, patch: Partial<Review>) => {
    const cur = reviews[code] ?? { score: null, tags: [], notes: [] };
    setReview(code, { ...cur, ...patch });
  };
  const closedCount = OPERATIONS.filter((o) =>
    ["verified", "completed", "expired"].includes(statuses[o.code]),
  ).length;
  const votedCount = OPERATIONS.filter((o) => reviews[o.code]?.score != null).length;
  const canCreateVerdict = closedCount > 0 || votedCount > 0;

  return (
    <section className="bg-paper-2 px-5 pb-16 pt-12">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between gap-2 eyebrow text-ink-soft">
          <span>DOC-006 · Performance Review</span>
          <span>
            {index + 1} / {OPERATIONS.length}
          </span>
        </div>
        <h2 className="font-display mt-2 text-3xl text-ink">Performance Review</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Scorri le schede, assegna un voto e modifica tutto quando serve.
        </p>

        {/* back to index — sits right on top of the cards */}
        <button onClick={onBack} className="btn btn-outline-dark mt-6 w-full text-base">
          <ChevronLeft className="h-5 w-5" /> Torna all'indice review
        </button>

        {/* arrows + counter — stesso pattern di Operation */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => embla?.scrollPrev()}
            disabled={index === 0}
            aria-label="Review precedente"
            className="icon-btn border border-ink/20 bg-card"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <div className="font-display text-lg tabular-nums text-ink">{OPERATIONS[index].code}</div>
          <button
            onClick={() => embla?.scrollNext()}
            disabled={index === OPERATIONS.length - 1}
            aria-label="Review successiva"
            className="icon-btn border border-ink/20 bg-card"
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
                  review={reviews[op.code] ?? { score: null, tags: [], notes: [] }}
                  onChange={(p) => applyPatch(op.code, p)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* dots */}
        <div className="mt-4 flex justify-center gap-0.5">
          {OPERATIONS.map((o, i) => {
            const voted = reviews[o.code]?.score != null;
            return (
              <button
                key={o.code}
                onClick={() => embla?.scrollTo(i)}
                aria-label={`Vai a review ${i + 1}`}
                className="dot-hit"
              >
                <span
                  className={
                    "h-2 rounded-full transition-all " +
                    (i === index ? "w-7 bg-night" : voted ? "w-2 bg-approve" : "w-2 bg-ink/25")
                  }
                />
              </button>
            );
          })}
        </div>

        <button
          onClick={onVerdict}
          disabled={!canCreateVerdict}
          className="btn btn-xl btn-primary mt-6 w-full"
        >
          Effettua review
        </button>
        {!canCreateVerdict && (
          <p className="mt-2.5 text-center text-[13px] leading-relaxed text-ink-soft">
            Chiudi almeno una Operation o inserisci un voto prima di effettuare la review.
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
  const notes = review.notes ?? [];
  const hasInput = review.score != null || notes.length > 0;
  const clearReview = () => onChange({ score: null, tags: [], notes: [] });
  const addNote = (text: string) => {
    const t = text.trim();
    if (t) onChange({ notes: [...notes, t] });
  };
  const removeNote = (i: number) => onChange({ notes: notes.filter((_, j) => j !== i) });

  return (
    <article className="rounded-2xl bg-card p-5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow text-stamp">{op.code}</div>
        <StatusChip status={status} />
      </div>
      <h3 className="font-display mt-1.5 text-2xl leading-tight text-ink">{op.name}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">Obiettivo: {op.success}</p>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <div className="eyebrow text-[10px] text-ink-soft">Board Rating</div>
          {review.score != null && (
            <button
              onClick={() => onChange({ score: null })}
              className="inline-flex min-h-9 items-center gap-1 px-1 text-[13px] font-semibold text-stamp active:scale-95"
            >
              <X className="h-4 w-4" /> Cancella
            </button>
          )}
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {SCORE_SCALE.map((s) => {
            const active = review.score === s.v;
            return (
              <button
                key={s.v}
                onClick={() => onChange({ score: active ? null : s.v })}
                aria-label={`Voto ${s.v} — ${s.label}`}
                aria-pressed={active}
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
          <div className="mt-3 rounded-xl bg-ink/5 px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">
            <span className="font-display">{review.score}</span>
            {` — ${SCORE_SCALE[review.score].label}. `}
            <span className="text-ink-soft">{SCORE_SCALE[review.score].desc}</span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-2">
          <div className="eyebrow text-[10px] text-ink-soft">Note libere</div>
          {notes.length > 0 && (
            <div className="text-[11px] text-ink-soft/70">{notes.length} salvate</div>
          )}
        </div>

        {notes.length > 0 && (
          <ul className="mt-2.5 space-y-2">
            {notes.map((n, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-xl border border-border bg-paper-2 p-3"
              >
                <span className="min-w-0 flex-1 break-words text-[15px] leading-snug text-ink">
                  {n}
                </span>
                <button
                  onClick={() => removeNote(i)}
                  aria-label="Elimina nota"
                  className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <NoteComposer onAdd={addNote} />
      </div>

      {hasInput && (
        <button
          onClick={clearReview}
          className="btn-chip mt-5 ml-auto flex border border-stamp/40 bg-stamp/5 text-stamp"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Cancella scheda review
        </button>
      )}
    </article>
  );
}

function NoteComposer({ onAdd }: { onAdd: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };
  return (
    <div className="mt-2.5 flex gap-2">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        enterKeyHint="done"
        placeholder="Aggiungi una nota…"
        className="min-w-0 flex-1 rounded-xl border-2 border-border bg-paper-2 px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-night focus:bg-card"
      />
      <button
        onClick={submit}
        disabled={!draft.trim()}
        aria-label="Aggiungi nota"
        className="btn btn-primary h-12 shrink-0 px-4"
      >
        <Plus className="h-5 w-5" />
        Aggiungi
      </button>
    </div>
  );
}

/* ──────────────────────────── RESULT ──────────────────────────── */

function ResultScreen({ verdict, onClear }: { verdict: StoredVerdict; onClear: () => void }) {
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
          <div className="eyebrow text-paper/60">DOC-007 · Final Outcome</div>
          <button
            onClick={onClear}
            className="btn-chip border border-paper/25 bg-paper/10 text-paper"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Undo
          </button>
        </div>
        <h2 className="font-display mt-2 text-3xl">Board Decision</h2>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Score" value={`${verdict.total}`} sub={`/ ${verdict.max}`} />
          <Stat label="Average" value={verdict.avg.toFixed(2)} sub="/ 5" />
          <Stat label="Concluse" value={`${verdict.closedCount}`} sub={`/ ${OPERATIONS.length}`} />
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
            {verdict.approved ? "Approvato" : "Con riserva"}
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
          <button onClick={share} className="btn btn-xl btn-light">
            <Share2 className="h-5 w-5" /> Share Outcome
          </button>
          <button onClick={onClear} className="btn btn-xl btn-outline-light sm:px-6">
            Delete
          </button>
        </div>

        <div className="mt-10">
          <div className="eyebrow text-paper/60">Operation Detail</div>
          <div className="mt-3 space-y-2">
            {verdict.details.map((o) => {
              return (
                <div
                  key={o.code}
                  className="flex items-center gap-3 rounded-xl bg-paper/[0.05] px-3.5 py-2.5"
                >
                  <div className="eyebrow text-[10px] text-paper/50">{o.code}</div>
                  <div className="min-w-0 flex-1 truncate text-[15px]">{o.name}</div>
                  <div className="font-display text-2xl tabular-nums">{o.score ?? "—"}</div>
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
        (tone === "bad" ? "border-stamp bg-stamp/15" : "border-paper/15 bg-paper/[0.04]")
      }
    >
      <div className="eyebrow text-[10px] text-paper/55">{label}</div>
      <div className="font-display mt-1 flex items-baseline gap-1 tabular-nums">
        <span className="text-4xl">{value}</span>
        {sub && <span className="text-base text-paper/50">{sub}</span>}
      </div>
    </div>
  );
}
