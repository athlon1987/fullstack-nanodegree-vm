'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Photo } from './photo';

export interface DeferredImageProps {
  /** A photo-library path (`/images/...`). */
  src: string;
  alt: string;
  /** The box always fills its positioned parent (kept for the call sites' clarity). */
  fill?: true;
  sizes: string;
  quality: number;
  /** The tiny placeholder shown until the photograph is requested (and while it loads). */
  blurDataURL?: string;
  /** How far outside the viewport the photograph is requested. Default: one viewport below and above. */
  rootMargin?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * A `fill` photograph that is requested only once its box comes near the viewport, after the page
 * has hydrated (redesign 1b). Use it for photographs below the first screen on a page whose hero
 * photograph is the largest paint: the browser's own `loading="lazy"` already requests images
 * 1,250 to 2,500 px below the fold during the first layout, so on a phone the home's destination
 * cards used to download alongside the hero and compete with it on a slow connection (and, in
 * Lighthouse's simulation, count as if the hero waited for them).
 *
 * Until then the box shows the blurred placeholder, so the space is never empty and nothing moves.
 * Without JavaScript the placeholder stays.
 */
export function DeferredImage({ src, alt, sizes, quality, blurDataURL, rootMargin = '100% 0px', className, style }: DeferredImageProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (near) {
    // Redesign 3: `Photo` (the optimizer's URLs, no next/image client code). Lazy as well, so a
    // card scrolled near but not into view still waits for the browser's own threshold.
    return <Photo image={{ src, alt, blurDataURL }} sizes={sizes} quality={quality} className={className} style={style} />;
  }
  const position = (style as CSSProperties | undefined)?.objectPosition;
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={blurDataURL ? undefined : { backgroundColor: 'var(--color-midnight)' }}
    >
      {blurDataURL ? (
        <span
          className="absolute -inset-4 scale-105 bg-cover blur-lg"
          style={{ backgroundImage: `url("${blurDataURL}")`, backgroundPosition: typeof position === 'string' ? position : '50% 50%' }}
        />
      ) : null}
    </span>
  );
}
