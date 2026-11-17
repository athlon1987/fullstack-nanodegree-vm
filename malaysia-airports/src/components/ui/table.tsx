import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TableScrollProps extends HTMLAttributes<HTMLDivElement> {
  /** Names the scrollable region for assistive technology. Required: the region is focusable so keyboard users can scroll it. */
  label: string;
}

/**
 * The scroll container for a table that may be wider than a phone. Keyboard users can focus it
 * and scroll with the arrow keys; the page itself never scrolls sideways.
 */
export function TableScroll({ label, className, ...rest }: TableScrollProps) {
  // `relative` keeps absolutely positioned descendants (such as `sr-only` text) inside the scroll
  // region; without it they escape and the whole page scrolls sideways on phones.
  return <div role="region" aria-label={label} tabIndex={0} className={cn('relative w-full overflow-x-auto focus-visible:focus-ring-inset', className)} {...rest} />;
}

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Row height: `default` 52px (touch rows), `dense` 40px (desktop data), `compact` 32px (reference tables). */
  density?: 'default' | 'dense' | 'compact';
}

/**
 * Dense table primitives. Use real table markup for tabular data (boards, fares, rates) with a
 * `<caption>` (it may be `sr-only`) and `scope` on header cells. On the board surface the same
 * primitives take board colours automatically.
 *
 * @example
 * <TableScroll label={t('parking.title')}>
 *   <Table density="dense">
 *     <caption className="sr-only">...</caption>
 *     <THead><Tr><Th>...</Th><Th numeric>...</Th></Tr></THead>
 *     <TBody><Tr><Td>...</Td><Td numeric>RM 4.00</Td></Tr></TBody>
 *   </Table>
 * </TableScroll>
 */
export function Table({ density = 'default', className, ...rest }: TableProps) {
  return <table data-density={density} className={cn('group/table w-full border-collapse text-left', className)} {...rest} />;
}

export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(className)} {...rest} />;
}

export function TBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(className)} {...rest} />;
}

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Dim the row: a cancelled flight, a closed outlet. Never the only signal: keep the status chip. */
  muted?: boolean;
}

export function Tr({ muted = false, className, ...rest }: TrProps) {
  return (
    <tr
      className={cn('border-b border-line transition-colors duration-fast [tbody>&]:hover:bg-page-subtle', muted && 'text-ink-3', className)}
      {...rest}
    />
  );
}

const CELL =
  'px-3 align-middle first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5 ' +
  'h-row group-data-[density=dense]/table:h-row-dense group-data-[density=compact]/table:h-row-compact';

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function Th({ numeric = false, scope = 'col', className, ...rest }: ThProps) {
  return (
    <th
      scope={scope}
      className={cn(
        'type-data-xs px-3 py-2.5 align-bottom font-medium whitespace-nowrap text-ink-3 first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5',
        '[thead_&]:border-b [thead_&]:border-line-strong',
        numeric && 'text-right',
        className,
      )}
      {...rest}
    />
  );
}

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Right-aligned mono figures: amounts, durations, counts. */
  numeric?: boolean;
  /** Mono without right alignment: times, flight numbers, gates. */
  mono?: boolean;
}

export function Td({ numeric = false, mono = false, className, ...rest }: TdProps) {
  return <td className={cn(CELL, 'type-body-sm sm:text-base', (numeric || mono) && 'type-data-md', numeric && 'text-right', className)} {...rest} />;
}
