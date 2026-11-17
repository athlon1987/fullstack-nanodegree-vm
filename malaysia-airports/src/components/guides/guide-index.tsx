'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/client';
import { EmptyState } from '@/components/common/empty-state';
import { SectionHeading } from '@/components/common/section-heading';
import { FilterChip } from '@/components/ui/filter-chip';
import { GuideCard } from './guide-card';
import { SCOPE_ICONS, SCOPE_LABEL_KEYS, START_HERE_GUIDE, type GuideGroupId } from './guide-meta';
import { GUIDE_SCOPES, type GuideScope } from './guide-scopes';
import type { GuideCardView } from './guide-views.server';

export interface GuideIndexProps {
  groups: readonly { id: GuideGroupId; cards: readonly GuideCardView[] }[];
}

const GROUP_TITLE = { before: 'guidePages.hub.groups.before', borders: 'guidePages.hub.groups.borders', care: 'guidePages.hub.groups.care' } as const;
const GROUP_LEAD = { before: 'guidePages.hub.groupLeads.before', borders: 'guidePages.hub.groupLeads.borders', care: 'guidePages.hub.groupLeads.care' } as const;

/**
 * The guide hub: an "applies to" filter over guide cards grouped by stage of the trip. Every card
 * is in the server HTML; without JavaScript the filter simply does nothing.
 */
export function GuideIndex({ groups }: GuideIndexProps) {
  const t = useT();
  const [scope, setScope] = useState<GuideScope | null>(null);
  const visible = groups
    .map((group) => ({ ...group, cards: scope ? group.cards.filter((card) => card.scopes.includes(scope)) : group.cards }))
    .filter((group) => group.cards.length > 0);
  const count = visible.reduce((sum, group) => sum + group.cards.length, 0);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <div role="group" aria-label={t('guidePages.hub.filterLabel')} className="flex flex-wrap items-center gap-2">
          <span aria-hidden="true" className="type-body-sm mr-1 text-ink-2">
            {t('guidePages.hub.filterLabel')}
          </span>
          <FilterChip pressed={scope === null} onPressedChange={() => setScope(null)}>
            {t('guidePages.hub.filterAll')}
          </FilterChip>
          {GUIDE_SCOPES.map((item) => (
            <FilterChip key={item} icon={SCOPE_ICONS[item]} pressed={scope === item} onPressedChange={(on) => setScope(on ? item : null)}>
              {t(SCOPE_LABEL_KEYS[item])}
            </FilterChip>
          ))}
        </div>
        <p role="status" className="type-caption text-ink-2">
          {t.count('guidePages.hub.count', count)}
        </p>
      </div>

      {visible.length === 0 ? <EmptyState title={t('guidePages.hub.noMatch')} /> : null}

      {visible.map((group) => (
        <section key={group.id} aria-labelledby={`guides-${group.id}`}>
          <SectionHeading id={`guides-${group.id}`} title={t(GROUP_TITLE[group.id])} lead={t(GROUP_LEAD[group.id])} variant="title" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.cards.map((card) => (
              <GuideCard key={card.slug} guide={card} emphasis={card.slug === START_HERE_GUIDE} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
