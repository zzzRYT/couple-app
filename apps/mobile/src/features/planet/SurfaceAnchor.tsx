import { useMemo, type ReactNode } from 'react';
import { Quaternion, Vector3 } from 'three';
import { surfacePosition } from './model';

export function SurfaceAnchor({ latitude, longitude, heading = 0, surfaceScale = 1, children }: { latitude: number; longitude: number; heading?: number; surfaceScale?: number; children: ReactNode }) {
  const { position, orientation } = useMemo(() => {
    const lat = Math.max(-89.999, Math.min(89.999, latitude));
    const point = (a: number, b: number) => new Vector3(...surfacePosition(a, b));
    const north = point(lat + 0.001, longitude).sub(point(lat - 0.001, longitude));
    const east = point(lat, longitude + 0.001).sub(point(lat, longitude - 0.001));
    const normal = east.cross(north).normalize();
    return { position: surfacePosition(latitude, longitude), orientation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal) };
  }, [latitude, longitude]);
  return <group position={position.map((value) => value * surfaceScale) as [number, number, number]} quaternion={orientation}><group rotation={[0, heading * Math.PI / 180, 0]}>{children}</group></group>;
}
