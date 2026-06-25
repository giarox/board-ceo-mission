import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Target, ClipboardCheck } from "lucide-react";
import { Dossier } from "@/components/Dossier";
import { Operations } from "@/components/Operations";
import { PerformanceReview } from "@/components/PerformanceReview";
import { useLocalState } from "@/lib/use-local-state";
import { EMPTY_REVIEWS, type Review } from "@/lib/operations";

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
  const [reviews, setReviews] = useLocalState<Record<string, Review>>(
    "reviews:v1",
    EMPTY_REVIEWS,
  );

  const reviewShots = useMemo(
    () =>
      Object.values(reviews).reduce(
        (n, x) => n + (x.score === 0 || x.score === 1 ? 1 : 0),
        0,
      ),
    [reviews],
  );
  const totalShots = shots + reviewShots;

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
        if (visible)
          setActive(visible.target.getAttribute("data-section") as SectionId);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    Object.values(refs).forEach((r) => r.current && obs.observe(r.current));
    return () => obs.disconnect();
  }, []); // eslint-disable-line

  const go = (id: SectionId) => {
    const el = refs[id].current;
    if (!el) return;
    const headerH = 96; // sticky header height incl. tabs
    const y = el.getBoundingClientRect().top + window.scrollY - headerH + 1;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <main className="min-h-[100svh]">
      {/* Sticky top header — corporate bar */}
      <header
        className="sticky top-0 z-50 border-b border-paper/10 bg-night/95 text-paper backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto max-w-xl px-4">
          <div className="flex items-center justify-between pt-2">
            <div className="font-mono-tight text-[10px] uppercase tracking-[0.2em] text-paper/70">
              MAS·2026 <span className="text-paper/35">/</span> Berlin
            </div>
            <div className="flex items-center gap-2 rounded-md border-2 border-stamp bg-stamp/15 px-2.5 py-1">
              <span className="font-mono-tight text-[9px] uppercase tracking-widest text-stamp">
                Shot CEO
              </span>
              <span className="font-display text-base leading-none text-paper tabular-nums">
                {totalShots}
              </span>
            </div>
          </div>
          <nav
            className="mt-2 grid grid-cols-3 gap-1 pb-1"
            aria-label="Sezioni"
          >
            {TABS.map(({ id, label, Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className={
                    "relative flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors active:scale-[0.97] " +
                    (isActive
                      ? "bg-paper/10 text-paper"
                      : "text-paper/55 hover:text-paper/80")
                  }
                >
                  <Icon
                    className={
                      "h-4 w-4 " + (isActive ? "text-stamp" : "")
                    }
                  />
                  <span className="font-mono-tight text-[11px] uppercase tracking-widest">
                    {label}
                  </span>
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-px h-[2px] bg-stamp" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div ref={refs.dossier} data-section="dossier">
        <Dossier />
      </div>
      <div ref={refs.operation} data-section="operation">
        <Operations setShots={setShots} />
      </div>
      <div ref={refs.review} data-section="review">
        <PerformanceReview reviews={reviews} setReviews={setReviews} />
      </div>
    </main>
  );
}
