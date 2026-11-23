import type { CSSProperties } from 'react';
import type { Lang } from '@/content';
import { heroForAirport } from '@/content/images';
import { cn } from '@/lib/cn';
import { AirportVignette } from '@/components/art/airport-vignette';
import { TaburField } from '@/components/art/patterns';
import { ART_DIRECTED_POSITION, artDirection, objectPosition, toMediaImage } from '@/components/ui/media';
import { Photo } from '@/components/ui/photo';

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
 * it is a full-bleed, decorative photograph (the airport's name is the heading beside it) with a
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
 *
 * Redesign 1c: wide screens frame the subject in the open right half (the words and the shade
 * hold the left), and each photograph can tune the cinematic shade (`hero-shade` in globals.css):
 * `shade` is its alpha where the fall starts (default 0.66), `shadeEnd` at the right edge (default
 * 0.1). Bright skies behind the words need a little more; every value is checked with the pixel
 * contrast script (docs/qa/fixes/redesign1c.md).
 */
const HERO_FRAMING: Partial<Record<string, Parameters<typeof artDirection>[1] & { shade?: number; shadeEnd?: number }>> = {
  // The KLIA Terminal 1 canopy: phones follow the main white branch up to the roof.
  'klia-t1-canopy': { base: { x: 0.58, y: 0.5 }, md: { x: 0.7, y: 0.6 } },
  // The KLIA Terminal 1 roofline across the airfield (polish 1b): phones centre the domes under the
  // sky; wide screens keep the whole row of domes with the sky above the words.
  'klia-t1-airfield': { base: { x: 0.55, y: 0.55 }, md: { x: 0.5, y: 0.55 }, shade: 0.7 },
  // KLIA from the air (redesign 1c): the terminal roof and the pier sit in the open right half.
  'klia-t1-aerial': { base: { x: 0.6, y: 0.5 }, md: { x: 0.62, y: 0.45 } },
  // Kota Kinabalu: keep the terminal's own name board in the band on wide screens.
  'bki-terminal': { md: { x: 0.55, y: 0.3 } },
  // Langkawi: frame low on wide screens, so the band shows the entrance doors under the
  // departures sign rather than the roof above it.
  'lgk-terminal': { md: { x: 0.55, y: 0.8 } },
  // The fallback (a wing above islands): bright sea and cloud behind the words.
  'wing-window': { shade: 0.7 },
};

export function AirportBackdrop({ slug, code, lang, variant }: AirportBackdropProps) {
  const entry = heroForAirport(slug);
  const hero = variant === 'hero';
  if (entry && hero) {
    const image = toMediaImage(entry, lang, { decorative: true });
    const framing = HERO_FRAMING[entry.id];
    // The overview's hero (redesign 1b): in the static HTML, preloaded with high priority, quality
    // 65, AVIF or WebP, no animation. The words carry their own feathered scrim
    // (`scrim-feather`); the photograph keeps only a soft veil at the top and depth at the foot.
    return (
      // Polish 1b (critique-redesign1b item 11): on a phone the photograph is a band at the top
      // (19rem, the whole frame of a wide photograph instead of a dark slice), melting into the
      // midnight ground under the words; the site header above has its own ground, so no top veil.
      <div aria-hidden="true" className="on-media absolute inset-0 -z-10 overflow-hidden bg-midnight max-sm:bottom-auto max-sm:h-[19rem]">
        {/* Redesign 3: `Photo` (no image script); the phone renditions (a 19rem band above the
            words) at quality 55. */}
        <Photo
          image={image}
          alt=""
          sizes="100vw"
          quality={65}
          phoneQuality={55}
          priority
          artDirected
          style={artDirection(image.focal, framing)}
          className={cn('object-cover', ART_DIRECTED_POSITION)}
        />
        {/* Redesign 1c (verification SA5 item 4): from 1024 px one cinematic shade over the whole
            photograph (dark under the words, an eased fall to the right edge, a bottom sinking into
            the band, a light top veil), instead of a feathered panel behind the words whose edge
            showed on bright skies. Between 640 and 1023 px the words span the band: a soft veil and
            depth at the foot, and the words keep their own scrim. */}
        <span
          className="hero-shade absolute inset-0 max-lg:hidden"
          style={{ '--hero-shade': framing?.shade, '--hero-shade-end': framing?.shadeEnd } as CSSProperties}
        />
        <span className="absolute inset-x-0 top-0 h-32 scrim-top opacity-50 max-sm:hidden lg:hidden" />
        <span className="absolute inset-x-0 bottom-0 h-1/2 scrim-bottom opacity-40 max-sm:hidden lg:hidden" />
        <span className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-midnight to-transparent sm:hidden" />
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
