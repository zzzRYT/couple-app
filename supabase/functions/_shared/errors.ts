export const ERROR_CODES = [
  'VERSION_CONFLICT', 'SESSION_OCCUPIED', 'SESSION_CONFLICT', 'DAILY_LIMIT_REACHED', 'ALREADY_IN_SPACE',
  'GENERATION_REFUSED', 'GENERATION_FAILED', 'GENERATION_DISABLED', 'LIBRARY_FULL', 'RATE_LIMITED',
  'REPORT_RATE_LIMITED', 'ROOM_FULL', 'NOTHING_TO_UNDO', 'PREVIEW_CHANGED', 'ALREADY_APPLIED',
  'MILESTONE_PASSED', 'COVER_FORMAT_UNSUPPORTED', 'COVER_TOO_LARGE', 'COVER_INVALID_IMAGE',
  'UNSUPPORTED_REQUEST', 'INVALID_CANDIDATE', 'INVITE_EXPIRED', 'INVITE_USED', 'INVITE_INVALID', 'SPACE_FULL',
  'CONSENT_REQUIRED', 'SESSION_EXPIRED', 'IN_PROGRESS', 'INVALID_REQUEST', 'NOT_FOUND', 'UNAUTHORIZED',
] as const;
export type ErrorCode = typeof ERROR_CODES[number];
export function errorResponse(code: ErrorCode, status: number, retryable: boolean, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error: { code, retryable, ...extra } }, { status });
}
const STATUS: Partial<Record<ErrorCode, [number, boolean]>> = {
  VERSION_CONFLICT: [409, true], SESSION_OCCUPIED: [409, true], SESSION_CONFLICT: [409, true], SESSION_EXPIRED: [409, false], IN_PROGRESS: [409, true], MILESTONE_PASSED: [410, false],
  DAILY_LIMIT_REACHED: [429, false], ALREADY_IN_SPACE: [409, false], RATE_LIMITED: [429, true], REPORT_RATE_LIMITED: [429, false], ROOM_FULL: [422, false],
  NOTHING_TO_UNDO: [409, false], PREVIEW_CHANGED: [409, true], ALREADY_APPLIED: [409, false], UNSUPPORTED_REQUEST: [422, false],
  INVALID_CANDIDATE: [422, true], GENERATION_FAILED: [503, true], INVITE_EXPIRED: [410, false], INVITE_USED: [409, false],
  INVITE_INVALID: [404, false], SPACE_FULL: [409, false], CONSENT_REQUIRED: [403, false], INVALID_REQUEST: [400, false],
  COVER_INVALID_IMAGE: [422, false],
  NOT_FOUND: [404, false], UNAUTHORIZED: [401, false],
};
export class AppError extends Error {
  constructor(readonly code: ErrorCode, readonly extra: Record<string, unknown> = {}) { super(code); }
}
export function isErrorCode(value: string): value is ErrorCode { return (ERROR_CODES as readonly string[]).includes(value); }
/** Maps a stable code to its HTTP status; unknown failures become a retryable 503 without detail. */
export function toResponse(error: unknown): Response {
  const code = error instanceof AppError ? error.code : error instanceof Error && isErrorCode(error.message) ? error.message : null;
  if (!code) return Response.json({ error: { code: 'SERVER_ERROR', retryable: true } }, { status: 503 });
  const [status, retryable] = STATUS[code] ?? [400, false];
  return errorResponse(code, status, retryable, error instanceof AppError ? error.extra : {});
}
