import { facilityCategoryLabel } from '@/content/values';
import type { FacilityCategory, Lang } from '@/content/types';
import { cn } from '@/lib/cn';
import type { Translator } from '@/lib/i18n/translate';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { SERVICE_ICON_SM, SERVICE_TOOL } from './service-frame';
import { isAccessibilityFacility, missingExpectedCategories, type FacilityView } from './facility-view';

interface QuickRow {
  key: string;
  icon: string;
  label: string;
  detail: string;
  href: string;
}

/** The places most travellers look for first, in this order (prayer rooms and accessibility lead). */
const QUICK: readonly (FacilityCategory | 'accessibility')[] = ['prayer-room', 'accessibility', 'toilet', 'nursing-room', 'information'];

/**
 * Redesign stage two: the facilities page's answer, beside the title (under it on phones). Each row
 * opens the directory filtered to that need, through the filters the directory already reads from
 * the URL (`?cat=prayer-room`, `?access=1`). A category with nothing published says so in words and
 * opens the directory's "not published" card for it, which points to an information counter.
 */
export function FacilityQuickFinds({ items, airport, lang, t }: { items: readonly FacilityView[]; airport: string; lang: Lang; t: Translator }) {
  const missing = new Set(missingExpectedCategories(items));
  const rows = QUICK.flatMap((key): QuickRow[] => {
    if (key === 'accessibility') {
      const count = items.filter(isAccessibilityFacility).length;
      return count > 0 ? [{ key, icon: 'accessibility', label: t('mapPages.frame.accessibility'), detail: t.count('mapPages.frame.quickCount', count), href: `/${airport}/facilities?access=1` }] : [];
    }
    const count = items.filter((item) => item.category === key).length;
    if (count === 0 && !missing.has(key)) return [];
    return [
      {
        key,
        icon: key,
        label: facilityCategoryLabel(key, lang),
        detail: count > 0 ? t.count('mapPages.frame.quickCount', count) : t('mapPages.frame.quickMissing'),
        href: `/${airport}/facilities?cat=${key}`,
      },
    ];
  });
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="facility-quick-title" className={cn(SERVICE_TOOL, 'p-3 sm:p-4')}>
      <h2 id="facility-quick-title" className="type-title-md px-2 pt-1 pb-2 text-ink">
        {t('mapPages.frame.quickTitle')}
      </h2>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.key}>
            <LocaleLink
              href={`${row.href}#facility-results`}
              className="group flex min-h-14 items-center gap-3 rounded-2xl px-2 py-2 transition-colors duration-fast hover:bg-page-subtle"
            >
              <span className={SERVICE_ICON_SM}>
                <Icon name={row.icon} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="type-title-sm block text-ink">{row.label}</span>
                <span className="type-caption block text-ink-2">{row.detail}</span>
              </span>
              <Icon name="arrow-right" size="sm" className="shrink-0 text-ink-3 transition-transform duration-fast motion-ok:group-hover:translate-x-0.5" />
            </LocaleLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
