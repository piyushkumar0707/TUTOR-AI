import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

export default function NeuralMesh() {
  const ref = useRef();

  const nodes = useMemo(() => {
    return Array.from({ length: 60 }, () => [
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
    ]);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (ref.current) {
      ref.current.rotation.y += 0.001;

      ref.current.children.forEach((node, i) => {
        const pulse = Math.sin(t + i) * 0.3 + 1;
        node.material.emissiveIntensity = pulse;
      });
    }
  });

  return (
    <group ref={ref}>
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color="#bd9dff"
            emissive="#8a4cfc"
            emissiveIntensity={1}
          />
        </mesh>
      ))}
    </group>
  );
}