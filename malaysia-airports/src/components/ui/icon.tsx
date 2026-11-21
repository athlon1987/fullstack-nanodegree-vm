import { createElement, type SVGAttributes } from 'react';
import { ICON_DATA } from './icon-data';

/*
 * The icon registry. Round 5 (E-03, A-09): the geometry is plain data generated from lucide-react
 * (`icon-data.ts`, `icon-data.generate.mjs`) and `Icon` renders ordinary SVG. It has no
 * `'use client'` and no hooks, so icons in Server Components are static HTML: no client
 * reference, no geometry in the RSC payload and nothing to hydrate (lucide-react 1.x renders
 * every icon through a Client Component). Client Components still import it as before.
 *
 * Names are lucide's own kebab-case names, so they stay serialisable across the server and
 * client boundary (a string prop, never a component prop).
 */

/** Every icon the system ships. */
export type IconName = keyof typeof ICON_DATA;

/** A registry name or a semantic key from the domain layer (`prayer-room`, `rail`, `departing`). Unknown keys fall back to a circle. */
export type IconKey = IconName | (string & {});

/** All icon names, for the style guide. */
export const ICON_NAMES = Object.keys(ICON_DATA) as IconName[];

/**
 * Semantic keys used by the domain layer (facility categories, map points, transport modes,
 * journey steps, search result types, provenance) mapped to icons. One meaning, one icon:
 * "track a flight" is always `plane-takeoff`, "my journey" is always `bookmark`.
 */
const ALIASES: Record<string, IconName> = {
  // Facility categories (`FACILITY_CATEGORY_META[..].icon`)
  prayer: 'moon-star',
  'prayer-room': 'moon-star',
  'nursing-room': 'baby',
  'accessible-toilet': 'accessibility',
  accessible: 'accessibility',
  lounge: 'armchair',
  medical: 'briefcase-medical',
  clinic: 'briefcase-medical',
  pharmacy: 'pill',
  baggage: 'luggage',
  atm: 'banknote',
  currency: 'coins',
  'money-changer': 'coins',
  sim: 'card-sim',
  information: 'info',
  lost: 'package-search',
  'lost-property': 'package-search',
  play: 'blocks',
  'play-area': 'blocks',
  smoking: 'cigarette',
  shower: 'shower-head',
  rest: 'sofa',
  charging: 'plug-zap',
  water: 'glass-water',
  porter: 'hand-helping',
  assistance: 'hand-helping',
  calm: 'leaf',
  'calm-room': 'leaf',
  viewing: 'binoculars',
  other: 'ellipsis',
  // Map points
  gate: 'door-open',
  'check-in': 'ticket-check',
  security: 'scan-line',
  immigration: 'id-card',
  customs: 'stamp',
  'baggage-reclaim': 'baggage-claim',
  entrance: 'signpost',
  'meeting-point': 'users',
  lift: 'move-vertical',
  train: 'tram-front',
  bus: 'bus-front',
  taxi: 'car-taxi-front',
  parking: 'square-parking',
  shuttle: 'bus-front',
  dine: 'utensils',
  shop: 'shopping-bag',
  service: 'hand-helping',
  // Transport modes
  rail: 'train-front',
  'e-hailing': 'smartphone',
  'car-rental': 'key-round',
  'private-car': 'car-front',
  'inter-terminal': 'arrow-left-right',
  // Journey modes and steps
  departing: 'plane-takeoff',
  arriving: 'plane-landing',
  transiting: 'arrow-left-right',
  meeting: 'users',
  disruption: 'triangle-alert',
  terminal: 'building-2',
  travel: 'route',
  arrive: 'map-pin',
  food: 'utensils',
  boarding: 'door-open',
  landing: 'plane-landing',
  onward: 'navigation',
  // Search result types
  flight: 'plane-takeoff',
  airport: 'tower-control',
  facility: 'map-pin',
  outlet: 'shopping-bag',
  transport: 'train-front',
  guide: 'file-text',
  faq: 'circle-help',
  notice: 'megaphone',
  corporate: 'landmark',
  place: 'map-pin',
  airline: 'plane',
  unpublished: 'circle-dashed',
  // Product concepts
  journey: 'bookmark',
  concierge: 'sparkles',
  // Contact kinds
  email: 'mail',
  web: 'globe',
  chat: 'messages-square',
  app: 'smartphone',
};

/** Resolve any icon key (a registry name or a domain key) to a registry name. */
export function resolveIconName(key: string): IconName {
  if (Object.prototype.hasOwnProperty.call(ICON_DATA, key)) return key as IconName;
  return Object.prototype.hasOwnProperty.call(ALIASES, key) ? ALIASES[key] : 'circle';
}

const SIZES = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-8',
} as const;

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'name'> {
  /** A registry name (`plane-takeoff`) or a domain key (`prayer-room`, `rail`, `departing`). */
  name: IconKey;
  /** xs 14px, sm 16px, md 20px (default), lg 24px, xl 32px. */
  size?: keyof typeof SIZES;
  /** Accessible name. Omit it for decorative icons (the default): they are hidden from assistive technology. */
  label?: string;
  strokeWidth?: number;
}

/** Size classes a caller's `className` overrides (tailwind-merge keeps the last `size-*`). */
const SIZE_OVERRIDE = /^!?size-/;

/**
 * The icon's class list without tailwind-merge (round 5: `cn` on every icon was measurable at
 * hydration). Same result for the classes icons are given: an unprefixed `size-*`
 * replaces the size class, and a repeated class appears once.
 */
export function iconClassName(size: keyof typeof SIZES, className?: string): string {
  const extra = className ? className.split(/\s+/).filter(Boolean) : [];
  const classes = ['shrink-0', ...(extra.some((name) => SIZE_OVERRIDE.test(name)) ? [] : [SIZES[size]]), ...extra];
  return [...new Set(classes)].join(' ');
}

/**
 * The one icon component. Decorative by default (`aria-hidden`); pass `label` only when the icon
 * is the sole carrier of meaning.
 *
 * @example <Icon name="plane-takeoff" size="sm" />
 */
export function Icon({ name, size = 'md', label, strokeWidth = 1.5, className, ...rest }: IconProps) {
  const parts = ICON_DATA[resolveIconName(name)];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClassName(size, className)}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
    >
      {parts.map((part, index) => (typeof part === 'string' ? <path key={index} d={part} /> : createElement(part[0], { key: index, ...part[1] })))}
    </svg>
  );
}
