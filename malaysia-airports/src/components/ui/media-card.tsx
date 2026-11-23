import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { LocaleLink } from '@/components/common/locale-link';
import type { MediaImage } from './media';
import { Photo } from './photo';

const ASPECTS = {
  /** 4:5, the default: a tall, editorial tile. */
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
} as const;

export interface MediaCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The photograph. Without one the card is a midnight panel with the same layout. */
  image?: MediaImage;
  title: ReactNode;
  /** A path without the locale: the title becomes the card's one link and its hit area covers the card. */
  href?: string;
  /** A short line above the title ("Terminal 1", "Guide"). */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Laid over the top of the photograph: a provenance tag, a chip (they carry their own fills). */
  meta?: ReactNode;
  /** Under the description: a status pill, a "See more" line. Plain content, not a second link. */
  footer?: ReactNode;
  /** Reserved shape (no layout shift). The card still grows if its words need more room. */
  aspect?: keyof typeof ASPECTS;
  headingLevel?: 2 | 3 | 4;
  /** The image's `sizes`. Default: full width on phones, half on tablets, a third on desktops. */
  sizes?: string;
  preload?: boolean;
  as?: ElementType;
}

/**
 * A photograph with its title over it, for places, guides and offers. The words sit on their own
 * scrim (`scrim-behind`), so they meet 4.5:1 over any photograph, and they are an `on-media`
 * scope (light ink, light focus ring). With `href` the whole card is one link, named by the
 * title; on hover the card lifts and the photograph eases in (motion allowed).
 *
 * @example
 * <MediaCard image={toMediaImage(IMAGES.kliaJungle, lang)} eyebrow="KLIA Terminal 1" title={t('...')}
 *   description={t('...')} href="/kul/shop-and-dine" />
 */
export function MediaCard({
  image,
  title,
  href,
  eyebrow,
  description,
  meta,
  footer,
  aspect = 'portrait',
  headingLevel = 3,
  sizes,
  preload = false,
  as: Comp = 'article',
  className,
  ...rest
}: MediaCardProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <Comp
      className={cn(
        // No overflow clipping on the card itself: with an aspect ratio, a card that clipped could
        // not grow when its words need more room (Malay, 125% text). The image layer clips instead.
        'group/media relative isolate flex flex-col justify-end rounded-2xl bg-midnight text-ink shadow-md',
        ASPECTS[aspect],
        href &&
          'transition-[box-shadow,translate] duration-base ease-out hover:shadow-xl motion-ok:hover:-translate-y-1 has-[[data-card-link]:focus-visible]:focus-ring',
        className,
      )}
      {...rest}
    >
      <div className="surface-midnight absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
        {image ? (
          // Redesign 3: `Photo`, not next/image, so the guides' Client Component cards ship no image script.
          <Photo
            image={image}
            sizes={sizes ?? '(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw'}
            quality={60}
            priority={preload}
            className="object-cover transition-[scale] duration-slower ease-out motion-ok:group-hover/media:scale-[1.05]"
          />
        ) : null}
      </div>
      {meta ? <div className="absolute inset-x-3 top-3 z-[2] flex flex-wrap items-start gap-2">{meta}</div> : null}
      <div className="on-media scrim-behind rounded-b-[inherit] p-5 pt-8 text-ink sm:p-6 sm:pt-10">
        {eyebrow ? <p className="type-caption mb-1.5 font-semibold text-ink-2">{eyebrow}</p> : null}
        <Heading className="type-title-lg text-ink">
          {href ? (
            <LocaleLink href={href} data-card-link="" className="outline-none after:absolute after:inset-0 after:z-[1] after:rounded-2xl">
              {title}
            </LocaleLink>
          ) : (
            title
          )}
        </Heading>
        {description ? <p className="type-body-sm mt-1.5 text-ink-2">{description}</p> : null}
        {footer ? <div className="relative z-[2] mt-3 flex flex-wrap items-center gap-2">{footer}</div> : null}
      </div>
    </Comp>
  );
}
