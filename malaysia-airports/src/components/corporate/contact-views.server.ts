import { CORPORATE_LINKS, GROUP_CONTACTS, getAirport, pick, type Contact, type Lang } from '@/content';
import type { Translator } from '@/lib/i18n';
import { formatDate } from '@/lib/time';
import type { IconName } from '@/components/ui/icon';
import type { ChannelView } from './contact-channel-list';
import { provenanceOf, resolveCorporateSources } from './corporate-data.server';

const KIND_ICON: Record<Contact['kind'], IconName> = { phone: 'phone', email: 'mail', web: 'globe', chat: 'messages-square', app: 'smartphone' };

/** `Retrieved 2026-11-16` in the content becomes "Retrieved 16 Nov 2026" in the reader's language. */
function retrievedLabel(asOf: string | undefined, lang: Lang, t: Translator): string | undefined {
  const date = asOf?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (!date) return asOf;
  return /retriev/i.test(asOf ?? '') ? t('freshness.retrieved', { date: formatDate(date, lang) }) : t('corporatePages.common.asOf', { date: formatDate(date, lang) });
}

function toChannel(contact: Contact, id: string, lang: Lang, t: Translator): ChannelView {
  const sources = resolveCorporateSources(contact.sources);
  return {
    id,
    icon: KIND_ICON[contact.kind],
    kind: t(`corporatePages.contact.kind.${contact.kind}`),
    label: pick(contact.label, lang),
    value: contact.value,
    href: contact.href,
    note: contact.note ? pick(contact.note, lang) : undefined,
    dateLabel: retrievedLabel(contact.asOf, lang, t),
    provenance: provenanceOf(sources),
    sources,
  };
}

/**
 * Sourced channels for the corporate pages: the group line and email, the KLIA Terminal 1 and
 * corporate office line, live chat (from the KLIA contacts), and the feedback site and contact page.
 * `only` limits the result to some channels, in that order.
 */
export function corporateChannels(lang: Lang, t: Translator, only?: readonly ('group-phone' | 'group-email' | 'office-phone' | 'chat' | 'feedback' | 'contact-page')[]): ChannelView[] {
  const kul = getAirport('kul');
  const office = kul?.contacts.find((contact) => contact.kind === 'phone' && contact.label.en.toLowerCase().includes('corporate office'));
  const chat = kul?.contacts.find((contact) => contact.kind === 'chat');
  const groupPhone = GROUP_CONTACTS.find((contact) => contact.kind === 'phone');
  const groupEmail = GROUP_CONTACTS.find((contact) => contact.kind === 'email');
  const linkSources = (ids: readonly string[]) => resolveCorporateSources(ids);

  const all: ChannelView[] = [
    ...(groupPhone ? [toChannel(groupPhone, 'group-phone', lang, t)] : []),
    ...(groupEmail ? [toChannel(groupEmail, 'group-email', lang, t)] : []),
    ...(office ? [toChannel(office, 'office-phone', lang, t)] : []),
    ...(chat ? [toChannel(chat, 'chat', lang, t)] : []),
    {
      id: 'feedback',
      icon: 'messages-square',
      kind: t('corporatePages.contact.kind.web'),
      label: t('corporatePages.contact.feedbackLabel'),
      value: t('corporatePages.contact.feedbackValue'),
      href: CORPORATE_LINKS.feedback.url,
      provenance: 'official',
      sources: linkSources(CORPORATE_LINKS.feedback.sources),
    },
    {
      id: 'contact-page',
      icon: 'globe',
      kind: t('corporatePages.contact.kind.web'),
      label: t('corporatePages.contact.contactPageLabel'),
      value: t('corporatePages.contact.contactPageValue'),
      href: CORPORATE_LINKS.contact.url,
      provenance: 'official',
      sources: linkSources(CORPORATE_LINKS.contact.sources),
    },
  ];
  if (!only) return all;
  return only.map((id) => all.find((channel) => channel.id === id)).filter((channel): channel is ChannelView => channel !== undefined);
}
