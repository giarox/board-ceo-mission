import { useEffect, useState } from "react";
import { OPERATIONS, type OpRuntime } from "@/lib/operations";
import { firebaseEnabled, getDbApi, STATE_ROOT } from "@/lib/firebase";

function readAllLocal(): Record<string, OpRuntime | null> {
  const out: Record<string, OpRuntime | null> = {};
  for (const o of OPERATIONS) {
    try {
      const raw = localStorage.getItem(`op:${o.code}`);
      out[o.code] = raw ? (JSON.parse(raw) as OpRuntime) : null;
    } catch {
      out[o.code] = null;
    }
  }
  return out;
}

function mapFromRoot(root: Record<string, unknown>): Record<string, OpRuntime | null> {
  const out: Record<string, OpRuntime | null> = {};
  for (const o of OPERATIONS) {
    out[o.code] = (root[`op:${o.code}`] as OpRuntime) ?? null;
  }
  return out;
}

/**
 * Runtime state for every Operation.
 * - Sync ON  → live from Firebase (one subscription to the shared root).
 * - Sync OFF → localStorage, refreshed on storage/focus/visibility + a 1s tick.
 */
export function useAllOpRuntimes() {
  const [map, setMap] = useState<Record<string, OpRuntime | null>>({});

  useEffect(() => {
    if (firebaseEnabled) {
      const api = getDbApi();
      if (!api) return;
      let active = true;
      let unsub = () => {};
      api.then(({ db, ref, onValue }) => {
        if (!active) return;
        unsub = onValue(ref(db, STATE_ROOT), (snap) => {
          setMap(mapFromRoot((snap.val() ?? {}) as Record<string, unknown>));
        });
      });
      return () => {
        active = false;
        unsub();
      };
    }

    // localStorage fallback (same-tab writes don't fire 'storage', so we also poll).
    setMap(readAllLocal());
    const refresh = () => setMap(readAllLocal());
    window.addEventListener("storage", refresh);
    window.addEventListener("mas:local-state-change", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const t = setInterval(refresh, 1000);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("mas:local-state-change", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(t);
    };
  }, []);

  return map;
}
