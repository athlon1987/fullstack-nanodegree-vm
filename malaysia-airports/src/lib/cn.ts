import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names: conditional values are resolved by `clsx`, then conflicting
 * Tailwind utilities are de-duplicated by `tailwind-merge` (the last one wins).
 *
 * @example cn('px-2 py-1', isActive && 'bg-brand', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
