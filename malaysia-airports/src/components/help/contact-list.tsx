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
            <p className="type-caption text-ink-2">
              {contact.scope} · {contact.label}
            </p>
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
