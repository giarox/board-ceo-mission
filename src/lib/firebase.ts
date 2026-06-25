// ─────────────────────────────────────────────────────────────────────────
// Firebase Realtime Database — shared, live state for the whole Board.
//
// Paste your Firebase **web app config** below (Firebase console → Project
// settings → "Your apps" → SDK setup and configuration → Config). These values
// are NOT secret: access is controlled by the Realtime Database security rules,
// not by hiding the keys. The web config is meant to live in the client.
//
// Until `databaseURL` is filled in, the app automatically falls back to
// per-device localStorage (exactly how it worked before) — so the site keeps
// running with or without sync.
// ─────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyB3ClYSgsSlLlZN6fdreXkD2eziv5Y2PQ4",
  authDomain: "mas2026-brl2026.firebaseapp.com",
  databaseURL: "https://mas2026-brl2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mas2026-brl2026",
  storageBucket: "mas2026-brl2026.firebasestorage.app",
  messagingSenderId: "686223377682",
  appId: "1:686223377682:web:8ab6fa98c4cd2ea461dfcb",
};

/** Live sync is on only once a Realtime Database URL is configured. */
export const firebaseEnabled = Boolean(firebaseConfig.databaseURL);

/** Root path that holds the shared Board state. Bump the version to reset all. */
export const STATE_ROOT = "state/v1";

type DbModule = typeof import("firebase/database");
export type DbApi = { db: import("firebase/database").Database } & Pick<
  DbModule,
  "ref" | "onValue" | "set" | "update" | "runTransaction"
>;

let apiPromise: Promise<DbApi> | null = null;

/**
 * Lazily initialises Firebase (dynamically imported, so it never loads during
 * SSR/prerender or for users when sync is off). Returns null when disabled.
 */
export function getDbApi(): Promise<DbApi> | null {
  if (!firebaseEnabled) return null;
  if (!apiPromise) {
    apiPromise = (async () => {
      const appMod = await import("firebase/app");
      const dbMod = await import("firebase/database");
      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
      return {
        db: dbMod.getDatabase(app),
        ref: dbMod.ref,
        onValue: dbMod.onValue,
        set: dbMod.set,
        update: dbMod.update,
        runTransaction: dbMod.runTransaction,
      };
    })();
  }
  return apiPromise;
}
