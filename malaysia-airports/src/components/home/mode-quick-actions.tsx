'use client';

import { getAirport } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { useAirportContext, useJourneyMode } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { QuickAction } from '@/components/common/quick-action';
import { hasSection, sectionHref } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { JOURNEY_ACTIONS, actionHintKey, actionTitleKey } from './journey-actions';

export interface ModeQuickActionsProps {
  /**
   * Fix the actions to this airport (airport pages): only actions whose section exists there are
   * shown. Omit it on network pages: links follow the remembered airport, or lead to the airport
   * chooser when none is set.
   */
  airport?: string;
  terminal?: TerminalId;
  className?: string;
}

/**
 * Six quick actions, ordered and worded for the current journey mode. The first one is marked
 * "Start here".
 */
export function ModeQuickActions({ airport, terminal, className }: ModeQuickActionsProps) {
  const t = useT();
  const { effectiveMode } = useJourneyMode();
  const context = useAirportContext();
  const availability = useSectionAvailability();
  const fixed = airport ? getAirport(airport) : undefined;
  const selection = fixed ? { airport: fixed.slug, terminal } : context.selection;
  const actions = JOURNEY_ACTIONS[effectiveMode].filter((action) => !fixed || hasSection(availability, fixed.slug, action.section));
  if (actions.length === 0) return null;

  return (
    <ul
      aria-label={t('home.actions.label')}
      data-journey-mode={effectiveMode}
      className={cn('grid grid-cols-3 gap-2 sm:gap-2.5', actions.length >= 6 ? 'lg:grid-cols-6' : actions.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3', className)}
    >
      {actions.map((action, index) => (
        <li key={action.copy} className="flex min-w-0">
          <QuickAction
            icon={action.icon}
            title={t(actionTitleKey(action.copy))}
            hint={t(actionHintKey(action.copy))}
            href={sectionHref(action.section, selection, availability)}
            emphasis={index === 0}
            emphasisLabel={t('home.actions.startHere')}
            /* Compact tiles for the first screen: on phones the hint is hidden and the type is smaller. */
            className="w-full gap-2 p-3 sm:p-4 max-sm:[&_.type-body-sm]:hidden max-sm:[&_.type-title-sm]:text-sm max-sm:[&_.type-title-sm]:leading-snug sm:[&_.type-title-sm]:text-base max-sm:[&_.type-data-xs]:hidden"
          />
        </li>
      ))}
    </ul>
  );
}
