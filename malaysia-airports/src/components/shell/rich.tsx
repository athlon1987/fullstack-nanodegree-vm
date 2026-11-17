import { Fragment, type ReactNode } from 'react';

/**
 * Fill a dictionary template with React nodes instead of strings, so one placeholder can be
 * emphasised: `rich(t('flights.search.scopeAirport'), { airport: <strong>KLIA</strong> })`.
 * Call `t(key)` WITHOUT variables: unknown placeholders are left in place for this function.
 */
export function rich(template: string, parts: Record<string, ReactNode>): ReactNode[] {
  return template
    .split(/(\{\w+\})/g)
    .filter(Boolean)
    .map((piece, index) => {
      const match = /^\{(\w+)\}$/.exec(piece);
      return match && match[1] in parts ? <Fragment key={index}>{parts[match[1]]}</Fragment> : piece;
    });
}
