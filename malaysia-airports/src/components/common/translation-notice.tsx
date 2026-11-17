'use client';

import { useT } from '@/lib/i18n/client';
import { Callout } from '@/components/ui/callout';

/**
 * Shown on a Malay page that falls back to English content
 * (`hasTranslation(text, lang) === false`). The English content itself should be wrapped in
 * `lang="en"`.
 *
 * @example {!hasTranslation(guide.title, lang) ? <TranslationNotice /> : null}
 */
export function TranslationNotice({ className }: { className?: string }) {
  const t = useT();
  return (
    <Callout tone="info" icon="languages" title={t('translation.noticeTitle')} className={className}>
      {t('translation.noticeBody')}
    </Callout>
  );
}
