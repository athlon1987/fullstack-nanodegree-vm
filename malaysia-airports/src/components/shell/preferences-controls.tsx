'use client';

import { TEXT_SIZES, THEMES, type TextSize, type ThemeChoice } from '@/lib/preferences';
import { usePreferences } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';

const THEME_ICONS: Record<ThemeChoice, string> = { system: 'monitor', light: 'sun', dark: 'moon' };

/**
 * Theme, text size, contrast and motion. Used by the display settings panel and by the phone
 * menu. Values are stored on the device and applied to `<html>` at once.
 */
export function PreferencesControls({ compact = false, className }: { compact?: boolean; className?: string }) {
  const t = useT();
  const { preferences, set, reset } = usePreferences();
  const themeLabels: Record<ThemeChoice, string> = {
    system: t('preferences.themeSystem'),
    light: t('preferences.themeLight'),
    dark: t('preferences.themeDark'),
  };
  const sizeLabels: Record<TextSize, string> = {
    100: t('preferences.textSizeDefault'),
    112: t('preferences.textSizeLarge'),
    125: t('preferences.textSizeLargest'),
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <SegmentedControl<ThemeChoice>
        label={t('preferences.theme')}
        showLabel
        block
        value={preferences.theme}
        onValueChange={(theme) => set({ theme })}
        options={THEMES.map((theme) => ({ value: theme, label: themeLabels[theme], icon: THEME_ICONS[theme] }))}
      />
      <SegmentedControl<`${TextSize}`>
        label={t('preferences.textSize')}
        showLabel
        block
        value={`${preferences.textSize}`}
        onValueChange={(size) => set({ textSize: Number(size) as TextSize })}
        options={TEXT_SIZES.map((size) => ({ value: `${size}` as `${TextSize}`, label: sizeLabels[size], hint: `${size}%` }))}
      />
      <div className="flex flex-col gap-4">
        <Switch
          label={t('preferences.highContrast')}
          hint={t('preferences.highContrastHint')}
          checked={preferences.highContrast}
          onCheckedChange={(highContrast) => set({ highContrast })}
        />
        <Switch
          label={t('preferences.reducedMotion')}
          hint={t('preferences.reducedMotionHint')}
          checked={preferences.reducedMotion}
          onCheckedChange={(reducedMotion) => set({ reducedMotion })}
        />
      </div>
      <div className={cn('flex flex-wrap items-center justify-between gap-3', !compact && 'border-t border-line pt-5')}>
        <p className="type-caption text-ink-2">{t('preferences.savedLocally')}</p>
        <Button variant="secondary" size="sm" onClick={() => reset()}>
          {t('preferences.reset')}
        </Button>
      </div>
    </div>
  );
}
