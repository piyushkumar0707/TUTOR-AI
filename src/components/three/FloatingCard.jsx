import { Html } from '@react-three/drei';

export default function FloatingCard({ position, title }) {
  return (
    <Html position={position} center>
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-white text-sm shadow-lg">
        {title}
      </div>
    </Html>
  );
}