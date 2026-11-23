import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import type { Translator } from '@/lib/i18n';
import { CORPORATE_SECTIONS } from './corporate-sections';

/** The corporate home's table of contents: numbered, one line each, the whole row is the link. */
export function SectionIndex({ t }: { t: Translator }) {
  return (
    // Redesign stage two: cards with the section's emblem, the whole card one link; no number prefixes.
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {CORPORATE_SECTIONS.map((section) => (
        <li
          key={section.id}
          className="group relative flex min-w-0 flex-col rounded-2xl border border-line bg-surface shadow-sm transition-[box-shadow,translate,border-color] duration-base ease-out hover:border-line-strong hover:shadow-lg motion-ok:hover:-translate-y-0.5 has-[a:focus-visible]:focus-ring"
        >
          <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
              <Icon name={section.icon} size="lg" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              {/* Round 6 (A-14, third review 9.1 item 7): title-md, so the hub keeps to 8 type sizes. */}
              <h3 className="type-title-md text-ink">
                <LocaleLink href={section.href} className="outline-none after:absolute after:inset-0 after:rounded-2xl group-hover:underline group-hover:decoration-gold group-hover:decoration-1 group-hover:underline-offset-4">
                  {t(section.label)}
                </LocaleLink>
              </h3>
              <p className="type-body-sm mt-1 text-ink-2">{t(section.description)}</p>
            </div>
            <Icon name="arrow-right" size="md" strokeWidth={1.5} className="shrink-0 text-ink-3 transition-transform duration-fast group-hover:text-ink motion-ok:group-hover:translate-x-0.5" />
          </div>
        </li>
      ))}
    </ol>
  );
}
