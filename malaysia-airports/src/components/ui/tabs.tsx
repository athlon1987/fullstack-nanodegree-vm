'use client';

import { Tabs as TabsPrimitive } from 'radix-ui';
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react';
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

const FADE = '2.5rem';

/**
 * The row of tabs. Give it an `aria-label`. When the tabs are wider than the screen the row
 * scrolls sideways and fades at the edge that has more, so a cut-off label never looks final.
 */
export function TabsList({ className, ...rest }: ComponentProps<typeof TabsPrimitive.List>) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ start: false, end: false });

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const measure = () => {
      const start = list.scrollLeft > 2;
      const end = list.scrollLeft + list.clientWidth < list.scrollWidth - 2;
      setMore((current) => (current.start === start && current.end === end ? current : { start, end }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    list.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener('scroll', measure);
    };
  }, []);

  const fade = { '--fade-start': more.start ? FADE : '0px', '--fade-end': more.end ? FADE : '0px' } as CSSProperties;

  // Direction v2: app-like pills on a soft track. The track hugs the tabs and scrolls sideways
  // (with the edge fade) when they are wider than the screen.
  return (
    <div className="flex min-w-0">
      <TabsPrimitive.List
        ref={ref}
        style={fade}
        className={cn('scroll-fade-x flex max-w-full gap-1 overflow-x-auto rounded-pill bg-fill p-1 [scrollbar-width:none]', className)}
        {...rest}
      />
    </div>
  );
}

export function TabsTrigger({ className, ...rest }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative inline-flex h-9 shrink-0 items-center gap-2 rounded-pill px-4 text-[0.9375rem] font-semibold whitespace-nowrap text-ink-2 transition-[background-color,color,box-shadow] duration-fast touch:h-11 sm:px-5',
        'hover:bg-fill-hover hover:text-ink focus-visible:focus-ring-inset',
        'data-[state=active]:bg-ink data-[state=active]:text-page data-[state=active]:shadow-sm disabled:text-ink-3',
        className,
      )}
      {...rest}
    />
  );
}

export function TabsContent({ className, ...rest }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-5', className)} {...rest} />;
}
