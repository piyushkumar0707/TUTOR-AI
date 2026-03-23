import { Stars } from '@react-three/drei';

export default function ParticleField() {
  return (
    <Stars
      radius={65}
      depth={28}
      count={1800}
      factor={3.2}
      saturation={0}
      fade
      speed={0.65}
    />
  );
}
