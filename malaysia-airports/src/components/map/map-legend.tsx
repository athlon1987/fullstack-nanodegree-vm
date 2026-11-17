'use client';

import type { ReactNode } from 'react';
import { useT } from '@/lib/i18n/client';

/** The key under the map: every colour on the drawing also has a pattern, a shape or a word. */
export function MapLegend({ showRoute }: { showRoute: boolean }) {
  const t = useT();
  return (
    <div className="mt-3 px-1">
      <h2 className="sr-only">{t('mapPages.legend.title')}</h2>
      <ul className="type-caption grid grid-cols-2 items-start gap-x-4 gap-y-2 text-ink-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
        <Item label={t('mapPages.legend.landside')}>
          <rect x="1" y="3" width="22" height="14" rx="4" className="fill-surface stroke-line-strong" strokeWidth="1.25" />
        </Item>
        <Item label={t('mapPages.legend.airside')}>
          <defs>
            <pattern id="map-legend-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" className="stroke-primary-ink" strokeWidth="1.25" strokeOpacity="0.3" />
            </pattern>
          </defs>
          <rect x="1" y="3" width="22" height="14" rx="4" className="fill-primary-soft stroke-line-strong" strokeWidth="1.25" />
          <rect x="1" y="3" width="22" height="14" rx="4" fill="url(#map-legend-hatch)" />
        </Item>
        <Item label={t('mapPages.legend.link')}>
          <rect x="1" y="3" width="22" height="14" rx="4" className="fill-page-subtle stroke-line-control" strokeWidth="1.25" strokeDasharray="3 2" />
        </Item>
        <Item label={t('mapPages.legend.sourced')}>
          <circle cx="12" cy="10" r="7" className="fill-surface stroke-ink" strokeWidth="1.5" />
        </Item>
        <Item label={t('mapPages.legend.illustrative')}>
          <circle cx="12" cy="10" r="7" className="fill-surface stroke-ink" strokeWidth="1.5" strokeDasharray="2.5 2" />
        </Item>
        {showRoute ? (
          <>
            <Item label={t('mapPages.legend.route')}>
              <path d="M2 10 H22" className="stroke-primary" strokeWidth="4" strokeLinecap="round" />
            </Item>
            <Item label={t('mapPages.legend.ride')}>
              <path d="M2 10 H22" className="stroke-primary" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 6" />
            </Item>
          </>
        ) : null}
      </ul>
    </div>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="inline-flex items-start gap-2 sm:items-center">
      <svg aria-hidden="true" viewBox="0 0 24 20" className="mt-px h-4 w-5 shrink-0 overflow-visible sm:mt-0">
        {children}
      </svg>
      {label}
    </li>
  );
}
