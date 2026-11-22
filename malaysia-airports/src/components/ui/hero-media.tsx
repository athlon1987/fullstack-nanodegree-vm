import Image from 'next/image';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { objectPosition, placeholderProps, type MediaImage } from './media';

/** Reserved heights. The box grows with its content, never shrinks below these. */
const SIZES = {
  /** A home or airport hero: about a laptop screen. */
  tall: 'min-h-[34rem] md:min-h-[40rem] lg:min-h-[44rem]',
  /** A section page header. */
  medium: 'min-h-[24rem] md:min-h-[28rem]',
  /** A slim band above a page title. */
  short: 'min-h-[14rem] md:min-h-[18rem]',
} as const;

export interface HeroMediaProps extends HTMLAttributes<HTMLElement> {
  image: MediaImage;
  /**
   * Where the words sit and how the photograph is darkened behind them.
   *   bottom  the content block carries its own scrim (`scrim-behind`), however tall it grows
   *   left    on wider screens the content sits on the left, aligned with the page column, on a
   *           scrim that fades out to its right; on phones it behaves as `bottom`
   *   full    an even veil for mood only: put the words on a `GlassPanel`
   *   none    no scrim: only for a hero with no words over the photograph
   * Default `bottom`.
   */
  scrim?: 'bottom' | 'left' | 'full' | 'none';
  /** Reserved height. Default `tall`. */
  size?: keyof typeof SIZES;
  /** Inset inside the page gutter with 28 px corners, instead of edge to edge. */
  inset?: boolean;
  /**
   * The hero is the largest thing on the first screen: preload it with high priority. Only one
   * image per page. The heading over it stays in the static HTML (never behind a Suspense boundary).
   */
  preload?: boolean;
  /** next/image `sizes`. Default `100vw` (or the page width when `inset`). */
  sizes?: string;
  as?: ElementType;
  /** Classes for the content block (its width, alignment and padding). */
  contentClassName?: string;
  /** Shown as a small, quiet credit in the corner. Defaults to `image.credit`. Pass `null` to hide. */
  credit?: ReactNode;
  children?: ReactNode;
}

/**
 * A full-bleed photograph with words over it, the space reserved before the image arrives (no
 * layout shift). The content block is an `on-media` scope: every component inside it takes the
 * light ink and the light focus ring, and its text meets 4.5:1 even over a white photograph.
 *
 * @example
 * <HeroMedia image={toMediaImage(IMAGES.kliaT1Hall, lang)} preload scrim="left">
 *   <h1 className="type-display-2xl text-ink">{t('home.headline')}</h1>
 *   <p className="type-lead mt-4 text-ink-2">{t('home.lead')}</p>
 * </HeroMedia>
 */
export function HeroMedia({
  image,
  scrim = 'bottom',
  size = 'tall',
  inset = false,
  preload = false,
  sizes,
  as: Comp = 'section',
  contentClassName,
  credit,
  className,
  children,
  ...rest
}: HeroMediaProps) {
  const creditText = credit === undefined ? image.credit : credit;
  return (
    <Comp
      className={cn(
        'relative isolate flex flex-col justify-end bg-midnight [--hero-inline-start:max(var(--spacing-gutter),calc((100vw_-_77.5rem)/2_+_var(--spacing-gutter)))]',
        SIZES[size],
        inset && 'mx-gutter overflow-hidden rounded-3xl shadow-lg',
        className,
      )}
      {...rest}
    >
      <div className={cn('absolute inset-0 -z-10 overflow-hidden', inset && 'rounded-[inherit]')}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes ?? (inset ? '(min-width: 80rem) 77.5rem, 100vw' : '100vw')}
          preload={preload}
          {...(preload ? { fetchPriority: 'high' as const } : {})}
          {...placeholderProps(image)}
          style={{ objectPosition: objectPosition(image.focal) }}
          className="object-cover"
        />
        {scrim === 'full' ? <span aria-hidden="true" className="absolute inset-0 scrim-full" /> : null}
        {/* A soft top veil keeps the photograph calm under the header. */}
        {scrim !== 'none' ? <span aria-hidden="true" className="absolute inset-x-0 top-0 h-28 scrim-top opacity-60" /> : null}
      </div>
      {children ? (
        <div
          className={cn(
            'on-media relative w-full text-ink',
            (scrim === 'bottom' || scrim === 'left') && 'scrim-behind',
            scrim === 'left' && 'md:flex md:w-fit md:max-w-full md:flex-1 md:flex-col md:justify-end md:scrim-behind-left',
          )}
        >
          <div
            className={cn(
              'mx-auto w-full max-w-page px-gutter pt-10 pb-10 md:pb-14',
              scrim === 'left' &&
                'md:mx-0 md:w-[min(40rem,100vw)] md:max-w-none md:pt-24 md:pb-16 lg:w-[calc(var(--hero-inline-start)_+_38rem)] lg:pl-(--hero-inline-start)',
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      ) : null}
      {creditText ? (
        // Phones: under the words (never over them); wider screens: the bottom-right corner.
        <p className="type-caption relative z-10 mx-gutter mb-3 self-end rounded-pill bg-[color-mix(in_srgb,var(--color-scrim)_78%,transparent)] px-2.5 py-0.5 text-xs text-on-midnight-dim md:absolute md:right-3 md:bottom-3 md:m-0 md:max-w-[60%]">
          {creditText}
        </p>
      ) : null}
    </Comp>
  );
}
