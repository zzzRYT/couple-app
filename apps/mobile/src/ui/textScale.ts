import { useWindowDimensions } from 'react-native';
/** The system text size from which layouts stack, wrap and drop single-line caps instead of shrinking (S20). */
export const LARGE_TEXT = 1.3;
export function useLargeText(): boolean {
  return useWindowDimensions().fontScale >= LARGE_TEXT;
}
/** `Day 492` -> `Day\n492`: at large text the label and the number go on two lines rather than one clipped line. Leaves `492日目` whole. */
export function splitBigDay(label: string, n: number | null): string {
  const at = label.indexOf(String(n));
  const lead = at > 0 ? label.slice(0, at).trim() : '';
  return lead ? `${lead}\n${label.slice(at)}` : label;
}
