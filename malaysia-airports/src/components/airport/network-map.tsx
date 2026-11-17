import { AIRPORTS } from '@/content/airports';
import type { Airport } from '@/content/types';
import { cn } from '@/lib/cn';

/**
 * A schematic map of Malaysia in two panels (Peninsular Malaysia; Sabah, Sarawak and Labuan),
 * with every airport plotted from the registry coordinates.
 *
 * It is an orientation aid, not cartography: the coastlines are hand-simplified, registry
 * positions are rounded (`coordinates.approximate`), and island airports get a small disc to
 * stand on. The caption must say so wherever it is shown. Markers are not interactive: the
 * directory beside the map is the control.
 */

/** Pixels per degree: both panels share it, so distances compare across them. */
const SCALE = 46;

interface Panel {
  id: 'peninsular' | 'borneo';
  /** West, east, south and north edges in degrees. */
  west: number;
  east: number;
  south: number;
  north: number;
  /** Simplified land outline as [lon, lat] pairs. */
  outline: readonly (readonly [number, number])[];
}

const PANELS: readonly Panel[] = [
  {
    id: 'peninsular',
    west: 99.2,
    east: 104.8,
    south: 0.9,
    north: 7.1,
    outline: [
      [100.12, 6.42], [100.35, 6.05], [100.38, 5.55], [100.45, 5.0], [100.62, 4.6], [100.7, 4.15], [100.95, 3.75], [101.3, 3.25], [101.38, 2.9],
      [101.75, 2.6], [102.2, 2.2], [102.55, 1.9], [103.0, 1.6], [103.45, 1.35], [104.05, 1.37], [104.28, 1.4], [104.22, 1.9], [103.9, 2.4],
      [103.55, 2.9], [103.42, 3.5], [103.45, 4.0], [103.42, 4.6], [103.2, 5.2], [102.95, 5.55], [102.6, 5.85], [102.3, 6.2], [102.1, 6.25],
      [101.85, 5.85], [101.5, 5.8], [101.1, 5.65], [100.98, 6.05], [100.75, 6.45], [100.4, 6.6],
    ],
  },
  {
    id: 'borneo',
    west: 109.2,
    east: 119.7,
    south: 0.6,
    north: 7.4,
    outline: [
      [109.65, 2.05], [109.95, 1.75], [110.35, 1.75], [110.75, 1.55], [111.15, 1.45], [111.35, 2.0], [111.3, 2.4], [111.75, 2.75], [112.5, 2.95],
      [113.05, 3.25], [113.6, 3.8], [114.0, 4.45], [114.55, 4.75], [115.05, 4.95], [115.45, 5.0], [115.6, 5.45], [116.0, 5.95], [116.35, 6.45],
      [116.75, 6.95], [117.2, 6.75], [117.6, 6.45], [117.75, 5.95], [118.2, 5.8], [118.6, 5.55], [119.25, 5.2], [118.9, 4.95], [118.6, 4.5],
      [118.0, 4.3], [117.6, 4.2], [116.6, 4.35], [115.9, 4.35], [115.6, 3.9], [115.55, 3.3], [115.1, 2.8], [114.8, 2.2], [114.6, 1.5],
      [113.9, 1.35], [113.0, 1.45], [112.2, 1.15], [111.6, 1.0], [110.9, 0.9], [110.3, 0.95], [109.75, 1.45],
    ],
  },
];

/** Airports that sit on islands off the simplified coastline. */
const ISLAND_AIRPORTS = new Set(['lgk', 'pen', 'pkg', 'rdn', 'tod', 'lbu']);

const x = (panel: Panel, lon: number): number => Math.round((lon - panel.west) * SCALE * 10) / 10;
const y = (panel: Panel, lat: number): number => Math.round((panel.north - lat) * SCALE * 10) / 10;

function panelOf(airport: Airport): Panel {
  return airport.region === 'peninsular' ? PANELS[0] : PANELS[1];
}

