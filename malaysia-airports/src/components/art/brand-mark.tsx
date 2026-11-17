import type { SVGAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface BrandMarkProps extends SVGAttributes<SVGSVGElement> {
  /** Accessible name. Omit when the mark sits next to the wordmark (it is then decorative). */
  label?: string;
}

/**
 * The prototype's own mark: two nested pucuk rebung chevrons (a roof, a runway in perspective)
 * under a single gold lozenge. Original and typographic. It is NOT the official Malaysia
 * Airports logo and must never be replaced by it in this prototype.
 *
 * @example <BrandMark className="size-8" />
 */
export function BrandMark({ label, className, ...rest }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="square"
      className={cn('size-7 shrink-0', className)}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
    >
      <path d="M3.5 27 16 9l12.5 18" />
      <path d="M10.5 27l5.5-8 5.5 8" />
      <path d="M16 1l2.6 3.2L16 7.4l-2.6-3.2z" className="fill-gold" stroke="none" />
    </svg>
  );
}
