import { ExternalLink } from '@/components/common/external-link';
import { SourceNote } from '@/components/common/source-note';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';
import type { ContactView } from './help-views.server';

/** Official contact channels with their scope, note and sources. Server-rendered. */
export function ContactList({ contacts }: { contacts: readonly ContactView[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => (
        <li key={contact.id} className="flex min-w-0 gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
            <Icon name={contact.kind} />
          </span>
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
export function CallRow({ contacts, title, allLabel, max = 2, layout = 'row' }: { contacts: readonly ContactView[]; title: string; allLabel: string; max?: number; layout?: 'row' | 'card' }) {
  const phones = contacts.filter((contact) => contact.kind === 'phone' && contact.href?.startsWith('tel:')).slice(0, max);
  if (phones.length === 0) return null;
  const card = layout === 'card';
  return (
    // Polish (critique-redesign2 item 3): `card` is the help centre's key answer in the band's right
    // column, the call lines stacked on smoky glass.
    <section aria-labelledby="help-call-title" className={cn('flex flex-col gap-2', card && 'glass-dark gap-3 rounded-3xl p-5 sm:p-6')}>
      <h2 id="help-call-title" className={cn('text-ink', card ? 'type-title-md' : 'type-title-sm')}>
        {title}
      </h2>
      <ul className={cn('flex gap-2', card ? 'flex-col items-start' : 'flex-wrap')}>
        {phones.map((phone) => (
          <li key={phone.id} className="min-w-0">
            <a
              href={phone.href}
              className="type-body-sm inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-pill border border-line-control bg-surface py-1.5 pr-4 pl-1.5 text-ink shadow-xs transition-colors duration-fast hover:border-ink"
            >
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold text-on-gold">
                <Icon name="phone" size="sm" />
              </span>
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
