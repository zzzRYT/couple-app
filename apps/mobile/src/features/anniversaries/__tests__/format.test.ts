import { formattedDate, formattedMonthDay } from '../format';
it('V0 dates follow the design in all supported languages', () => {
  expect(formattedDate('2026-11-11', 'ko-KR', true)).toBe('2026년 11월 11일 (수)');
  expect(formattedDate('2026-11-11', 'ja-JP', false)).toBe('11月11日(水)');
  expect(formattedDate('2026-11-11', 'en-US', true)).toBe('Wed, Nov 11, 2026');
  expect(formattedMonthDay('2026-11-11', 'ko-KR')).toBe('11월 11일');
});
