import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play, Check, RotateCcw } from "lucide-react";
import { OPERATIONS, type Operation } from "@/lib/operations";
import { useLocalState } from "@/lib/use-local-state";

type OpState = {
  // remaining seconds when paused/idle; null = idle (not started)
  elapsedMs: number | null; // time recorded as "completed"
  startedAt: number | null; // epoch when started, null when not running
  expired: boolean;
};

const empty: OpState = { elapsedMs: null, startedAt: null, expired: false };

export function Operations({ shots, setShots }: { shots: number; setShots: (n: number | ((p: number) => number)) => void }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, align: "center" });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
  }, [embla]);

  return (
    <section className="night-bg text-paper px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <div className="font-mono-tight text-[11px] uppercase tracking-[0.18em] text-paper/60">
            DOC-005 · Operation
          </div>
          <ShotCounter shots={shots} />
        </div>
        <h2 className="font-display mt-2 text-3xl">Le sette missioni</h2>
        <p className="mt-1 text-[14px] text-paper/70">
          Scorri lateralmente. Una alla volta, con calma. O quasi.
        </p>

        {/* counter + arrows */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => embla?.scrollPrev()}
            disabled={index === 0}
            aria-label="Operation precedente"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-paper/20 bg-paper/5 active:scale-95 disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="font-display text-lg">
            {index + 1} <span className="text-paper/40">/ {OPERATIONS.length}</span>
          </div>
          <button
            onClick={() => embla?.scrollNext()}
            disabled={index === OPERATIONS.length - 1}
            aria-label="Operation successiva"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-paper/20 bg-paper/5 active:scale-95 disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* embla */}
        <div className="mt-4 overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {OPERATIONS.map((op) => (
              <div key={op.code} className="min-w-0 flex-[0_0_100%] px-1">
                <OpCard op={op} onExpire={() => setShots((s) => s + 1)} />
              </div>
            ))}
          </div>
        </div>

        {/* dots */}
        <div className="mt-5 flex justify-center gap-2">
          {OPERATIONS.map((_, i) => (
            <button
              key={i}
              onClick={() => embla?.scrollTo(i)}
              aria-label={`Vai a Operation ${i + 1}`}
              className={
                "h-2.5 rounded-full transition-all " +
                (i === index ? "w-8 bg-paper" : "w-2.5 bg-paper/30")
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShotCounter({ shots }: { shots: number }) {
  return (
    <div className="rounded-md border-2 border-stamp bg-stamp/15 px-3 py-1.5 text-right">
      <div className="font-mono-tight text-[9px] uppercase tracking-widest text-stamp">
        Shot CEO
      </div>
      <div className="font-display text-xl leading-none text-paper">{shots}</div>
    </div>
  );
}

function OpCard({ op, onExpire }: { op: Operation; onExpire: () => void }) {
  const [state, setState] = useLocalState<OpState>(`op:${op.code}`, empty);
  const [now, setNow] = useState(() => Date.now());
  const expiredFiredRef = useRef(false);

  const totalMs = op.limitMin * 60_000;
  const running = state.startedAt !== null && state.elapsedMs === null && !state.expired;
  const remainingMs = running ? Math.max(0, totalMs - (now - (state.startedAt ?? 0))) : totalMs;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running && remainingMs <= 0 && !expiredFiredRef.current) {
      expiredFiredRef.current = true;
      setState({ ...state, expired: true, startedAt: null });
      onExpire();
      try { navigator.vibrate?.([200, 80, 200, 80, 400]); } catch {}
    }
    if (!running) expiredFiredRef.current = false;
  }, [running, remainingMs]); // eslint-disable-line

  const start = () => setState({ elapsedMs: null, startedAt: Date.now(), expired: false });
  const done = () => {
    const used = Date.now() - (state.startedAt ?? Date.now());
    setState({ elapsedMs: used, startedAt: null, expired: false });
  };
  const reset = () => setState(empty);

  const display = state.elapsedMs != null ? state.elapsedMs : remainingMs;

  return (
    <article className="rounded-2xl bg-paper text-ink shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="font-mono-tight text-[11px] uppercase tracking-[0.18em] text-stamp">
          {op.code}
        </div>
        <div className="font-mono-tight text-[11px] uppercase tracking-widest text-ink-soft">
          Verifica entro {op.limitMin} min
        </div>
      </header>

      <div className="px-5 pb-5 pt-4">
        <h3 className="font-display text-2xl leading-tight">{op.name}</h3>

        <Block label="Attivazione">{op.activation}</Block>
        <Block label="Briefing">{op.briefing}</Block>
        <Block label="Success Criteria" tone="ok">{op.success}</Block>

        {/* Timer */}
        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="font-mono-tight text-[10px] uppercase tracking-widest text-ink-soft">
              {state.elapsedMs != null ? "Tempo registrato" : running ? "Tempo rimanente" : "Pronto"}
            </div>
            {(state.elapsedMs != null || state.expired) && (
              <button onClick={reset} className="flex items-center gap-1 text-[12px] text-ink-soft active:scale-95">
                <RotateCcw className="h-3.5 w-3.5" /> reset
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
            <div className="mt-3 rounded-lg bg-stamp px-4 py-3 text-center text-white">
              <div className="font-display text-xl">Tempo scaduto</div>
              <div className="mt-0.5 font-mono-tight text-[12px] uppercase tracking-widest">
                Shot per il CEO
              </div>
            </div>
          ) : !running && state.elapsedMs == null ? (
            <button
              onClick={start}
              className="font-display mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-night py-5 text-xl text-paper active:scale-[0.98]"
            >
              <Play className="h-6 w-6" /> Avvia
            </button>
          ) : running ? (
            <button
              onClick={done}
              className="font-display mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-approve py-5 text-xl text-white active:scale-[0.98]"
            >
              <Check className="h-6 w-6" /> Fatto
            </button>
          ) : (
            <div className="mt-3 rounded-lg bg-approve/15 px-4 py-3 text-center">
              <div className="font-display text-lg text-approve">Operation completata</div>
              <div className="mt-0.5 font-mono-tight text-[12px] uppercase tracking-widest text-ink-soft">
                in {fmt(state.elapsedMs!)}
              </div>
            </div>
          )}
        </div>
      </div>

      {state.expired && <FullscreenShot onClose={reset} />}
    </article>
  );
}

function Block({ label, tone, children }: { label: string; tone?: "ok"; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div
        className={
          "font-mono-tight text-[10px] uppercase tracking-[0.18em] " +
          (tone === "ok" ? "text-approve" : "text-stamp")
        }
      >
        {label}
      </div>
      <p className="mt-1 text-[15px] leading-relaxed text-ink">{children}</p>
    </div>
  );
}

function FullscreenShot({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center flash-red">
      <div className="font-display text-[64px] leading-none text-white">SHOT</div>
      <div className="font-display mt-2 text-[40px] leading-none text-white">PER IL CEO</div>
      <div className="font-mono-tight mt-6 max-w-xs text-sm uppercase tracking-widest text-white/90">
        Tempo scaduto. Esecuzione immediata, a sue spese.
      </div>
      <button
        onClick={onClose}
        className="font-display mt-10 rounded-xl bg-white px-8 py-4 text-xl text-stamp active:scale-95"
      >
        Ho bevuto
      </button>
    </div>
  );
}

function fmt(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
