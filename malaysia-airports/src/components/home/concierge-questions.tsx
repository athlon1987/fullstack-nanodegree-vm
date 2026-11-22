'use client';

import { useT } from '@/lib/i18n/client';
import { overlays } from '@/components/shell/overlay-store';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/** Example questions that open the concierge panel with the question filled in. */
export function ConciergeQuestions({ questions }: { questions: readonly string[] }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="type-eyebrow mb-2.5 text-ink-2">{t('concierge.suggestionsTitle')}</h3>
        <ul className="flex flex-col gap-2">
          {questions.map((question) => (
            <li key={question}>
              <button
                type="button"
                onClick={() => overlays.openConcierge(question)}
                className="group flex min-h-13 w-full items-center gap-3 rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-left text-ink transition-colors duration-fast hover:border-ink-3 hover:bg-surface-raised"
              >
                <Icon name="messages-square" size="sm" className="text-gold-ink" />
                <span className="type-body min-w-0 flex-1 font-medium">{question}</span>
                <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="text-ink-3 transition-transform duration-base motion-ok:group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="secondary" iconStart="sparkles" onClick={() => overlays.openConcierge()}>
          {t('concierge.open')}
        </Button>
        <p className="type-caption min-w-0 flex-1 basis-48 text-ink-2">{t('concierge.limits')}</p>
      </div>
    </div>
  );
}
