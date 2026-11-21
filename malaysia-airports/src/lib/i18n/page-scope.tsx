import { lang as routeLang } from 'next/root-params';
import type { ReactNode } from 'react';
import { I18nScope, toLang } from './index';

/**
 * Server Component: `I18nScope` for a whole page, reading the language from the root param.
 * Pages whose Client Components read a scoped namespace (`SCOPED_NAMESPACES`) wrap their content
 * in it (round 2, E-11/E-01): the root provider no longer sends the guide, transport, shop and
 * dine, map and home copy to every page (about 45 KB of each page's HTML).
 *
 *   export default function MapPage(props) {
 *     return <I18nPageScope namespaces={['mapPages']}><Suspense …>…</Suspense></I18nPageScope>;
 *   }
 */
export async function I18nPageScope({ namespaces, children }: { namespaces: readonly string[]; children: ReactNode }) {
  const lang = toLang(await routeLang());
  return (
    <I18nScope lang={lang} namespaces={namespaces}>
      {children}
    </I18nScope>
  );
}
