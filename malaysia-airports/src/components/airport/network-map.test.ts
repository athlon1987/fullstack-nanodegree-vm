import { describe, expect, it } from 'vitest';
import { AIRPORTS } from '@/content/airports';
import { labelPlacement, labelWidth, markerCircle } from './network-map';

describe('network map labels (round 5)', () => {
  const labels = AIRPORTS.filter((airport) => airport.classification === 'international').map(labelPlacement);

  it('labels every international airport', () => {
    expect(labels.map((label) => label.text).sort()).toEqual(['BKI', 'KCH', 'KUL', 'LGK', 'PEN']);
  });

  it('keeps every label inside its panel, so none is clipped at any width or zoom (the drawing scales as a whole)', () => {
    for (const label of labels) {
      const width = labelWidth(label.text);
      const left = label.anchor === 'start' ? label.x : label.x - width;
      const right = label.anchor === 'start' ? label.x + width : label.x;
      expect(left, `${label.text} left edge`).toBeGreaterThanOrEqual(0);
      expect(right, `${label.text} right edge`).toBeLessThanOrEqual(label.panelWidth);
      expect(label.y - 11, `${label.text} top`).toBeGreaterThanOrEqual(0);
      expect(label.y + 3, `${label.text} bottom`).toBeLessThanOrEqual(label.panelHeight);
    }
  });

  it('keeps every label clear of the other markers in its panel', () => {
    for (const label of labels) {
      const width = labelWidth(label.text);
      const left = label.anchor === 'start' ? label.x : label.x - width;
      const right = left + width;
      // Capitals: from the baseline up to about 0.75 em.
      const top = label.y - 11 * 0.75;
      const own = AIRPORTS.find((airport) => airport.slug === label.slug)!;
      for (const airport of AIRPORTS.filter((other) => other.slug !== label.slug && (other.region === 'peninsular') === (own.region === 'peninsular'))) {
        const marker = markerCircle(airport);
        const nearestX = Math.min(Math.max(marker.x, left), right);
        const nearestY = Math.min(Math.max(marker.y, top), label.y);
        expect(Math.hypot(marker.x - nearestX, marker.y - nearestY), `${label.text} and ${airport.code}`).toBeGreaterThan(marker.r);
      }
    }
  });

  it('draws Langkawi to the right of its marker, away from the west edge', () => {
    const lgk = labels.find((label) => label.slug === 'lgk')!;
    expect(lgk.anchor).toBe('start');
  });
});
