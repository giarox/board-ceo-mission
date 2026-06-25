import { useCallback, useEffect, useRef, useState } from "react";
import { firebaseEnabled, getDbApi, STATE_ROOT } from "@/lib/firebase";

type Updater<T> = T | ((prev: T) => T);

/**
 * Shared state for a single key.
 * - Sync ON  → reads/writes Firebase Realtime DB, live for every device.
 * - Sync OFF → per-device localStorage (original behaviour).
 *
 * Same `[value, setValue, hydrated]` shape as before, and the setter still
 * accepts a value or an updater function.
 */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  const path = `${STATE_ROOT}/${key}`;

  // ── Firebase: subscribe to live updates ─────────────────────────────────
  useEffect(() => {
    if (!firebaseEnabled) return;
    const api = getDbApi();
    if (!api) return;
    let active = true;
    let unsub = () => {};
    api.then(({ db, ref, onValue }) => {
      if (!active) return;
      unsub = onValue(ref(db, path), (snap) => {
        const v = snap.val();
        setValue((v ?? initial) as T);
        setHydrated(true);
      });
    });
    return () => {
      active = false;
      unsub();
    };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── localStorage: read once, then persist on change ─────────────────────
  useEffect(() => {
    if (firebaseEnabled) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // Corrupt/blocked storage — keep the initial value.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (firebaseEnabled || !hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("mas:local-state-change", { detail: { key } }));
    } catch {
      // Ignore quota/availability errors — non-critical.
    }
  }, [key, value, hydrated]);

  const update = useCallback(
    (next: Updater<T>) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(valueRef.current) : next;
      setValue(resolved); // optimistic; Firebase listener confirms/corrects

      if (!firebaseEnabled) return;
      const api = getDbApi();
      if (!api) return;
      void api.then(({ db, ref, set, runTransaction }) => {
        const r = ref(db, path);
        if (typeof next === "function") {
          // Atomic against concurrent writers (e.g. the shot counter).
          const fn = next as (p: T) => T;
          void runTransaction(r, (cur) => fn((cur ?? valueRef.current) as T));
        } else {
          void set(r, resolved);
        }
      });
    },
    [path],
  );

  return [value, update, hydrated] as const;
}

/**
 * Shared map keyed by id (e.g. one review per Operation). Each child is written
 * independently, so two people editing *different* entries never clobber each
 * other — important for live votes/notes.
 *
 * Returns `[map, setEntry, hydrated]` where `setEntry(id, value)` updates one entry.
 */
export function useSharedMap<T>(key: string, initial: Record<string, T>) {
  const [map, setMap] = useState<Record<string, T>>(initial);
  const [hydrated, setHydrated] = useState(false);
  const mapRef = useRef(map);
  mapRef.current = map;
  const path = `${STATE_ROOT}/${key}`;

  // ── Firebase ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseEnabled) return;
    const api = getDbApi();
    if (!api) return;
    let active = true;
    let unsub = () => {};
    api.then(({ db, ref, onValue }) => {
      if (!active) return;
      unsub = onValue(ref(db, path), (snap) => {
        const v = (snap.val() ?? {}) as Record<string, T>;
        setMap({ ...initial, ...v });
        setHydrated(true);
      });
    });
    return () => {
      active = false;
      unsub();
    };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── localStorage ────────────────────────────────────────────────────────
  useEffect(() => {
    if (firebaseEnabled) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setMap({ ...initial, ...(JSON.parse(raw) as Record<string, T>) });
    } catch {
      // Keep initial on bad data.
    }
    setHydrated(true);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const setEntry = useCallback(
    (id: string, value: T) => {
      setMap((prev) => ({ ...prev, [id]: value })); // optimistic

      if (!firebaseEnabled) {
        try {
          const next = { ...mapRef.current, [id]: value };
          localStorage.setItem(key, JSON.stringify(next));
          window.dispatchEvent(new CustomEvent("mas:local-state-change", { detail: { key } }));
        } catch {
          // non-critical
        }
        return;
      }
      const api = getDbApi();
      if (!api) return;
      void api.then(({ db, ref, set }) => set(ref(db, `${path}/${id}`), value));
    },
    [key, path],
  );

  return [map, setEntry, hydrated] as const;
}
