/** Longest question the concierge accepts, in characters (UI, API and engine agree). */
export const CONCIERGE_MAX_QUESTION = 400;

/** Request timeout for the browser's call to `/api/concierge`, in milliseconds. */
export const CONCIERGE_CLIENT_TIMEOUT_MS = 12_000;

/** Time allowed for the optional AI rewording on the server, in milliseconds. */
export const CONCIERGE_REPHRASE_TIMEOUT_MS = 8_000;

/** Caps that keep answers short enough to read on a phone. */
export const ANSWER_LIMITS = { statements: 5, cards: 4, actions: 4 } as const;
