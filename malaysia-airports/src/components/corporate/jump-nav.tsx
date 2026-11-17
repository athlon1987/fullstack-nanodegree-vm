import { Icon, type IconName } from '@/components/ui/icon';

export interface JumpNavProps {
  label: string;
  items: readonly { id: string; label: string; icon?: IconName }[];
}

/** "On this page" links to the sections below, as wrapping pills (no sideways scroll). */
export function JumpNav({ label, items }: JumpNavProps) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="type-body-sm inline-flex min-h-11 items-center gap-2 rounded-pill border border-line-control bg-surface px-4 text-ink transition-colors duration-fast hover:border-ink"
            >
              {item.icon ? <Icon name={item.icon} size="sm" /> : null}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
