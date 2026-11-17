import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from './icon';

export interface DataListProps extends HTMLAttributes<HTMLDListElement> {
  /**
   * `rows`: label left, value right, ruled (flight facts, fares).
   * `stacked`: small label above each value, in a responsive grid (summary panels).
   */
  layout?: 'rows' | 'stacked';
  /** Tighter rows for dense panels. */
  dense?: boolean;
}

/**
 * Label and value pairs, as a real description list.
 *
 * @example
 * <DataList>
 *   <DataListItem label={t('common.labels.gate')} mono>C12</DataListItem>
 * </DataList>
 */
export function DataList({ layout = 'rows', dense = false, className, ...rest }: DataListProps) {
  return (
    <dl
      data-layout={layout}
      data-dense={dense}
      className={cn(
        'group/dl min-w-0',
        layout === 'rows' ? 'divide-y divide-line border-y border-line' : 'grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]',
        className,
      )}
      {...rest}
    />
  );
}

export interface DataListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  icon?: IconKey;
  /** Mono, tabular value: times, gates, codes, amounts. */
  mono?: boolean;
  children: ReactNode;
}

export function DataListItem({ label, icon, mono = false, className, children, ...rest }: DataListItemProps) {
  return (
    <div
      className={cn(
        'min-w-0',
        'group-data-[layout=rows]/dl:flex group-data-[layout=rows]/dl:min-h-row group-data-[layout=rows]/dl:flex-wrap group-data-[layout=rows]/dl:items-center group-data-[layout=rows]/dl:justify-between group-data-[layout=rows]/dl:gap-x-6 group-data-[layout=rows]/dl:gap-y-1 group-data-[layout=rows]/dl:py-2.5',
        'group-data-[dense=true]/dl:group-data-[layout=rows]/dl:min-h-row-dense group-data-[dense=true]/dl:group-data-[layout=rows]/dl:py-1.5',
        className,
      )}
      {...rest}
    >
      <dt
        className={cn(
          'flex items-center gap-2 text-ink-2',
          'group-data-[layout=rows]/dl:type-body-sm group-data-[layout=stacked]/dl:type-eyebrow group-data-[layout=stacked]/dl:text-ink-3',
        )}
      >
        {icon ? <Icon name={icon} size="sm" className="text-ink-3" /> : null}
        {label}
      </dt>
      <dd
        className={cn(
          'min-w-0 text-ink group-data-[layout=rows]/dl:text-right group-data-[layout=stacked]/dl:mt-1.5',
          mono ? 'type-data-md' : 'type-body font-medium',
        )}
      >
        {children}
      </dd>
    </div>
  );
}
