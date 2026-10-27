import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/scene/valid.json';
import { validateScene } from '../src/validate';

const obj = { assetId: 'obj_sky_star', x: 0.3, y: 0.4, width: 0.1, height: 0.1, rotationDeg: 0, zIndex: 2, opacity: 1 };
const text = { text: 'hello', x: 0.3, y: 0.4, width: 0.2, height: 0.1, rotationDeg: 0, zIndex: 3, styleToken: 'text.primary' };
const validate = (value: unknown) => validateScene(value, new Set(['app_mascot', 'obj_sky_star']), { initial: true });

describe('scene validation', () => {
  it('accepts a valid scene and the maximum number of objects and texts', () => {
    expect(validate(fixture).ok).toBe(true);
    expect(validateScene({ ...fixture, objects: [obj] }, new Set(['app_mascot', 'obj_sky_star'])).ok).toBe(true);
    expect(validate({ ...fixture, objects: [...fixture.objects, ...Array(15).fill(obj)], texts: Array(3).fill(text) }).ok).toBe(true);
  });
  it.each([
    ['objects', { ...fixture, objects: [...fixture.objects, ...Array(16).fill(obj)] }, '/objects'],
    ['texts', { ...fixture, texts: Array(4).fill(text) }, '/texts'],
    ['negative coordinate', { ...fixture, objects: [fixture.objects[0], { ...obj, x: -0.01 }] }, '/objects/1/x'],
    ['large coordinate', { ...fixture, objects: [fixture.objects[0], { ...obj, y: 1.01 }] }, '/objects/1/y'],
    ['rotation', { ...fixture, objects: [fixture.objects[0], { ...obj, rotationDeg: 181 }] }, '/objects/1/rotationDeg'],
    ['text length', { ...fixture, texts: [{ ...text, text: 'a'.repeat(41) }] }, '/texts/0/text'],
    ['unknown field', { ...fixture, extra: 1 }, ''],
    ['url', { ...fixture, objects: [fixture.objects[0], { ...obj, assetId: 'https://example.com/a' }] }, '/objects/1/assetId'],
    ['svg', { ...fixture, objects: [fixture.objects[0], { ...obj, svg: '<svg/>' }] }, '/objects/1'],
    ['html', { ...fixture, objects: [fixture.objects[0], { ...obj, html: '<script/>' }] }, '/objects/1'],
    ['event', { ...fixture, objects: [fixture.objects[0], { ...obj, onClick: 'x' }] }, '/objects/1'],
    ['script text', { ...fixture, texts: [{ ...text, text: '<script>alert(1)</script>' }] }, '/texts/0/text'],
    ['url text', { ...fixture, texts: [{ ...text, text: 'https://example.com' }] }, '/texts/0/text'],
    ['unknown asset', { ...fixture, objects: [fixture.objects[0], { ...obj, assetId: 'unknown' }] }, '/objects/1/assetId'],
    ['missing mascot', { ...fixture, objects: [obj] }, '/objects'],
    ['duplicate mascot', { ...fixture, objects: [...fixture.objects, ...fixture.objects] }, '/objects'],
    ...['mascotState', 'wearable', 'color', 'expression', 'pose'].map((field): [string, unknown, string] => [field, { ...fixture, objects: [{ ...fixture.objects[0], [field]: 'x' }] }, '/objects/0']),
  ])('rejects %s with an error location', (_name, scene, path) => {
    const result = validate(scene);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === path)).toBe(true);
  });
});
