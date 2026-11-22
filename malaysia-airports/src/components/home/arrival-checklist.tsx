'use client';

import type { Provenance, Source } from '@/content/types';
import { useJourneyMode } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Icon } from '@/components/ui/icon';

/** The entry-checklist step, read on the server from the Arriving guide record. */
export interface ArrivalChecklistItem {
  /** The guide section's title ("Before you land"). */
  heading: string;
  title: string;
  body: string;
  provenance: Provenance;
  sources: Source[];
  asOf?: string;
  action?: { label: string; href: string };
  /** The guide, without the locale: `/guides/arriving`. */
  guideHref: string;
}

/**
 * "Before you land" on the home in Arriving mode (A-18): the arrival-card step of the Arriving
 * guide, word for word from the content record, with its tag, sources and as-of date. No fact is
 * copied into interface strings. Renders nothing in the other modes.
 */
export function ArrivalChecklist({ item }: { item: ArrivalChecklistItem }) {
  const t = useT();
  const { effectiveMode } = useJourneyMode();
  if (effectiveMode !== 'arriving') return null;
  return (
    <section aria-labelledby="home-arrival-title" className="glass-dark on-media rounded-2xl p-4 text-ink sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="home-arrival-title" className="type-eyebrow flex items-center gap-2 text-gold-ink">
          <Icon name="id-card" size="sm" />
          {item.heading}
        </h2>
        <ProvenanceTag provenance={item.provenance} length="short" />
      </div>
      <p className="type-title-sm mt-2 text-ink">{item.title}</p>
      <p className="type-body-sm mt-1 max-w-reading text-ink-2">{item.body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
        {item.action ? (
          <ExternalLink variant="action" href={item.action.href} className="type-body-sm text-ink">
            {item.action.label}
          </ExternalLink>
        ) : null}
        <LocaleLink href={item.guideHref} className="link-action type-body-sm text-ink">
          {t('shellExtras.arriving.guide')}
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
        </LocaleLink>
        <SourceNote sources={item.sources} />
        {item.asOf ? <p className="type-caption text-ink-2">{t('freshness.asOf', { date: item.asOf })}</p> : null}
      </div>
    </section>
  );
}
