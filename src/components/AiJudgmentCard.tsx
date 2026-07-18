import { Markdown } from './Markdown';
import { JudgmentIcon } from './icons';

/**
 * The ai_judgment_note, rendered as a distinct, CONSISTENT element on every
 * lesson. The durable skill this curriculum teaches is knowing when NOT to
 * reach for AI, so it must be visible on every node — never buried in the flow.
 */
export function AiJudgmentCard({ note }: { note: string }) {
  return (
    <aside
      className="border p-5"
      style={{ borderColor: 'var(--ink)', background: 'var(--paper-raised)' }}
    >
      <div className="mb-2.5 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
        <JudgmentIcon size={15} />
        <h3 className="microlabel">AI Judgment — when to use it, and when not to</h3>
      </div>
      <div style={{ color: 'var(--ink)' }}>
        <Markdown>{note}</Markdown>
      </div>
    </aside>
  );
}
