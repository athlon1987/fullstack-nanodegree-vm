import Image from 'next/image';
import type { ReactNode } from 'react';
import { IMAGES, EXPLORE_IMAGES } from '@/content/images';
import type { Lang } from '@/content/types';
import { cn } from '@/lib/cn';
import { LocaleLink } from '@/components/common/locale-link';
import { SERVICE_ICON_SM, SERVICE_TOOL } from '@/components/facilities/service-frame';
import { Icon, type IconKey } from '@/components/ui/icon';
import { objectPosition, placeholderProps, toMediaImage } from '@/components/ui/media';

/**
 * The photograph for a section's answer panel: the same library photograph the airport overview's
 * "Explore" card uses for that section (only that airport's own photographs, or a Malaysian dish for
 * food; `EXPLORE_IMAGES`), so the page and the card that leads to it agree. None for an airport
 * without one: the panel then has no picture rather than another airport's.
 */
export function sectionPhoto(airport: string, section: 'shop-dine' | 'lounges', lang: Lang) {
  const id = EXPLORE_IMAGES[airport]?.[section];
  return id ? toMediaImage(IMAGES[id], lang) : undefined;
}

export interface GlanceRow {
  key: string;
  icon: IconKey;
  label: string;
  /** Filters the directory (a URL the directory already reads), when given. */
  href?: string;
}

/**
 * Redesign stage two: the answer beside the title on the shops and lounges pages: a photograph
 * where the library holds a truthful one, then what the page holds in a few rows.
 */
export function GlancePanel({ title, photo, rows, footer, className }: { title: string; photo?: ReturnType<typeof sectionPhoto>; rows: readonly GlanceRow[]; footer?: ReactNode; className?: string }) {
  return (
    <section aria-labelledby="glance-panel-title" className={cn(SERVICE_TOOL, 'overflow-hidden', className)}>
      {photo ? (
        <div className="relative isolate h-36 overflow-hidden bg-fill sm:h-44">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 64rem) 27rem, 100vw"
            quality={60}
            {...placeholderProps(photo)}
            style={{ objectPosition: objectPosition(photo.focal) }}
            className="-z-10 object-cover"
          />
        </div>
      ) : null}
      <div className="p-3 sm:p-4">
        <h2 id="glance-panel-title" className="type-title-md px-2 pt-1 pb-2 text-ink">
          {title}
        </h2>
        <ul className="flex flex-col">
          {rows.map((row) => {
            const body = (
              <>
                <span className={SERVICE_ICON_SM}>
                  <Icon name={row.icon} size="sm" />
                </span>
                <span className="type-body min-w-0 flex-1 font-medium text-ink">{row.label}</span>
                {row.href ? <Icon name="arrow-right" size="sm" className="shrink-0 text-ink-3 transition-transform duration-fast motion-ok:group-hover:translate-x-0.5" /> : null}
              </>
            );
            return (
              <li key={row.key}>
                {row.href ? (
                  <LocaleLink href={row.href} className="group flex min-h-14 items-center gap-3 rounded-2xl px-2 py-2 transition-colors duration-fast hover:bg-page-subtle">
                    {body}
                  </LocaleLink>
                ) : (
                  <div className="flex min-h-14 items-center gap-3 px-2 py-2">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
        {footer ? <div className="type-caption px-2 pt-2 pb-1 text-ink-2">{footer}</div> : null}
      </div>
    </section>
  );
}
