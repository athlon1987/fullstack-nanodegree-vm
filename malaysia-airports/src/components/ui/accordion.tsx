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
  return <AccordionPrimitive.Root className={cn('border-t border-line-strong', className)} {...rest} />;
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
    <AccordionPrimitive.Item className={cn('border-b border-line-strong', className)} {...rest}>
      <AccordionPrimitive.Header asChild>
        <Heading>
          <AccordionPrimitive.Trigger className="group type-title-sm flex min-h-13 w-full items-center justify-between gap-4 py-3 text-left text-ink transition-colors duration-fast hover:text-primary-ink">
            <span className="min-w-0">{title}</span>
            <Icon
              name="chevron-down"
              strokeWidth={1.75}
              className="text-ink-2 transition-transform duration-base group-data-[state=open]:rotate-180"
            />
          </AccordionPrimitive.Trigger>
        </Heading>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
        <div className="max-w-reading pb-5 text-ink-2">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
