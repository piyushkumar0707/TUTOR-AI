import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import NeuralMesh from './NeuralMesh';
import DataFlow from './DataFlow';

function CameraMotion() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.x = Math.sin(t * 0.15) * 0.2;
    state.camera.position.y = Math.cos(t * 0.15) * 0.2;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 55 }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#8a4cfc" />

      <NeuralMesh />
      <DataFlow />

      <CameraMotion />

      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.2} />
      </EffectComposer>
    </Canvas>
  );
}