import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import type { Translator } from '@/lib/i18n';

/** The standing reminder that this corporate section is a concept, with the official site beside it. */
export function PrototypeNote({ t, officialUrl }: { t: Translator; officialUrl: string }) {
  return (
    <aside aria-labelledby="corporate-prototype-note" className="flex flex-col gap-4 rounded-2xl bg-page-subtle p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-7">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink-2 shadow-xs">
        <Icon name="flask-conical" size="md" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <h2 id="corporate-prototype-note" className="type-title-sm text-ink">
          {t('corporatePages.common.prototypeTitle')}
        </h2>
        <p className="type-body-sm mt-1 max-w-reading text-ink-2">{t('corporatePages.common.prototypeBody')}</p>
        <div className="mt-2 flex flex-wrap gap-x-6">
          <ExternalLink variant="action" href={officialUrl} className="type-body-sm text-ink">
            {t('corporatePages.common.officialSite')}
          </ExternalLink>
          <LocaleLink href="/about-this-prototype" className="link-action type-body-sm text-ink">
            {t('corporatePages.common.prototypeAction')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        </div>
      </div>
    </aside>
  );
}
