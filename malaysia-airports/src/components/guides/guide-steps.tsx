import type { Translator } from '@/lib/i18n/translate';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { GuideActionLink } from './guide-action-link';
import type { GuideStepView } from './guide-views.server';
import { ScopeChips } from './scope-chips';

export interface GuideStepsProps {
  steps: readonly GuideStepView[];
  /** Accessible name of the ordered list. */
  label: string;
  t: Translator;
}

/**
 * Guide steps as a numbered thread: title, provenance tag, plain-language body, "applies to"
 * chips, then actions and the step's own sources. Server-rendered, so it works without JavaScript.
 */
export function GuideSteps({ steps, label, t }: GuideStepsProps) {
  return (
    <Timeline aria-label={label}>
      {steps.map((step) => (
        <TimelineItem
          key={step.id}
          id={`step-${step.id}`}
          className="scroll-mt-32"
          title={step.title}
          meta={<ProvenanceTag provenance={step.provenance} length="short" />}
          actions={
            step.actions.length > 0 || step.sources.length > 0 ? (
              <>
                {step.actions.map((action) => (
                  <GuideActionLink key={action.href} action={action} />
                ))}
                <SourceNote sources={step.sources} />
              </>
            ) : undefined
          }
        >
          <p>{step.body}</p>
          <ScopeChips scopes={step.scopes} t={t} showLabel className="mt-2.5" />
        </TimelineItem>
      ))}
    </Timeline>
  );
}
