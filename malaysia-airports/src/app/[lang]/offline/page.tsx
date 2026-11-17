import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getT, toLang } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo/metadata';
import { OfflinePageContent } from '@/components/platform/offline-page';

export async function generateMetadata(): Promise<Metadata> {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  return pageMetadata({ lang, path: '/offline', title: t('platformPages.title'), description: t('platformPages.metaDescription'), noindex: true });
}

/** Offline access (see `OfflinePageContent`). Fully static; the device fills in its own state. */
export default async function OfflinePage() {
  return <OfflinePageContent lang={toLang(await routeLang())} />;
}
