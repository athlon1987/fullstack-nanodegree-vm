import { isLang, langParams } from '@/lib/i18n';
import { buildConciergeKnowledge } from '@/lib/concierge/knowledge.server';

/**
 * The concierge knowledge pack for one language, as static JSON built at build time. The
 * concierge loads it in the background once the visitor has agreed to use it, so the answer
 * engine can also run in the browser when `/api/concierge` cannot be reached (offline,
 * rate-limited or down). No page carries it in its own payload.
 */
export function generateStaticParams() {
  return langParams();
}

export async function GET(_request: Request, context: { params: Promise<{ lang: string }> }) {
  const { lang } = await context.params;
  if (!isLang(lang)) return Response.json({ error: 'Unknown language' }, { status: 404 });
  return Response.json(buildConciergeKnowledge(lang));
}
