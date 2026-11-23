import { getImageProps } from 'next/image';
import { imageConfigDefault } from 'next/dist/shared/lib/image-config';
import { describe, expect, it } from 'vitest';
import { IMAGE_DEVICE_SIZES, IMAGE_PHONE_MAX_WIDTH, IMAGE_SIZES } from './image-config';
import { photoAttributes } from './photo';

/** `Photo` writes the URLs `next/image` would (redesign 3): the optimizer must keep accepting them. */
describe('photoAttributes', () => {
  it('uses the default widths of the installed Next.js', () => {
    expect(IMAGE_DEVICE_SIZES).toEqual(imageConfigDefault.deviceSizes);
    expect(IMAGE_SIZES).toEqual(imageConfigDefault.imageSizes);
  });

  // Outside a Next.js build `getImageProps` has the default configuration, whose only quality is
  // 75, so the comparison uses 75; the qualities themselves are checked below.
  const cases = ['100vw', '(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw', '(min-width: 80rem) 77.5rem, 100vw', '(min-width: 64rem) 10rem, (min-width: 40rem) 9rem, 5rem'];
  for (const sizes of cases) {
    it(`matches getImageProps for sizes "${sizes}"`, () => {
      const src = '/images/klia/terminal-1-aerial.jpg';
      const { props } = getImageProps({ src, alt: '', fill: true, sizes, quality: 75 });
      expect(photoAttributes(src, sizes, { quality: 75 })).toEqual({ src: props.src, srcSet: props.srcSet, sizes: props.sizes });
    });
  }

  it('asks for a configured quality', () => {
    expect(photoAttributes('/images/a.jpg', '100vw', { quality: 60 }).src).toContain('&q=60');
    expect(photoAttributes('/images/a.jpg', '100vw', { quality: 62 }).src).toContain('&q=60');
    expect(photoAttributes('/images/a.jpg', '100vw', { quality: 90 }).src).toContain('&q=75');
  });

  it('gives the phone renditions their own quality', () => {
    const { srcSet = '' } = photoAttributes('/images/a.jpg', '100vw', { quality: 65, phoneQuality: 55 });
    for (const candidate of srcSet.split(', ')) {
      const [url, descriptor] = candidate.split(' ');
      const width = Number.parseInt(descriptor, 10);
      expect(url).toContain(`&q=${width <= IMAGE_PHONE_MAX_WIDTH ? 55 : 65}`);
    }
  });

  it('leaves SVG and remote files unoptimised', () => {
    expect(photoAttributes('/art/map.svg', '100vw', { quality: 60 })).toEqual({ src: '/art/map.svg' });
    expect(photoAttributes('https://example.com/a.jpg', '100vw', { quality: 60 })).toEqual({ src: 'https://example.com/a.jpg' });
  });
});
