import type { IconName } from '@/components/ui/icon';
import type { TKey } from '@/lib/i18n/translate';

/** Pages of the corporate section, in navigation order. */
export const CORPORATE_SECTION_IDS = ['about', 'network', 'business', 'sustainability', 'careers', 'media', 'governance', 'contact'] as const;
export type CorporateSectionId = (typeof CORPORATE_SECTION_IDS)[number];
export type CorporateNavId = 'overview' | CorporateSectionId;

export interface CorporateSectionMeta {
  id: CorporateSectionId;
  /** Path without the locale. */
  href: string;
  label: TKey;
  /** One line for the corporate home index. */
  description: TKey;
  icon: IconName;
}

export const CORPORATE_SECTIONS: readonly CorporateSectionMeta[] = [
  { id: 'about', href: '/corporate/about', label: 'corporatePages.nav.about', description: 'corporatePages.home.sections.about', icon: 'landmark' },
  { id: 'network', href: '/corporate/network', label: 'corporatePages.nav.network', description: 'corporatePages.home.sections.network', icon: 'plane' },
  { id: 'business', href: '/corporate/business', label: 'corporatePages.nav.business', description: 'corporatePages.home.sections.business', icon: 'building-2' },
  { id: 'sustainability', href: '/corporate/sustainability', label: 'corporatePages.nav.sustainability', description: 'corporatePages.home.sections.sustainability', icon: 'leaf' },
  { id: 'careers', href: '/corporate/careers', label: 'corporatePages.nav.careers', description: 'corporatePages.home.sections.careers', icon: 'users' },
  { id: 'media', href: '/corporate/news', label: 'corporatePages.nav.media', description: 'corporatePages.home.sections.media', icon: 'newspaper' },
  { id: 'governance', href: '/corporate/governance', label: 'corporatePages.nav.governance', description: 'corporatePages.home.sections.governance', icon: 'shield-check' },
  { id: 'contact', href: '/corporate/contact', label: 'corporatePages.nav.contact', description: 'corporatePages.home.sections.contact', icon: 'phone' },
];

export function corporateSection(id: CorporateSectionId): CorporateSectionMeta {
  return CORPORATE_SECTIONS.find((section) => section.id === id) ?? CORPORATE_SECTIONS[0];
}
