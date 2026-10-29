import translations from '../i18n/locales/en-US.json';
export const errorKeys = {
  VERSION_CONFLICT: 'preview.conflict.title', SESSION_OCCUPIED: 'prompt.partner', SESSION_CONFLICT: 'undo.busy.title',
  DAILY_LIMIT_REACHED: 'prompt.quota.title', ALREADY_IN_SPACE: 'join.hasSpace.title', GENERATION_REFUSED: 'gen.refuse.purpose',
  GENERATION_FAILED: 'gen.fail.title', GENERATION_DISABLED: 'gen.disabled.title', LIBRARY_FULL: 'gen.lib.full',
  RATE_LIMITED: 'sys.quota.title', REPORT_RATE_LIMITED: 'report.obj.limit', ROOM_FULL: 'prompt.unsupported.title',
  NOTHING_TO_UNDO: 'undo.none.title', PREVIEW_CHANGED: 'undo.conflict.title', ALREADY_APPLIED: 'undo.none.title',
  MILESTONE_PASSED: 'sys.old.title', COVER_FORMAT_UNSUPPORTED: 'sys.asset.title', COVER_TOO_LARGE: 'sys.asset.title',
  COVER_INVALID_IMAGE: 'sys.asset.title', UNSUPPORTED_REQUEST: 'prompt.unsupported.title', INVALID_CANDIDATE: 'sys.ai.title',
  INVITE_EXPIRED: 'join.expired.title', INVITE_USED: 'join.used.title', INVITE_INVALID: 'join.invalid.title', SPACE_FULL: 'join.full.title',
  CONSENT_REQUIRED: 'prompt.consent.need', SESSION_EXPIRED: 'prompt.idle.me.title', IN_PROGRESS: 'sys.pending.title',
  REAUTH_REQUIRED: 'acct.delete.reauth.fail', ACCOUNT_DELETING: 'acct.delete.progress', PROVIDER_NOT_CONFIGURED: 'acct.delete.fail.title',
} as const;
export type ErrorCode = keyof typeof errorKeys;
export function errorKey(code: string): string { return errorKeys[code as ErrorCode] ?? 'sys.server.title'; }
/** Keys that have a matching body line, so screens can show title and body together. */
export function errorBodyKey(code: string): string | null {
  const body = errorKey(code).replace(/\.title$/, '.body');
  return body.endsWith('.body') && Object.prototype.hasOwnProperty.call(translations, body) ? body : null;
}
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, readonly details: Record<string, unknown> = {}) { super(code); }
}
