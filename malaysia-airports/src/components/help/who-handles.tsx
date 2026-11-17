import type { Translator } from '@/lib/i18n/translate';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { WHO_CONTACT_KEYS, WHO_HANDLES } from './help-meta';
import type { FaqView } from './help-views.server';

export interface WhoHandlesProps {
  t: Translator;
  /** FAQ views by id: each row links to its sourced answer and shows its provenance. */
  faqs: Readonly<Record<string, FaqView>>;
  /** Limit to these row ids. */
  only?: readonly string[];
}

/** "Who handles what": a small table that sends people straight to the right organisation. */
export function WhoHandles({ t, faqs, only }: WhoHandlesProps) {
  const rows = WHO_HANDLES.filter((row) => faqs[row.faq] && (!only || only.includes(row.id)));
  if (rows.length === 0) return null;
  return (
    <div className="@container min-w-0">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{t('guidePages.help.whoCaption')}</caption>
        <thead className="sr-only @2xl:not-sr-only">
          <tr className="border-b border-line-strong">
            <th scope="col" className="type-caption py-2 pr-4 font-semibold text-ink-2">
              {t('guidePages.help.whoSituation')}
            </th>
            <th scope="col" className="type-caption py-2 pr-4 font-semibold text-ink-2">
              {t('guidePages.help.whoContact')}
            </th>
            <th scope="col" className="type-caption py-2 font-semibold text-ink-2">
              {t('guidePages.help.whoDetails')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const faq = faqs[row.faq];
            return (
              <tr key={row.id} className="grid border-b border-line py-3 @2xl:table-row @2xl:py-0">
                <th scope="row" className="type-body-sm font-normal text-ink-2 @2xl:py-3 @2xl:pr-4">
                  {t(row.situation)}
                </th>
                <td className="type-title-sm mt-0.5 text-ink @2xl:py-3 @2xl:pr-4">{t(WHO_CONTACT_KEYS[row.contact])}</td>
                <td className="mt-1 @2xl:py-3">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <LocaleLink href={`/help/${faq.topic}#${faq.id}`} className="link-action type-body-sm text-ink">
                      {t('guidePages.help.readAnswer')}
                      <span className="sr-only">: {faq.question}</span>
                    </LocaleLink>
                    <ProvenanceTag provenance={faq.provenance} length="short" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
