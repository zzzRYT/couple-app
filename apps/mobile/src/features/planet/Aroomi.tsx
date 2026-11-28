import { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import type { Group } from 'three';

// Temporary primitive model; replace this component when the owner's GLB is available.
export function Aroomi({ reducedMotion }: { reducedMotion: boolean }) {
  const left = useRef<Group>(null); const right = useRef<Group>(null); const character = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (reducedMotion) {
      if (character.current) { character.current.rotation.y = 0; character.current.position.set(0, 0, 0); }
      if (left.current) left.current.rotation.z = 0;
      if (right.current) right.current.rotation.z = 0;
      return;
    }
    const t = clock.elapsedTime;
    if (character.current) {
      const x = Math.sin(t * 0.18) * 0.14;
      character.current.position.set(x, -0.5 * x * x, 0);
      character.current.rotation.y = Math.sin(t * 0.3) * 0.35;
    }
    if (left.current) left.current.rotation.z = Math.sin(t * 1.2) * 0.45;
    if (right.current) right.current.rotation.z = -Math.sin(t * 1.2) * 0.45;
  });
  return <group ref={character} scale={0.38}>
    <mesh position={[0, 0.5, 0]} scale={[0.84, 1, 0.76]}><sphereGeometry args={[0.5, 24, 16]} /><meshStandardMaterial color="#F0CFA6" roughness={1} /></mesh>
    {[-1, 1].map((side) => <group key={side} ref={side < 0 ? left : right} position={[side * 0.37, 0.44, 0]}><mesh position={[side * 0.11, 0, 0]} scale={[0.25, 0.14, 0.14]}><sphereGeometry /><meshStandardMaterial color="#F0CFA6" roughness={1} /></mesh></group>)}
    {[-1, 1].map((side) => <group key={side}>
      <mesh position={[side * 0.15, 0.05, 0.06]} scale={[0.17, 0.1, 0.2]}><sphereGeometry /><meshStandardMaterial color="#F0CFA6" roughness={1} /></mesh>
      <mesh position={[side * 0.13, 0.68, 0.35]} scale={[0.025, 0.035, 0.015]}><sphereGeometry /><meshStandardMaterial color="#3A261C" roughness={1} /></mesh>
      <mesh position={[side * 0.23, 0.57, 0.32]} scale={[0.05, 0.035, 0.015]}><sphereGeometry /><meshStandardMaterial color="#F2A99B" roughness={1} /></mesh>
    </group>)}
    <mesh position={[0, 0.37, 0.37]} rotation={[0, 0, 0.55]} scale={[0.1, 0.43, 0.025]}><boxGeometry /><meshStandardMaterial color="#5263BD" roughness={1} /></mesh>
    <mesh position={[-0.04, 0.39, 0.4]} scale={0.06}><sphereGeometry /><meshStandardMaterial color="#FCCF7B" roughness={1} /></mesh>
  </group>;
}
