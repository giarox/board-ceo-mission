import { SCORE_SCALE } from "@/lib/operations";

export function Dossier() {
  return (
    <div className="flex flex-col">
      {/* COVER — night */}
      <section className="night-bg text-paper relative overflow-hidden px-6 pb-16 pt-12">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between font-mono-tight text-[11px] uppercase tracking-[0.18em] text-paper/60">
            <span>MAS-2026-BLN</span>
            <span>Doc. 001 / Cover</span>
          </div>

          <div className="mt-8 flex justify-end">
            <span className="stamp-box text-sm">Riservato</span>
          </div>

          <h1 className="font-display mt-6 text-[40px] leading-[0.95] sm:text-5xl">
            Marriage<br />Acquisition<br />Summit 2026
          </h1>
          <p className="font-display mt-3 text-xl text-paper/80">Berlin Edition</p>

          <div className="mt-10 rounded-lg border border-paper/15 bg-paper/[0.04] p-5 backdrop-blur-sm">
            <DataRow k="Oggetto" v="Valutazione operativa dell'asset Giacomo Palazzo in vista della Marriage Acquisition." />
            <DataRow k="Sede" v="Berlino, Repubblica Federale di Germania" />
            <DataRow k="Asset" v="Giacomo Palazzo (CEO)" />
            <DataRow k="Organo valutante" v="Il Board" />
            <DataRow k="Esito atteso" v="Approvazione, con o senza riserva." last />
          </div>

          <p className="font-mono-tight mt-8 text-[11px] leading-relaxed text-paper/55">
            Accesso strettamente riservato al Board. Se trovato incustodito: negare tutto,
            dare la colpa alla logistica e cambiare argomento parlando del meteo a Berlino.
          </p>
        </div>
      </section>

      {/* BRIEF — paper */}
      <section className="paper-grain px-6 py-14">
        <div className="mx-auto max-w-xl">
          <SectionLabel code="DOC-002" name="Executive Brief" />
          <h2 className="font-display mt-3 text-3xl text-ink">Mandato del Board</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ink">
            Il Board si riunisce a Berlino per verificare se Giacomo Palazzo, in qualità di CEO,
            sia effettivamente pronto alla fase finale della Marriage Acquisition o se sia
            opportuno richiedere un ulteriore ciclo di test, possibilmente in un paese ancora
            più lontano da casa.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
            Il presente dossier raccoglie le procedure, i criteri di valutazione e le
            conseguenze operative previste. Ogni decisione del Board è insindacabile.
            Ogni decisione del CEO è, di fatto, irrilevante.
          </p>

          <div className="mt-6 rounded-md border-l-4 border-stamp bg-stamp/10 p-4">
            <div className="font-mono-tight text-[11px] uppercase tracking-widest text-stamp">
              Nota legale
            </div>
            <p className="mt-1 text-[15px] text-ink">
              L'imparzialità non è garantita, non è prevista e non sarà oggetto di reclamo.
            </p>
          </div>
        </div>
      </section>

      {/* PROTOCOL — paper alt */}
      <section className="bg-paper-2 px-6 py-14">
        <div className="mx-auto max-w-xl">
          <SectionLabel code="DOC-003" name="Protocollo Operativo" />
          <h2 className="font-display mt-3 text-3xl text-ink">Come funziona</h2>

          <ol className="mt-6 space-y-4">
            {[
              {
                t: "Attivazione",
                d: "Il Board può attivare quante Operation vuole, quando vuole, se ritiene che situazione, luogo e vibe siano favorevoli. L'ordine non è vincolante, il buon gusto neppure.",
              },
              {
                t: "Verifica Operativa Immediata",
                d: "Ogni Operation ha un tempo limite, fissato e visibile nel dossier. Se entro il tempo non c'è progresso credibile: shot per il CEO, a sue spese, senza diritto di replica.",
              },
              {
                t: "Performance Review",
                d: "Il giorno dopo, riuniti e indolenziti, il Board vota ogni Operation da 0 a 5. Voto basso, paga il CEO. Voto alto, paga il Board. Il pareggio non esiste.",
              },
            ].map((s, i) => (
              <li key={i} className="flex gap-4 rounded-lg bg-card p-4 shadow-[0_1px_0_var(--color-border)]">
                <div className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-night text-paper">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg leading-tight text-ink">{s.t}</div>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SCALE — paper */}
      <section className="paper-grain px-6 py-14">
        <div className="mx-auto max-w-xl">
          <SectionLabel code="DOC-004" name="Scala Ufficiale di Valutazione" />
          <h2 className="font-display mt-3 text-3xl text-ink">Voto 0 — 5</h2>
          <p className="mt-2 text-[15px] text-ink-soft">
            Ogni voto ha una conseguenza operativa precisa, vincolante e non rimborsabile.
          </p>

          <div className="mt-6 space-y-3">
            {SCORE_SCALE.map((s) => (
              <div
                key={s.v}
                className="flex items-stretch gap-4 overflow-hidden rounded-lg border border-border bg-card"
              >
                <div
                  className={
                    "font-display flex w-16 shrink-0 items-center justify-center text-3xl text-white " +
                    (s.tone === "bad"
                      ? "bg-stamp"
                      : s.tone === "mid"
                        ? "bg-warn text-ink"
                        : s.tone === "ok"
                          ? "bg-night"
                          : "bg-approve")
                  }
                >
                  {s.v}
                </div>
                <div className="min-w-0 py-3 pr-4">
                  <div className="font-display text-base leading-tight text-ink">{s.label}</div>
                  <div className="mt-0.5 text-[14px] leading-snug text-ink-soft">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DataRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div className={"py-2.5 " + (last ? "" : "border-b border-paper/10")}>
      <div className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-paper/50">{k}</div>
      <div className="mt-0.5 text-[15px] leading-snug text-paper">{v}</div>
    </div>
  );
}

function SectionLabel({ code, name }: { code: string; name: string }) {
  return (
    <div className="flex items-center gap-2 font-mono-tight text-[11px] uppercase tracking-[0.18em] text-ink-soft">
      <span className="rounded bg-ink/10 px-1.5 py-0.5">{code}</span>
      <span>{name}</span>
    </div>
  );
}
