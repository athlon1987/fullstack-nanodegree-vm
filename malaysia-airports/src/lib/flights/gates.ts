/**
 * Gate letters a published location mentions: "near Gate G" is `G`, "at Gate H" is `H`, and the
 * Satellite Building at KLIA Terminal 1 holds the C gates. Pure; used to suggest lounges and
 * outlets near a passenger's gate (journey timeline and concierge).
 */
export function gatePrefixesOf(location: string | undefined): string[] {
  if (!location) return [];
  const found = new Set<string>();
  for (const match of location.matchAll(/\bgates?\s+([A-Z])(?:\d+)?\b/gi)) found.add(match[1].toUpperCase());
  for (const match of location.matchAll(/\b([A-Z])\s+gates\b/g)) found.add(match[1]);
  if (/satellite/i.test(location)) found.add('C');
  return [...found];
}
