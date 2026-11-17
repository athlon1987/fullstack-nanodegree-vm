'use client';

import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tabs for switching between views of the same subject. Arrow keys move between tabs.
 *
 * @example
 * <Tabs defaultValue="t1">
 *   <TabsList aria-label={t('common.labels.terminal')}>
 *     <TabsTrigger value="t1">Terminal 1</TabsTrigger><TabsTrigger value="t2">Terminal 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="t1">...</TabsContent>
 * </Tabs>
 */
export function Tabs({ className, ...rest }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn('min-w-0', className)} {...rest} />;
}

/** The row of tabs. Give it an `aria-label`. It scrolls sideways on narrow screens. */
export function TabsList({ className, ...rest }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('flex gap-1 overflow-x-auto border-b border-line-strong [scrollbar-width:none]', className)}
      {...rest}
    />
  );
}

export function TabsTrigger({ className, ...rest }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-base font-semibold whitespace-nowrap text-ink-2 transition-colors duration-fast sm:px-4',
        'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-transparent hover:text-ink focus-visible:focus-ring-inset',
        'data-[state=active]:text-ink data-[state=active]:after:bg-ink disabled:text-ink-3',
        'forced-colors:data-[state=active]:after:bg-[HighlightText]',
        className,
      )}
      {...rest}
    />
  );
}

export function TabsContent({ className, ...rest }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-5', className)} {...rest} />;
}
