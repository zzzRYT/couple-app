export const errorKeys = {
  VERSION_CONFLICT: 'preview.conflict.title', SESSION_OCCUPIED: 'prompt.partner', SESSION_CONFLICT: 'undo.busy.title',
  DAILY_LIMIT_REACHED: 'prompt.quota.title', ALREADY_IN_SPACE: 'join.hasSpace.title', GENERATION_REFUSED: 'gen.refuse.purpose',
  GENERATION_FAILED: 'gen.fail.title', GENERATION_DISABLED: 'gen.disabled.title', LIBRARY_FULL: 'gen.lib.full',
  RATE_LIMITED: 'sys.quota.title', REPORT_RATE_LIMITED: 'report.obj.limit', ROOM_FULL: 'prompt.unsupported.title',
  NOTHING_TO_UNDO: 'undo.none.title', PREVIEW_CHANGED: 'undo.conflict.title', ALREADY_APPLIED: 'undo.none.title',
  MILESTONE_PASSED: 'sys.old.title', COVER_FORMAT_UNSUPPORTED: 'sys.asset.title', COVER_TOO_LARGE: 'sys.asset.title',
  COVER_INVALID_IMAGE: 'sys.asset.title', UNSUPPORTED_REQUEST: 'prompt.unsupported.title', INVALID_CANDIDATE: 'sys.ai.title',
} as const;
export function errorKey(code: string): string { return errorKeys[code as keyof typeof errorKeys] ?? 'sys.server.title'; }
