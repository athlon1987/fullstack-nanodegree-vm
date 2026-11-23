'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/cn';
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
    <div className="flex flex-col gap-16 sm:gap-20">
      {/* The filter sits on a white pill tray: one row on wide screens, wrapping on phones. */}
      <div className="flex flex-col gap-3 rounded-3xl bg-surface p-3 shadow-sm ring-1 ring-line sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:rounded-pill sm:py-2.5 sm:pr-6 sm:pl-3">
        <div role="group" aria-label={t('guidePages.hub.filterLabel')} className="flex flex-wrap items-center gap-2">
          <span aria-hidden="true" className="type-body-sm mr-1 pl-2 font-medium text-ink-2">
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
        <p role="status" className="type-body-sm pl-2 font-semibold text-ink sm:pl-0">
          {t.count('guidePages.hub.count', count)}
        </p>
      </div>

      {visible.length === 0 ? <EmptyState title={t('guidePages.hub.noMatch')} /> : null}

      {visible.map((group) => {
        // Magazine rhythm: a group that opens with a photograph gives it two columns from `lg` up;
        // a group of two shares the row in halves; a group of icon cards runs four across on wide screens.
        const photos = group.cards.filter((card) => card.image).length;
        const feature = group.cards[0]?.image && group.cards.length > 2;
        const columns =
          group.cards.length <= 2 ? 'sm:grid-cols-2' : photos === 0 && group.cards.length === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
        return (
          <section key={group.id} aria-labelledby={`guides-${group.id}`}>
            <SectionHeading id={`guides-${group.id}`} title={t(GROUP_TITLE[group.id])} lead={t(GROUP_LEAD[group.id])} />
            <ul className={cn('grid gap-5 lg:gap-6', columns)}>
              {group.cards.map((card, index) => (
                <GuideCard
                  key={card.slug}
                  guide={card}
                  emphasis={card.slug === START_HERE_GUIDE}
                  size={feature && index === 0 ? 'feature' : 'default'}
                  className={feature && index === 0 ? 'sm:col-span-2' : undefined}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
