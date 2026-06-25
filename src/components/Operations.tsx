import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  CheckCheck,
  RotateCcw,
  Lightbulb,
  X,
} from "lucide-react";
import { OPERATIONS, type Operation, type OpRuntime, EMPTY_OP_RUNTIME } from "@/lib/operations";
import { useLocalState } from "@/lib/use-local-state";

export function Operations() {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    align: "center",
    containScroll: "trimSnaps",
  });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
  }, [embla]);

  return (
    <section className="night-bg text-paper px-5 py-12">
      <div className="mx-auto max-w-xl">
        <div className="eyebrow text-paper/55">DOC-005 · Operation</div>
        <h2 className="font-display mt-2 text-3xl">Operations Agenda</h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-paper/70">
          Sette Operation ufficiali. Il Board ne attiva quante vuole, quando vuole, se ritiene
          situazione, luogo e vibe favorevoli. Scorri per consultarle.
        </p>

        {/* counter + arrows */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => embla?.scrollPrev()}
            disabled={index === 0}
            aria-label="Operation precedente"
            className="icon-btn border border-paper/25 bg-paper/5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="font-display text-lg tabular-nums">
            {index + 1} <span className="text-paper/40">/ {OPERATIONS.length}</span>
          </div>
          <button
            onClick={() => embla?.scrollNext()}
            disabled={index === OPERATIONS.length - 1}
            aria-label="Operation successiva"
            className="icon-btn border border-paper/25 bg-paper/5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* embla — peek both sides */}
        <div className="mt-4 overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {OPERATIONS.map((op) => (
              <div key={op.code} className="min-w-0 flex-[0_0_88%]">
                <OpCard op={op} />
              </div>
            ))}
          </div>
        </div>

        {/* dots */}
        <div className="mt-4 flex justify-center gap-1">
          {OPERATIONS.map((_, i) => (
            <button
              key={i}
              onClick={() => embla?.scrollTo(i)}
              aria-label={`Vai a Operation ${i + 1}`}
              className="dot-hit"
            >
              <span
                className={
                  "h-2 rounded-full transition-all " +
                  (i === index ? "w-7 bg-paper" : "w-2 bg-paper/30")
                }
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpCard({ op }: { op: Operation }) {
  const [state, setState] = useLocalState<OpRuntime>(`op:${op.code}`, EMPTY_OP_RUNTIME);
  const [now, setNow] = useState(() => Date.now());
  const [ideasOpen, setIdeasOpen] = useState(false);
  const expiredFiredRef = useRef(false);

  const totalMs = op.limitMin * 60_000;
  // == null so a field dropped by Realtime DB (null isn't stored) reads as null.
  const running = state.startedAt != null && state.elapsedMs == null && !state.expired;
  const remainingMs = running ? Math.max(0, totalMs - (now - (state.startedAt ?? 0))) : totalMs;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running && remainingMs <= 0 && !expiredFiredRef.current) {
      expiredFiredRef.current = true;
      // Just flag the op expired (idempotent across devices). The shot tally is
      // derived from how many ops are expired, so it can't be double-counted.
      setState({ ...state, expired: true, startedAt: null });
      try {
        navigator.vibrate?.([200, 80, 200, 80, 400]);
      } catch {
        // Vibration API may be unavailable or blocked — non-critical.
      }
    }
    if (!running) expiredFiredRef.current = false;
  }, [running, remainingMs]); // eslint-disable-line

  const start = () => setState({ elapsedMs: null, startedAt: Date.now(), expired: false });
  const done = () => {
    const used = Date.now() - (state.startedAt ?? Date.now());
    setState({ elapsedMs: used, startedAt: null, expired: false });
  };
  // No-timer ops are simply switched on; elapsedMs marks the activated state.
  const activate = () => setState({ elapsedMs: 0, startedAt: Date.now(), expired: false });
  const reset = () => setState(EMPTY_OP_RUNTIME);

  const display = state.elapsedMs != null ? state.elapsedMs : remainingMs;
  const activated = state.elapsedMs != null;
  const completed = !!state.completed;
  const complete = () => setState({ ...state, completed: true });
  // "Annulla" on a started op resets it; on a completed one it just re-opens it.
  const undo = completed
    ? { label: "Riapri", onClick: () => setState({ ...state, completed: false }) }
    : { label: "Annulla", onClick: reset };

  return (
    <article className="rounded-2xl bg-paper text-ink shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
      <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <div className="eyebrow text-stamp">{op.code}</div>
        <div className="eyebrow text-[10px] text-ink-soft">
          {op.noTimer ? "Tutta la giornata" : `Verifica entro ${op.limitMin} min`}
        </div>
      </header>

      <div className="px-5 pb-5 pt-4">
        <h3 className="font-display text-2xl leading-tight">{op.name}</h3>

        <Block label="Attivazione">{op.activation}</Block>
        <Block label="Briefing">{op.briefing}</Block>
        <Block label="Success Criteria" tone="ok">
          {op.success}
        </Block>

        {op.failure && (
          <div className="mt-4 rounded-xl border-l-4 border-stamp bg-stamp/10 p-3.5">
            <div className="eyebrow text-[10px] text-stamp">Failure Criteria</div>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{op.failure}</p>
          </div>
        )}

        {op.callIdeas && (
          <button
            onClick={() => setIdeasOpen(true)}
            className="btn btn-outline-dark mt-4 h-12 w-full text-base"
          >
            <Lightbulb className="h-5 w-5" /> Visualizza idee chiamate
          </button>
        )}

        {op.noTimer ? (
          /* Activation toggle — no countdown, runs all night, revertible */
          <div className="mt-5">
            {!activated ? (
              <button onClick={activate} className="btn btn-xl btn-primary w-full">
                <Play className="h-6 w-6" /> Attiva
              </button>
            ) : (
              <>
                <div
                  className={
                    "rounded-2xl border p-4 " +
                    (completed
                      ? "border-approve bg-approve text-white"
                      : "border-approve/40 bg-approve/10")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={
                        "flex items-center gap-2 " + (completed ? "text-white" : "text-approve")
                      }
                    >
                      <Check className="h-6 w-6 shrink-0" />
                      <span className="font-display text-xl leading-tight">
                        {completed ? "Completata" : "Operatività avviata"}
                      </span>
                    </div>
                    <button
                      onClick={undo.onClick}
                      className={
                        "btn-chip border " +
                        (completed
                          ? "border-white/40 bg-white/15 text-white"
                          : "border-border bg-paper-2 text-ink")
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> {undo.label}
                    </button>
                  </div>
                  <div
                    className={
                      "mt-2 text-[13px] leading-snug " +
                      (completed ? "text-white/80" : "text-ink-soft")
                    }
                  >
                    {completed
                      ? "Operazione chiusa dal Board."
                      : "Badge e dotazione attivi fino a fine giornata."}
                  </div>
                </div>
                {!completed && (
                  <button
                    onClick={complete}
                    className="btn btn-outline-dark mt-2 h-12 w-full text-base"
                  >
                    <CheckCheck className="h-5 w-5" /> Segna come completata
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          /* Timer */
          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-stamp/35 bg-stamp/10 px-3 py-2 text-center">
              <span className="eyebrow text-[10px] text-stamp">Verifica entro</span>
              <span className="font-display text-lg text-ink">{op.limitMin} min</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="eyebrow text-[10px] text-ink-soft">
                {activated ? "Tempo registrato" : running ? "Tempo rimanente" : "Pronto"}
              </div>
              {(running || activated || state.expired) && (
                <button
                  onClick={undo.onClick}
                  className="btn-chip border border-border bg-paper-2 text-ink"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> {undo.label}
                </button>
              )}
            </div>
            <div
              className={
                "font-display mt-1 text-center text-[64px] leading-none tabular-nums " +
                (running && remainingMs < 30_000 ? "text-stamp" : "text-ink")
              }
            >
              {fmt(display)}
            </div>

            {state.expired ? (
              <div className="mt-3 rounded-xl bg-stamp px-4 py-3 text-center text-white">
                <div className="font-display text-xl">Tempo scaduto</div>
                <div className="eyebrow mt-1 text-[11px]">Shot per il CEO</div>
              </div>
            ) : !running && !activated ? (
              <button onClick={start} className="btn btn-xl btn-primary mt-3 w-full">
                <Play className="h-6 w-6" /> Avvia
              </button>
            ) : running ? (
              <button onClick={done} className="btn btn-xl btn-positive mt-3 w-full">
                <Check className="h-6 w-6" /> Stoppa
              </button>
            ) : completed ? (
              <div className="mt-3 rounded-xl bg-approve px-4 py-3 text-center text-white">
                <div className="font-display text-lg">Completata</div>
                <div className="eyebrow mt-1 text-[11px] text-white/80">
                  operazione chiusa dal Board
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 rounded-xl bg-approve/15 px-4 py-3 text-center">
                  <div className="font-display text-lg text-approve">Operatività verificata</div>
                  <div className="eyebrow mt-1 text-[11px] text-ink-soft">
                    in {fmt(state.elapsedMs!)}
                  </div>
                </div>
                <button
                  onClick={complete}
                  className="btn btn-outline-dark mt-2 h-12 w-full text-base"
                >
                  <CheckCheck className="h-5 w-5" /> Segna come completata
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {state.expired && <FullscreenShot onClose={reset} />}
      {ideasOpen && op.callIdeas && (
        <CallIdeasModal ideas={op.callIdeas} onClose={() => setIdeasOpen(false)} />
      )}
    </article>
  );
}

function Block({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: "ok";
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className={"eyebrow text-[10px] " + (tone === "ok" ? "text-approve" : "text-stamp")}>
        {label}
      </div>
      <p className="mt-1 text-[15px] leading-relaxed text-ink">{children}</p>
    </div>
  );
}

function FullscreenShot({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center flash-red">
      <div className="font-display text-[64px] leading-none text-white">SHOT</div>
      <div className="font-display mt-2 text-[40px] leading-none text-white">PER IL CEO</div>
      <div className="eyebrow mt-6 max-w-xs text-[13px] text-white/90">
        Tempo scaduto. Esecuzione immediata, a sue spese.
      </div>
      <button onClick={onClose} className="btn btn-xl mt-10 bg-white px-8 text-stamp">
        Ho bevuto
      </button>
    </div>
  );
}

function CallIdeasModal({ ideas, onClose }: { ideas: string[]; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-night/70 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Idee per le chiamate"
    >
      <div
        className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-2xl bg-paper p-5 text-ink shadow-[0_24px_70px_-20px_rgba(0,0,0,0.7)]"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-stamp" />
            <div>
              <div className="eyebrow text-ink-soft">Berlin Calling</div>
              <h3 className="font-display text-2xl leading-tight">Idee chiamate</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="icon-btn -mr-1 -mt-1 border border-border bg-card text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          Due scenari già pronti. Il Board sceglie, il CEO esegue.
        </p>

        <ol className="mt-4 space-y-2.5">
          {ideas.map((idea, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-night text-[13px] text-paper">
                {i + 1}
              </div>
              <p className="min-w-0 text-[15px] leading-relaxed text-ink">{idea}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function fmt(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
