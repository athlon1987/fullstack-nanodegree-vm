import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import type { Translator } from '@/lib/i18n';
import { CORPORATE_SECTIONS } from './corporate-sections';

/** The corporate home's table of contents: numbered, one line each, the whole row is the link. */
export function SectionIndex({ t }: { t: Translator }) {
  return (
    <ol className="grid border-t border-line lg:grid-cols-2 lg:gap-x-12">
      {CORPORATE_SECTIONS.map((section, index) => (
        <li key={section.id} className="group relative rounded-sm border-b border-line has-[a:focus-visible]:focus-ring">
          <div className="flex items-start gap-4 py-5 sm:gap-6">
            <span aria-hidden="true" className="type-data-sm tabular pt-1.5 text-ink-3">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span aria-hidden="true" className="hidden size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-ink sm:flex">
              <Icon name={section.icon} size="md" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="type-title-lg text-ink">
                <LocaleLink href={section.href} className="outline-none after:absolute after:inset-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                  {t(section.label)}
                </LocaleLink>
              </h3>
              <p className="type-body-sm mt-1 text-ink-2">{t(section.description)}</p>
            </div>
            <Icon name="arrow-right" size="md" strokeWidth={1.5} className="mt-1.5 shrink-0 text-ink-3 transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-ink" />
          </div>
        </li>
      ))}
    </ol>
  );
}
