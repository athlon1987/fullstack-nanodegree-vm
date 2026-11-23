import { cn } from '@/lib/cn';
import { Icon, type IconKey } from '@/components/ui/icon';

/*
 * Redesign stage two: the picture slot of a shop, restaurant, service or lounge card. No outlet in
 * our sources has a licensed photograph, and inventing one would show a place that may not look like
 * that, so each card gets category art instead: the place's monogram in the serif accent on a soft
 * tint of its category, the category's icon and a faint woven motif. Decorative: the card's heading
 * says the name, and its chips say the category.
 */
const TONES = {
  dine: { box: 'bg-gold-soft text-gold-ink', motif: 'text-gold' },
  shop: { box: 'bg-primary-soft text-primary-ink', motif: 'text-primary-ink' },
  service: { box: 'bg-leaf-soft text-leaf', motif: 'text-leaf' },
  lounge: { box: 'surface-midnight text-gold-bright', motif: 'text-gold-bright' },
} as const;

export type CategoryArtTone = keyof typeof TONES;

/** The icon of each kind of outlet (dine, shop, service). */
export const KIND_ICONS: Readonly<Record<'dine' | 'shop' | 'service', IconKey>> = { dine: 'utensils', shop: 'shopping-bag', service: 'hand-helping' };

/** Up to two letters or digits from the first words of a name ("Plaza Premium Lounge" → "PP"). */
export function monogram(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, ' ')
    .split(/[\s/–-]+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+/u, ''))
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => [...word][0]?.toLocaleUpperCase() ?? '')
    .join('');
}

/** The medallion's tint per tone: the category's soft tint, its icon in the category's ink. */
const MEDALLION = {
  dine: 'bg-gold-soft text-gold-ink',
  shop: 'bg-primary-soft text-primary-ink',
  service: 'bg-leaf-soft text-leaf',
  lounge: 'bg-gold-soft text-gold-ink',
} as const;

/**
 * Polish (critique-redesign2 item 6): the lead of a directory card, a 48 px round medallion with
 * the category's icon on its tint, beside the name (Airbnb's list rows). It replaced the 96 px
 * monogram band, whose repeated letters ("PP PP MA MA") read as missing images. Decorative.
 */
export function CategoryMedallion({ tone, icon, className }: { tone: CategoryArtTone; icon: IconKey; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', MEDALLION[tone], className)}>
      <Icon name={icon} size="md" strokeWidth={1.75} />
    </span>
  );
}

/** `card`: the band at the top of a directory card (no longer used on cards). `feature`: the large panel beside an outlet page's title. */
export function CategoryArt({ name, tone, icon, size = 'card', className }: { name: string; tone: CategoryArtTone; icon: IconKey; size?: 'card' | 'feature'; className?: string }) {
  const style = TONES[tone];
  const feature = size === 'feature';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative isolate flex items-end justify-between gap-4 overflow-hidden',
        feature ? 'h-64 rounded-3xl px-8 pb-7 shadow-md' : 'h-24 px-5 pb-3.5 sm:px-6',
        style.box,
        className,
      )}
    >
      <span className={cn('pattern-tabur-fade absolute inset-y-0 right-0 -z-10 w-2/3 opacity-[0.14]', style.motif)} />
      <span className={cn('leading-none tracking-tight', feature ? 'type-serif-xl' : 'type-serif-lg')}>{monogram(name)}</span>
      <Icon name={icon} className={cn('opacity-80', feature ? 'mb-2 size-9' : 'mb-1 size-6')} strokeWidth={1.5} />
    </div>
  );
}
