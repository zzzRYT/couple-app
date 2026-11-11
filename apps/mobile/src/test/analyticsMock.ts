/** Keeps every test offline: app code that tracks gets jest.fn() stand-ins. src/lib/__tests__/analytics.test.ts unmocks it to drive the real SDK. */
jest.mock('../lib/analytics', () => ({ startAnalytics: jest.fn(), track: jest.fn() }));
