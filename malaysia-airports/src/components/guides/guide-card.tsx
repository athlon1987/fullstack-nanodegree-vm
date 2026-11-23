'use client';

import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/cn';
import { Card, CardLink } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { MediaCard } from '@/components/ui/media-card';
import { SCOPE_ICONS, SCOPE_LABEL_KEYS } from './guide-meta';
import type { GuideCardView } from './guide-views.server';

export interface GuideCardProps {
  guide: GuideCardView;
  emphasis?: boolean;
  headingLevel?: 2 | 3;
  /** `feature`: the wide photograph that opens a group on the hub (from `lg` up). */
  size?: 'default' | 'feature';
  /** Use the photograph when the guide has one. Default true. */
  photo?: boolean;
  className?: string;
}

/** "Start here": a small solid gold pill, the hub's one gold accent. */
export function StartHerePill({ label, className }: { label: string; className?: string }) {
  return <span className={cn('type-caption inline-flex min-h-7 items-center gap-1.5 rounded-pill bg-gold px-3 font-semibold text-on-gold shadow-sm', className)}>{label}</span>;
}

function CardFacts({ guide }: { guide: GuideCardView }) {
  const t = useT();
  return (
    <p className="type-caption flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-2">
      <span className="font-semibold text-ink">{t.count('guidePages.hub.steps', guide.stepCount)}</span>
      {guide.scopes.map((scope) => (
        <span key={scope} className="inline-flex items-center gap-1">
          <Icon name={SCOPE_ICONS[scope]} size="xs" />
          {t(SCOPE_LABEL_KEYS[scope])}
        </span>
      ))}
    </p>
  );
}

/**
 * A guide on the hub or under "Related guides" (redesign stage two). A guide with a truthful
 * photograph is a `MediaCard` (the words on its own scrim); every other guide is an editorial card
 * with its line icon on a soft plate with the scattered-flower motif. Either way the title is the
 * card's one link.
 */
export function GuideCard({ guide, emphasis = false, headingLevel = 3, size = 'default', photo = true, className }: GuideCardProps) {
  const t = useT();
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const startHere = emphasis ? <StartHerePill label={t('guidePages.hub.startHere')} /> : null;

  if (photo && guide.image) {
    return (
      <MediaCard
        as="li"
        image={guide.image}
        href={`/guides/${guide.slug}`}
        title={guide.title}
        description={guide.summary}
        headingLevel={headingLevel}
        meta={startHere}
        footer={<CardFacts guide={guide} />}
        aspect="portrait"
        sizes={size === 'feature' ? '(min-width: 64rem) 66vw, 100vw' : '(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw'}
        className={cn(
          'min-w-0',
          // From `lg` up the photograph fills its grid cell, so a row of cards shares one height.
          'lg:aspect-auto lg:h-full lg:min-h-[26rem]',
          size === 'feature' && 'sm:aspect-[16/10] lg:aspect-auto lg:min-h-[30rem] sm:[&_h2]:type-display-sm sm:[&_h3]:type-display-sm',
          className,
        )}
      />
    );
  }

  return (
    <Card as="li" interactive className={cn('flex h-full min-w-0 flex-col overflow-hidden', className)}>
      <div aria-hidden="true" className="relative flex h-32 items-end justify-between overflow-hidden rounded-t-[inherit] bg-[linear-gradient(135deg,var(--color-primary-soft),var(--color-page-subtle)_75%)] px-5 pb-4 sm:px-6">
        <span className="pattern-tabur-fade absolute inset-0 text-primary-ink opacity-[0.08]" />
        <span className="relative flex size-14 items-center justify-center rounded-2xl bg-surface text-primary-ink shadow-md ring-1 ring-line">
          <Icon name={guide.icon} size="lg" strokeWidth={1.5} />
        </span>
        {startHere ? <span className="relative self-start pt-4">{startHere}</span> : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pt-5 pb-5 sm:px-6 sm:pb-6">
        <Heading className="type-title-lg text-ink">
          <CardLink href={`/guides/${guide.slug}`}>{guide.title}</CardLink>
        </Heading>
        <p className="type-body-sm text-ink-2">{guide.summary}</p>
        <div className="mt-auto pt-3">
          <CardFacts guide={guide} />
        </div>
      </div>
    </Card>
  );
}
