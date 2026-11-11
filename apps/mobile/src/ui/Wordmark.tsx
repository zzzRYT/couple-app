import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDisplayAppearance } from '../features/settings/preferences';

/** design/wordmark: 아룸 for Korean, Aroom for every other language, drawn 28pt tall. */
const WORDMARKS = {
  ko: { width: 63, light: require('../../assets/brand/wordmark-ko-light.png'), dark: require('../../assets/brand/wordmark-ko-dark.png') },
  en: { width: 104, light: require('../../assets/brand/wordmark-en-light.png'), dark: require('../../assets/brand/wordmark-en-dark.png') },
} as const;

export function Wordmark() {
  const { t, i18n } = useTranslation(); const { scheme } = useDisplayAppearance();
  const mark = WORDMARKS[i18n.language.startsWith('ko') ? 'ko' : 'en'];
  return <Image accessible accessibilityRole="header" accessibilityLabel={t('app.name')} source={mark[scheme]} style={{ width: mark.width, height: 28 }} />;
}
