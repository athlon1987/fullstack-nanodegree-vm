import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { LocaleLink, type LocaleLinkProps } from '@/components/common/locale-link';

const VARIANTS = {
  /** Hairline card on a surface: the default container. */
  outline: 'border border-line-strong bg-surface',
  /** Lifts off the page: search desk, popover-like panels. */
  raised: 'border border-line-strong bg-surface shadow-md',
  /** A quiet well for secondary content. */
  sunken: 'border border-line bg-page-subtle',
  /** No chrome: for grouping inside another card. */
  plain: '',
} as const;

const PADDING = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' } as const;

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: keyof typeof VARIANTS;
  /** Padding for simple cards. Use `none` with `CardHeader` / `CardBody` / `CardFooter`. */
  padding?: keyof typeof PADDING;
  /**
   * The whole card is one link: put exactly one `CardLink` inside (usually the title). The card
   * shows hover and focus states, and other content stays plain text.
   */
  interactive?: boolean;
  as?: ElementType;
}

/**
 * Card container.
 *
 * @example
 * <Card interactive padding="md">
 *   <h3 className="type-title-md"><CardLink href="/kul/parking">{t('nav.parking')}</CardLink></h3>
 * </Card>
 */
export function Card({ variant = 'outline', padding = 'none', interactive = false, as: Comp = 'div', className, ...rest }: CardProps) {
  return (
    <Comp
      className={cn(
        'relative rounded-lg',
        VARIANTS[variant],
        PADDING[padding],
        interactive &&
          'transition-[border-color,box-shadow,background-color] duration-fast hover:border-ink-3 hover:shadow-sm has-[[data-card-link]:focus-visible]:focus-ring',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 px-5 pt-5 sm:px-6 sm:pt-6', className)} {...rest} />;
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5 sm:px-6', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6', className)} {...rest} />;
}

export interface CardLinkProps extends LocaleLinkProps {
  children: ReactNode;
}

/** The link of an `interactive` card. Its hit area stretches over the whole card. */
export function CardLink({ className, children, ...rest }: CardLinkProps) {
  return (
    <LocaleLink data-card-link="" className={cn('outline-none after:absolute after:inset-0 after:rounded-[inherit]', className)} {...rest}>
      {children}
    </LocaleLink>
  );
}
