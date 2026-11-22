'use client';

import { Popover as PopoverPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** Popover root. For a few controls or a short explanation anchored to a trigger; not for navigation menus on phones (use `Sheet`). */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;
export const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * @example
 * <Popover>
 *   <PopoverTrigger asChild><Button variant="secondary" iconEnd="chevron-down">{t('flights.filters.title')}</Button></PopoverTrigger>
 *   <PopoverContent aria-label={t('flights.filters.title')}>...</PopoverContent>
 * </Popover>
 */
export function PopoverContent({ className, sideOffset = 8, collisionPadding = 12, align = 'start', ...rest }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        align={align}
        className={cn(
          'z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-line bg-surface-raised p-4 text-ink shadow-xl outline-none',
          'data-[state=open]:animate-scale-in',
          className,
        )}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
}
