import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const TONES = {
  /** Frosted glass that follows the theme: white in the light theme, midnight in the dark theme. */
  auto: 'glass text-ink',
  /** Smoky midnight glass in both themes; the content takes the light ink (`on-media`). */
  dark: 'glass-dark on-media text-ink',
} as const;

const PADDING = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' } as const;
const RADII = { lg: 'rounded-lg', xl: 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl' } as const;

export interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  tone?: keyof typeof TONES;
  padding?: keyof typeof PADDING;
  /** Corner radius. Default `2xl` (24 px). */
  radius?: keyof typeof RADII;
  as?: ElementType;
}

/**
 * A translucent panel for content over photography: a flight search over the hero, a live status
 * card, a quick-actions tray. The blur is decoration only: the panel's own fill is strong enough
 * for 4.5:1 text over any photograph (measured over pure white and pure black), and it becomes
 * a solid panel without backdrop-filter support, with "reduce transparency" and in high contrast.
 *
 * @example
 * <GlassPanel tone="dark" padding="md"><SearchField size="lg" ... /></GlassPanel>
 */
export function GlassPanel({ tone = 'auto', padding = 'md', radius = '2xl', as: Comp = 'div', className, ...rest }: GlassPanelProps) {
  return <Comp className={cn('relative', TONES[tone], PADDING[padding], RADII[radius], className)} {...rest} />;
}
