import './threeCompat';
import { useEffect, useMemo, type ReactNode } from 'react';
import { SphereGeometry } from 'three';
import { Canvas, useThree } from '@react-three/fiber/native';
import type { RootState } from '@react-three/fiber/native';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { Platform } from 'react-native';
import { Aroomi, type Poke } from './Aroomi';
import { SurfaceAnchor } from './SurfaceAnchor';
import { potatoRadius, type PlanetScene as Scene } from './model';
import type { Placement } from './placement';
import { cameraRig, initialWalker, planetOrientation, walkerPose, type Walker } from './walk';

function prepareRenderer({ gl }: RootState) {
  if (Platform.OS !== 'ios') return;
  const context = gl.getContext() as ExpoWebGLRenderingContext;
  const endFrame = context.endFrameEXP;
  // The iOS simulator needs scene draws submitted before each presentation.
  context.endFrameEXP = () => {
    if (gl.info.render.calls) context.flushEXP();
    endFrame.call(context);
  };
}

function CameraRig({ zoom, scale, blend }: { zoom: number; scale: number; blend: number }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  useEffect(() => {
    if (size.width && size.height) { const rig = cameraRig(zoom, size.width / size.height, scale, blend); camera.position.set(...rig.position); camera.lookAt(...rig.target); }
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, zoom, scale, blend]);
  return null;
}

function Potato({ ground }: { ground: string }) {
  const geometry = useMemo(() => {
    const sphere = new SphereGeometry(1, 48, 32); const positions = sphere.getAttribute('position');
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i); const y = positions.getY(i); const z = positions.getZ(i);
      const scale = potatoRadius(x, y, z);
      positions.setXYZ(i, x * scale, y * scale, z * scale);
    }
    sphere.computeVertexNormals(); return sphere;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} scale={[1, 0.94, 0.96]}><meshStandardMaterial color={ground} roughness={1} /></mesh>;
}

export function PlanetScene({ scene, reducedMotion, objects, placements = [], scale = 1, walker = initialWalker, walkBlend = 0, poke }: { scene: Scene; reducedMotion: boolean; objects?: ReactNode; placements?: ReadonlyArray<Placement & { content: ReactNode }>; scale?: number; walker?: Walker; walkBlend?: number; poke?: Poke }) {
  const { theme, timeOfDay, camera } = scene; const pose = walkerPose(walker, scale);
  return <Canvas onCreated={prepareRenderer} frameloop={reducedMotion ? 'demand' : 'always'} camera={{ fov: 30, position: [0, 0, 6 / camera.zoom] }}>
    <CameraRig zoom={camera.zoom} scale={scale} blend={walkBlend} />
    <ambientLight intensity={1.55} color="#FFF4DF" />
    <directionalLight position={[-3, 5, 4]} intensity={1.75} color={timeOfDay === 'day' ? '#FFF4DF' : '#C9B8E8'} />
    <directionalLight position={[3, -2, 3]} intensity={0.35} color="#AACBE2" />
    <group quaternion={planetOrientation(camera, walker, walkBlend)}>
      <group scale={scale}><Potato ground={theme.ground[1]} />
      <mesh scale={[1.005, 0.945, 0.965]}><sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, 0.78]} /><meshStandardMaterial color={theme.cap[0]} roughness={1} /></mesh></group>
      <group position={pose.position} quaternion={pose.quaternion}><Aroomi reducedMotion={reducedMotion} wander={1 - walkBlend} poke={poke} /></group>
      <group name="planet-objects">{objects}{placements.map((item) => <SurfaceAnchor key={item.id} latitude={item.latitude} longitude={item.longitude} heading={item.heading} surfaceScale={scale}>{item.content}</SurfaceAnchor>)}</group>
    </group>
  </Canvas>;
}
