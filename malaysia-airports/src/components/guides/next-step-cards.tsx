import type { Translator } from '@/lib/i18n/translate';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon, type IconKey } from '@/components/ui/icon';

const CARDS: readonly { id: string; icon: IconKey; href: string; title: 'guidePages.hub.connections.title' | 'guidePages.hub.journey.title' | 'guidePages.hub.help.title'; body: 'guidePages.hub.connections.body' | 'guidePages.hub.journey.body' | 'guidePages.hub.help.body'; action: 'guidePages.hub.connections.action' | 'guidePages.hub.journey.action' | 'guidePages.hub.help.action' }[] = [
  { id: 'connections', icon: 'transiting', href: '/kul/transit', title: 'guidePages.hub.connections.title', body: 'guidePages.hub.connections.body', action: 'guidePages.hub.connections.action' },
  { id: 'journey', icon: 'journey', href: '/journey', title: 'guidePages.hub.journey.title', body: 'guidePages.hub.journey.body', action: 'guidePages.hub.journey.action' },
  { id: 'help', icon: 'circle-help', href: '/help', title: 'guidePages.hub.help.title', body: 'guidePages.hub.help.body', action: 'guidePages.hub.help.action' },
];

/**
 * Three ways onward from the guides: the KLIA transit planner, My journey and the help centre.
 * Redesign stage two: cards on the midnight band that closes the hub, the whole card one link.
 */
export function NextStepCards({ t }: { t: Translator }) {
  return (
    <ul className="grid gap-4 md:grid-cols-3 lg:gap-6">
      {CARDS.map((card) => (
        <li
          key={card.id}
          className="group relative flex min-w-0 flex-col gap-4 rounded-2xl bg-on-midnight/6 p-6 ring-1 ring-on-midnight/12 transition-[background-color,translate] duration-base ease-out hover:bg-on-midnight/10 motion-ok:hover:-translate-y-0.5 has-[a:focus-visible]:focus-ring sm:p-7"
        >
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-on-midnight/8 text-gold-bright ring-1 ring-gold/40">
            <Icon name={card.icon} size="md" />
          </span>
          <div className="min-w-0">
            <h2 className="type-title-lg text-ink">{t(card.title)}</h2>
            <p className="type-body-sm mt-1.5 text-ink-2">{t(card.body)}</p>
          </div>
          <LocaleLink href={card.href} className="link-action type-body-sm mt-auto text-ink outline-none after:absolute after:inset-0 after:rounded-2xl">
            {t(card.action)}
            <Icon name="arrow-right" size="sm" />
          </LocaleLink>
        </li>
      ))}
    </ul>
  );
}
