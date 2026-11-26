import './threeCompat';
import { useEffect, useMemo } from 'react';
import { SphereGeometry } from 'three';
import { Canvas, useThree } from '@react-three/fiber/native';
import { Aroomi } from './Aroomi';
import type { PlanetScene as Scene } from './model';

function CameraZoom({ zoom }: { zoom: number }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  useEffect(() => { if (size.width && size.height) camera.position.z = 1 / (0.62 * Math.tan(Math.PI / 12) * (size.width / size.height) * zoom); camera.updateProjectionMatrix(); }, [camera, size.width, size.height, zoom]);
  return null;
}

function Potato({ ground }: { ground: string }) {
  const geometry = useMemo(() => {
    const sphere = new SphereGeometry(1, 48, 32); const positions = sphere.getAttribute('position');
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i); const y = positions.getY(i); const z = positions.getZ(i);
      const scale = 1 + 0.035 * Math.sin(x * 5 + z * 3) * Math.sin(y * 5 - z * 2);
      positions.setXYZ(i, x * scale, y * scale, z * scale);
    }
    sphere.computeVertexNormals(); return sphere;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} scale={[1, 0.94, 0.96]}><meshStandardMaterial color={ground} roughness={1} /></mesh>;
}

export function PlanetScene({ scene, reducedMotion }: { scene: Scene; reducedMotion: boolean }) {
  const { theme, timeOfDay, camera } = scene;
  return <Canvas camera={{ fov: 30, position: [0, 0, 6 / camera.zoom] }}>
    <CameraZoom zoom={camera.zoom} />
    <ambientLight intensity={1.55} color="#FFF4DF" />
    <directionalLight position={[-3, 5, 4]} intensity={1.75} color={timeOfDay === 'day' ? '#FFF4DF' : '#C9B8E8'} />
    <directionalLight position={[3, -2, 3]} intensity={0.35} color="#AACBE2" />
    <group rotation={[camera.pitch, camera.yaw, 0]}>
      <Potato ground={theme.ground[1]} />
      <mesh scale={[1.005, 0.945, 0.965]}><sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, 0.78]} /><meshStandardMaterial color={theme.cap[0]} roughness={1} /></mesh>
      <Aroomi reducedMotion={reducedMotion} />
    </group>
  </Canvas>;
}
