import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { catalogImages } from '../scene/catalogImages';
import { useReducedMotion } from './motion';
const frames = [catalogImages.obj_plant_potted, catalogImages.obj_party_balloon, require('../../assets/loader/window.png'), catalogImages.obj_decor_books];
export function CycleLoader({ label, reducedMotion }: { label: string; reducedMotion?: boolean }) {
  const systemReduced = useReducedMotion();
  const reduced = reducedMotion ?? systemReduced;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (reduced) { setFrame(0); return; }
    const timer = setInterval(() => setFrame((current) => (current + 1) % frames.length), 1200);
    return () => clearInterval(timer);
  }, [reduced]);
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label}><Image testID="loader-frame" source={frames[reduced ? 0 : frame]} style={{ width: 64, height: 64 }} /></View>;
}
