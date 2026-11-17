/** Help centre presentation config. Client-safe: no content imports. */
import type { TKey } from '@/lib/i18n/translate';
import type { IconKey } from '@/components/ui/icon';

/** Topic display order on the hub (topics missing here follow in content order). */
export const HELP_TOPIC_ORDER: readonly string[] = [
  'flights',
  'baggage',
  'lost-property',
  'contact',
  'feedback',
  'scams',
  'accessibility',
  'terminals',
  'parking-transport',
  'privacy',
  'about-this-site',
];

export const HELP_TOPIC_ICONS: Readonly<Record<string, IconKey>> = {
  flights: 'clock-alert',
  baggage: 'luggage',
  'lost-property': 'package-search',
  contact: 'phone',
  feedback: 'messages-square',
  scams: 'shield-check',
  accessibility: 'accessibility',
  terminals: 'building-2',
  'parking-transport': 'train-front',
  privacy: 'eye',
  'about-this-site': 'info',
};

export const helpTopicIcon = (slug: string): IconKey => HELP_TOPIC_ICONS[slug] ?? 'circle-help';

/** "Common questions" on the hub, in order. */
export const POPULAR_FAQS: readonly string[] = [
  'flight-delay-refund',
  'missing-checked-bag',
  'klia-lost-item',
  'wheelchair-request',
  'klia-change-terminals',
  'scam-mdac-fees',
];

export type WhoContact = 'airline' | 'lostFound' | 'mahb' | 'mavcom';

/** "Who handles what": each row links to the FAQ that holds the sourced answer. */
export const WHO_HANDLES: readonly { id: string; situation: TKey; contact: WhoContact; faq: string }[] = [
  { id: 'delay', situation: 'guidePages.help.who.delay', contact: 'airline', faq: 'flight-delay-care' },
  { id: 'missing-bag', situation: 'guidePages.help.who.missingBag', contact: 'airline', faq: 'missing-checked-bag' },
  { id: 'lost-on-board', situation: 'guidePages.help.who.lostOnBoard', contact: 'airline', faq: 'lost-on-aircraft' },
  { id: 'lost-terminal', situation: 'guidePages.help.who.lostTerminal', contact: 'lostFound', faq: 'klia-lost-item' },
  { id: 'airport', situation: 'guidePages.help.who.airport', contact: 'mahb', faq: 'airport-feedback' },
  { id: 'unresolved', situation: 'guidePages.help.who.unresolved', contact: 'mavcom', faq: 'airline-complaint-escalation' },
  { id: 'wheelchair', situation: 'guidePages.help.who.wheelchair', contact: 'airline', faq: 'wheelchair-request' },
];

export const WHO_CONTACT_KEYS: Readonly<Record<WhoContact, TKey>> = {
  airline: 'guidePages.help.whoAnswer.airline',
  lostFound: 'guidePages.help.whoAnswer.lostFound',
  mahb: 'guidePages.help.whoAnswer.mahb',
  mavcom: 'guidePages.help.whoAnswer.mavcom',
};

/** Internal pages related to each topic (hrefs without locale). */
export const TOPIC_RELATED: Readonly<Record<string, readonly { href: string; label: TKey }[]>> = {
  flights: [
    { href: '/notices', label: 'guidePages.help.links.notices' },
    { href: '/kul/transit', label: 'guidePages.help.links.transitPlanner' },
    { href: '/journey', label: 'guidePages.help.links.myJourney' },
  ],
  baggage: [
    { href: '/guides/baggage', label: 'guidePages.help.links.baggageGuide' },
    { href: '/guides/security', label: 'guidePages.help.links.securityGuide' },
  ],
  'lost-property': [{ href: '/guides/baggage', label: 'guidePages.help.links.baggageGuide' }],
  accessibility: [{ href: '/accessibility', label: 'guidePages.help.links.accessibility' }],
  terminals: [
    { href: '/kul/map', label: 'guidePages.help.links.map' },
    { href: '/kul/transit', label: 'guidePages.help.links.transitPlanner' },
  ],
  'parking-transport': [
    { href: '/kul/transport', label: 'guidePages.help.links.transport' },
    { href: '/kul/parking', label: 'guidePages.help.links.parking' },
    { href: '/kul/transit', label: 'guidePages.help.links.transitPlanner' },
  ],
  scams: [{ href: '/guides/immigration-customs', label: 'guidePages.help.links.immigrationGuide' }],
  privacy: [
    { href: '/privacy', label: 'guidePages.help.links.privacyPage' },
    { href: '/journey', label: 'guidePages.help.links.myJourney' },
  ],
  'about-this-site': [{ href: '/about-this-prototype', label: 'guidePages.help.links.aboutPrototype' }],
};

/** Official external pages per topic: source ids from the registry with a link label. */
export const TOPIC_OFFICIAL: Readonly<Record<string, readonly { source: string; label: TKey }[]>> = {
  'lost-property': [{ source: 'mahb-lost-found', label: 'guidePages.help.links.lostFound' }],
  feedback: [{ source: 'mahb-feedback-site', label: 'guidePages.help.links.feedbackSite' }],
  contact: [
    { source: 'mahb-feedback-site', label: 'guidePages.help.links.feedbackSite' },
    { source: 'mahb-klia-t1-help', label: 'guidePages.help.links.helpSupport' },
  ],
  scams: [
    { source: 'mahb-scam-alert', label: 'guidePages.help.links.scamAlert' },
    { source: 'mahb-corporate-scam-alert', label: 'guidePages.help.links.scamAlertCorporate' },
  ],
  privacy: [{ source: 'mahb-privacy-notice', label: 'guidePages.help.links.privacyNotice' }],
  accessibility: [{ source: 'mahb-special-assistance-klia-t1', label: 'guidePages.help.links.specialAssistance' }],
};
