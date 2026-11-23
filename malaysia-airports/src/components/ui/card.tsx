import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { LocaleLink, type LocaleLinkProps } from '@/components/common/locale-link';
import type { MediaImage } from './media';
import { Photo } from './photo';

/*
 * Direction v2: cards lift off the page by a soft, layered shadow and a hairline, not by an
 * outline alone. Corners are 20 px; media inside a card follows them.
 */
const VARIANTS = {
  /** The default container: a white card with a hairline and a soft shadow. */
  outline: 'border border-line bg-surface shadow-sm',
  /** Lifts further off the page: search desk, feature panels, popover-like content. */
  raised: 'border border-line bg-surface shadow-md',
  /** A quiet well for secondary content. */
  sunken: 'border border-transparent bg-page-subtle',
  /** Frosted glass that follows the theme. Over photographs prefer `GlassPanel`. */
  glass: 'glass',
  /** A midnight card: components inside take the light ink (`on-media`). */
  midnight: 'surface-midnight on-media border border-line text-ink shadow-md',
  /** No chrome: for grouping inside another card. */
  plain: '',
} as const;

const PADDING = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' } as const;

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: keyof typeof VARIANTS;
  /** Padding for simple cards. Use `none` with `CardMedia` / `CardHeader` / `CardBody` / `CardFooter`. */
  padding?: keyof typeof PADDING;
  /**
   * The whole card is one link: put exactly one `CardLink` inside (usually the title). The card
   * shows hover and focus states, and other content stays plain text.
   */
  interactive?: boolean;
  as?: ElementType;
}

/**
 * Card container.
 *
 * @example
 * <Card interactive padding="md">
 *   <h3 className="type-title-md"><CardLink href="/kul/parking">{t('nav.parking')}</CardLink></h3>
 * </Card>
 *
 * @example
 * <Card interactive>
 *   <CardMedia image={toMediaImage(IMAGES.kliaT1Hall, lang)} />
 *   <CardBody><h3 className="type-title-md"><CardLink href="/kul">KLIA</CardLink></h3></CardBody>
 * </Card>
 */
export function Card({ variant = 'outline', padding = 'none', interactive = false, as: Comp = 'div', className, ...rest }: CardProps) {
  return (
    <Comp
      className={cn(
        'group/card relative rounded-xl',
        VARIANTS[variant],
        PADDING[padding],
        interactive &&
          'transition-[border-color,box-shadow,background-color,translate] duration-base ease-out hover:border-line-strong hover:shadow-lg motion-ok:hover:-translate-y-0.5 has-[[data-card-link]:focus-visible]:focus-ring',
        className,
      )}
      {...rest}
    />
  );
}

const MEDIA_ASPECTS = {
  wide: 'aspect-[16/9]',
  landscape: 'aspect-[3/2]',
  square: 'aspect-square',
  portrait: 'aspect-[4/5]',
} as const;

export interface CardMediaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  image: MediaImage;
  /** Reserved shape, so the card never shifts while the image loads. Default `landscape` (3:2). */
  aspect?: keyof typeof MEDIA_ASPECTS;
  /** The image's `sizes`. Default: full width on phones, half on tablets, a third on desktops. */
  sizes?: string;
  /** Only for a card that is the largest thing on the first screen. */
  preload?: boolean;
  /** Small things laid over the top of the image (a provenance tag, a chip). */
  overlay?: ReactNode;
}

/**
 * The image slot of a card: full bleed at the top, following the card's corners, with the space
 * reserved. On an `interactive` card the photograph eases in a little on hover (motion allowed).
 */
export function CardMedia({ image, aspect = 'landscape', sizes, preload = false, overlay, className, ...rest }: CardMediaProps) {
  return (
    <div className={cn('relative isolate overflow-hidden rounded-t-[inherit] bg-fill', MEDIA_ASPECTS[aspect], className)} {...rest}>
      <Photo
        image={image}
        sizes={sizes ?? '(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw'}
        quality={60}
        priority={preload}
        className="-z-10 object-cover transition-[scale] duration-slower ease-out motion-ok:group-hover/card:scale-[1.04]"
      />
      {overlay ? <div className="absolute inset-x-3 top-3 flex flex-wrap items-start gap-2">{overlay}</div> : null}
    </div>
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 px-5 pt-5 sm:px-6 sm:pt-6', className)} {...rest} />;
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5 sm:px-6', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6', className)} {...rest} />;
}

export interface CardLinkProps extends LocaleLinkProps {
  children: ReactNode;
}

/** The link of an `interactive` card. Its hit area stretches over the whole card. */
export function CardLink({ className, children, ...rest }: CardLinkProps) {
  return (
    <LocaleLink data-card-link="" className={cn('outline-none after:absolute after:inset-0 after:z-[1] after:rounded-[inherit]', className)} {...rest}>
      {children}
    </LocaleLink>
  );
}
