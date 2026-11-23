import Image from 'next/image';
import type { Lang } from '@/content';
import { heroForAirport } from '@/content/images';
import { cn } from '@/lib/cn';
import { AirportVignette } from '@/components/art/airport-vignette';
import { TaburField } from '@/components/art/patterns';
import { ART_DIRECTED_POSITION, artDirection, objectPosition, placeholderProps, toMediaImage } from '@/components/ui/media';

export interface AirportBackdropProps {
  /** Airport slug: `kul`. */
  slug: string;
  /** IATA code, for the line drawing when there is no photograph. */
  code: string;
  lang: Lang;
  /**
   * `hero`: the overview's cinematic band (the photograph is preloaded, the line drawing is large).
   * `band`: the slim band of the section pages (never preloaded; the drawing is left out).
   */
  variant: 'hero' | 'band';
}

/** Whether an airport has a photograph of its own or the Malaysia fallback (never another airport's). */
export function airportHasPhoto(slug: string): boolean {
  return heroForAirport(slug) !== undefined;
}

/**
 * The picture behind the airport header (redesign round one). With a photograph from the library
 * (`heroForAirport`: the airport's own, else a Malaysia image that shows no particular airport)
 * it is a full-bleed, decorative `next/image` (the airport's name is the heading beside it) with a
 * soft veil; the words over it carry their own scrim (`scrim-behind`). Without one, a rich branded
 * midnight: two navy glows, a warm gold light, a field of songket stars and, on the hero, the
 * airport's own line drawing in light ink. Either way the box is sized by its parent, so nothing
 * shifts while a photograph loads.
 *
 * A Server Component: the photo library stays on the server.
 */
/**
 * Framing per photograph (fractions of the photograph) where its focal point does not suit both a
 * phone (a tall slice) and a wide desktop band; others use their focal point everywhere.
 */
const HERO_FRAMING: Partial<Record<string, Parameters<typeof artDirection>[1]>> = {
  // The KLIA Terminal 1 canopy: phones follow the main white branch up to the roof.
  'klia-t1-canopy': { base: { x: 0.58, y: 0.5 }, md: { x: 0.7, y: 0.6 } },
  // Kota Kinabalu and Langkawi: keep the terminal's own name board in the band on wide screens.
  'bki-terminal': { md: { x: 0.55, y: 0.3 } },
  'lgk-terminal': { md: { x: 0.55, y: 0.35 } },
};

export function AirportBackdrop({ slug, code, lang, variant }: AirportBackdropProps) {
  const entry = heroForAirport(slug);
  const hero = variant === 'hero';
  if (entry && hero) {
    const image = toMediaImage(entry, lang, { decorative: true });
    // The overview's hero (redesign 1b): in the static HTML, preloaded with high priority, quality
    // 65, AVIF or WebP, no animation. The words carry their own feathered scrim
    // (`scrim-feather`); the photograph keeps only a soft veil at the top and depth at the foot.
    return (
      <div aria-hidden="true" className="on-media absolute inset-0 -z-10 overflow-hidden bg-midnight">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="100vw"
          quality={65}
          preload
          fetchPriority="high"
          {...placeholderProps(image)}
          style={artDirection(image.focal, HERO_FRAMING[entry.id])}
          className={cn('object-cover', ART_DIRECTED_POSITION)}
        />
        <span className="absolute inset-x-0 top-0 h-32 scrim-top opacity-50" />
        <span className="absolute inset-x-0 bottom-0 h-1/2 scrim-bottom opacity-40" />
      </div>
    );
  }
  if (entry) {
    // The slim band of the section pages (redesign 1b): a wash of the airport's own photograph made
    // from its blur placeholder, already in the page, so the band costs no request and never
    // becomes the page's largest paint (the flight page's LCP was this band's photograph, 4.4 s in
    // Lighthouse mobile). Under a 72 % veil a full photograph showed little more than this.
    return (
      <div aria-hidden="true" className="on-media absolute inset-0 -z-10 overflow-hidden bg-midnight">
        {entry.blurDataURL ? (
          <span
            className="absolute -inset-6 bg-cover opacity-70 blur-xl"
            style={{ backgroundImage: `url("${entry.blurDataURL}")`, backgroundPosition: objectPosition(entry.focal) }}
          />
        ) : null}
        <span className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-scrim)_62%,transparent)]" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-gold)_55%,transparent)_30%,color-mix(in_srgb,var(--color-gold)_55%,transparent)_70%,transparent)]" />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="on-media surface-midnight absolute inset-0 -z-10 overflow-hidden">
      {/* Warm light from the upper right, like a terminal at dusk. */}
      <span className="absolute inset-0 bg-[radial-gradient(55%_120%_at_92%_0%,color-mix(in_srgb,var(--color-gold)_22%,transparent),transparent_70%)]" />
      <span className="absolute inset-0 bg-[radial-gradient(40%_80%_at_10%_100%,color-mix(in_srgb,var(--color-primary-ink)_16%,transparent),transparent_70%)]" />
      <TaburField fade className={cn('absolute top-0 right-0 h-full opacity-35', hero ? 'w-3/5' : 'w-2/5')} />
      {hero ? (
        <AirportVignette
          code={code}
          ground="sunken"
          className="absolute -right-6 bottom-0 w-[min(44rem,92%)] bg-transparent text-on-midnight-dim opacity-30 sm:opacity-35 md:w-[min(44rem,55%)] lg:opacity-45"
        />
      ) : null}
      {/* A fine gold horizon under the band. */}
      <span className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-gold)_55%,transparent)_30%,color-mix(in_srgb,var(--color-gold)_55%,transparent)_70%,transparent)]" />
    </div>
  );
}
