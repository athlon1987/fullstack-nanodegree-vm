import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container, type ContainerProps } from './container';

/* Direction v2: bands are separated by colour and space, not by rules. */
const TONES = {
  page: '',
  /** A quiet cool-grey band between page sections. */
  subtle: 'bg-page-subtle',
  /** A white band (cards on it use `raised` or `sunken`). */
  surface: 'bg-surface',
  /** Warm ivory: one editorial band per page at most. */
  ivory: 'bg-ivory',
  /** Ink band with light text (the "all 39 airports" band, the footer). */
  inverse: 'bg-inverse text-on-inverse',
  /** The brand's midnight with a soft lift of light. Components inside take the light ink. */
  midnight: 'surface-midnight on-media text-ink',
  /** The dark data surface. Everything inside takes board colours. */
  board: 'surface-board',
} as const;

const SPACING = {
  none: '',
  sm: 'py-10',
  md: 'py-14 md:py-16',
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
