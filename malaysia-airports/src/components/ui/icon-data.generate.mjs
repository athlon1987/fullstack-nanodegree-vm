#!/usr/bin/env node
/**
 * Writes the icon registry from lucide-react's own icon data:
 *  - `icons.svg`, one `<symbol id="name">` per icon (the sprite `Icon` points at with `<use>`);
 *  - `icon-names.ts`, the list of names (the only part of the registry in any script).
 *
 *   node src/components/ui/icon-data.generate.mjs
 *
 * Round 5 (E-03, A-09): lucide-react 1.x renders every icon through a Client Component, so each
 * icon on a server-rendered page was a hydration island with its geometry repeated in the RSC
 * payload, and the whole lucide registry (22.8 KB gzip with tailwind-merge) was in the first load
 * of all 39 routes. Now no script carries icon geometry: icons are `<svg><use href="sprite#name">`
 * in Server and Client Components alike, and the sprite is one cached file (about 8 KB gzip).
 * lucide-react stays a dependency only as the source of the data. `icon-data.test.ts` fails if
 * the files are out of date with lucide-react or with this list.
 *
 * To add an icon: add its registry name and lucide component name to GLYPHS, run this script.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Registry name (lucide's kebab-case name) → lucide-react component name. */
export const GLYPHS = {
  'accessibility': 'Accessibility',
  'a-large-small': 'ALargeSmall',
  'armchair': 'Armchair',
  'arrow-down': 'ArrowDown',
  'arrow-left': 'ArrowLeft',
  'arrow-left-right': 'ArrowLeftRight',
  'arrow-right': 'ArrowRight',
  'arrow-up': 'ArrowUp',
  'arrow-up-right': 'ArrowUpRight',
  'baby': 'Baby',
  'badge-check': 'BadgeCheck',
  'baggage-claim': 'BaggageClaim',
  'ban': 'Ban',
  'banknote': 'Banknote',
  'bed': 'Bed',
  'bell': 'Bell',
  'bell-ring': 'BellRing',
  'binoculars': 'Binoculars',
  'blocks': 'Blocks',
  'bookmark': 'Bookmark',
  'bookmark-check': 'BookmarkCheck',
  'briefcase-medical': 'BriefcaseMedical',
  'building-2': 'Building2',
  'bus-front': 'BusFront',
  'calculator': 'Calculator',
  'calendar-days': 'CalendarDays',
  'car': 'Car',
  'car-front': 'CarFront',
  'car-taxi-front': 'CarTaxiFront',
  'card-sim': 'CardSim',
  'check': 'Check',
  'chevron-down': 'ChevronDown',
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'chevron-up': 'ChevronUp',
  'chevrons-up-down': 'ChevronsUpDown',
  'cigarette': 'Cigarette',
  'circle': 'Circle',
  'circle-alert': 'CircleAlert',
  'circle-check': 'CircleCheck',
  'circle-dashed': 'CircleDashed',
  'circle-dot': 'CircleDot',
  'circle-help': 'CircleHelp',
  'circle-parking': 'CircleParking',
  'circle-x': 'CircleX',
  'clock': 'Clock',
  'clock-alert': 'ClockAlert',
  'coins': 'Coins',
  'compass': 'Compass',
  'contrast': 'Contrast',
  'copy': 'Copy',
  'door-closed': 'DoorClosed',
  'door-open': 'DoorOpen',
  'ellipsis': 'Ellipsis',
  'external-link': 'ExternalLink',
  'eye': 'Eye',
  'file-text': 'FileText',
  'flask-conical': 'FlaskConical',
  'footprints': 'Footprints',
  'glass-water': 'GlassWater',
  'globe': 'Globe',
  'hand-helping': 'HandHelping',
  'history': 'History',
  'home': 'Home',
  'hotel': 'Hotel',
  'hourglass': 'Hourglass',
  'id-card': 'IdCard',
  'info': 'Info',
  'key-round': 'KeyRound',
  'landmark': 'Landmark',
  'languages': 'Languages',
  'layers': 'Layers',
  'leaf': 'Leaf',
  'lightbulb': 'Lightbulb',
  'list-filter': 'ListFilter',
  'loader-circle': 'LoaderCircle',
  'locate-fixed': 'LocateFixed',
  'luggage': 'Luggage',
  'mail': 'Mail',
  'map': 'Map',
  'map-pin': 'MapPin',
  'map-pin-check': 'MapPinCheck',
  'megaphone': 'Megaphone',
  'menu': 'Menu',
  'messages-square': 'MessagesSquare',
  'minus': 'Minus',
  'monitor': 'Monitor',
  'moon': 'Moon',
  'moon-star': 'MoonStar',
  'move-vertical': 'MoveVertical',
  'navigation': 'Navigation',
  'newspaper': 'Newspaper',
  'octagon-alert': 'OctagonAlert',
  'package-search': 'PackageSearch',
  'palette': 'Palette',
  'pencil': 'Pencil',
  'person-standing': 'PersonStanding',
  'phone': 'Phone',
  'pill': 'Pill',
  'plane': 'Plane',
  'plane-landing': 'PlaneLanding',
  'plane-takeoff': 'PlaneTakeoff',
  'plug-zap': 'PlugZap',
  'plus': 'Plus',
  'refresh-cw': 'RefreshCw',
  'route': 'Route',
  'ruler': 'Ruler',
  'scan-line': 'ScanLine',
  'search': 'Search',
  'search-x': 'SearchX',
  'send': 'Send',
  'settings-2': 'Settings2',
  'share-2': 'Share2',
  'shield-check': 'ShieldCheck',
  'shopping-bag': 'ShoppingBag',
  'shower-head': 'ShowerHead',
  'signpost': 'Signpost',
  'sliders-horizontal': 'SlidersHorizontal',
  'smartphone': 'Smartphone',
  'sofa': 'Sofa',
  'sparkles': 'Sparkles',
  'square-parking': 'SquareParking',
  'stamp': 'Stamp',
  'star': 'Star',
  'sun': 'Sun',
  'tag': 'Tag',
  'ticket': 'Ticket',
  'ticket-check': 'TicketCheck',
  'ticket-x': 'TicketX',
  'timer': 'Timer',
  'toilet': 'Toilet',
  'tower-control': 'TowerControl',
  'train-front': 'TrainFront',
  'tram-front': 'TramFront',
  'trash-2': 'Trash2',
  'triangle-alert': 'TriangleAlert',
  'type': 'Type',
  'users': 'Users',
  'utensils': 'Utensils',
  'wifi': 'Wifi',
  'wifi-off': 'WifiOff',
  'x': 'X',
  'zoom-in': 'ZoomIn',
  'zoom-out': 'ZoomOut',
};

