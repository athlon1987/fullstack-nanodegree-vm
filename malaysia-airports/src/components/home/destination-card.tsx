import type { CSSProperties } from 'react';
import { localizeAirport, pick, type Airport, type Lang, type Terminal } from '@/content';
import { ALL_IMAGES, HOME_HERO_IMAGES, objectPosition, type SiteImage } from '@/content/images';
import { getT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { AirportVignette } from '@/components/art/airport-vignette';
import { AirportCode } from '@/components/common/airport-code';
import { sectionPath } from '@/components/shell/sections';
import { CardLink } from '@/components/ui/card';
import { DeferredImage } from '@/components/ui/deferred-image';
import { Icon } from '@/components/ui/icon';

/**
 * Deep, place-coloured grounds for the cards while the photo library has no picture of a place:
 * dusk over the strait (Penang), dawn on the mountain (Kota Kinabalu), rainforest (Kuching), the
 * Andaman sea (Langkawi), and the brand's midnight for the Kuala Lumpur gateways. Words never sit
 * on these directly: they have their own scrim (`scrim-behind`).
 */
const GROUNDS: Record<string, string> = {
  'kul-t1': 'linear-gradient(165deg, #070c22 0%, #1b2a63 58%, #8a6a35 100%)',
  'kul-t2': 'linear-gradient(165deg, #070c22 0%, #1f2d6e 55%, #3f5fa3 100%)',
  szb: 'linear-gradient(165deg, #0b1428 0%, #26395a 55%, #5d7591 100%)',
  pen: 'linear-gradient(172deg, #0b1838 0%, #234a70 50%, #c27c4b 100%)',
  bki: 'linear-gradient(172deg, #121538 0%, #4b3668 52%, #d48c5e 100%)',
  kch: 'linear-gradient(172deg, #041a17 0%, #0f4537 55%, #4a8a5c 100%)',
  lgk: 'linear-gradient(172deg, #03213a 0%, #0a5670 55%, #2c9f9d 100%)',
};

/**
 * A photograph of the place from the library: never another place's, never the generic Malaysia
 * fallback (a card named Penang must show Penang). KLIA Terminal 2 has its own group. Redesign 1b:
 * never the home hero's own photograph either, so the KLIA Terminal 1 card shows a second view of
 * the terminal instead of repeating the picture at the top of the page.
 */
export function placePhoto(slug: string, terminal?: string): SiteImage | undefined {
  const group = slug === 'kul' ? (terminal === 'T2' ? 'klia2' : 'klia') : undefined;
  const hero = HOME_HERO_IMAGES[0];
  const candidates = ALL_IMAGES.filter((image) => image.place === slug && (group ? image.group === group : true) && (slug !== 'kul' || image.subject === 'terminal' || image.subject === 'interior'));
  return candidates.find((image) => image.id !== hero) ?? candidates[0];
}

export interface DestinationCardProps {
  airport: Airport;
  terminal?: Terminal;
  lang: Lang;
  /** `portrait` for the destinations rail, `landscape` for the gateways row. */
  shape?: 'portrait' | 'landscape';
  /** next/image `sizes` for the photograph. */
  sizes: string;
  className?: string;
}

/**
 * A place card for the home: the place's photograph (or its coloured ground and line drawing until
 * the library has one), its name over a scrim, the code, and one link to the airport's home. The
 * whole card is the link's hit area; it lifts on hover where motion is allowed.
 */
export function DestinationCard({ airport: record, terminal, lang, shape = 'portrait', sizes, className }: DestinationCardProps) {
  const t = getT(lang);
  const airport = localizeAirport(record, lang);
  const title = terminal ? pick(terminal.name, lang) : airport.shortName;
  const place = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
  const photo = placePhoto(airport.slug, terminal?.id);
  const key = airport.slug === 'kul' ? `kul-${(terminal?.id ?? 'T1').toLowerCase()}` : airport.slug;
  const ground: CSSProperties = { backgroundImage: GROUNDS[key] ?? GROUNDS.szb };

  return (
    <li
      className={cn(
        'group/card relative isolate flex min-w-0 flex-col justify-end overflow-hidden rounded-3xl bg-midnight shadow-md',
        'transition-[box-shadow,translate] duration-base ease-out hover:shadow-xl motion-ok:hover:-translate-y-1 has-[[data-card-link]:focus-visible]:focus-ring',
        shape === 'portrait' ? 'min-h-[22rem] sm:min-h-[26rem]' : 'min-h-[16rem] sm:min-h-[18rem]',
        className,
      )}
    >
      <div className="absolute inset-0 -z-10" style={photo ? undefined : ground}>
        {photo ? (
          // Redesign 1b: requested only near the viewport, after hydration, so it never competes
          // with the hero photograph on the first load (DeferredImage). Quality 60, AVIF or WebP.
          <DeferredImage
            src={photo.src}
            alt=""
            fill
            sizes={sizes}
            quality={60}
            blurDataURL={photo.blurDataURL}
            style={{ objectPosition: objectPosition(photo) }}
            className="object-cover transition-[scale] duration-slower ease-out motion-ok:group-hover/card:scale-[1.04]"
          />
        ) : (
          <AirportVignette
            code={airport.code}
            terminal={terminal?.id}
            ground="sunken"
            className={cn(
              'on-media absolute inset-x-0 bg-transparent text-ink opacity-80 transition-[scale] duration-slower ease-out motion-ok:group-hover/card:scale-[1.04] [&_.fill-surface-sunken]:fill-transparent',
              shape === 'portrait' ? 'top-[8%] scale-[1.25]' : 'top-[-6%] left-[30%] w-[75%]',
            )}
          />
        )}
      </div>
      <div className="on-media scrim-behind rounded-b-[inherit] p-5 pt-10 text-ink sm:p-6 sm:pt-12">
        {/* Redesign round one (critique item 21): the place and the code on one line above, the
            city in display type (the section-title size already on the home, so no new size). */}
        <p className="type-caption flex items-center gap-2 font-semibold text-ink-2">
          <span className="min-w-0 truncate">{terminal ? airport.name : place}</span>
          <span aria-hidden="true">·</span>
          <AirportCode code={airport.code} name={airport.name} size="sm" className="shrink-0 text-ink" />
        </p>
        <h3 className="type-title-lg mt-1 min-w-0 leading-tight tracking-tight text-ink">
          <CardLink href={sectionPath(airport.slug, 'overview', terminal?.id)}>{title}</CardLink>
        </h3>
        <p className="type-body-sm mt-3 flex items-center gap-1.5 font-semibold text-ink">
          {t('home.network.airportHome')}
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="text-gold-bright transition-transform duration-base motion-ok:group-hover/card:translate-x-0.5" />
        </p>
      </div>
    </li>
  );
}
