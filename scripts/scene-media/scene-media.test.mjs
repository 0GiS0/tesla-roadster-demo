import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAX_SCENES, detectChangedScenes, parseCatalog } from './changed-scenes.mjs';
import { collectScene, isValidSlug, parseMeta, renderComment } from './publish.mjs';

const entry = (key, slug, environment, extra = '') => `  {
    key: '${key}',
    hash: '${slug ? `#meme/${slug}` : ''}',
    mode: '${slug ? 'meme' : 'original'}',
    environment: '${environment}',
    copy: { label: 'It\\'s a "test" {', title: 'x' },${extra}
  },`;
const catalog = (...entries) => `export const sceneCatalog: SceneDefinition[] = [\n${entries.join('\n')}\n];\nexport const other = [{ a: 1 }];\n`;

const base = parseCatalog(catalog(entry('ramp', '', 'ramp'), entry('a', 'alpha', 'pothole'), entry('b', 'beta', 'parking')));

describe('parseCatalog', () => {
  it('splits entries and ignores braces inside strings and later arrays', () => {
    expect(base.map((e) => [e.key, e.slug, e.mode, e.environment])).toEqual([
      ['ramp', '', 'original', 'ramp'],
      ['a', 'alpha', 'meme', 'pothole'],
      ['b', 'beta', 'meme', 'parking'],
    ]);
  });
});

describe('detectChangedScenes', () => {
  const detect = (head, changedFiles) => detectChangedScenes({ baseCatalog: base, headCatalog: parseCatalog(head), changedFiles });

  it('records nothing when no scene file changes', () => {
    const head = catalog(entry('ramp', '', 'ramp'), entry('a', 'alpha', 'pothole'), entry('b', 'beta', 'parking'));
    expect(detect(head, ['README.md']).scenes).toEqual([]);
  });

  it('records only the edited or new catalog entries', () => {
    const head = catalog(entry('ramp', '', 'ramp'), entry('a', 'alpha', 'pothole', '\n    tourMoment: 3,'), entry('b', 'beta', 'parking'), entry('c', 'gamma', 'cables'));
    expect(detect(head, ['src/sceneCatalog.ts'])).toEqual({ scenes: ['alpha', 'gamma'], truncated: false });
  });

  it('never records the original scene', () => {
    const head = catalog(entry('ramp', '', 'ramp', '\n    tourMoment: 1,'), entry('a', 'alpha', 'pothole'), entry('b', 'beta', 'parking'));
    expect(detect(head, ['src/sceneCatalog.ts']).scenes).toEqual([]);
  });

  it('records every meme for shared rendering code and only matching ones for an environment file', () => {
    const head = catalog(entry('ramp', '', 'ramp'), entry('a', 'alpha', 'pothole'), entry('b', 'beta', 'parking'));
    expect(detect(head, ['src/Scene.tsx']).scenes).toEqual(['alpha', 'beta']);
    expect(detect(head, ['src/ParkingLot.tsx']).scenes).toEqual(['beta']);
  });

  it('caps the number of scenes and reports truncation', () => {
    const many = Array.from({ length: MAX_SCENES + 2 }, (_, i) => entry(`k${i}`, `scene-${i}`, 'pothole'));
    const result = detectChangedScenes({ baseCatalog: [], headCatalog: parseCatalog(catalog(...many)), changedFiles: [] });
    expect(result.scenes).toHaveLength(MAX_SCENES);
    expect(result.truncated).toBe(true);
  });
});

describe('publisher validation', () => {
  const sha = 'a'.repeat(40);

  it('accepts only safe slugs', () => {
    expect(isValidSlug('robo-de-plaza')).toBe(true);
    for (const bad of ['', '../x', 'a/b', 'A', 'a--b', '-a', 'a b', 'x'.repeat(65), 5, null]) expect(isValidSlug(bad)).toBe(false);
  });

  it('parses valid metadata and rejects tampered values', () => {
    expect(parseMeta(JSON.stringify({ pr: 7, headSha: sha, scenes: ['b', 'a'], truncated: false })).scenes).toEqual(['a', 'b']);
    for (const bad of [{ pr: '7' }, { pr: 0 }, { pr: 7, headSha: 'abc' }, { pr: 7, headSha: sha, scenes: ['../x'] }, { pr: 7, headSha: sha, scenes: ['a', 'a'] }]) {
      expect(() => parseMeta(JSON.stringify({ scenes: [], headSha: sha, ...bad }))).toThrow();
    }
  });

  it('collects only well-formed media files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scene-media-test-'));
    const scene = join(dir, 'scene-media-alpha');
    mkdirSync(scene);
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(8)]);
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(8)]);
    writeFileSync(join(scene, 'alpha.png'), png);
    writeFileSync(join(scene, 'alpha.mp4'), mp4);
    writeFileSync(join(scene, 'alpha.gif'), Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(8)]));
    expect(Object.keys(collectScene(dir, 'alpha'))).toEqual(['mp4', 'png', 'gif']);

    writeFileSync(join(scene, 'alpha.gif'), Buffer.from('<html>not a gif</html>'));
    expect(collectScene(dir, 'alpha')).toBeNull();

    writeFileSync(join(dir, 'secret.txt'), 'x');
    writeFileSync(join(scene, 'alpha.gif'), Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(8)]));
    symlinkSync(join(dir, 'secret.txt'), join(scene, 'alpha.mp4.link'));
    expect(collectScene(dir, 'alpha')).not.toBeNull();
    expect(collectScene(dir, 'missing')).toBeNull();
  });

  it('renders a comment with the marker, embedded images and failed scenes', () => {
    const meta = { pr: 7, headSha: sha, scenes: ['alpha', 'beta'], truncated: false };
    const body = renderComment({ meta, results: { alpha: true, beta: false }, mediaBase: 'https://example.test/raw/c0ffee/pr-7', runUrl: 'https://example.test/run/1' });
    expect(body.startsWith('<!-- scene-media -->')).toBe(true);
    expect(body).toContain('![Captura «después» de la escena alpha](https://example.test/raw/c0ffee/pr-7/alpha/alpha.png)');
    expect(body).toContain('alpha/alpha.mp4');
    expect(body).toContain('No se pudo grabar esta escena');
  });
});
