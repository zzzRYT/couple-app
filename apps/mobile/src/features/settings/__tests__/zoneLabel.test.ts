import { utcOffsetLabel, zoneLabel } from '../zoneLabel';

const winter = Date.UTC(2026, 0, 15), summer = Date.UTC(2026, 6, 15);

it('draws the board value for the default zone in every language', () => {
  expect(zoneLabel('Asia/Seoul', 'ko-KR', winter)).toBe('서울 (UTC+9)');
  expect(zoneLabel('Asia/Seoul', 'en-US', winter)).toBe('Seoul (UTC+9)');
  expect(zoneLabel('Asia/Seoul', 'ja-JP', winter)).toBe('ソウル（UTC+9）');
});
it('follows daylight saving and half-hour offsets', () => {
  expect(utcOffsetLabel('America/New_York', winter)).toBe('UTC-5');
  expect(utcOffsetLabel('America/New_York', summer)).toBe('UTC-4');
  expect(utcOffsetLabel('Asia/Kolkata', winter)).toBe('UTC+5:30');
  expect(utcOffsetLabel('UTC', winter)).toBe('UTC');
});
it('falls back to the city part of the id for zones outside the picker list', () => {
  expect(zoneLabel('America/Argentina/Buenos_Aires', 'ko-KR', winter)).toBe('Buenos Aires (UTC-3)');
  expect(zoneLabel('Asia/Seoul', 'fr-FR', winter)).toBe('Seoul (UTC+9)');
});
