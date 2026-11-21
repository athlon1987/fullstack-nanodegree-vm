/**
 * SEO building blocks for every team (server only). See docs/engineering/handoffs/platform.md.
 *
 *   import { JsonLd, airportJsonLd, pageMetadata } from '@/lib/seo';
 *
 * `legacy-redirects.ts` and `security-headers.ts` are read by `next.config.ts` and are not
 * re-exported here.
 */
export { JsonLd, serializeJsonLd, type JsonLdData } from './json-ld';
export { INHERITED_ALTERNATES, pageMetadata, type PageMetadataInput } from './metadata';
export { airportJsonLd, breadcrumbJsonLd, organizationJsonLd, websiteJsonLd } from './schemas';
export { SITE_URL, SITE_INDEXABLE, absoluteUrl, localePaths } from './site';
