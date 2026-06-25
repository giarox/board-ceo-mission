// Board admin actions — wipe parts of the shared state. Works against Firebase
// (live for everyone) when sync is on, else clears localStorage.
import { OPERATIONS } from "@/lib/operations";
import { firebaseEnabled, getDbApi, STATE_ROOT } from "@/lib/firebase";

const OP_KEYS = OPERATIONS.map((o) => `op:${o.code}`);
const REVIEWS_KEY = "reviews:v1";
const VERDICT_KEY = "verdict:v1";
const SHOTS_KEY = "shots:timers"; // legacy, may linger in old localStorage

function clearLocal(keys: string[]) {
  try {
    keys.forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent("mas:local-state-change", { detail: { key: "*" } }));
  } catch {
    // ignore
  }
}

async function clearKeys(keys: string[]) {
  if (!firebaseEnabled) return clearLocal(keys);
  const api = await getDbApi();
  if (!api) return;
  await Promise.all(keys.map((k) => api.set(api.ref(api.db, `${STATE_ROOT}/${k}`), null)));
}

/** Reset every Operation timer/activation (and the shots from expired timers). */
export async function resetOperations() {
  await clearKeys(OP_KEYS);
}

/** Clear all Board votes and notes. */
export async function resetRatings() {
  await clearKeys([REVIEWS_KEY]);
}

/** Clear the final verdict only. */
export async function resetVerdict() {
  await clearKeys([VERDICT_KEY]);
}

/** Nuke the entire shared state. */
export async function resetAll() {
  if (!firebaseEnabled) return clearLocal([...OP_KEYS, REVIEWS_KEY, VERDICT_KEY, SHOTS_KEY]);
  const api = await getDbApi();
  if (!api) return;
  await api.set(api.ref(api.db, STATE_ROOT), null);
}
