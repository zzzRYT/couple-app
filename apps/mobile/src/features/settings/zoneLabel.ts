import { zoneOffset } from '../notifications/plan';

type Names = { 'ko-KR': string; 'en-US': string; 'ja-JP': string };
/** City names for the zones the picker offers; Hermes has no Intl zone names, so the row cannot ask the engine for them. */
const NAMES: Record<string, Names> = {
  'Asia/Seoul': { 'ko-KR': '서울', 'en-US': 'Seoul', 'ja-JP': 'ソウル' },
  'Asia/Tokyo': { 'ko-KR': '도쿄', 'en-US': 'Tokyo', 'ja-JP': '東京' },
  'Asia/Taipei': { 'ko-KR': '타이베이', 'en-US': 'Taipei', 'ja-JP': '台北' },
  'Asia/Singapore': { 'ko-KR': '싱가포르', 'en-US': 'Singapore', 'ja-JP': 'シンガポール' },
  'Asia/Bangkok': { 'ko-KR': '방콕', 'en-US': 'Bangkok', 'ja-JP': 'バンコク' },
  'Asia/Dubai': { 'ko-KR': '두바이', 'en-US': 'Dubai', 'ja-JP': 'ドバイ' },
  'Europe/London': { 'ko-KR': '런던', 'en-US': 'London', 'ja-JP': 'ロンドン' },
  'Europe/Paris': { 'ko-KR': '파리', 'en-US': 'Paris', 'ja-JP': 'パリ' },
  'Europe/Berlin': { 'ko-KR': '베를린', 'en-US': 'Berlin', 'ja-JP': 'ベルリン' },
  'America/Los_Angeles': { 'ko-KR': '로스앤젤레스', 'en-US': 'Los Angeles', 'ja-JP': 'ロサンゼルス' },
  'America/Denver': { 'ko-KR': '덴버', 'en-US': 'Denver', 'ja-JP': 'デンバー' },
  'America/Chicago': { 'ko-KR': '시카고', 'en-US': 'Chicago', 'ja-JP': 'シカゴ' },
  'America/New_York': { 'ko-KR': '뉴욕', 'en-US': 'New York', 'ja-JP': 'ニューヨーク' },
  'Pacific/Auckland': { 'ko-KR': '오클랜드', 'en-US': 'Auckland', 'ja-JP': 'オークランド' },
};

/** `UTC+9`, `UTC-3:30`, `UTC` for the zone's offset right now. */
export function utcOffsetLabel(zone: string, instant = Date.now()): string {
  const minutes = Math.round(zoneOffset(instant, zone) / 60_000);
  if (minutes === 0) return 'UTC';
  const abs = Math.abs(minutes), rest = abs % 60;
  return `UTC${minutes < 0 ? '-' : '+'}${Math.floor(abs / 60)}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
}

/** The settings row value, e.g. `서울 (UTC+9)`, the same on every JS engine. */
export function zoneLabel(zone: string, locale: string, instant = Date.now()): string {
  const names = NAMES[zone], city = zone.split('/').pop()!.replace(/_/g, ' ');
  const name = names ? names[(locale in names ? locale : 'en-US') as keyof Names] : city;
  const offset = utcOffsetLabel(zone, instant);
  return locale === 'ja-JP' ? `${name}（${offset}）` : `${name} (${offset})`;
}
