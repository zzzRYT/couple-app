import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import type { Group } from 'three';
import { bodyFront, makeAroomiBody, makeAroomiKnot, makeAroomiScarf, swingArms } from './aroomiBody';

// Seat a part on the front of the body, turned to face along the surface normal.
function onBody(x: number, y: number, lift = 0): { position: [number, number, number]; rotation: [number, number, number, 'YXZ'] } {
  const { z, normal } = bodyFront(x, y);
  return { position: [x + normal[0] * lift, y + normal[1] * lift, z + normal[2] * lift], rotation: [-Math.asin(normal[1]), Math.atan2(normal[0], normal[2]), 0, 'YXZ'] };
}

// Temporary generated model; replace this component when the owner's GLB is available.
export function Aroomi({ reducedMotion }: { reducedMotion: boolean }) {
  const character = useRef<Group>(null);
  const body = useMemo(makeAroomiBody, []); const scarf = useMemo(makeAroomiScarf, []); const knot = useMemo(makeAroomiKnot, []);
  useEffect(() => () => { body.geometry.dispose(); scarf.dispose(); knot.dispose(); }, [body, scarf, knot]);
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
    swingArms(body, (Math.sin(t * 1.2) + 1) * 0.15);
  });
  return <group ref={character} scale={0.38}>
    <mesh geometry={body.geometry}><meshStandardMaterial color="#F0CFA6" roughness={1} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <mesh {...onBody(side * 0.13, 0.68)} scale={[0.025, 0.035, 0.012]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#3A261C" roughness={1} /></mesh>
      <mesh {...onBody(side * 0.2, 0.61)} scale={[0.05, 0.035, 0.008]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#F2A99B" roughness={1} /></mesh>
    </group>)}
    {/* Smile traced from design/mascot/vector/icon_face_A.svg: 0.092 wide, 0.016 thick, its lowest point 0.05 under the eye line. */}
    <group {...onBody(0, 0.63)}>
      <mesh position={[0, 0.054, 0]} rotation={[0, 0, -Math.PI / 2 - 0.76]} scale={[1, 1, 0.6]}><torusGeometry args={[0.054, 0.008, 6, 12, 1.52]} /><meshStandardMaterial color="#3A261C" roughness={1} /></mesh>
    </group>
    <mesh geometry={scarf}><meshStandardMaterial color="#5263BD" roughness={1} /></mesh>
    <mesh geometry={knot}><meshStandardMaterial color="#5263BD" roughness={1} /></mesh>
    <mesh {...onBody(-0.2, 0.41, 0.02)} scale={[0.055, 0.055, 0.02]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#FCCF7B" roughness={1} /></mesh>
  </group>;
}
