import { Fragment, type ReactNode } from 'react';

/** A number range ("2-7", "4–12", "07:05–08:00") or a hyphenated model number ("737-800"). */
const RANGE = /(\d+(?::\d+)?\s?[-–]\s?\d+(?::\d+)?)/;

/**
 * Text with every number range kept on one line (round 6, review-3 9.1 item 8: "kaunter 2- / 7"
 * broke inside the range on the flight summary at 125% text). The range keeps its own characters,
 * so screen readers read it as before.
 */
export function keepRanges(text: string): ReactNode {
  const parts = text.split(RANGE);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
