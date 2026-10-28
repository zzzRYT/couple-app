import { fieldOrder, fieldText, fromIsoDate, toIsoDate } from '../DateWheel';

it('orders the date fields per language', () => {
  expect(fieldOrder('ko-KR')).toEqual(['year', 'month', 'day']);
  expect(fieldOrder('ja-JP')).toEqual(['year', 'month', 'day']);
  expect(fieldOrder('en-US')).toEqual(['month', 'day', 'year']);
});

it('labels values with units in Korean and Japanese and with month names in English', () => {
  expect(fieldText('month', 6, 'ko-KR', '월')).toBe('6월');
  expect(fieldText('year', 2025, 'ja-JP', '年')).toBe('2025年');
  expect(fieldText('month', 6, 'en-US', 'Month')).toBe('Jun');
  expect(fieldText('day', 29, 'en-US', 'Day')).toBe('29');
});

it('round-trips ISO dates', () => {
  expect(toIsoDate(fromIsoDate('2025-06-09'))).toBe('2025-06-09');
});
