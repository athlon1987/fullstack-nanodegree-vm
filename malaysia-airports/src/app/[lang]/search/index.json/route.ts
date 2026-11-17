import { isLang, langParams } from '@/lib/i18n';
import { buildSearchDocuments } from '@/lib/search';

/**
 * The search documents for one language, as static JSON. Built from the content layer at build
 * time and fetched by the command palette and the search page the first time they open, so no
 * page carries the index in its own payload.
 */
export function generateStaticParams() {
  return langParams();
}

export async function GET(_request: Request, context: { params: Promise<{ lang: string }> }) {
  const { lang } = await context.params;
  if (!isLang(lang)) return Response.json({ error: 'Unknown language' }, { status: 404 });
  return Response.json(buildSearchDocuments(lang));
}
