import type { Provenance, Source } from '@/content/types';
import { Icon, type IconName } from '@/components/ui/icon';
import { FactMeta } from './fact-meta';

export interface ChannelView {
  id: string;
  icon: IconName;
  /** "Phone", "Email". */
  kind: string;
  label: string;
  value: string;
  href?: string;
  note?: string;
  dateLabel?: string;
  provenance: Provenance;
  sources: Source[];
}

/** Published contact channels: what it is, the number or address as a link, a note and its sources. */
export function ContactChannelList({ channels, label }: { channels: readonly ChannelView[]; label: string }) {
  return (
    <ul aria-label={label} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {channels.map((channel) => {
        const external = channel.href?.startsWith('http');
        return (
          <li key={channel.id} className="flex min-w-0 gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
              <Icon name={channel.icon} size="md" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="type-eyebrow text-ink-3">{channel.kind}</p>
              <p className="type-body-sm mt-1 text-ink-2">{channel.label}</p>
              {channel.href ? (
                <a
                  href={channel.href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="link type-title-sm mt-1 inline-flex min-h-11 items-center text-ink [overflow-wrap:anywhere]"
                >
                  {channel.value}
                  {external ? <Icon name="arrow-up-right" size="xs" strokeWidth={2} className="ml-1 shrink-0" /> : null}
                </a>
              ) : (
                <p className="type-title-md mt-1 text-ink">{channel.value}</p>
              )}
              {channel.note ? <p className="type-body-sm mt-1 text-ink-2">{channel.note}</p> : null}
              <FactMeta className="mt-2" provenance={channel.provenance} dateLabel={channel.dateLabel} sources={channel.sources} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
