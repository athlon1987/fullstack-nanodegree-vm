import Image from 'next/image';
import type { SiteImage } from '@/content/images';
import { objectPosition } from '@/content/images';
import type { Lang } from '@/content/types';
import { HeroArt } from './hero-art';

/**
 * The picture behind the home hero: the first photograph of `HOME_HERO_IMAGES` when the photo
 * library has one, otherwise the illustrated "KLIA at dusk" (`HeroArt`). Either way it fills the
 * hero's box, which is sized by its content, so nothing moves when the image arrives.
 *
 * The photograph is the page's LCP element: preloaded with high priority, `sizes="100vw"`, served
 * by next/image (WebP by default; AVIF once `images.formats` lists it), blur placeholder from the
 * library. Over a photograph two scrims keep text legible: one under the header (the navigation
 * sits there in white) and the headline block's own `scrim-behind` (set by the hero). The
 * illustration is dark where text sits, so it needs neither.
 */
export function HeroBackdrop({ photo, lang }: { photo?: SiteImage; lang: Lang }) {
  return (
    <div aria-hidden={photo ? undefined : true} className="absolute inset-0 -z-10 overflow-hidden bg-midnight">
      {photo ? (
        <>
          <Image
            src={photo.src}
            alt={photo.alt[lang]}
            fill
            sizes="100vw"
            quality={75}
            preload
            fetchPriority="high"
            placeholder="blur"
            blurDataURL={photo.blurDataURL}
            style={{ objectPosition: objectPosition(photo) }}
            className="object-cover"
          />
          {/* The header zone: text alpha to the bottom of the header, fading out 6rem below it. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[calc(var(--spacing-header)+6rem)]"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, color-mix(in srgb, var(--color-scrim) var(--scrim-text-alpha), transparent) 0, color-mix(in srgb, var(--color-scrim) var(--scrim-text-alpha), transparent) var(--spacing-header), transparent 100%)',
            }}
          />
          {/* Depth at the foot of the hero, where the glass panels sit. */}
          <span aria-hidden="true" className="scrim-bottom absolute inset-x-0 bottom-0 h-2/3 opacity-70" />
        </>
      ) : (
        <HeroArt className="absolute inset-0" />
      )}
    </div>
  );
}
