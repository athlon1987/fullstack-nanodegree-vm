import { ExternalLink } from '@/components/common/external-link';
import { SourceNote } from '@/components/common/source-note';
import { Icon } from '@/components/ui/icon';
import type { ContactView } from './help-views.server';

/** Official contact channels with their scope, note and sources. Server-rendered. */
export function ContactList({ contacts }: { contacts: readonly ContactView[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => (
        <li key={contact.id} className="flex min-w-0 gap-3 rounded-lg border border-line-strong bg-surface p-4">
          <Icon name={contact.kind} className="mt-0.5 shrink-0 text-primary-ink" />
          <div className="min-w-0">
            <p className="type-caption text-ink-2">{contact.label}</p>
            <p className="type-title-sm mt-0.5 break-words text-ink">
              {contact.href?.startsWith('https:') ? (
                <ExternalLink href={contact.href}>{contact.value}</ExternalLink>
              ) : contact.href ? (
                <a href={contact.href} className="link">
                  {contact.value}
                </a>
              ) : (
                contact.value
              )}
            </p>
            {contact.note ? <p className="type-body-sm mt-1 text-ink-2">{contact.note}</p> : null}
            <SourceNote sources={contact.sources} className="mt-1" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * A compact "Call Malaysia Airports" row for the top of Help (D-15): the published phone lines as
 * labelled `tel:` links, so a verified number is one tap away on a phone. Server-rendered.
 */
export function CallRow({ contacts, title, allLabel, max = 2 }: { contacts: readonly ContactView[]; title: string; allLabel: string; max?: number }) {
  const phones = contacts.filter((contact) => contact.kind === 'phone' && contact.href?.startsWith('tel:')).slice(0, max);
  if (phones.length === 0) return null;
  return (
    <section aria-labelledby="help-call-title" className="flex flex-col gap-2">
      <h2 id="help-call-title" className="type-title-sm text-ink">
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {phones.map((phone) => (
          <li key={phone.id} className="min-w-0">
            <a
              href={phone.href}
              className="type-body-sm inline-flex min-h-11 max-w-full items-center gap-2 rounded-pill border border-line-control bg-surface px-4 py-1.5 text-ink transition-colors duration-fast hover:border-ink"
            >
              <Icon name="phone" size="sm" className="shrink-0 text-primary-ink" />
              <span className="min-w-0">
                <span className="tabular font-semibold">{phone.value}</span>
                <span className="text-ink-2"> · {phone.label}</span>
              </span>
            </a>
          </li>
        ))}
        <li className="flex items-center">
          <a href="#contacts" className="link type-body-sm inline-flex min-h-11 items-center px-1 text-ink">
            {allLabel}
          </a>
        </li>
      </ul>
    </section>
  );
}
