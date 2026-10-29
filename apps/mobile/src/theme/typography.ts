import type { TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tokens } from './tokens';

export type TypeVariant = keyof typeof tokens.typography.scale;
type Face = 'display' | 'body' | 'emphasis';
/** Font family names are the keys registered with useFonts (theme/fonts.ts). */
const families: Record<'ko' | 'ja', Record<Face, string>> = {
  ko: { display: 'GaeguBold', body: 'GowunDodum', emphasis: 'NotoSansKRBold' },
  ja: { display: 'Yomogi', body: 'NotoSansJP', emphasis: 'ZenMaruGothicBold' },
};
const lang = (language: string) => (language.startsWith('ja') ? 'ja' : language.startsWith('en') ? 'en' : 'ko');
/** tokens.typography.faceRule: the hand-drawn face only for >= 20px bold tokens; display lines stay tight, body lines follow the language. */
export function typeStyle(variant: TypeVariant, language: string): TextStyle {
  const scale = tokens.typography.scale[variant];
  const code = lang(language);
  const face: Face = scale.face === 'display' ? 'display' : scale.weight >= 600 ? 'emphasis' : 'body';
  const ratio = face === 'display' ? 1.25 : tokens.typography.lineHeight[code];
  return { fontFamily: families[code === 'ja' ? 'ja' : 'ko'][face], fontSize: scale.size, lineHeight: Math.round(scale.size * ratio) };
}
/** Small bold text that has no scale token (chips 13, field labels 14). */
export function emphasisStyle(size: number, language: string): TextStyle {
  const code = lang(language);
  return { fontFamily: families[code === 'ja' ? 'ja' : 'ko'].emphasis, fontSize: size, lineHeight: Math.round(size * tokens.typography.lineHeight[code]) };
}
export function useType() {
  const { i18n } = useTranslation();
  const language = i18n?.language ?? 'ko';
  return { type: (variant: TypeVariant) => typeStyle(variant, language), emphasis: (size: number) => emphasisStyle(size, language) };
}
