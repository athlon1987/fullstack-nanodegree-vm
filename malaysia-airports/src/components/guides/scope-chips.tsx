import type { GuideScope } from '@/content/guides';
import type { Translator } from '@/lib/i18n/translate';
import { cn } from '@/lib/cn';
import { Chip } from '@/components/ui/chip';
import { SCOPE_ICONS, SCOPE_LABEL_KEYS } from './guide-meta';

export interface ScopeChipsProps {
  scopes: readonly GuideScope[];
  t: Translator;
  /** Show the "Applies to" label before the chips (visually). It is always read by screen readers. */
  showLabel?: boolean;
  className?: string;
}

/** "Applies to" chips: domestic flights, international flights, Sabah and Sarawak rules. Text and icon, never colour alone. */
export function ScopeChips({ scopes, t, showLabel = false, className }: ScopeChipsProps) {
  if (scopes.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className={cn('type-caption text-ink-2', !showLabel && 'sr-only')}>{t('guidePages.scopes.label')}:</span>
      <ul className="contents">
        {scopes.map((scope) => (
          <li key={scope}>
            <Chip tone="outline" icon={SCOPE_ICONS[scope]}>
              {t(SCOPE_LABEL_KEYS[scope])}
            </Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}
