import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AIRPORTS } from './airports';
import {
  ALLOWED_LICENCES,
  ALL_IMAGES,
  AIRPORT_HERO_IMAGES,
  DESTINATION_IMAGES,
  DISCOVER_IMAGES,
  FALLBACK_HERO,
  HOME_HERO_IMAGES,
  IMAGES,
  IMAGE_GROUPS,
  heroForAirport,
  imageFor,
  imagesByGroup,
  objectPosition,
  type ImageId,
} from './images';

const PUBLIC = join(__dirname, '..', '..', 'public');

/** Width and height from a JPEG's start-of-frame marker (no image library needed). */
function jpegSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes[0] === 0xff && bytes[1] === 0xd8, `${path} is a JPEG`).toBe(true);
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`bad marker in ${path}`);
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    // SOF0 to SOF15, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error(`no frame header in ${path}`);
}

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]));
}

const EMPTY = ALL_IMAGES.length === 0;

describe('photo library', () => {
  // Skipped (and listed as skipped) only while the library is empty: see the STATUS note in
  // images.ts and docs/design/photography.md. Every other check holds either way.
  it.skipIf(EMPTY)('has a photo for every use the redesign needs', () => {
    expect(ALL_IMAGES.length).toBeGreaterThanOrEqual(24);
    expect(HOME_HERO_IMAGES.length).toBeGreaterThan(0);
    expect(DESTINATION_IMAGES.length).toBeGreaterThan(0);
    expect(DISCOVER_IMAGES.length).toBeGreaterThan(0);
    expect(FALLBACK_HERO).toBeDefined();
    for (const id of [...HOME_HERO_IMAGES, ...DESTINATION_IMAGES, ...DISCOVER_IMAGES]) expect(imageFor(id), id).toBeDefined();
  });

  it('every file exists with the width and height stated', () => {
    for (const image of ALL_IMAGES) {
      expect(image.src, image.id).toMatch(/^\/images\/[a-z0-9-]+\/[a-z0-9-]+\.jpg$/);
      const path = join(PUBLIC, image.src);
      expect(existsSync(path), image.src).toBe(true);
      expect(jpegSize(path), image.src).toEqual({ width: image.width, height: image.height });
      expect(Math.max(image.width, image.height), image.src).toBeLessThanOrEqual(2560);
    }
  });

  it('keeps public/images to the listed files and under 14 MB', () => {
    const files = filesUnder(join(PUBLIC, 'images')).filter((file) => !file.endsWith('.gitkeep'));
    const listed = new Set(ALL_IMAGES.map((image) => join(PUBLIC, image.src)));
    expect(files.filter((file) => !listed.has(file))).toEqual([]);
    const bytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
    expect(bytes).toBeLessThan(14 * 1024 * 1024);
  });

  it('uses only allowed licences, each with author, licence link and source link', () => {
    const allowed = new Set<string>(ALLOWED_LICENCES);
    for (const { id, credit } of ALL_IMAGES) {
      expect(allowed.has(credit.licence), `${id}: ${credit.licence}`).toBe(true);
      expect(credit.licence, id).not.toMatch(/NC|ND|GFDL/);
      expect(credit.author.trim().length, id).toBeGreaterThan(0);
      expect(credit.author, id).not.toMatch(/[<>]/);
      expect(credit.licenceUrl, id).toMatch(/^https:\/\/creativecommons\.org\/(licenses\/by(-sa)?\/[234]\.[05]\/|publicdomain\/(zero|mark)\/1\.0\/)/);
      if (credit.licence.startsWith('CC BY')) {
        const [, kind, version] = credit.licence.match(/^CC (BY(?:-SA)?) (\d\.\d)$/) ?? [];
        expect(credit.licenceUrl, id).toContain(`/licenses/${kind.toLowerCase()}/${version}/`);
      }
      expect(credit.sourceUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(['resized', 'cropped and resized'], id).toContain(credit.modified);
      if (credit.modified === 'cropped and resized') expect(credit.crop?.length, id).toBeGreaterThan(0);
    }
  });

  it('has alt text in English and Malay, a focal point and a blur placeholder', () => {
    for (const image of ALL_IMAGES) {
      for (const text of [image.alt.en, image.alt.ms]) {
        expect(text.trim().length, image.id).toBeGreaterThan(15);
        expect(text, image.id).not.toMatch(/^(image|photo|picture|gambar|foto) (of|bagi)/i);
      }
      expect(image.alt.ms, image.id).not.toBe(image.alt.en);
      expect(image.focal.x).toBeGreaterThanOrEqual(0);
      expect(image.focal.x).toBeLessThanOrEqual(1);
      expect(image.focal.y).toBeGreaterThanOrEqual(0);
      expect(image.focal.y).toBeLessThanOrEqual(1);
      expect(image.blurDataURL, image.id).toMatch(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/);
      expect(image.blurDataURL.length, image.id).toBeLessThan(2000);
      expect(IMAGE_GROUPS, image.id).toContain(image.group);
    }
  });

  it('never shows an airport with a photo of a different airport', () => {
    if (FALLBACK_HERO !== undefined) {
      const fallback = imageFor(FALLBACK_HERO);
      expect(fallback.place).toBe('my');
      expect(fallback.subject).not.toMatch(/terminal|interior/);
    }
    for (const [code, ids] of Object.entries(AIRPORT_HERO_IMAGES)) {
      expect(AIRPORTS.some((airport) => airport.slug === code), code).toBe(true);
      for (const id of ids ?? []) expect(imageFor(id).place, `${code}: ${id}`).toBe(code);
    }
    for (const airport of AIRPORTS) {
      const hero = heroForAirport(airport.slug);
      expect(heroForAirport(airport.code)).toBe(hero);
      if (hero === undefined) {
        expect(FALLBACK_HERO, airport.slug).toBeUndefined();
        continue;
      }
      expect([airport.slug, 'my'], `${airport.slug}: ${hero.id}`).toContain(hero.place);
      if (hero.place === 'my') expect(hero.subject, airport.slug).not.toMatch(/terminal|interior/);
    }
  });

  it('helpers return the record entries', () => {
    expect(objectPosition({ focal: { x: 0.5, y: 0.25 } })).toBe('50% 25%');
    for (const image of ALL_IMAGES) expect(imageFor(image.id as ImageId)).toBe(image);
    // Every entry is in a credits group (ALL_IMAGES is built group by group).
    expect(Object.values(IMAGES)).toHaveLength(ALL_IMAGES.length);
    expect(imagesByGroup().flatMap((entry) => entry.images)).toEqual(ALL_IMAGES);
    expect(new Set(ALL_IMAGES.map((image) => image.src)).size).toBe(ALL_IMAGES.length);
  });
});
