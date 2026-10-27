import { describe, expect, it } from 'vitest';
import theme from '../fixtures/theme/valid.json';
import { validateTheme, validatePresentation, validateSessionDoc } from '../src/validate';
const presentation = { schemaVersion: 1, visible: true, x: 0.1, y: 0.1, width: 0.3, height: 0.2, styleToken: 'day.default', textScale: 1 };
const session = { schemaVersion: 1, sessionId: '7f0f6c07-e459-409c-a999-9e7df8c5f08a', ownerUserId: '7f0f6c07-e459-409c-a999-9e7df8c5f08b', status: 'occupied', acquiredAt: '2026-01-01T00:00:00Z', lastActivityAt: '2026-01-01T00:00:00Z', expiresAt: '2026-01-01T00:03:00Z' };
describe('theme, presentation and session contracts', () => {
  it('accepts valid documents including follow_time', () => {
    expect(validateTheme(theme).ok).toBe(true);
    expect(validatePresentation(presentation).ok).toBe(true);
    expect(validateSessionDoc(session).ok).toBe(true);
  });
  it('rejects unknown fields, invalid timezones and absent timezone', () => {
    const missing: Partial<typeof theme> = { ...theme };
    delete missing.timeZone;
    expect(validateTheme(missing).ok).toBe(false);
    expect(validateTheme({ ...theme, timeZone: 'not/a-zone' }).ok).toBe(false);
    expect(validateTheme({ ...theme, extra: true }).ok).toBe(false);
    expect(validatePresentation({ ...presentation, date: '2026-01-01' }).ok).toBe(false);
    expect(validateSessionDoc({ ...session, status: 'other' }).ok).toBe(false);
    expect(validateSessionDoc({ ...session, extra: true }).ok).toBe(false);
  });
});
