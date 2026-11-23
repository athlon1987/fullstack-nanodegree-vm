import { Fragment } from 'react';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The query's words (two characters or more), longest first so "klia2" wins over "klia". */
export function highlightWords(query: string): string[] {
  const words = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1);
  return [...new Set(words)].sort((a, b) => b.length - a.length);
}

/**
 * Marks where the query's words appear in a result's title or summary (redesign stage two). Only
 * literal matches are marked (a fuzzy or synonym match simply shows unmarked). The marks are
 * `<mark>` elements, so the accessible name of a link around them is the plain text, and forced
 * colours paint them with the system's Mark colours.
 */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = highlightWords(query);
  if (words.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'giu'));
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded-xs bg-gold-soft px-0.5 font-semibold text-ink forced-colors:bg-[Mark] forced-colors:text-[MarkText]">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
