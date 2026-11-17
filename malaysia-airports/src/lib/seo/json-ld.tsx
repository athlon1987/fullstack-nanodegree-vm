/**
 * Structured data for search engines (schema.org JSON-LD), as the Next.js guide recommends: a
 * native `<script type="application/ld+json">` in the page, with `<` escaped so content can
 * never close the script element. It is a data block, not script, so the CSP does not apply.
 *
 * @example <JsonLd data={airportJsonLd(airport, lang)} />
 */

/** A JSON-LD object or a list of them (`@context` included by the builders in `schemas.ts`). */
export type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

/** Serialise for embedding in HTML: `<` becomes `<` (also covers `</script>` and `<!--`). */
export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function JsonLd({ data }: { data: JsonLdData }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
