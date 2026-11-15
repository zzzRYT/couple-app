import { nextCustomDate } from './anniversaries';
import { ANNIVERSARY_PRESETS, type AnniversaryPreset } from './anniversaryRegistry';
export { ANNIVERSARY_PRESETS, type AnniversaryPreset, type PresetId } from './anniversaryRegistry';

type TFunction = (key: string, vars?: Record<string, unknown>) => string;
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
