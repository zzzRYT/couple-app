import { nextCustomDate } from './anniversaries';

type TFunction = (key: string, vars?: Record<string, unknown>) => string;
type PresetRow = { id: string; month: number; day: number; builtIn: boolean; region: 'kr' | 'jp' | null; ko: string };
/** Mirrors public.anniversary_preset. `builtIn` identifies built-in days; the rest are offered on the add screen. `ko` is the stored title. */
export const ANNIVERSARY_PRESETS = [
  { id: 'diary', month: 1, day: 14, builtIn: false, region: 'kr', ko: '다이어리데이' },
  { id: 'valentine', month: 2, day: 14, builtIn: true, region: null, ko: '발렌타인데이' },
  { id: 'samgyeopsal', month: 3, day: 3, builtIn: false, region: 'kr', ko: '삼겹살데이' },
  { id: 'white', month: 3, day: 14, builtIn: true, region: null, ko: '화이트데이' },
  { id: 'rose', month: 5, day: 14, builtIn: false, region: 'kr', ko: '로즈데이' },
  { id: 'married', month: 5, day: 21, builtIn: false, region: 'kr', ko: '부부의 날' },
  { id: 'kiss', month: 6, day: 14, builtIn: false, region: 'kr', ko: '키스데이' },
  { id: 'silver', month: 7, day: 14, builtIn: false, region: 'kr', ko: '실버데이' },
  { id: 'wine', month: 10, day: 14, builtIn: false, region: 'kr', ko: '와인데이' },
  { id: 'movie', month: 11, day: 14, builtIn: false, region: 'kr', ko: '무비데이' },
  { id: 'goodCouple', month: 11, day: 22, builtIn: false, region: 'jp', ko: '좋은 부부의 날' },
  { id: 'hug', month: 12, day: 14, builtIn: false, region: 'kr', ko: '허그데이' },
  { id: 'xmasEve', month: 12, day: 24, builtIn: false, region: null, ko: '크리스마스 이브' },
] as const satisfies readonly PresetRow[];
export type AnniversaryPreset = (typeof ANNIVERSARY_PRESETS)[number];
export type PresetId = AnniversaryPreset['id'];
type CustomLike = { presetId?: string | null; title: string };

export const presetOf = (id: string | null | undefined): AnniversaryPreset | undefined => ANNIVERSARY_PRESETS.find((preset) => preset.id === id);
/** A preset row still carrying its stored Korean title shows in the reader's language; a title the couple changed shows as written. */
export function presetTitle(custom: CustomLike, t: TFunction): string {
  const preset = presetOf(custom.presetId);
  return preset && custom.title === preset.ko ? t(`anniv.preset.${preset.id}`) : custom.title;
}
const monthDay = (preset: AnniversaryPreset) => `${String(preset.month).padStart(2, '0')}-${String(preset.day).padStart(2, '0')}`;
export const nextPresetDate = (preset: AnniversaryPreset, today: string): string => nextCustomDate({ date: `2000-${monthDay(preset)}`, repeat: 'yearly' }, today)!;
/** Added when the couple has the preset's row, or made the same yearly day by hand under any of its localized names. */
export function presetAdded(preset: AnniversaryPreset, customs: readonly (CustomLike & { date: string; repeat: 'yearly' | 'once' })[], titlesOf: (preset: AnniversaryPreset) => string[]): boolean {
  return customs.some((custom) => custom.presetId === preset.id || (custom.repeat === 'yearly' && custom.date.slice(5) === monthDay(preset) && titlesOf(preset).includes(custom.title.trim())));
}
