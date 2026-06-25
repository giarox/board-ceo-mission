import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { OPERATIONS, QUICK_TAGS, SCORE_SCALE } from "@/lib/operations";
import { useLocalState } from "@/lib/use-local-state";

type Review = { score: number | null; tags: string[]; note: string };

const emptyReviews: Record<string, Review> = Object.fromEntries(
  OPERATIONS.map((o) => [o.code, { score: null, tags: [], note: "" }]),
);

export function PerformanceReview({
  shotsFromTimers,
}: {
  shotsFromTimers: number;
}) {
  const [reviews, setReviews] = useLocalState<Record<string, Review>>(
    "reviews:v1",
    emptyReviews,
  );
  const [idx, setIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const op = OPERATIONS[idx];
  const r = reviews[op.code] ?? { score: null, tags: [], note: "" };

  const reviewShots = useMemo(
    () =>
      Object.values(reviews).reduce(
        (n, x) => n + (x.score === 0 || x.score === 1 ? 1 : 0),
        0,
      ),
    [reviews],
  );
  const totalShots = shotsFromTimers + reviewShots;

  const setReview = (patch: Partial<Review>) =>
    setReviews({ ...reviews, [op.code]: { ...r, ...patch } });

  const toggleTag = (t: string) =>
    setReview({ tags: r.tags.includes(t) ? r.tags.filter((x) => x !== t) : [...r.tags, t] });

  const next = () => {
    if (idx < OPERATIONS.length - 1) setIdx(idx + 1);
    else setShowResult(true);
  };

  if (showResult) {
    return (
      <ResultScreen
        reviews={reviews}
        totalShots={totalShots}
        onBack={() => setShowResult(false)}
      />
    );
  }

  return (
    <section className="bg-paper-2 px-5 pb-32 pt-10">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between font-mono-tight text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          <span>DOC-006 · Performance Review</span>
          <span>{idx + 1} / {OPERATIONS.length}</span>
        </div>

        {/* progress dots */}
        <div className="mt-3 flex gap-1.5">
          {OPERATIONS.map((o, i) => (
            <button
              key={o.code}
              onClick={() => setIdx(i)}
              className={
                "h-2 flex-1 rounded-full transition-all " +
                (i === idx
                  ? "bg-night"
                  : reviews[o.code]?.score != null
                    ? "bg-approve"
                    : "bg-ink/15")
              }
              aria-label={`Vai alla review ${i + 1}`}
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-card p-5 shadow-[0_1px_0_var(--color-border)]">
          <div className="font-mono-tight text-[11px] uppercase tracking-[0.18em] text-stamp">
            {op.code}
          </div>
          <h3 className="font-display mt-1 text-2xl leading-tight">{op.name}</h3>
          <p className="mt-2 text-[14px] leading-snug text-ink-soft">
            Obiettivo: {op.success}
          </p>

          {/* Score buttons */}
          <div className="mt-5">
            <div className="font-mono-tight text-[10px] uppercase tracking-widest text-ink-soft">
              Voto del Board
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {SCORE_SCALE.map((s) => {
                const active = r.score === s.v;
                return (
                  <button
                    key={s.v}
                    onClick={() => setReview({ score: s.v })}
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
            {r.score != null && (
              <div className="mt-3 rounded-lg bg-ink/5 px-3 py-2 text-[14px] text-ink">
                <span className="font-display">{r.score}</span> — {SCORE_SCALE[r.score].label}.{" "}
                <span className="text-ink-soft">{SCORE_SCALE[r.score].desc}</span>
              </div>
            )}
          </div>

          {/* Quick tags */}
          <div className="mt-5">
            <div className="font-mono-tight text-[10px] uppercase tracking-widest text-ink-soft">
              Etichette rapide (opzionale)
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_TAGS.map((t) => {
                const active = r.tags.includes(t);
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

          {/* Note */}
          <details className="mt-5 rounded-lg bg-paper-2 p-3">
            <summary className="font-mono-tight cursor-pointer text-[11px] uppercase tracking-widest text-ink-soft">
              Note libere (facoltative)
            </summary>
            <textarea
              value={r.note}
              onChange={(e) => setReview({ note: e.target.value })}
              placeholder="Verbalizza, se ne hai la forza."
              rows={3}
              className="mt-2 w-full resize-none rounded-md border border-border bg-card p-3 text-[15px] outline-none focus:ring-2 focus:ring-night"
            />
          </details>
        </div>

        {/* Nav */}
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-3">
          <button
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="flex h-16 items-center justify-center rounded-xl border-2 border-night bg-card px-5 text-night active:scale-95 disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="font-display flex h-16 items-center justify-center gap-2 rounded-xl bg-night text-xl text-paper active:scale-[0.98]"
          >
            {idx === OPERATIONS.length - 1 ? "Calcola verdetto" : "Avanti"}
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* sticky shot counter */}
      <div className="fixed inset-x-0 bottom-[72px] z-40 flex justify-center px-4 pb-2">
        <div className="rounded-full border-2 border-stamp bg-paper px-4 py-1.5 shadow-lg">
          <span className="font-mono-tight text-[10px] uppercase tracking-widest text-stamp">
            Totale shot CEO
          </span>{" "}
          <span className="font-display text-base text-ink">{totalShots}</span>
        </div>
      </div>
    </section>
  );
}

function ResultScreen({
  reviews,
  totalShots,
  onBack,
}: {
  reviews: Record<string, Review>;
  totalShots: number;
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
    }\nPunteggio: ${total}/${max} — media ${avg.toFixed(2)}\nShot a carico del CEO: ${totalShots}`;
    try {
      if (navigator.share) await navigator.share({ title: "MAS 2026", text });
      else {
        await navigator.clipboard.writeText(text);
        alert("Esito copiato negli appunti.");
      }
    } catch {}
  };

  return (
    <section className="night-bg text-paper min-h-[100svh] px-6 pb-32 pt-12">
      <div className="mx-auto max-w-xl">
        <div className="font-mono-tight text-[11px] uppercase tracking-[0.18em] text-paper/60">
          DOC-007 · Verdetto Finale
        </div>
        <h2 className="font-display mt-2 text-3xl">Esito del Summit</h2>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Punteggio" value={`${total}`} sub={`/ ${max}`} />
          <Stat label="Media" value={avg.toFixed(2)} sub="/ 5" />
          <Stat label="Shot CEO" value={`${totalShots}`} sub="" tone="bad" />
          <Stat label="Operation valutate" value={`${scored.length}`} sub={`/ ${OPERATIONS.length}`} />
        </div>

        {/* stamp */}
        <div className="relative mt-10 rounded-2xl border border-paper/15 bg-paper/[0.04] p-8 text-center">
          <div
            className={
              "font-display mx-auto inline-block rounded-md border-[3px] px-6 py-3 text-3xl uppercase stamp-animate " +
              (approved
                ? "border-approve text-approve"
                : "border-warn text-warn")
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

        {/* detail */}
        <div className="mt-10">
          <div className="font-mono-tight text-[11px] uppercase tracking-widest text-paper/60">
            Dettaglio per Operation
          </div>
          <div className="mt-3 space-y-2">
            {OPERATIONS.map((o) => {
              const s = reviews[o.code]?.score;
              return (
                <div key={o.code} className="flex items-center gap-3 rounded-lg bg-paper/[0.05] px-3 py-2.5">
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

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "bad" }) {
  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (tone === "bad" ? "border-stamp bg-stamp/15" : "border-paper/15 bg-paper/[0.04]")
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