export interface NetworkMapProps {
  /** Panel titles, in page order: Peninsular Malaysia, then Sabah, Sarawak and Labuan. */
  titles: { peninsular: string; borneo: string };
  /** Text alternative for each panel's drawing. */
  alt: string;
  /** Slugs to draw at full strength; the rest are dimmed. Omit to show all. */
  highlight?: ReadonlySet<string>;
  className?: string;
}

/** The schematic network map. Pair it with a caption that says positions are approximate. */
export function NetworkMap({ titles, alt, highlight, className }: NetworkMapProps) {
  return (
    <div className={cn('grid gap-x-8 gap-y-6 sm:grid-cols-[minmax(0,0.53fr)_minmax(0,1fr)] sm:items-end', className)}>
      {PANELS.map((panel) => {
        const width = Math.round((panel.east - panel.west) * SCALE);
        const height = Math.round((panel.north - panel.south) * SCALE);
        const airports = AIRPORTS.filter((airport) => panelOf(airport) === panel);
        return (
          <div key={panel.id} className={cn('min-w-0', panel.id === 'peninsular' && 'max-sm:max-w-64')}>
            <p className="type-eyebrow mb-2 text-ink-2">{titles[panel.id]}</p>
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${alt} ${titles[panel.id]}.`} className="block h-auto w-full" focusable="false">
              <polygon
                points={panel.outline.map(([lon, lat]) => `${x(panel, lon)},${y(panel, lat)}`).join(' ')}
                className="fill-surface-sunken stroke-line-strong"
                strokeWidth={1}
                strokeLinejoin="round"
              />
              {airports
                .filter((airport) => ISLAND_AIRPORTS.has(airport.slug))
                .map((airport) => (
                  <circle
                    key={`island-${airport.slug}`}
                    cx={x(panel, airport.coordinates.lon)}
                    cy={y(panel, airport.coordinates.lat)}
                    r={7}
                    className="fill-surface-sunken stroke-line-strong"
                    strokeWidth={1}
                  />
                ))}
              {airports.map((airport) => {
                const cx = x(panel, airport.coordinates.lon);
                const cy = y(panel, airport.coordinates.lat);
                const dim = highlight ? !highlight.has(airport.slug) : false;
                const international = airport.classification === 'international';
                return (
                  <g key={airport.slug} opacity={dim ? 0.22 : 1}>
                    {international ? (
                      <circle cx={cx} cy={cy} r={5} className="fill-primary stroke-surface" strokeWidth={1.5} />
                    ) : airport.classification === 'domestic' ? (
                      <circle cx={cx} cy={cy} r={3.6} className="fill-surface stroke-primary" strokeWidth={1.6} />
                    ) : (
                      <rect x={cx - 2.3} y={cy - 2.3} width={4.6} height={4.6} transform={`rotate(45 ${cx} ${cy})`} className="fill-ink-2" />
                    )}
                    {international ? (
                      <text
                        x={cx + (airport.slug === 'kch' || airport.slug === 'kul' ? 9 : -9)}
                        y={cy + (airport.slug === 'kul' ? 14 : 4)}
                        textAnchor={airport.slug === 'kch' || airport.slug === 'kul' ? 'start' : 'end'}
                        className="fill-ink font-mono text-[11px] font-semibold"
                        style={{ paintOrder: 'stroke' }}
                      >
                        {airport.code}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
        );
      })}
    </div>
  );
}

/** The three marker shapes, for the legend: international, domestic, STOLport. */
export function MapMarker({ kind, className }: { kind: Airport['classification']; className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false" className={cn('size-3.5 shrink-0', className)}>
      {kind === 'international' ? (
        <circle cx={7} cy={7} r={5} className="fill-primary" />
      ) : kind === 'domestic' ? (
        <circle cx={7} cy={7} r={4} className="fill-surface stroke-primary" strokeWidth={1.8} />
      ) : (
        <rect x={4.2} y={4.2} width={5.6} height={5.6} transform="rotate(45 7 7)" className="fill-ink-2" />
      )}
    </svg>
  );
}
