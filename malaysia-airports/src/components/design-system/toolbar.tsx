'use client';

import { usePreferences } from '@/lib/hooks/use-preferences';
import { useT } from '@/lib/i18n/client';
import type { TextSize, ThemeChoice } from '@/lib/preferences';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';

/** Theme, text size, contrast and motion for previewing the system. Writes the visitor's real preferences. */
export function PreviewToolbar() {
  const t = useT();
  const { preferences, set, reset } = usePreferences();
  return (
    <section aria-label={t('designSystem.previewTitle')} className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <SegmentedControl<ThemeChoice>
          label={t('preferences.theme')}
          showLabel
          value={preferences.theme}
          onValueChange={(theme) => set({ theme })}
          options={[
            { value: 'system', label: t('preferences.themeSystem'), icon: 'monitor' },
            { value: 'light', label: t('preferences.themeLight'), icon: 'sun' },
            { value: 'dark', label: t('preferences.themeDark'), icon: 'moon' },
          ]}
        />
        <SegmentedControl<'100' | '112' | '125'>
          label={t('preferences.textSize')}
          showLabel
          value={String(preferences.textSize) as '100' | '112' | '125'}
          onValueChange={(size) => set({ textSize: Number(size) as TextSize })}
          options={[
            { value: '100', label: t('preferences.textSizeDefault') },
            { value: '112', label: t('preferences.textSizeLarge') },
            { value: '125', label: t('preferences.textSizeLargest') },
          ]}
        />
        <div className="grid min-w-0 flex-1 basis-full gap-x-8 gap-y-1 sm:grid-cols-2 xl:basis-96">
          <Switch label={t('preferences.highContrast')} checked={preferences.highContrast} onCheckedChange={(highContrast) => set({ highContrast })} />
          <Switch label={t('preferences.reducedMotion')} checked={preferences.reducedMotion} onCheckedChange={(reducedMotion) => set({ reducedMotion })} />
        </div>
        <Button variant="quiet" size="sm" iconStart="refresh-cw" onClick={reset} className="-ml-3 xl:ml-0">
          {t('common.actions.reset')}
        </Button>
      </div>
      <p className="type-caption mt-3 text-ink-3">{t('preferences.savedLocally')}</p>
    </section>
  );
}
