import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { V0Error } from '../../features/home/states';
import { Screen, Skeleton } from '../../ui/components';
import { V1_FEATURES } from '../../config/features';
import { PlanetScreen } from '../../features/planet/PlanetScreen';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';

export default function PlanetRoute() {
  const { state, refresh } = useSpace(); const now = useNow(); const { t } = useTranslation();
  if (!V1_FEATURES.planet) return <Redirect href="/home" />;
  const space = state.snapshot?.space;
  if (state.status === 'error' && !state.offline || (state.offline && !space)) return <V0Error offline={state.offline} title={t('planet.tab')} retry={() => void refresh()} />;
  return space ? <PlanetScreen anniversary={space.anniversaryDate} timeZone={space.timeZone} now={now} /> : <Screen><Skeleton label={t('state.loading')} height={72} /></Screen>;
}
