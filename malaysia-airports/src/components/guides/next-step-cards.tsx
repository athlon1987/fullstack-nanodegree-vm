import type { Translator } from '@/lib/i18n/translate';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon, type IconKey } from '@/components/ui/icon';

const CARDS: readonly { id: string; icon: IconKey; href: string; title: 'guidePages.hub.connections.title' | 'guidePages.hub.journey.title' | 'guidePages.hub.help.title'; body: 'guidePages.hub.connections.body' | 'guidePages.hub.journey.body' | 'guidePages.hub.help.body'; action: 'guidePages.hub.connections.action' | 'guidePages.hub.journey.action' | 'guidePages.hub.help.action' }[] = [
  { id: 'connections', icon: 'transiting', href: '/kul/transit', title: 'guidePages.hub.connections.title', body: 'guidePages.hub.connections.body', action: 'guidePages.hub.connections.action' },
  { id: 'journey', icon: 'journey', href: '/journey', title: 'guidePages.hub.journey.title', body: 'guidePages.hub.journey.body', action: 'guidePages.hub.journey.action' },
  { id: 'help', icon: 'circle-help', href: '/help', title: 'guidePages.hub.help.title', body: 'guidePages.hub.help.body', action: 'guidePages.hub.help.action' },
];

/** Three ways onward from the guides: the KLIA transit planner, My journey and the help centre. */
export function NextStepCards({ t }: { t: Translator }) {
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {CARDS.map((card) => (
        <li key={card.id} className="flex min-w-0 gap-4">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink">
            <Icon name={card.icon} />
          </span>
          <div className="min-w-0">
            <h2 className="type-title-md text-ink">{t(card.title)}</h2>
            <p className="type-body-sm mt-1 text-ink-2">{t(card.body)}</p>
            <LocaleLink href={card.href} className="link-action type-body-sm mt-1 text-ink">
              {t(card.action)}
              <Icon name="arrow-right" size="sm" />
            </LocaleLink>
          </div>
        </li>
      ))}
    </ul>
  );
}
