import Image from 'next/image';
import type { SiteImage } from '@/content/images';
import type { Lang } from '@/content/types';
import { cn } from '@/lib/cn';
import { ART_DIRECTED_POSITION, artDirection } from '@/components/ui/media';
import { HeroArt } from './hero-art';

/**
 * The picture behind the home hero: the first photograph of `HOME_HERO_IMAGES` when the photo
 * library has one, otherwise the illustrated "KLIA at dusk" (`HeroArt`). Either way it fills the
 * hero's box, which is sized by its content, so nothing moves when the image arrives.
 *
 * The photograph is the page's LCP element (redesign 1b, docs/qa/fixes/redesign1b-integrate.md):
 * in the static HTML, preloaded with `fetchPriority="high"`, never lazy, no entrance animation or
 * transition, `sizes="100vw"`, quality 65, served as AVIF or WebP by next/image. Art direction: on
 * a phone the hero is a tall slice of a wide photograph, so it is framed on the white column that
 * fans out of the roof; from 768 px it is framed to the right, with the words on the left.
 *
 * Legibility: the veil under the header (`scrim-header`) and a soft depth at the foot, where the
 * glass panels sit. The headline block carries its own feathered scrim (`scrim-feather`, set by the
 * hero). The illustration is dark where text sits, so it needs neither.
 */
/**
 * Where the home hero's photograph is framed (fractions of the photograph). The KLIA Terminal 1
 * canopy: the column node sits at about (0.66, 0.95) and its white branches fan up to the left and
 * right. Phones see a slice about a fifth of its width, so the slice follows the main branch up to
 * the roof; from 768 px the frame keeps the fan on the right, away from the words.
 */
const HOME_HERO_FRAMING: Partial<Record<string, Parameters<typeof artDirection>[1]>> = {
  'klia-t1-canopy': { base: { x: 0.6, y: 0.5 }, md: { x: 0.8, y: 0.5 } },
  // Polish 1b: the Terminal 1 roof canopies against the sky. Phones (a band about as tall as it is
  // wide) keep the first canopies and the sky beside them; wide screens keep the canopy tops.
  'klia-t1-roof': { base: { x: 0.3, y: 0.45 }, md: { x: 0.5, y: 0.4 } },
  // Redesign 1c: Mount Kinabalu at sunset. Phones (a band a little narrower than the photograph)
  // keep the whole summit; wide screens keep the sunlit ridge above the forest, the summit to the
  // right of the headline.
  'mount-kinabalu': { base: { x: 0.5, y: 0.4 }, md: { x: 0.6, y: 0.42 } },
};

export function HeroBackdrop({ photo, lang }: { photo?: SiteImage; lang: Lang }) {
  return (
    // Polish 1b (critique-redesign1b item 2): on phones the photograph is a band at the top of the
    // hero (`--hero-band`, set by the hero), not a slice behind every control; the controls below
    // it sit on midnight.
    <div aria-hidden={photo ? undefined : true} className="absolute inset-0 -z-10 overflow-hidden bg-midnight max-md:bottom-auto max-md:h-[var(--hero-band,100%)]">
      {photo ? (
        <>
          <Image
            src={photo.src}
            alt={photo.alt[lang]}
            fill
            sizes="100vw"
            quality={65}
            preload
            fetchPriority="high"
            placeholder="blur"
            blurDataURL={photo.blurDataURL}
            style={artDirection(photo.focal, HOME_HERO_FRAMING[photo.id])}
            className={cn('object-cover', ART_DIRECTED_POSITION)}
          />
          <span aria-hidden="true" className="scrim-header absolute inset-x-0 top-0 h-[calc(var(--spacing-header)+6rem)]" />
          {/* Polish 1b (critique-redesign1b item 3): depth only in the bottom third, behind the tiles
              (solid glass panels of their own), so the rest of the photograph is at full strength;
              the words carry their own feathered scrim. On phones, the band's foot melts into the
              midnight ground under the search card. */}
          <span aria-hidden="true" className="scrim-bottom absolute inset-x-0 bottom-0 h-1/3 opacity-55 max-md:h-12 max-md:opacity-100" />
        </>
      ) : (
        <HeroArt className="absolute inset-0" />
      )}
    </div>
  );
}
