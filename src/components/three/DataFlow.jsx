import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function DataFlow() {
  const ref = useRef();

  useFrame(() => {
    ref.current.rotation.y += 0.0005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={400}
          array={new Float32Array(
            Array.from({ length: 1200 }, () => (Math.random() - 0.5) * 6)
          )}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.015}
        color="#ffffff"
        opacity={0.25}
        transparent
        depthWrite={false}
      />
    </points>
  );
}