import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/*
 * Woven motifs. All three are decoration: hidden from assistive technology, one colour, and
 * never placed behind body text. See docs/design/design-system.md for the cultural notes.
 */

export interface RebungRuleProps extends HTMLAttributes<HTMLDivElement> {
  /** `sm` is the 6px gold-thread hairline; `lg` is the 20px border for band edges. */
  size?: 'sm' | 'lg';
}

/**
 * Pucuk rebung (bamboo shoot): the row of triangles found on the border of songket and batik
 * cloth. Gold by default; set a text colour utility to change it.
 *
 * @example <RebungRule />
 */
export function RebungRule({ size = 'sm', className, ...rest }: RebungRuleProps) {
  return <div aria-hidden="true" className={cn('w-full text-gold', size === 'lg' ? 'pattern-rebung-lg' : 'pattern-rebung', className)} {...rest} />;
}

export interface TaburFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Fade the field out towards the left, for a corner of a hero. */
  fade?: boolean;
}

/**
 * Bunga tabur (scattered flowers): small four-point stars and dots, the field motif of
 * songket. Position and size it with utilities; keep it to one corner.
 *
 * @example <TaburField fade className="absolute top-0 right-0 h-64 w-1/2" />
 */
export function TaburField({ fade = false, className, ...rest }: TaburFieldProps) {
  return <div aria-hidden="true" className={cn('pointer-events-none text-gold opacity-60', fade ? 'pattern-tabur-fade' : 'pattern-tabur', className)} {...rest} />;
}

/**
 * A fine mengkuang (pandanus) weave texture for the corner of a dark band or the board.
 *
 * @example <WeaveTexture className="absolute right-0 bottom-0 h-12 w-2/5 text-board-dim opacity-30" />
 */
export function WeaveTexture({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('pattern-weave pointer-events-none text-ink-3 opacity-30', className)} {...rest} />;
}
