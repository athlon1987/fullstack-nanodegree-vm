/**
 * The fact guard: checks that a piece of text introduces no number and no capitalised name that
 * is absent from a reference text. Used on the AI rewording before it replaces the grounded
 * answer, and by the unit tests as the "no invented facts" property.
 */
import { normalise } from './text';

/** Numbers as they appear: "RM 55.00" gives 55; "14:35" gives 14 and 35. */
export function numbersIn(text: string): number[] {
  return [...text.matchAll(/\d+(?:[.,]\d+)*/g)].flatMap((match) => {
    const raw = match[0].replace(/,(?=\d{3}\b)/g, '');
    const value = Number.parseFloat(raw.replace(',', '.'));
    return Number.isFinite(value) ? [value] : [];
  });
}

/** Capitalised words that are not at the start of a sentence: likely names of places, airlines, products. */
export function namesIn(text: string): string[] {
  const names: string[] = [];
  for (const match of text.matchAll(/(^|[.!?:;]\s+|\s|\(|“|")([A-Z][\p{L}0-9&@'’-]*)/gu)) {
    const startOfSentence = match.index === 0 || /[.!?:;]\s+$/.test(match[1]);
    const name = match[2].replace(/[’']s$/, '');
    if (!startOfSentence && name.length > 1) names.push(name);
  }
  return names;
}

export interface GuardResult {
  ok: boolean;
  /** Numbers and names in `candidate` that `reference` does not support. */
  unsupported: string[];
}

/** True when every number and name in `candidate` is supported by `reference`. */
export function checkGrounded(candidate: string, reference: string): GuardResult {
  const allowedNumbers = new Set(numbersIn(reference).map((value) => String(value)));
  const referenceWords = ` ${normalise(reference)} `;
  const unsupported: string[] = [];
  for (const value of numbersIn(candidate)) {
    if (!allowedNumbers.has(String(value))) unsupported.push(String(value));
  }
  for (const name of namesIn(candidate)) {
    const key = normalise(name);
    if (key && !referenceWords.includes(` ${key} `)) unsupported.push(name);
  }
  return { ok: unsupported.length === 0, unsupported };
}
