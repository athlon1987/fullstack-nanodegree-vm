/**
 * Canonical and hreflang links as HTTP `Link` headers on every localised page (docs-02), applied
 * from `next.config.ts` `headers()`. The root layout cannot know the page's path, so until every
 * route's `generateMetadata` calls `pageMetadata` (the HTML `<link>` tags; hand-off to the page
 * owners) these headers give crawlers the canonical URL and both language versions for 100% of
 * pages. Search engines read `rel="canonical"` and `hreflang` from `Link` headers as they do
 * from the HTML; both carry the same values.
 *
 * File-like paths (`/en/opengraph-image.png`, `/en/search/index.json`) are left out.
 * Pure module with NO imports: `next.config.ts` loads it outside the app bundle.
 */

export interface PathHeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

/** The `Link` value for a page whose path after the locale is `rest` (`''` or `/kul/parking`). */
export function alternateLinkValue(origin: string, lang: string, rest: string): string {
  const base = origin.replace(/\/+$/, '');
  return [
    `<${base}/${lang}${rest}>; rel="canonical"`,
    `<${base}/en${rest}>; rel="alternate"; hreflang="en"`,
    `<${base}/ms${rest}>; rel="alternate"; hreflang="ms"`,
    `<${base}/en${rest}>; rel="alternate"; hreflang="x-default"`,
  ].join(', ');
}

/** `headers()` rules: `:lang` and `:path` are filled in by Next.js from the matched URL. */
export function alternateLinkRules(siteUrl: string): PathHeaderRule[] {
  return [
    { source: '/:lang(en|ms)', headers: [{ key: 'Link', value: alternateLinkValue(siteUrl, ':lang', '') }] },
    { source: '/:lang(en|ms)/:path((?!.*\\.[A-Za-z0-9]+$).+)', headers: [{ key: 'Link', value: alternateLinkValue(siteUrl, ':lang', '/:path') }] },
  ];
}
