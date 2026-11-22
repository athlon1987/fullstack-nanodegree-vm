'use client';

import type { ReactNode } from 'react';
import { GROUP_CONTACTS } from '@/content/airports';
import { pick } from '@/content/values';
import { useLang, useT } from '@/lib/i18n/client';
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
    <h3 className="type-eyebrow mb-2 flex items-center gap-2.5 text-gold-ink">
      <span aria-hidden="true" className="h-px w-5 bg-gold" />
      {children}
    </h3>
  );
}

const ROW = 'flex min-h-12 w-full items-center gap-3.5 rounded-2xl px-2 text-left text-base font-medium text-ink transition-colors duration-fast hover:bg-fill';

/** A round icon badge, as in the primary list above. */
function RowIcon({ icon }: { icon: IconName }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 ring-1 ring-line-strong">
      <Icon name={icon} size="sm" strokeWidth={1.75} />
    </span>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: IconName; children: ReactNode }) {
  return (
    <li>
      <LocaleLink href={href} onClick={() => closeOverlay()} className={ROW}>
        <RowIcon icon={icon} />
        <span className="min-w-0 flex-1">{children}</span>
      </LocaleLink>
    </li>
  );
}

/**
 * The menu: the airport, primary navigation, more destinations, language, and the display
 * settings (theme, text size, contrast, motion). Full screen on phones, a side panel on tablets
 * and narrow desktops where the navigation row does not fit. Direction v2: a midnight sheet (an
 * `on-media` scope, so every control inside takes the light ink) with large, app-like rows.
 */
/** The group phone line from the content layer (client-safe registry), one tap from the menu. */
const GROUP_PHONE = GROUP_CONTACTS.find((contact) => contact.kind === 'phone' && contact.href);

export function MenuPanel() {
  const t = useT();
  const lang = useLang();
  const dialog = useOverlayDialog('menu');
  return (
    <Sheet open={dialog.open} onOpenChange={dialog.onOpenChange}>
      <SheetContent
        title={t('shell.menu.title')}
        onCloseAutoFocus={dialog.onCloseAutoFocus}
        className="on-media border-[rgb(255_255_255/0.1)] bg-midnight max-sm:top-0 max-sm:max-h-none max-sm:rounded-none max-sm:border-0"
      >
        <div className="flex flex-col gap-8">
          <AirportSwitcherButton variant="row" />

          <section>
            <MenuHeading>{t('shell.menu.explore')}</MenuHeading>
            {/* Includes Assistance (A-15). */}
            <PrimaryNav variant="list" className="-mx-2" />
            {GROUP_PHONE?.href ? (
              // A verified number one tap from the menu (package D hand-off, D-15).
              <div className="-mx-2 mt-1">
                <a href={GROUP_PHONE.href} className={ROW}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fill text-ink ring-1 ring-line-strong">
                    <Icon name="phone" size="md" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{t('shellExtras.nav.callLabel')}</span>
                    <span className="type-caption block text-ink-2">
                      {GROUP_PHONE.value} · {pick(GROUP_PHONE.label, lang)}
                    </span>
                  </span>
                </a>
              </div>
            ) : null}
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
              <li>
                <button type="button" onClick={() => overlays.openConcierge()} className={ROW}>
                  <RowIcon icon="sparkles" />
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
