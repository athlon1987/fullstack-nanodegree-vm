/**
 * The shared accessibility scan for every e2e spec (security-08 / docs-12 / ux-frequent-06).
 *
 *   import { AXE_TAGS, expectNoAxeViolations } from './support/axe';
 *   await expectNoAxeViolations(page);
 *
 * The tag set is the product's conformance target, WCAG 2.2 AA, which axe expresses as the A and
 * AA rules of each WCAG version: 2.0, 2.1 and 2.2. Every spec uses this list so no scan can drift
 * to a smaller one.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page'];

/** Run axe with the shared tags on the current page (optionally inside `include`) and expect no violations. */
export async function expectNoAxeViolations(page: Page, options: { include?: string; exclude?: string[] } = {}): Promise<void> {
  let builder = new AxeBuilder({ page: page as unknown as AxePage }).withTags([...AXE_TAGS]);
  if (options.include) builder = builder.include(options.include);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  const results = await builder.analyze();
  const summary = results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
  expect(summary).toEqual([]);
}