/** The data of every icon in GLYPHS, in registry order: `{ name: [part, ...] }`. */
export async function buildIconData() {
  const lucide = await import('lucide-react');
  const out = {};
  for (const [name, component] of Object.entries(GLYPHS)) {
    const icon = lucide[component];
    if (!icon) throw new Error(`lucide-react has no ${component} (for ${name})`);
    const file = await import(`lucide-react/dist/esm/icons/${await moduleFile(component)}.mjs`);
    out[name] = file.__iconData.node.map(([tag, attrs]) => {
      const rest = Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'key'));
      return tag === 'path' && Object.keys(rest).length === 1 && typeof rest.d === 'string' ? rest.d : [tag, rest];
    });
  }
  return out;
}

/** lucide-react's file for a component name, from its export list (`Home` is `house.mjs`). */
let exportsMap;
async function moduleFile(component) {
  if (!exportsMap) {
    const { readFileSync } = await import('node:fs');
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const entry = require.resolve('lucide-react').replace(/dist\/cjs\/lucide-react\.js$/, 'dist/esm/lucide-react.mjs');
    exportsMap = new Map();
    for (const match of readFileSync(entry, 'utf8').matchAll(/export \{ default as (\w+)[^}]*\} from '\.\/icons\/([\w-]+)\.mjs'/g)) exportsMap.set(match[1], match[2]);
    for (const match of readFileSync(entry, 'utf8').matchAll(/export \{([^}]*)\} from '\.\/icons\/([\w-]+)\.mjs'/g))
      for (const name of match[1].matchAll(/default as (\w+)/g)) exportsMap.set(name[1], match[2]);
  }
  const file = exportsMap.get(component);
  if (!file) throw new Error(`No lucide-react module for ${component}`);
  return file;
}

const escapeAttribute = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The sprite: one symbol per icon, its children exactly as lucide-react renders them. */
export function renderSprite(data) {
  const symbols = Object.entries(data).map(([name, parts]) => {
    const children = parts
      .map((part) => {
        const [tag, attributes] = typeof part === 'string' ? ['path', { d: part }] : part;
        return `<${tag}${Object.entries(attributes)
          .map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`)
          .join('')}/>`;
      })
      .join('');
    return `<symbol id="${name}" viewBox="0 0 24 24">${children}</symbol>`;
  });
  // The root size only satisfies the static-import loader (it reads an image size); symbols are what count.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- GENERATED by icon-data.generate.mjs from lucide-react (https://lucide.dev, ISC licence, Copyright (c) Lucide Contributors). Do not edit. -->\n${symbols.join('\n')}\n</svg>\n`;
}

/** The TypeScript source of icon-names.ts. */
export function renderIconNames(data) {
  return `/** GENERATED by icon-data.generate.mjs: the icon registry's names (the geometry is in icons.svg). Do not edit. */
export const ICON_NAMES = ${JSON.stringify(Object.keys(data), null, 2).replace(/"/g, "'")} as const;
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = await buildIconData();
  writeFileSync(fileURLToPath(new URL('./icons.svg', import.meta.url)), renderSprite(data));
  writeFileSync(fileURLToPath(new URL('./icon-names.ts', import.meta.url)), renderIconNames(data));
  console.log(`wrote icons.svg and icon-names.ts (${Object.keys(GLYPHS).length} icons)`);
}
