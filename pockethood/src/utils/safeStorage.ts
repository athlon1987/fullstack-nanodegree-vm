// localStorage can be missing or throw (private windows, sandboxed frames).
// These helpers make per-device conveniences degrade silently.
export const safeGet = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
export const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* unavailable */
  }
};
export const safeRemove = (k: string) => {
  try {
    localStorage.removeItem(k);
  } catch {
    /* unavailable */
  }
};
