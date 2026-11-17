import { GROUP_CONTACTS, getSource, pick, type Lang } from '@/content';
import { getT } from '@/lib/i18n';
import { Wordmark } from '@/components/art/wordmark';
import { RebungRule } from '@/components/art/patterns';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { LanguageSwitch } from './language-switch';

const LINK = 'inline-flex min-h-8 items-center rounded-sm text-ink-2 underline decoration-transparent underline-offset-4 transition-colors duration-fast hover:text-ink hover:decoration-gold touch:min-h-11';

function Column({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="min-w-0">
      <h2 className="type-eyebrow mb-3 text-ink-3">{title}</h2>
      <ul className="type-body-sm flex flex-col gap-0.5">
        {links.map((link) => (
          <li key={link.href}>
            <LocaleLink href={link.href} className={LINK}>
              {link.label}
            </LocaleLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The site footer: what this prototype is, passenger, company and transparency links, the
 * official contacts that exist in the content layer (nothing else), and the language switch as
 * plain links. Its top edge is the gold pucuk rebung rule.
 */
export function SiteFooter({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const official = getSource('mahb-airports-site');
  const contacts = GROUP_CONTACTS.filter((contact) => contact.href);

  return (
    <footer data-print="hidden" className="mt-auto border-t border-line bg-page-subtle pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <RebungRule size="lg" className="-mt-px opacity-80" />
      <Container className="py-10 sm:py-14">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)]">
          <div className="min-w-0">
            <LocaleLink href="/" aria-label={t('shell.homeLabel', { name: t('common.appName') })} className="inline-flex rounded-sm">
              <Wordmark name={t('common.appName')} />
            </LocaleLink>
            <p className="type-body-sm mt-3 text-ink-2">{t('common.tagline')}</p>
            <div className="mt-6 rounded-lg border border-line-strong bg-surface p-4 sm:p-5">
              <h2 className="type-title-sm flex items-center gap-2 text-ink">
                <Icon name="flask-conical" size="sm" className="text-gold-ink" />
                {t('shell.footer.statementTitle')}
              </h2>
              <p className="type-body-sm mt-2 text-ink-2">{t('shell.footer.statementBody')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                <LocaleLink href="/about-this-prototype" className="link-action type-body-sm text-ink">
                  {t('footer.about')}
                  <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                </LocaleLink>
                {official ? (
                  <ExternalLink href={official.url} variant="action" className="type-body-sm text-ink">
                    {t('footer.officialSite')}
                  </ExternalLink>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-4">
            <Column
              title={t('footer.passengers')}
              links={[
                { href: '/airports', label: t('nav.airports') },
                { href: '/guides', label: t('nav.plan') },
                { href: '/journey', label: t('nav.myJourney') },
                { href: '/notices', label: t('nav.notices') },
                { href: '/accessibility', label: t('nav.accessibility') },
                { href: '/help', label: t('shell.footer.helpCentre') },
              ]}
            />
            <Column
              title={t('footer.company')}
              links={[
                { href: '/corporate', label: t('nav.corporate') },
                { href: '/corporate/network', label: t('home.network.eyebrow') },
              ]}
            />
            <Column
              title={t('shell.footer.transparency')}
              links={[
                { href: '/about-this-prototype', label: t('footer.about') },
                { href: '/privacy', label: t('footer.privacy') },
                { href: '/terms', label: t('footer.terms') },
                { href: '/accessibility', label: t('footer.accessibility') },
                { href: '/design-system', label: t('footer.designSystem') },
              ]}
            />
            <div className="min-w-0">
              <h2 className="type-eyebrow mb-3 text-ink-3">{t('shell.footer.contactsTitle')}</h2>
              <ul className="type-body-sm flex flex-col gap-2.5">
                {contacts.map((contact) => (
                  <li key={contact.value} className="min-w-0">
                    <span className="type-caption block text-ink-2">{pick(contact.label, lang)}</span>
                    <a href={contact.href} className="link inline-flex min-h-8 items-center break-all text-ink touch:min-h-11">
                      {contact.value}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="type-caption mt-3 text-ink-2">{t('shell.footer.contactsNote')}</p>
            </div>
          </div>
        </div>

        <div className="type-caption mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-line pt-5 text-ink-2">
          <p className="min-w-0 flex-1 basis-80">
            {t('footer.disclaimer')} {t('footer.rights')}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <LanguageSwitch variant="plain" />
            <a href="#main" className={LINK}>
              <Icon name="arrow-up" size="sm" className="mr-1" />
              {t('shell.footer.backToTop')}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
