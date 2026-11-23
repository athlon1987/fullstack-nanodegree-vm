import { NotPublished } from '@/components/common/not-published';
import { Icon, type IconName } from '@/components/ui/icon';
import type { Translator } from '@/lib/i18n';
import type { FactView } from './corporate-data.server';
import { FactMeta } from './fact-meta';

export interface BusinessAreaCardProps {
  id: string;
  icon: IconName;
  title: string;
  body: string;
  facts: readonly FactView[];
  t: Translator;
}

/**
 * One line of business as a ledger row: what it covers, what is published about it (or that
 * nothing is), and that no dedicated channel is published. Stacks on phones.
 */
export function BusinessAreaCard({ id, icon, title, body, facts, t }: BusinessAreaCardProps) {
  return (
    <article aria-labelledby={`area-${id}`} className="grid gap-x-10 gap-y-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_11rem]">
      <div className="flex min-w-0 gap-4">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
          <Icon name={icon} size="lg" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <h3 id={`area-${id}`} className="type-title-lg text-ink">
            {title}
          </h3>
          <p className="type-body mt-1 text-ink-2">{body}</p>
        </div>
      </div>
      <div className="min-w-0 max-lg:pl-15">
        <h4 className="type-eyebrow text-ink-3">{t('corporatePages.business.knownTitle')}</h4>
        {facts.length ? (
          <ul className="mt-2 flex flex-col gap-4">
            {facts.map((fact) => (
              <li key={fact.id} className="min-w-0">
                <p className="type-body-sm font-semibold text-ink">{fact.label}</p>
                <p className="type-body-sm mt-0.5 text-ink-2">
                  {fact.value}
                  {fact.note ? ` ${fact.note}` : null}
                </p>
                <FactMeta className="mt-1.5" provenance={fact.provenance} dateLabel={t('corporatePages.common.asOf', { date: fact.asOf })} sources={fact.sources} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-body-sm mt-2 text-ink-2">{t('corporatePages.business.nothingKnown')}</p>
        )}
      </div>
      <div className="min-w-0 max-lg:pl-15">
        <h4 className="type-eyebrow text-ink-3">{t('corporatePages.business.channelLabel')}</h4>
        <NotPublished className="mt-2" />
      </div>
    </article>
  );
}
