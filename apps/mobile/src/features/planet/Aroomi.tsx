import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { Vector3 } from 'three';
import type { Group, Mesh, Object3D } from 'three';
import { bodyFront, makeAroomiBody, makeAroomiKnot, makeAroomiScarf, swingArms } from './aroomiBody';
import { newLife, newPose, restPose, stepLife } from './aroomiLife';

const SIZE = 0.38;
// Scratch vectors, so the frame loop allocates nothing.
const foot = new Vector3(); const head = new Vector3();

/** A tap on the planet view, in view points. `n` changes with every tap. */
export type Poke = { x: number; y: number; n: number };

// Seat a part on the front of the body, turned to face along the surface normal.
function seat(part: Object3D, x: number, y: number, lift = 0) {
  const { z, normal } = bodyFront(x, y);
  part.position.set(x + normal[0] * lift, y + normal[1] * lift, z + normal[2] * lift);
  part.rotation.set(-Math.asin(normal[1]), Math.atan2(normal[0], normal[2]), 0, 'YXZ');
}
// The face: where each part rests. A look moves them all across the body, since there is no neck to turn.
const FACE = [[-0.13, 0.68], [0.13, 0.68], [-0.2, 0.61], [0.2, 0.61], [0, 0.63]] as const;
const GAZE_REACH = 0.36;

// Temporary generated model; replace this component when the owner's GLB is available.
export function Aroomi({ reducedMotion, wander = 1, poke }: { reducedMotion: boolean; wander?: number; poke?: Poke }) {
  const character = useRef<Group>(null); const tails = useRef<Mesh>(null); const face = useRef<(Object3D | null)[]>([]);
  const body = useMemo(makeAroomiBody, []); const scarf = useMemo(makeAroomiScarf, []); const knot = useMemo(makeAroomiKnot, []);
  const life = useMemo(() => newLife(Math.random() * 2 ** 32), []); const pose = useMemo(newPose, []); const poked = useRef(poke?.n ?? 0);
  useEffect(() => () => { body.geometry.dispose(); scarf.dispose(); knot.geometry.dispose(); }, [body, scarf, knot]);
  useFrame(({ clock, camera, size }) => {
    const figure = character.current; if (!figure?.parent) return;
    const t = clock.elapsedTime; const x = reducedMotion ? 0 : Math.sin(t * 0.18) * 0.14 * wander;
    if (reducedMotion) restPose(pose);
    else {
      let hit = false;
      if (poke && poke.n !== poked.current) {
        poked.current = poke.n;
        figure.localToWorld(foot.set(0, 0, 0)).project(camera); figure.localToWorld(head.set(0, 1, 0)).project(camera);
        const height = Math.hypot(head.x - foot.x, head.y - foot.y) * size.height / 2;
        hit = Math.abs(poke.x - ((foot.x + head.x) / 4 + 0.5) * size.width) < height * 0.7 && Math.abs(poke.y - (0.5 - (foot.y + head.y) / 4) * size.height) < height * 0.8;
      }
      figure.parent.worldToLocal(foot.copy(camera.position));
      stepLife(life, pose, t, Math.atan2(foot.x, foot.z), hit);
    }
    const girth = SIZE / Math.sqrt(pose.stretch);
    figure.position.set(x, -0.5 * x * x + pose.lift * SIZE, 0);
    figure.rotation.set(0, pose.turn * wander, pose.lean);
    figure.scale.set(girth, SIZE * pose.stretch, girth);
    for (let i = 0; i < FACE.length; i += 1) {
      const part = face.current[i]; if (!part) continue;
      seat(part, FACE[i]![0] + pose.gazeYaw * GAZE_REACH, FACE[i]![1] + pose.gazePitch * GAZE_REACH);
      if (i < 2) part.scale.y = 0.035 * pose.eyes;
    }
    tails.current?.rotation.set(0, pose.tailSwing, -pose.tailLift);
    swingArms(body, pose.arms);
  });
  return <group ref={character} scale={SIZE}>
    <mesh geometry={body.geometry}><meshStandardMaterial color="#F0CFA6" roughness={1} /></mesh>
    {[0, 1].map((i) => <mesh key={i} ref={(part) => { face.current[i] = part; }} scale={[0.025, 0.035, 0.012]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#3A261C" roughness={1} /></mesh>)}
    {[2, 3].map((i) => <mesh key={i} ref={(part) => { face.current[i] = part; }} scale={[0.05, 0.035, 0.008]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#F2A99B" roughness={1} /></mesh>)}
    {/* Smile traced from design/mascot/vector/icon_face_A.svg: 0.092 wide, 0.016 thick, its lowest point 0.05 under the eye line. */}
    <group ref={(part) => { face.current[4] = part; }}>
      <mesh position={[0, 0.054, 0]} rotation={[0, 0, -Math.PI / 2 - 0.76]} scale={[1, 1, 0.6]}><torusGeometry args={[0.054, 0.008, 6, 12, 1.52]} /><meshStandardMaterial color="#3A261C" roughness={1} /></mesh>
    </group>
    <mesh geometry={scarf}><meshStandardMaterial color="#5263BD" roughness={1} /></mesh>
    <mesh ref={tails} geometry={knot.geometry} position={knot.at}><meshStandardMaterial color="#5263BD" roughness={1} /></mesh>
    <mesh ref={(part) => { if (part) seat(part, -0.2, 0.41, 0.02); }} scale={[0.055, 0.055, 0.02]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#FCCF7B" roughness={1} /></mesh>
  </group>;
}
