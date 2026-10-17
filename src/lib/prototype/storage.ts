import { PrototypeState } from "./types";
import { createSeed } from "./seed";
// Replace this boundary with a database adapter when the prototype is ready.
export const STORAGE_KEY = "timerfm-prototype-v1";
export function loadPrototype(): PrototypeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (
        data.version === 1 &&
        Array.isArray(data.activities) &&
        Array.isArray(data.tasks) &&
        Array.isArray(data.projects) &&
        Array.isArray(data.checkIns) &&
        Array.isArray(data.completions) &&
        Array.isArray(data.sessions) &&
        Array.isArray(data.challenges) &&
        data.user
      )
        return data;
    }
  } catch {
    /* Some browsers do not provide local storage. */
  }
  return createSeed();
}
export function savePrototype(data: PrototypeState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
