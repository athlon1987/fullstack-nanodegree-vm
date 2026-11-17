'use client';

import { useEffect } from 'react';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';

/**
 * The error boundary for every page under `[lang]`. The shell (header, footer, navigation) stays
 * in place, so the rest of the site still works.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center py-16 sm:py-24">
      <Icon name="triangle-alert" size="xl" className="text-warning-fg" />
      <h1 className="type-display-lg mt-4 text-ink">{t('errors.genericTitle')}</h1>
      <p role="alert" className="type-body-lg mt-4 max-w-reading text-ink-2">
        {t('errors.genericBody')}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button iconStart="refresh-cw" onClick={() => retry()}>
          {t('common.actions.retry')}
        </Button>
        <Button asChild variant="secondary">
          <LocaleLink href="/">{t('errors.backHome')}</LocaleLink>
        </Button>
      </div>
    </Container>
  );
}
