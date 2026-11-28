import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { BODY, makeAroomiBody, swingArms } from './aroomiBody';

// Seat a part on the front of the body, turned to face along the surface normal.
function onBody(x: number, y: number, lift = 0): { position: [number, number, number]; rotation: [number, number, number, 'YXZ'] } {
  const z = BODY[2] * Math.sqrt(1 - (x / BODY[0]) ** 2 - ((y - 0.5) / BODY[1]) ** 2);
  const normal = new Vector3(x / BODY[0] ** 2, (y - 0.5) / BODY[1] ** 2, z / BODY[2] ** 2).normalize();
  return { position: [x + normal.x * lift, y + normal.y * lift, z + normal.z * lift], rotation: [-Math.asin(normal.y), Math.atan2(normal.x, normal.z), 0, 'YXZ'] };
}

// Temporary generated model; replace this component when the owner's GLB is available.
export function Aroomi({ reducedMotion }: { reducedMotion: boolean }) {
  const character = useRef<Group>(null);
  const body = useMemo(makeAroomiBody, []);
  useEffect(() => () => body.geometry.dispose(), [body]);
  useFrame(({ clock }) => {
    if (reducedMotion) {
      if (character.current) { character.current.rotation.y = 0; character.current.position.set(0, 0, 0); }
      swingArms(body, 0);
      return;
    }
    const t = clock.elapsedTime;
    if (character.current) {
      const x = Math.sin(t * 0.18) * 0.14;
      character.current.position.set(x, -0.5 * x * x, 0);
      character.current.rotation.y = Math.sin(t * 0.3) * 0.35;
    }
    swingArms(body, Math.sin(t * 1.2) * 0.45);
  });
  return <group ref={character} scale={0.38}>
    <mesh geometry={body.geometry}><meshStandardMaterial color="#F0CFA6" roughness={1} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <mesh {...onBody(side * 0.13, 0.68)} scale={[0.025, 0.035, 0.012]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#3A261C" roughness={1} /></mesh>
      <mesh {...onBody(side * 0.23, 0.57)} scale={[0.05, 0.035, 0.008]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#F2A99B" roughness={1} /></mesh>
    </group>)}
    {/* K01 sash: the band of the body shell from the left shoulder (y 0.56) round to the right waist (y 0.25). */}
    <group position={[0, 0.5, 0]} scale={[BODY[0] * 1.03, BODY[1] * 1.03, BODY[2] * 1.03]}>
      <mesh rotation={[0, 0, 0.322]}><sphereGeometry args={[1, 48, 1, 0, Math.PI * 2, 1.672, 0.2]} /><meshStandardMaterial color="#5263BD" roughness={1} /></mesh>
    </group>
    <mesh {...onBody(-0.04, 0.38, 0.02)} scale={[0.055, 0.055, 0.02]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#FCCF7B" roughness={1} /></mesh>
  </group>;
}
