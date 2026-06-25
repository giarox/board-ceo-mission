export type Operation = {
  code: string;
  name: string;
  limitMin: number;
  activation: string;
  briefing: string;
  success: string;
};

export const OPERATIONS: Operation[] = [
  {
    code: "OP-01",
    name: "Badge Activation",
    limitMin: 5,
    activation:
      "Giacomo, in qualità di CEO, da questo momento sei ufficialmente tracciabile, valutabile e — se necessario — sostituibile senza preavviso.",
    briefing:
      "Devi indossare badge e dotazione ufficiale per tutta la durata delle Operation. Non sono ammessi rimaneggiamenti creativi, occultamenti strategici o smarrimenti accidentali.",
    success:
      "Mantenere badge e dotazione visibili, integri e operativi fino alla fine della giornata. Il Board si riserva controlli a campione.",
  },
  {
    code: "OP-02",
    name: "Export Approval",
    limitMin: 15,
    activation:
      "Giacomo, in qualità di CEO, il Board ti richiede di convincere investitori esteri, visto il chiaro e documentato fallimento sul mercato italiano.",
    briefing:
      "Devi ottenere approvazioni da sconosciuti in qualunque forma riconoscibile: firme su un foglio, 'yes' a voce, pollici alzati, selfie, video o conferme vagamente credibili. La qualità è negoziabile, la quantità no.",
    success:
      "Raccogliere almeno 5 approvazioni esterne valide, da persone diverse e visibilmente coscienti.",
  },
  {
    code: "OP-03",
    name: "Berlin Calling",
    limitMin: 10,
    activation:
      "Giacomo, in qualità di CEO, il Board ti richiede di dimostrare la tua abilità nel creare panico aziendale per motivi completamente inventati e privi di qualunque fondamento operativo.",
    briefing:
      "Devi chiamare una persona scelta dal Board e seguire alla lettera lo scenario assegnato, senza ridere, senza smentire e senza chiedere scusa in diretta.",
    success:
      "Generare almeno una reazione valida, reale e genuina dall'altra parte della cornetta. Silenzi imbarazzati inclusi.",
  },
  {
    code: "OP-04",
    name: "Asset Acquisition",
    limitMin: 20,
    activation:
      "Giacomo, in qualità di CEO, il Board ti richiede di produrre contenuti visivi strategici, utili a coprire l'assenza totale di una strategia.",
    briefing:
      "Devi completare le foto o i video richiesti dal Board durante la serata. Il Board si riserva il diritto di rifiutare qualsiasi asset 'troppo dignitoso'.",
    success:
      "Produrre almeno 5 asset visivi validi: pose stupide, scene imbarazzanti, oggetti inutili o materiale che un domani negherai davanti a un giudice.",
  },
  {
    code: "OP-05",
    name: "External Advisory",
    limitMin: 15,
    activation:
      "Giacomo, in qualità di CEO, il Board ti richiede di avviare una consulenza esterna da sconosciuti, ubriachi o tedeschi: tre categorie comunque più affidabili di noi.",
    briefing:
      "Devi raccogliere consigli matrimoniali da fonti esterne non qualificate. Sono espressamente esclusi parenti, ex e psicologi praticanti.",
    success:
      "Ottenere almeno 3 consigli matrimoniali validi da persone diverse, possibilmente contraddittori tra loro.",
  },
  {
    code: "OP-06",
    name: "Budget Negotiation",
    limitMin: 15,
    activation:
      "Giacomo, in qualità di CEO, il Board ti richiede di trasformare la vergogna e la pietà in capitale, dato che quello dell'azienda è stato bruciato malamente nel Q1.",
    briefing:
      "Devi ottenere qualcosa senza pagare: un oggetto, un favore, un gadget, uno sconto, un souvenir o una risorsa anche palesemente inutile. Il furto non è negoziazione.",
    success:
      "Acquisire almeno 1 risorsa senza usare budget diretto, e poterne dimostrare la provenienza al Board.",
  },
  {
    code: "OP-07",
    name: "Quality Control",
    limitMin: 5,
    activation:
      "Giacomo, in qualità di CEO, il Board ti richiede di prenderti finalmente le tue responsabilità e testare in prima persona il prodotto che ha fatto fuori gli ultimi due stagisti.",
    briefing:
      "Devi assaggiare il cocktail preparato dal Board e fornire una valutazione tecnica strutturata, sobria almeno nella forma.",
    success:
      "Indovinare almeno 2 componenti del cocktail. Le bestemmie non contano come ingredienti.",
  },
];

export const SCORE_SCALE = [
  { v: 0, label: "Fallimento critico", desc: "Giro di shot per tutto il Board, a spese del CEO.", tone: "bad" as const },
  { v: 1, label: "Performance insufficiente", desc: "Shot per il CEO, a sue spese.", tone: "bad" as const },
  { v: 2, label: "Approvazione con riserva", desc: "Passa, ma resta agli atti del Board.", tone: "mid" as const },
  { v: 3, label: "Approvazione standard", desc: "Operation approvata senza obiezioni formali.", tone: "ok" as const },
  { v: 4, label: "Approvazione con merito", desc: "Operation approvata, con stima del Board.", tone: "good" as const },
  { v: 5, label: "Performance eccellente", desc: "Drink per il CEO, offre il Board.", tone: "good" as const },
];

export const QUICK_TAGS = ["epico", "scena muta", "imbarazzante", "rivedibile", "leggendario", "da rimuovere dagli atti"];

// Shared types for review state
export type Review = { score: number | null; tags: string[]; note: string };
export const EMPTY_REVIEWS: Record<string, Review> = Object.fromEntries(
  OPERATIONS.map((o) => [o.code, { score: null, tags: [], note: "" }]),
);

// Operation runtime state (mirrors Operations.tsx OpCard storage)
export type OpRuntime = {
  elapsedMs: number | null;
  startedAt: number | null;
  expired: boolean;
};
export const EMPTY_OP_RUNTIME: OpRuntime = { elapsedMs: null, startedAt: null, expired: false };

export type OpStatus = "idle" | "running" | "done" | "expired";

export function statusFromRuntime(s: OpRuntime | null | undefined): OpStatus {
  if (!s) return "idle";
  if (s.expired) return "expired";
  if (s.startedAt !== null && s.elapsedMs === null) return "running";
  if (s.elapsedMs !== null) return "done";
  return "idle";
}

export const STATUS_LABEL: Record<OpStatus, string> = {
  idle: "Da avviare",
  running: "In corso",
  done: "Completata",
  expired: "Tempo scaduto",
};
