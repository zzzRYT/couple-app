import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import scene from '../schemas/room-scene.schema.json' with { type: 'json' };
import theme from '../schemas/room-theme.schema.json' with { type: 'json' };
import presentation from '../schemas/room-presentation.schema.json' with { type: 'json' };
import session from '../schemas/room-prompt-session.schema.json' with { type: 'json' };
import { ensureSingleMascot } from './mascot.ts';

export type ValidationResult = { ok: boolean; errors: { path: string; code: string }[] };
const ajv = new Ajv2020({ strict: true, allErrors: true });
ajv.addFormat('uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
ajv.addFormat('date-time', { type: 'string', validate: (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value) && Number.isFinite(Date.parse(value)) });
const sceneCheck = ajv.compile(scene);
const themeCheck = ajv.compile(theme);
const presentationCheck = ajv.compile(presentation);
const sessionCheck = ajv.compile(session);
function result(check: ValidateFunction, value: unknown): ValidationResult {
  const ok = check(value);
  return { ok, errors: (check.errors ?? []).map((e: ErrorObject) => ({ path: e.instancePath, code: e.keyword })) };
}
export function validateScene(value: unknown, activeAssetIds: ReadonlySet<string>, options: { initial?: boolean } = {}): ValidationResult {
  const r = result(sceneCheck, value);
  if (value && typeof value === 'object' && 'objects' in value && Array.isArray(value.objects)) {
    if (options.initial && !ensureSingleMascot(value.objects.filter((x): x is { assetId: string } => !!x && typeof x === 'object' && typeof x.assetId === 'string'))) {
      r.errors.push({ path: '/objects', code: 'initialMascot' });
    }
    value.objects.forEach((object: unknown, index: number) => {
      if (object && typeof object === 'object' && 'assetId' in object && typeof object.assetId === 'string' && !activeAssetIds.has(object.assetId)) {
        r.errors.push({ path: `/objects/${index}/assetId`, code: 'assetId' });
      }
    });
  }
  if (value && typeof value === 'object' && 'texts' in value && Array.isArray(value.texts)) {
    value.texts.forEach((item: unknown, index: number) => {
      if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string' && /<[^>]*>|(?:https?:\/\/|www\.)|\bon\w+\s*=/i.test(item.text)) {
        r.errors.push({ path: `/texts/${index}/text`, code: 'unsafeText' });
      }
    });
  }
  r.ok = r.errors.length === 0;
  return r;
}
export function validateTheme(value: unknown): ValidationResult {
  const r = result(themeCheck, value);
  if (value && typeof value === 'object' && 'timeZone' in value && typeof value.timeZone === 'string') {
    try { new Intl.DateTimeFormat('en', { timeZone: value.timeZone }); }
    catch { r.errors.push({ path: '/timeZone', code: 'timeZone' }); }
  }
  r.ok = r.errors.length === 0;
  return r;
}
export const validatePresentation = (value: unknown) => result(presentationCheck, value);
export const validateSessionDoc = (value: unknown) => result(sessionCheck, value);
