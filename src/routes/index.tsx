import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileText, Target, ClipboardCheck } from "lucide-react";
import { Dossier } from "@/components/Dossier";
import { Operations } from "@/components/Operations";
import { PerformanceReview } from "@/components/PerformanceReview";
import { useLocalState } from "@/lib/use-local-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAS 2026 — Berlin Edition" },
      {
        name: "description",
        content:
          "Dossier riservato del Board per il Marriage Acquisition Summit 2026 — Berlino.",
      },
      { property: "og:title", content: "MAS 2026 — Berlin Edition" },
      {
        property: "og:description",
        content: "Accesso strettamente riservato al Board.",
      },
    ],
  }),
  component: Home,
});

type SectionId = "dossier" | "operation" | "review";

const TABS: { id: SectionId; label: string; Icon: typeof FileText }[] = [
  { id: "dossier", label: "Dossier", Icon: FileText },
  { id: "operation", label: "Operation", Icon: Target },
  { id: "review", label: "Review", Icon: ClipboardCheck },
];

function Home() {
  const [shots, setShots] = useLocalState<number>("shots:timers", 0);
  const refs = {
    dossier: useRef<HTMLDivElement>(null),
    operation: useRef<HTMLDivElement>(null),
    review: useRef<HTMLDivElement>(null),
  };
  const [active, setActive] = useState<SectionId>("dossier");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.getAttribute("data-section") as SectionId);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    Object.values(refs).forEach((r) => r.current && obs.observe(r.current));
    return () => obs.disconnect();
  }, []); // eslint-disable-line

  const go = (id: SectionId) => {
    refs[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-[100svh] pb-24">
      <div ref={refs.dossier} data-section="dossier">
        <Dossier />
      </div>
      <div ref={refs.operation} data-section="operation">
        <Operations shots={shots} setShots={setShots} />
      </div>
      <div ref={refs.review} data-section="review">
        <PerformanceReview shotsFromTimers={shots} />
      </div>

      {/* Sticky thumb-nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-paper/10 bg-night/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Sezioni"
      >
        <div className="mx-auto grid max-w-xl grid-cols-3">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => go(id)}
                className={
                  "flex flex-col items-center justify-center gap-1 py-3 transition-colors active:scale-95 " +
                  (isActive ? "text-paper" : "text-paper/55")
                }
              >
                <Icon className={"h-6 w-6 " + (isActive ? "text-stamp" : "")} />
                <span className="font-mono-tight text-[11px] uppercase tracking-widest">
                  {label}
                </span>
                <span
                  className={
                    "h-[3px] w-8 rounded-full " +
                    (isActive ? "bg-stamp" : "bg-transparent")
                  }
                />
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
