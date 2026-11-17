import { Suspense } from 'react';
import type { Lang } from '@/content/types';
import { getT, type Translator } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { QuickAction } from '@/components/common/quick-action';
import { Container } from '@/components/ui/container';
import { Icon, type IconName } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { InstallCard } from './install-card';
import { ConnectionStatus, NotSavedNotice } from './offline-status';
import { SavedPages } from './saved-pages';

/**
 * Offline access: the connection and saving status, the pages saved on this device, what works
 * without a connection and what does not, what to open before losing signal, and how to install.
 * Static HTML; the status and the saved list are filled in on the device. The service worker
 * saves this page on install and sends offline visitors here when a page is not saved.
 */
export function OfflinePageContent({ lang }: { lang: Lang }) {
  const t = getT(lang);
  return (
    <>
      <PageHeader title={t('platformPages.title')} lead={t('platformPages.lead')} breadcrumbs={<Breadcrumbs items={[{ label: t('platformPages.title') }]} />} />

      <Container className="pb-section">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">
            <div className="flex flex-col gap-4">
              <Suspense fallback={null}>
                <NotSavedNotice />
              </Suspense>
              <ConnectionStatus />
            </div>
            <SavedPages />
          </div>
          <div className="grid content-start gap-4 md:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <Capabilities
              title={t('platformPages.works.heading')}
              icon="circle-check"
              items={[t('platformPages.works.journey'), t('platformPages.works.pages'), t('platformPages.works.settings')]}
            />
            <Capabilities
              title={t('platformPages.needs.heading')}
              icon="wifi"
              items={[t('platformPages.needs.flights'), t('platformPages.needs.search'), t('platformPages.needs.newPages')]}
            />
          </div>
        </div>
      </Container>

      <Section tone="subtle" spacing="md" aria-labelledby="prepare-title">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="flex flex-col gap-5 lg:col-span-3">
            <div className="max-w-reading">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="prepare-title" className="type-display-sm text-ink">
                  {t('platformPages.prepare.heading')}
                </h2>
                <ProvenanceTag provenance="suggestion" />
              </div>
              <p className="type-body mt-1.5 text-ink-2">{t('platformPages.prepare.lead')}</p>
            </div>
            <PrepareActions t={t} />
          </div>
          <div className="lg:col-span-2">
            <InstallCard />
          </div>
        </div>
      </Section>
    </>
  );
}

function Capabilities({ title, icon, items }: { title: string; icon: IconName; items: string[] }) {
  return (
    <section className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6">
      <h2 className="type-title-md flex items-center gap-2.5 text-ink">
        <Icon name={icon} className="text-primary-ink" />
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="type-body flex gap-3 text-ink-2">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-gold" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PrepareActions({ t }: { t: Translator }) {
  const actions = [
    { icon: 'bookmark', title: t('platformPages.prepare.journey'), hint: t('platformPages.prepare.journeyHint'), href: '/journey' },
    { icon: 'tower-control', title: t('platformPages.prepare.airports'), hint: t('platformPages.prepare.airportsHint'), href: '/airports' },
    { icon: 'route', title: t('platformPages.prepare.guides'), hint: t('platformPages.prepare.guidesHint'), href: '/guides' },
    { icon: 'circle-help', title: t('platformPages.prepare.help'), hint: t('platformPages.prepare.helpHint'), href: '/help' },
  ] as const;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => (
        <li key={action.href} className="flex">
          <QuickAction layout="row" icon={action.icon} title={action.title} hint={action.hint} href={action.href} className="w-full" />
        </li>
      ))}
    </ul>
  );
}
