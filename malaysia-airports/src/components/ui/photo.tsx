import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { IMAGE_ALL_SIZES, IMAGE_DEVICE_SIZES, IMAGE_PHONE_MAX_WIDTH, IMAGE_QUALITIES } from './image-config';
import { objectPosition, type MediaImage } from './media';

/**
 * Photographs without `next/image`'s client code (redesign 3, docs/qa/fixes/redesign3-perf.md).
 *
 * Every photograph on the site fills a box whose space is reserved by its parent, never changes
 * after it is drawn and needs no load handler, so none of them needs `next/image`'s client
 * component (about 5.7 KB gzip in every route that imported it, also on pages with no photograph).
 * `Photo` writes the same `<img>` on the server: the optimizer's URLs (`/_next/image`, the default
 * loader's format), a `srcSet` of the widths the `sizes` can use, the blurred placeholder behind
 * it and the fill styles. It has no state and no effects, so it renders the same on the server and
 * in a Client Component, and it adds a few hundred bytes where a Client Component uses it.
 *
 * Loading: lazy by default. `priority` is for the page's largest paint (eager, `fetchPriority`
 * high); React's server renderer then writes its preload into the head, before the stylesheets.
 * Any `<img>` that is not lazy gets such a preload, so `eager` is only for an image that is on
 * the first screen.
 *
 * Kept in step with `next/image` by `photo.test.ts` (the same `src`, `srcSet` and `sizes` as
 * `getImageProps`). The project sets no `deploymentId`; if it ever does, the URLs need its `dpl`.
 */

export interface PhotoQuality {
  /** Optimizer quality for every rendition (one of `IMAGE_QUALITIES`). */
  quality: number;
  /**
   * A lower quality for the renditions a phone picks (828 px wide and narrower) where the
   * photograph is small on the screen or sits under a scrim. Only for full-width photographs: a
   * narrow image on a wide screen would pick these too.
   */
  phoneQuality?: number;
}

/** The closest configured quality, as `next/image` picks it. */
function configuredQuality(quality: number): number {
  return IMAGE_QUALITIES.reduce((best, current) => (Math.abs(current - quality) < Math.abs(best - quality) ? current : best), IMAGE_QUALITIES[0]);
}

/** The widths `next/image` lists for these `sizes`: from the smallest `vw` share of the narrowest device width up. */
function widthsFor(sizes: string): number[] {
  const shares = [...sizes.matchAll(/(^|\s)(1?\d?\d)vw/g)].map((match) => Number.parseInt(match[2], 10));
  if (!shares.length) return IMAGE_ALL_SIZES;
  const smallest = Math.min(...shares) / 100;
  return IMAGE_ALL_SIZES.filter((width) => width >= IMAGE_DEVICE_SIZES[0] * smallest);
}

/** The optimizer's URL for one rendition (the default loader's format). */
export function optimizedUrl(src: string, width: number, quality: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${configuredQuality(quality)}`;
}

function sourcePath(src: MediaImage['src']): string {
  return typeof src === 'string' ? src : src.src;
}

/** `src`, `srcSet` and `sizes` for a photograph that fills its box at `sizes`. */
export function photoAttributes(src: MediaImage['src'], sizes: string, { quality, phoneQuality }: PhotoQuality): { src: string; srcSet?: string; sizes?: string } {
  const path = sourcePath(src);
  // Only files in /public or a static import are optimised; SVG is served as it is.
  if (!path.startsWith('/') || path.startsWith('//') || /\.svg($|\?)/i.test(path)) return { src: path };
  const widths = widthsFor(sizes);
  const qualityFor = (width: number) => (phoneQuality !== undefined && width <= IMAGE_PHONE_MAX_WIDTH ? phoneQuality : quality);
  return {
    src: optimizedUrl(path, widths[widths.length - 1], quality),
    srcSet: widths.map((width) => `${optimizedUrl(path, width, qualityFor(width))} ${width}w`).join(', '),
    sizes,
  };
}

/** The blurred placeholder behind a photograph while it loads (`next/image`'s SVG blur, cover fit). */
export function blurBackground(blurDataURL: string | undefined, position = '50% 50%'): CSSProperties {
  if (!blurDataURL) return {};
  const svg = `%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='xMidYMid slice' style='filter: url(%23b);' href='${blurDataURL}'/%3E%3C/svg%3E`;
  return { backgroundSize: 'cover', backgroundPosition: position, backgroundRepeat: 'no-repeat', backgroundImage: `url("data:image/svg+xml;charset=utf-8,${svg}")` };
}

const FILL: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'transparent' };

export interface PhotoProps extends PhotoQuality, Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes' | 'loading' | 'fetchPriority'> {
  image: MediaImage;
  /** The `sizes` of the box at each breakpoint. */
  sizes: string;
  /** The page's largest paint: eager and fetched with high priority (preloaded in the head). One per page. */
  priority?: boolean;
  /** On the first screen but not the largest paint: eager, normal priority. */
  eager?: boolean;
  /**
   * The object position comes from classes (`ART_DIRECTED_POSITION` with `artDirection()` in
   * `style`), so the focal point is not written inline.
   */
  artDirected?: boolean;
}

/**
 * A photograph that fills its positioned parent (the parent reserves the space). Text over it
 * needs its own scrim, as with every photograph.
 *
 * @example <Photo image={image} sizes="100vw" quality={65} phoneQuality={55} priority className="object-cover" />
 */
export function Photo({ image, sizes, quality, phoneQuality, priority = false, eager = false, artDirected = false, alt, style, ...rest }: PhotoProps) {
  const position = artDirected ? undefined : objectPosition(image.focal);
  const blur = image.blurDataURL ?? (typeof image.src === 'object' ? image.src.blurDataURL : undefined);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the optimizer's URLs without next/image's client code (see above)
    <img
      alt={alt ?? image.alt}
      {...photoAttributes(image.src, sizes, { quality, phoneQuality })}
      loading={priority || eager ? undefined : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      style={{ ...FILL, ...(position ? { objectPosition: position } : {}), ...blurBackground(blur, position), ...style }}
      {...rest}
    />
  );
}
