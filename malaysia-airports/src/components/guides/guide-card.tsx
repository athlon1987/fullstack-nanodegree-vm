'use client';

import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Card, CardLink } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { SCOPE_ICONS, SCOPE_LABEL_KEYS } from './guide-meta';
import type { GuideCardView } from './guide-views.server';

export interface GuideCardProps {
  guide: GuideCardView;
  emphasis?: boolean;
  headingLevel?: 2 | 3;
  className?: string;
}

/** A guide on the hub or in "Related guides": icon, title link, summary, step count and scopes. */
export function GuideCard({ guide, emphasis = false, headingLevel = 3, className }: GuideCardProps) {
  const t = useT();
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <Card as="li" interactive padding="md" className={cn('flex min-w-0 flex-col gap-3', emphasis && 'border-ink', className)}>
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-ink">
          <Icon name={guide.icon} />
        </span>
        {emphasis ? <Badge tone="gold">{t('guidePages.hub.startHere')}</Badge> : null}
      </div>
      <Heading className="type-title-md text-ink">
        <CardLink href={`/guides/${guide.slug}`}>{guide.title}</CardLink>
      </Heading>
      <p className="type-body-sm text-ink-2">{guide.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
        <span className="type-caption text-ink-2">{t.count('guidePages.hub.steps', guide.stepCount)}</span>
        {guide.scopes.map((scope) => (
          <span key={scope} className="type-caption inline-flex items-center gap-1 text-ink-2">
            <Icon name={SCOPE_ICONS[scope]} size="xs" />
            {t(SCOPE_LABEL_KEYS[scope])}
          </span>
        ))}
      </div>
    </Card>
  );
}
