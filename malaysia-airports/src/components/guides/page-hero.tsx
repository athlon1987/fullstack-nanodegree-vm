import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container } from '@/components/ui/container';
import { HeroMedia } from '@/components/ui/hero-media';
import { Icon, type IconKey } from '@/components/ui/icon';
import type { MediaImage } from '@/components/ui/media';

export interface PageHeroProps {
  /** The page's single `h1`. It is static HTML: never behind a Suspense boundary, never animated in. */
  title: ReactNode;
  lead?: ReactNode;
  /** One short kicker above the title, on a gold rule. */
  eyebrow?: ReactNode;
  /** `<Breadcrumbs>` for the page. */
  breadcrumbs?: ReactNode;
  /** Facts under the lead (step count, date checked, chips). */
  meta?: ReactNode;
  /** Primary actions for the page. */
  actions?: ReactNode;
  /**
   * A truthful library photograph (a place's own photograph, or a travel picture for a travel
   * topic): the header becomes a photograph with the words on a content-relative scrim. Only one
   * per page; it is preloaded.
   */
  image?: MediaImage;
  /**
   * Without a photograph: `midnight` is the brand band for landing pages (guides, help, corporate),
   * `light` the quiet editorial header for reading pages (privacy, terms, a guide without a photograph).
   */
  tone?: 'midnight' | 'light';
  /** A large line icon as the header's emblem from `lg` up (decorative), when there is no photograph. */
  emblem?: IconKey;
  /** `lg` for landing pages (bigger title), `md` for everything else. */
  size?: 'md' | 'lg';
  /** Content under the words inside the band, for example the help centre's search. */
  children?: ReactNode;
  /** Classes for the outer element. */
  className?: string;
  /** Narrower content column for focused tool pages (search, notices). */
  width?: 'page' | 'narrow';
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="type-overline mb-4 flex items-center gap-3 text-gold-ink">
      <span aria-hidden="true" className="h-px w-8 bg-gold" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** The quiet emblem beside a title without a photograph: concentric rings, one gold, and the topic's icon. */
function Emblem({ icon, tone }: { icon: IconKey; tone: 'midnight' | 'light' }) {
  return (
    <div aria-hidden="true" className="relative hidden size-44 shrink-0 items-center justify-center lg:flex xl:size-52">
      <span className={cn('absolute inset-0 rounded-full border', tone === 'midnight' ? 'border-on-midnight/10' : 'border-line-strong/70')} />
      <span className="absolute inset-5 rounded-full border border-gold/50" />
      <span
        className={cn(
          'relative flex size-24 items-center justify-center rounded-full shadow-lg xl:size-28',
          tone === 'midnight' ? 'bg-on-midnight/8 text-gold-bright ring-1 ring-on-midnight/15' : 'bg-surface text-primary-ink ring-1 ring-line',
        )}
      >
        <Icon name={icon} size="xl" strokeWidth={1.25} className="size-11 xl:size-12" />
      </span>
    </div>
  );
}

/**
 * The top of a content page in Direction v2 (redesign stage two): a photograph where a truthful
 * one exists, otherwise a midnight brand band or a quiet light header with an emblem. Breadcrumbs,
 * one kicker, a big Hanken title and a lead, as on the home and airport heroes.
 *
 * Text over a photograph sits on `HeroMedia`'s scrim (4.5:1 over a white photograph); on the
 * midnight band it is an `on-media` scope (light ink, light focus ring).
 */
export function PageHero({ title, lead, eyebrow, breadcrumbs, meta, actions, image, tone = 'midnight', emblem, size = 'md', children, className, width = 'page' }: PageHeroProps) {
  const heading = <h1 className={cn('text-ink [text-wrap:balance]', size === 'lg' ? 'type-display-xl' : 'type-display-lg')}>{title}</h1>;
  const words = (
    <>
      {eyebrow ? <Kicker>{eyebrow}</Kicker> : null}
      {heading}
      {lead ? <p className="type-lead mt-5 max-w-reading text-ink-2 [text-wrap:pretty]">{lead}</p> : null}
      {meta ? <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">{meta}</div> : null}
      {actions ? <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </>
  );

  if (image) {
    return (
      <>
        <HeroMedia image={image} preload scrim="left" size="medium" as="header" className={className} contentClassName="pt-16 md:pt-28">
          {breadcrumbs ? <div className="mb-8 [&_[data-breadcrumbs]]:text-ink-2">{breadcrumbs}</div> : null}
          {words}
        </HeroMedia>
        {children ? <Container className="relative z-10 -mt-8">{children}</Container> : null}
      </>
    );
  }

  const midnight = tone === 'midnight';
  return (
    <header className={cn('relative isolate overflow-hidden', midnight ? 'on-media surface-midnight text-ink' : 'bg-page', className)}>
      {midnight ? (
        <>
          {/* Scattered-flower motif in gold, fading out towards the words: quiet decoration only. */}
          <span aria-hidden="true" className="pattern-tabur-fade absolute inset-y-0 right-0 -z-10 w-[min(42rem,60%)] text-gold opacity-[0.09]" />
          <span aria-hidden="true" className="rule-gold absolute inset-x-0 bottom-0 opacity-50" />
        </>
      ) : (
        <span aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(60rem_22rem_at_88%_0%,color-mix(in_srgb,var(--color-gold-soft)_70%,transparent),transparent_70%)]" />
      )}
      <Container size={width} className={cn('pt-3 sm:pt-4', midnight ? 'pb-12 sm:pb-16' : 'pb-10 sm:pb-12')}>
        {breadcrumbs ? <div className="mb-8 sm:mb-12">{breadcrumbs}</div> : <div className="h-6 sm:h-10" />}
        <div className="flex items-end justify-between gap-12">
          <div className="min-w-0 max-w-[52rem] flex-1">{words}</div>
          {emblem ? <Emblem icon={emblem} tone={midnight ? 'midnight' : 'light'} /> : null}
        </div>
        {children ? <div className="mt-8 sm:mt-10">{children}</div> : null}
      </Container>
    </header>
  );
}
