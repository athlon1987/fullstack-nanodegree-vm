import { getNotices, resolveSources, type Source } from '@/content';
import type { TerminalId } from '@/content/types';
import { opsServicesFor, type OpsServiceId } from '@/lib/providers/demo-operations';
import { OpsStatus } from './ops-status';

export interface OpsStatusSectionProps {
  /** Airport slug: `kul`. */
  airport: string;
  services?: readonly OpsServiceId[];
  terminal?: TerminalId;
  headingLevel?: 2 | 3;
  /** `card` (default) or `tiles` (the airport overview, redesign round one). */
  variant?: 'card' | 'tiles';
  className?: string;
}

/**
 * Drop-in status lines for other pages (hand-offs B-01: the home notice strip and KLIA overview,
 * package A; the transit planner, package C). Server Component: it loads the airport's notices
 * and their sources and renders the client `OpsStatus`. Renders nothing for an airport without
 * any of the services.
 *
 * @example <OpsStatusSection airport="kul" services={['aerotrain', 'inter-terminal-train', 'inter-terminal-shuttle']} />
 */
export function OpsStatusSection({ airport, services, terminal, headingLevel, variant, className }: OpsStatusSectionProps) {
  const available = opsServicesFor(airport);
  const wanted = (services ?? available).filter((service) => available.includes(service));
  if (wanted.length === 0) return null;
  const notices = getNotices(airport);
  const sources: Record<string, Source> = Object.fromEntries(resolveSources([...new Set(notices.flatMap((notice) => notice.sources))]).map((source) => [source.id, source]));
  return <OpsStatus airport={airport} notices={notices} sources={sources} services={wanted} terminal={terminal} headingLevel={headingLevel} variant={variant} className={className} />;
}
