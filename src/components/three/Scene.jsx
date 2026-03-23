import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import BrainMesh from './BrainMesh';
import ParticleField from './ParticleField';

export default function Scene() {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.1], fov: 48 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.38} color="#f5e7ff" />
        <directionalLight position={[3, 4, 2]} intensity={1.1} color="#ffffff" castShadow />
        <pointLight position={[-3, -2, 3]} intensity={1.35} color="#bd9dff" />
        <pointLight position={[2.5, 1, -1.5]} intensity={0.9} color="#ff97b2" />

        <ParticleField />
        <BrainMesh />

        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 2.8}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Canvas>
    </div>
  );
}
