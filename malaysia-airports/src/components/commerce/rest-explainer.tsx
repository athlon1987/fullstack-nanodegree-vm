import type { Lang } from '@/content/types';
import { getT } from '@/lib/i18n';
import type { TKey } from '@/lib/i18n/translate';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Icon, type IconKey } from '@/components/ui/icon';

const SIDES: readonly { id: 'airside' | 'landside'; icon: IconKey; points: readonly TKey[] }[] = [
  {
    id: 'airside',
    icon: 'scan-line',
    points: ['commercePages.lounges.explainer.airside1', 'commercePages.lounges.explainer.airside2', 'commercePages.lounges.explainer.airside3'],
  },
  {
    id: 'landside',
    icon: 'door-open',
    points: ['commercePages.lounges.explainer.landside1', 'commercePages.lounges.explainer.landside2', 'commercePages.lounges.explainer.landside3'],
  },
];

/**
 * For transit passengers: what resting airside or landside means for the next flight. General
 * advice, tagged as a suggestion; the facts about each place are in the cards above.
 */
export function RestExplainer({ lang, transitHref }: { lang: Lang; transitHref?: string }) {
  const t = getT(lang);
  return (
    <section aria-labelledby="rest-explainer-title" className="mt-16 rounded-xl border border-line-strong bg-page-subtle p-5 sm:p-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="type-eyebrow text-gold-ink">{t('commercePages.lounges.explainer.eyebrow')}</p>
        <ProvenanceTag provenance="suggestion" />
      </div>
      <h2 id="rest-explainer-title" className="type-display-sm mt-3 text-ink">
        {t('commercePages.lounges.explainer.title')}
      </h2>
      <p className="type-body mt-2 max-w-reading text-ink-2">{t('commercePages.lounges.explainer.lead')}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {SIDES.map((side) => (
          <div key={side.id} className="min-w-0 rounded-lg border border-line bg-surface p-5">
            <h3 className="type-title-md flex items-center gap-2.5 text-ink">
              <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-md bg-page-subtle text-ink">
                <Icon name={side.icon} size="sm" />
              </span>
              {t(side.id === 'airside' ? 'commercePages.lounges.explainer.airsideTitle' : 'commercePages.lounges.explainer.landsideTitle')}
            </h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {side.points.map((point) => (
                <li key={point} className="type-body-sm flex gap-2.5 text-ink">
                  <Icon name="chevron-right" size="sm" className="mt-0.5 shrink-0 text-ink-3" />
                  <span className="min-w-0">{t(point)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="type-body-sm flex gap-2 text-ink-2">
          <Icon name="lightbulb" size="sm" className="mt-0.5 shrink-0" />
          <span>{t('commercePages.lounges.explainer.tip')}</span>
        </p>
        {transitHref ? (
          <LocaleLink href={transitHref} className="link-action type-body-sm inline-flex items-center gap-1.5">
            {t('commercePages.lounges.explainer.transitLink')}
            <Icon name="arrow-right" size="sm" />
          </LocaleLink>
        ) : null}
      </div>
    </section>
  );
}
