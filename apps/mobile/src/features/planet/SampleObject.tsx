export function SampleObject() {
  return <group>
    <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.045, 0.06, 0.24, 7]} /><meshStandardMaterial color="#A97958" roughness={1} /></mesh>
    <mesh position={[0, 0.34, 0]}><icosahedronGeometry args={[0.19, 0]} /><meshStandardMaterial color="#A8C58C" roughness={1} /></mesh>
  </group>;
}
