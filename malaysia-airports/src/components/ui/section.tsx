import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container, type ContainerProps } from './container';

const TONES = {
  page: '',
  /** A quiet band between page sections. */
  subtle: 'border-y border-line bg-page-subtle',
  surface: 'border-y border-line bg-surface',
  /** Ink band with light text (the "all 39 airports" band, the footer). */
  inverse: 'bg-inverse text-on-inverse',
  /** The dark data surface. Everything inside takes board colours. */
  board: 'surface-board',
} as const;

const SPACING = {
  none: '',
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-section',
} as const;

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: keyof typeof TONES;
  spacing?: keyof typeof SPACING;
  /** Container width for the content; `false` to place children edge to edge. */
  width?: ContainerProps['size'] | false;
  as?: ElementType;
  children: ReactNode;
}

/**
 * A vertical band of a page with consistent rhythm.
 *
 * @example <Section tone="subtle" aria-labelledby="notices-h">...</Section>
 */
export function Section({ tone = 'page', spacing = 'lg', width = 'page', as: Comp = 'section', className, children, ...rest }: SectionProps) {
  return (
    <Comp className={cn(TONES[tone], SPACING[spacing], className)} {...rest}>
      {width === false ? children : <Container size={width}>{children}</Container>}
    </Comp>
  );
}
