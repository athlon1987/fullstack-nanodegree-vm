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
  /** Numbers and names in `candidate` that no reference supports. */
  unsupported: string[];
}

/** A reference text prepared once, for checking many candidates against it. */
export interface PreparedReference {
  numbers: Set<string>;
  words: string;
}

export function prepareReference(reference: string): PreparedReference {
  return { numbers: new Set(numbersIn(reference).map(String)), words: ` ${normalise(reference)} ` };
}

/** True when every number and name in `candidate` is supported by at least one reference. */
export function checkGrounded(candidate: string, ...references: (string | PreparedReference)[]): GuardResult {
  const prepared = references.map((reference) => (typeof reference === 'string' ? prepareReference(reference) : reference));
  const unsupported: string[] = [];
  for (const value of numbersIn(candidate)) {
    if (!prepared.some((reference) => reference.numbers.has(String(value)))) unsupported.push(String(value));
  }
  for (const name of namesIn(candidate)) {
    const key = normalise(name);
    if (key && !prepared.some((reference) => reference.words.includes(` ${key} `))) unsupported.push(name);
  }
  return { ok: unsupported.length === 0, unsupported };
}

/* ---- Extra checks for the AI rewording (security-04) ---------------------------------------- */

/**
 * Web addresses, bare domains, e-mail addresses and phone numbers in a text, normalised (lower
 * case; phones as digits only). A rewording may contain one only when a retrieved statement
 * contains the same one: a scam booking site or refund address must never reach a visitor.
 */
export function contactsIn(text: string): string[] {
  const found: string[] = [];
  let rest = text;
  for (const match of text.matchAll(/[\p{L}0-9._%+-]+@[\p{L}0-9.-]+\.[\p{L}]{2,}/gu)) {
    found.push(`email:${match[0].toLowerCase()}`);
    rest = rest.replace(match[0], ' ');
  }
  for (const match of rest.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi)) {
    found.push(`url:${match[0].toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[.,;:!?]+$/, '').replace(/\/$/, '')}`);
    rest = rest.replace(match[0], ' ');
  }
  // Bare domains: labels joined by dots ending in a letters-only label ("klia-parking-deals.example").
  for (const match of rest.matchAll(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b(?:\/[^\s<>"')]*)?/gi)) {
    if (/^\d+(?:\.\d+)+$/.test(match[0])) continue;
    found.push(`url:${match[0].toLowerCase().replace(/[.,;:!?]+$/, '').replace(/\/$/, '')}`);
  }
  for (const match of text.matchAll(/(?:\+|\b)\d[\d\s().-]{6,}\d\b/g)) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length >= 7 && !/^\d{4}-\d{2}-\d{2}$/.test(match[0].trim())) found.push(`phone:${digits}`);
  }
  return found;
}

/** Topics where a wrong yes or no could stop someone travelling or put them at risk. */
const SENSITIVE_TERMS: Record<string, RegExp> = {
  passport: /\b(?:passports?|pasport)\b/i,
  visa: /\bvisas?\b/i,
  security: /\b(?:security|screening|keselamatan|saringan)\b/i,
  immigration: /\b(?:immigration|imigresen|autogates?)\b/i,
  customs: /\b(?:customs|kastam|duty[- ]free allowance|declare|isytihar)\b/i,
  entry: /\b(?:mdac|arrival card|kad ketibaan|entry requirements?)\b/i,
  identity: /\b(?:identity card|mykad|ic|boarding pass|pas masuk)\b/i,
  health: /\b(?:vaccinat\w*|vaksin\w*|quarantine|kuarantin)\b/i,
  refund: /\b(?:refunds?|bayaran balik|compensation|pampasan)\b/i,
};
const NEGATION = /\b(?:no|not|never|none|without|don['’]?t|doesn['’]?t|isn['’]?t|aren['’]?t|needn['’]?t|cannot|can['’]?t|tidak|tak|bukan|jangan|tiada|tanpa)\b/i;

/** Sensitive topics a text speaks about, with whether the sentence is negated (`passport:no`). */
export function sensitiveClaims(text: string): Set<string> {
  const claims = new Set<string>();
  for (const sentence of text.split(/(?<=[.!?;:])\s+|\n+/)) {
    const negated = NEGATION.test(sentence);
    for (const [topic, pattern] of Object.entries(SENSITIVE_TERMS)) {
      if (pattern.test(sentence)) claims.add(`${topic}:${negated ? 'no' : 'yes'}`);
    }
  }
  return claims;
}

/**
 * The full check for an AI rewording against the retrieved statements and draft (never the
 * visitor's question): no new number or name, no web address, domain, e-mail or phone the
 * statements do not contain, and no sensitive topic (passport, visa, security, immigration,
 * customs, refunds…) that they do not discuss in the same sense (a "not" cannot appear or vanish).
 */
export function checkRewording(candidate: string, reference: string): GuardResult {
  const grounded = checkGrounded(candidate, reference);
  const unsupported = [...grounded.unsupported];
  const referenceText = reference.toLowerCase();
  const referenceContacts = new Set(contactsIn(reference));
  const referenceDigits = reference.replace(/\D/g, '');
  for (const contact of contactsIn(candidate)) {
    const [kind, value] = [contact.slice(0, contact.indexOf(':')), contact.slice(contact.indexOf(':') + 1)];
    const supported =
      referenceContacts.has(contact) ||
      (kind === 'url' && [...referenceContacts].some((known) => known.startsWith('url:') && (known.slice(4) === value || known.slice(4).startsWith(`${value}/`)))) ||
      (kind === 'phone' && referenceDigits.includes(value) && referenceContacts.has(contact)) ||
      (kind === 'email' && referenceText.includes(value));
    if (!supported) unsupported.push(contact);
  }
  const referenceClaims = sensitiveClaims(reference);
  for (const claim of sensitiveClaims(candidate)) if (!referenceClaims.has(claim)) unsupported.push(claim);
  return { ok: unsupported.length === 0, unsupported };
}
