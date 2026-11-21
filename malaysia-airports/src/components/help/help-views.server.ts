/**
 * Server-only builders for the help centre: localised FAQ and topic views, contacts and official
 * links resolved from the content layer. Never import from a Client Component.
 */
import { FAQS, GROUP_CONTACTS, HELP_TOPICS, getAirport, getFaq, getSource, localizeAirport, pick, resolveSources, type Contact, type Faq, type Lang, type Source } from '@/content';
import type { Translator } from '@/lib/i18n/translate';
import type { FactView } from '@/components/guides/fact-card';
import { HELP_TOPIC_ORDER, TOPIC_OFFICIAL, helpTopicIcon } from './help-meta';
import type { IconKey } from '@/components/ui/icon';

export interface FaqView extends FactView {
  topic: string;
  topicTitle: string;
  question: string;
  answer: string;
  asOf?: string;
  airports: { code: string; name: string }[];
}

export interface HelpTopicView {
  slug: string;
  title: string;
  summary: string;
  icon: IconKey;
  count: number;
}

export interface ContactView {
  id: string;
  kind: Contact['kind'];
  label: string;
  value: string;
  href?: string;
  note?: string;
  scope: string;
  sources: Source[];
}

export interface OfficialLinkView {
  id: string;
  label: string;
  url: string;
  sources: Source[];
}

const topicTitle = (slug: string, lang: Lang) => {
  const topic = HELP_TOPICS.find((item) => item.slug === slug);
  return topic ? pick(topic.title, lang) : slug;
};

export function toFaqView(faq: Faq, lang: Lang): FaqView {
  const question = pick(faq.question, lang);
  const answer = pick(faq.answer, lang);
  return {
    id: faq.id,
    topic: faq.topic,
    topicTitle: topicTitle(faq.topic, lang),
    question,
    answer,
    title: question,
    body: answer,
    provenance: faq.provenance,
    sources: resolveSources(faq.sources),
    asOf: faq.asOf,
    airports: (faq.airports ?? []).map((slug) => {
      const airport = getAirport(slug);
      return { code: airport?.code ?? slug.toUpperCase(), name: airport ? localizeAirport(airport, lang).shortName : slug.toUpperCase() };
    }),
  };
}

export function faqViews(lang: Lang, topic?: string): FaqView[] {
  return FAQS.filter((faq) => !topic || faq.topic === topic).map((faq) => toFaqView(faq, lang));
}

export function faqView(id: string, lang: Lang): FaqView | undefined {
  const faq = getFaq(id);
  return faq ? toFaqView(faq, lang) : undefined;
}

export function helpTopicViews(lang: Lang): HelpTopicView[] {
  const order = (slug: string) => {
    const index = HELP_TOPIC_ORDER.indexOf(slug);
    return index === -1 ? HELP_TOPIC_ORDER.length : index;
  };
  return [...HELP_TOPICS]
    .sort((a, b) => order(a.slug) - order(b.slug))
    .map((topic) => ({
      slug: topic.slug,
      title: pick(topic.title, lang),
      summary: pick(topic.summary, lang),
      icon: helpTopicIcon(topic.slug),
      count: FAQS.filter((faq) => faq.topic === topic.slug).length,
    }));
}

/** Official contacts: the group lines, then KLIA's own channels, without duplicates. */
export function contactViews(lang: Lang, t: Translator): ContactView[] {
  const klia = getAirport('kul');
  const seen = new Set<string>();
  const views: ContactView[] = [];
  const add = (contact: Contact, scope: string) => {
    const key = `${contact.kind}:${contact.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    views.push({
      id: key,
      kind: contact.kind,
      label: pick(contact.label, lang),
      value: contact.value,
      href: contact.href,
      note: contact.note ? pick(contact.note, lang) : undefined,
      scope,
      sources: resolveSources(contact.sources),
    });
  };
  for (const contact of GROUP_CONTACTS) add(contact, t('common.appName'));
  for (const contact of klia?.contacts ?? []) add(contact, t('guidePages.help.klia'));
  return views;
}

export function officialLinks(topic: string, t: Translator): OfficialLinkView[] {
  return (TOPIC_OFFICIAL[topic] ?? [])
    .map((item) => {
      const source = getSource(item.source);
      return source ? { id: item.source, label: t(item.label), url: source.url, sources: [source] } : undefined;
    })
    .filter((item): item is OfficialLinkView => Boolean(item));
}
