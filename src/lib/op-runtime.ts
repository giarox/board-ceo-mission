import { useEffect, useState } from "react";
import { OPERATIONS, type OpRuntime } from "@/lib/operations";

function readAll(): Record<string, OpRuntime | null> {
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

/**
 * Reads runtime state for every Operation from localStorage.
 * Refreshes on storage events, tab focus and on a 1s interval
 * (covers same-tab writes, since localStorage doesn't fire 'storage' locally).
 */
export function useAllOpRuntimes() {
  const [map, setMap] = useState<Record<string, OpRuntime | null>>({});

  useEffect(() => {
    setMap(readAll());
    const refresh = () => setMap(readAll());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const t = setInterval(refresh, 1000);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(t);
    };
  }, []);

  return map;
}
