const allowed = new Set(['event', 'status', 'code', 'durationMs', 'requestId', 'endpoint']);
export function safeLogFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).filter(([key, value]) => allowed.has(key) && ['string', 'number', 'boolean'].includes(typeof value)));
}
