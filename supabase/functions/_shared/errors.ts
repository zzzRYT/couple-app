export const ERROR_CODES = [
  'VERSION_CONFLICT', 'SESSION_OCCUPIED', 'SESSION_CONFLICT', 'DAILY_LIMIT_REACHED', 'ALREADY_IN_SPACE',
  'GENERATION_REFUSED', 'GENERATION_FAILED', 'GENERATION_DISABLED', 'LIBRARY_FULL', 'RATE_LIMITED',
  'REPORT_RATE_LIMITED', 'ROOM_FULL', 'NOTHING_TO_UNDO', 'PREVIEW_CHANGED', 'ALREADY_APPLIED',
  'MILESTONE_PASSED', 'COVER_FORMAT_UNSUPPORTED', 'COVER_TOO_LARGE', 'COVER_INVALID_IMAGE',
  'UNSUPPORTED_REQUEST', 'INVALID_CANDIDATE',
] as const;
export type ErrorCode = typeof ERROR_CODES[number];
export function errorResponse(code: ErrorCode, status: number, retryable: boolean): Response {
  return Response.json({ error: { code, retryable } }, { status });
}
