import type { Translator } from '@/lib/i18n/translate';
import type { TKey } from '@/lib/i18n/translate';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { FactCard, type FactView } from '@/components/guides/fact-card';
import { Timeline, TimelineItem } from '@/components/ui/timeline';

export interface EscalationLadderProps {
  t: Translator;
  /** The sourced answers for steps two and three. */
  feedback?: FactView;
  complaint?: FactView;
  headingLevel?: 2 | 3;
}

/** Three steps for a problem that is not resolved, each sourced fact attached where it applies. */
export function EscalationLadder({ t, feedback, complaint }: EscalationLadderProps) {
  const steps: { id: string; title: TKey; body: TKey; fact?: FactView }[] = [
    { id: 'start', title: 'guidePages.help.escalation.step1', body: 'guidePages.help.escalation.step1Body' },
    { id: 'feedback', title: 'guidePages.help.escalation.step2', body: 'guidePages.help.escalation.step2Body', fact: feedback },
    { id: 'regulator', title: 'guidePages.help.escalation.step3', body: 'guidePages.help.escalation.step3Body', fact: complaint },
  ];
  return (
    <Timeline aria-label={t('guidePages.help.escalation.title')}>
      {steps.map((step, index) => (
        <TimelineItem
          key={step.id}
          eyebrow={String(index + 1).padStart(2, '0')}
          title={t(step.title)}
          meta={step.fact ? undefined : <ProvenanceTag provenance="suggestion" length="short" />}
        >
          <p>{t(step.body)}</p>
          {step.fact ? <FactCard fact={step.fact} headingLevel={4} className="mt-3" /> : null}
        </TimelineItem>
      ))}
    </Timeline>
  );
}
