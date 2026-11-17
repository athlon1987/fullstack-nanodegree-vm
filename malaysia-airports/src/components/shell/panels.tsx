'use client';

import type { ReactNode } from 'react';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { Sheet, SheetContent } from '@/components/ui/dialog';
import { Icon, type IconName } from '@/components/ui/icon';
import { AirportSwitcherButton } from './airport-switcher';
import { LanguageSwitch } from './language-switch';
import { closeOverlay, overlays, useOverlayDialog } from './overlay-store';
import { PreferencesControls } from './preferences-controls';
import { PrimaryNav } from './primary-nav';

/** Display and accessibility settings: theme, text size, contrast and motion. */
export function PreferencesPanel() {
  const t = useT();
  const dialog = useOverlayDialog('preferences');
  return (
    <Sheet open={dialog.open} onOpenChange={dialog.onOpenChange}>
      <SheetContent title={t('preferences.title')} onCloseAutoFocus={dialog.onCloseAutoFocus}>
        <PreferencesControls />
      </SheetContent>
    </Sheet>
  );
}

function MenuHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="type-eyebrow mb-1.5 flex items-center gap-2.5 text-ink-2">
      <span aria-hidden="true" className="h-px w-5 bg-gold" />
      {children}
    </h3>
  );
}

const ROW = 'flex min-h-12 w-full items-center gap-3.5 rounded-md px-2 text-left text-base font-medium text-ink transition-colors duration-fast hover:bg-page-subtle';

function MenuLink({ href, icon, children }: { href: string; icon: IconName; children: ReactNode }) {
  return (
    <li>
      <LocaleLink href={href} onClick={() => closeOverlay()} className={ROW}>
        <Icon name={icon} className="text-ink-2" />
        <span className="min-w-0 flex-1">{children}</span>
      </LocaleLink>
    </li>
  );
}

/**
 * The menu: the airport, primary navigation, more destinations, language, and the display
 * settings (theme, text size, contrast, motion). Full screen on phones, a side panel on tablets
 * and narrow desktops where the navigation row does not fit.
 */
export function MenuPanel() {
  const t = useT();
  const dialog = useOverlayDialog('menu');
  return (
    <Sheet open={dialog.open} onOpenChange={dialog.onOpenChange}>
      <SheetContent
        title={t('shell.menu.title')}
        onCloseAutoFocus={dialog.onCloseAutoFocus}
        className="max-sm:top-0 max-sm:max-h-none max-sm:rounded-none max-sm:border-0"
      >
        <div className="flex flex-col gap-7">
          <AirportSwitcherButton variant="row" />

          <section>
            <MenuHeading>{t('shell.menu.explore')}</MenuHeading>
            <PrimaryNav variant="list" className="-mx-2" />
          </section>

          <section>
            <MenuHeading>{t('shell.menu.more')}</MenuHeading>
            <ul className="-mx-2 flex flex-col">
              <MenuLink href="/journey" icon="bookmark">
                {t('nav.myJourney')}
              </MenuLink>
              <MenuLink href="/notices" icon="megaphone">
                {t('nav.notices')}
              </MenuLink>
              <MenuLink href="/airports" icon="tower-control">
                {t('nav.airports')}
              </MenuLink>
              <MenuLink href="/accessibility" icon="accessibility">
                {t('nav.accessibility')}
              </MenuLink>
              <li>
                <button type="button" onClick={() => overlays.openConcierge()} className={ROW}>
                  <Icon name="sparkles" className="text-ink-2" />
                  <span className="min-w-0 flex-1">{t('concierge.open')}</span>
                </button>
              </li>
              <MenuLink href="/corporate" icon="landmark">
                {t('shell.corporateSite')}
              </MenuLink>
              <MenuLink href="/about-this-prototype" icon="flask-conical">
                {t('footer.about')}
              </MenuLink>
            </ul>
          </section>

          <section>
            <MenuHeading>{t('nav.languageLabel')}</MenuHeading>
            <LanguageSwitch variant="block" />
          </section>

          <section>
            <MenuHeading>{t('preferences.title')}</MenuHeading>
            <PreferencesControls compact className="mt-3" />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
