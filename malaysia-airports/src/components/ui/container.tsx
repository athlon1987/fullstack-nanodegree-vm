import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const SIZES = {
  /** 42rem: long-form reading. */
  reading: 'max-w-reading',
  /** 56rem: forms and focused tasks. */
  narrow: 'max-w-narrow',
  /** 77.5rem: the default page width. */
  page: 'max-w-page',
  /** 90rem: boards, maps and the header. */
  wide: 'max-w-wide',
  full: 'max-w-none',
} as const;

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  size?: keyof typeof SIZES;
  as?: ElementType;
}

/**
 * Centres content at a layout width with the fluid page gutter (16px on phones to 48px).
 *
 * @example <Container size="narrow">...</Container>
 */
export function Container({ size = 'page', as: Comp = 'div', className, ...rest }: ContainerProps) {
  return <Comp className={cn('mx-auto w-full px-gutter', SIZES[size], className)} {...rest} />;
}
