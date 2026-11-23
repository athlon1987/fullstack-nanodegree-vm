'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

export interface DeferredImageProps extends Omit<ImageProps, 'loading' | 'preload' | 'priority' | 'fetchPriority' | 'placeholder'> {
  /** The tiny placeholder shown until the photograph is requested (and while it loads). */
  blurDataURL?: string;
  /** How far outside the viewport the photograph is requested. Default: one viewport below and above. */
  rootMargin?: string;
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
export function DeferredImage({ blurDataURL, rootMargin = '100% 0px', className, style, alt, ...props }: DeferredImageProps) {
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
    return <Image alt={alt} className={className} style={style} {...props} {...(blurDataURL ? { placeholder: 'blur' as const, blurDataURL } : {})} />;
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
