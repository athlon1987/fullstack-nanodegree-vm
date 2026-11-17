'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';

export interface TooltipProps {
  /** Short, non-essential text. Anything a user must read belongs on the page, not in a tooltip. */
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** The focusable trigger element (a button or link). */
  children: ReactElement;
}

/**
 * A hint on hover and keyboard focus. Touch users do not get tooltips, so never put required
 * information in one.
 *
 * @example <Tooltip content={t('search.shortcutHint')}><IconButton icon="search" label={t('nav.search')} /></Tooltip>
 */
export function Tooltip({ content, side = 'top', children }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={350} skipDelayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className="type-caption z-50 max-w-64 rounded-sm border border-transparent bg-inverse px-2.5 py-1.5 font-medium text-on-inverse shadow-md data-[state=delayed-open]:animate-fade-in"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
