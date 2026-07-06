import { Markdown } from './Markdown';

/**
 * The ai_judgment_note, rendered as a distinct, CONSISTENT element on every
 * lesson. The durable skill this curriculum teaches is knowing when NOT to
 * reach for AI, so it must be visible on every node — never buried in the flow.
 */
export function AiJudgmentCard({ note }: { note: string }) {
  return (
    <aside className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🧭
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">
          AI Judgment — when to use it, and when not to
        </h3>
      </div>
      <div className="text-amber-950">
        <Markdown>{note}</Markdown>
      </div>
    </aside>
  );
}
