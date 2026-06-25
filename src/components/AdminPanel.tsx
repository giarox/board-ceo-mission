import { useEffect, useState } from "react";
import { X, Loader2, Check, ShieldAlert } from "lucide-react";
import { resetOperations, resetRatings, resetVerdict, resetAll } from "@/lib/admin";

type Action = {
  key: string;
  label: string;
  desc: string;
  run: () => Promise<void>;
  danger?: boolean;
};

const ACTIONS: Action[] = [
  {
    key: "ops",
    label: "Annulla Operations iniziate",
    desc: "Azzera timer e attivazioni di tutte le Operation (e gli shot da tempo scaduto).",
    run: resetOperations,
  },
  {
    key: "ratings",
    label: "Annulla Ratings",
    desc: "Cancella tutti i voti e le note del Board.",
    run: resetRatings,
  },
  {
    key: "verdict",
    label: "Annulla Esito",
    desc: "Cancella il verdetto finale, lasciando intatti voti e Operation.",
    run: resetVerdict,
  },
  {
    key: "all",
    label: "Annulla tutto",
    desc: "Azzera l'intero stato condiviso: Operation, voti, note ed esito. Si riparte da zero.",
    run: resetAll,
    danger: true,
  },
];

export function AdminPanel({ onClose }: { onClose: () => void }) {
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
      className="fixed inset-0 z-[90] flex items-end justify-center bg-night/70 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pannello riservato del Board"
    >
      <div
        className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-2xl bg-paper p-5 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.7)]"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-stamp" />
            <div>
              <div className="eyebrow text-ink-soft">Board · Riservato</div>
              <h2 className="font-display text-2xl leading-tight text-ink">Reset rapido</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi pannello"
            className="icon-btn -mr-1 -mt-1 border border-border bg-card text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          Le azzerate sono condivise: valgono per tutti i dispositivi in tempo reale. Tocca una
          volta, poi conferma.
        </p>

        <div className="mt-4 space-y-2.5">
          {ACTIONS.map((a) => (
            <ResetRow key={a.key} action={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

type Stage = "idle" | "confirm" | "busy" | "done";

function ResetRow({ action }: { action: Action }) {
  const [stage, setStage] = useState<Stage>("idle");

  // Auto-cancel a pending confirmation after a few seconds.
  useEffect(() => {
    if (stage !== "confirm") return;
    const t = setTimeout(() => setStage((s) => (s === "confirm" ? "idle" : s)), 4000);
    return () => clearTimeout(t);
  }, [stage]);

  const onClick = async () => {
    if (stage === "idle") {
      setStage("confirm");
      return;
    }
    if (stage === "confirm") {
      setStage("busy");
      try {
        await action.run();
        setStage("done");
        setTimeout(() => setStage("idle"), 1800);
      } catch {
        setStage("idle");
      }
    }
  };

  const danger = action.danger;
  const btnClass =
    stage === "done"
      ? "btn-positive"
      : stage === "confirm" || danger
        ? "btn-danger"
        : "btn-outline-dark";

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="font-display text-base leading-tight text-ink">{action.label}</div>
      <p className="mt-1 text-[13px] leading-snug text-ink-soft">{action.desc}</p>
      <button
        onClick={onClick}
        disabled={stage === "busy" || stage === "done"}
        className={"btn mt-3 h-11 w-full text-base " + btnClass}
      >
        {stage === "busy" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : stage === "done" ? (
          <>
            <Check className="h-4 w-4" /> Fatto
          </>
        ) : stage === "confirm" ? (
          "Tocca di nuovo per confermare"
        ) : (
          "Annulla"
        )}
      </button>
    </div>
  );
}
