'use client';

import { Accordion as AccordionPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './icon';

/**
 * Collapsible sections for FAQs and long guidance. `type="single" collapsible` opens one at a
 * time; `type="multiple"` lets several stay open.
 *
 * @example
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="q1" title={faq.question}>{faq.answer}</AccordionItem>
 * </Accordion>
 */
export function Accordion({ className, ...rest }: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root className={cn('border-t border-line', className)} {...rest} />;
}

export interface AccordionItemProps extends Omit<ComponentProps<typeof AccordionPrimitive.Item>, 'title'> {
  title: ReactNode;
  /** Heading level of the trigger, to keep the page outline in order. Default 3. */
  headingLevel?: 2 | 3 | 4;
  children: ReactNode;
}

export function AccordionItem({ title, headingLevel = 3, className, children, ...rest }: AccordionItemProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <AccordionPrimitive.Item className={cn('border-b border-line', className)} {...rest}>
      <AccordionPrimitive.Header asChild>
        <Heading>
          <AccordionPrimitive.Trigger className="group type-title-md flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left text-ink transition-colors duration-fast hover:text-primary-ink">
            <span className="min-w-0">{title}</span>
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2 transition-[background-color,rotate] duration-base ease-out group-hover:bg-fill-hover group-data-[state=open]:rotate-180"
            >
              <Icon name="chevron-down" size="sm" strokeWidth={2} />
            </span>
          </AccordionPrimitive.Trigger>
        </Heading>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
        <div className="max-w-reading pb-6 text-ink-2">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
