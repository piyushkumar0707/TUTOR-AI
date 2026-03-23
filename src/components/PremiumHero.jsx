import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const heroCopy = {
  badge: 'MIDNIGHT SCHOLAR EXPERIENCE',
  titlePrefix: 'Your personal',
  titleHighlight: 'AI Tutor',
  subtitle:
    'Ask questions, take quizzes, generate assignments — powered by cutting-edge AI and built for real learning.',
};

function buildNetwork(nodeCount = 190, radius = 2.5) {
  const nodes = [];

  for (let i = 0; i < nodeCount; i += 1) {
    const t = i / nodeCount;
    const angle = t * Math.PI * 10.5;
    const spiral = 0.35 + Math.sin(t * Math.PI * 7) * 0.25;

    const x = Math.cos(angle) * radius * spiral + (Math.random() - 0.5) * 0.28;
    const y = Math.sin(angle * 0.63) * radius * 0.75 + (Math.random() - 0.5) * 0.3;
    const z = Math.sin(angle) * radius * spiral + (Math.random() - 0.5) * 0.24;

    nodes.push(new THREE.Vector3(x, y, z));
  }

  const nodePositions = new Float32Array(nodeCount * 3);
  nodes.forEach((node, idx) => {
    nodePositions[idx * 3] = node.x;
    nodePositions[idx * 3 + 1] = node.y;
    nodePositions[idx * 3 + 2] = node.z;
  });

  const connectionPositions = [];
  const maxDistance = 1.05;
  const maxLinksPerNode = 3;

  for (let i = 0; i < nodes.length; i += 1) {
    let links = 0;
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (links >= maxLinksPerNode) break;

      const dist = nodes[i].distanceTo(nodes[j]);
      if (dist < maxDistance) {
        connectionPositions.push(
          nodes[i].x,
          nodes[i].y,
          nodes[i].z,
          nodes[j].x,
          nodes[j].y,
          nodes[j].z,
        );
        links += 1;
      }
    }
  }

  return {
    nodePositions,
    connectionPositions: new Float32Array(connectionPositions),
  };
}

function NeuralKnowledgeNetwork({ mobile }) {
  const groupRef = useRef(null);
  const driftRef = useRef({ x: 0, y: 0 });

  const { nodePositions, connectionPositions } = useMemo(() => buildNetwork(), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += delta * 0.07;
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.08;

    driftRef.current.x = THREE.MathUtils.lerp(driftRef.current.x, state.mouse.x * 0.4, 0.05);
    driftRef.current.y = THREE.MathUtils.lerp(driftRef.current.y, state.mouse.y * 0.28, 0.05);

    group.position.x = driftRef.current.x;
    group.position.y = driftRef.current.y;
  });

  return (
    <group ref={groupRef} scale={mobile ? 0.78 : 1}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={connectionPositions.length / 3}
            array={connectionPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#c9abff" transparent opacity={0.18} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodePositions.length / 3}
            array={nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#bd9dff"
          size={mobile ? 0.045 : 0.055}
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points rotation={[0.3, -0.2, 0.1]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodePositions.length / 3}
            array={nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ff97b2"
          size={mobile ? 0.026 : 0.032}
          sizeAttenuation
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function HeroCanvas({ mobile }) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 6.8], fov: 52 }}
      className="absolute inset-0"
    >
      <NeuralKnowledgeNetwork mobile={mobile} />

      <EffectComposer>
        <Bloom
          intensity={2.4}
          luminanceThreshold={0.08}
          luminanceSmoothing={0.35}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.14,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] },
  },
};

export default function PremiumHero({ onPrimaryClick, onSecondaryClick }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#0d0d18] text-[#e9e6f7]">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_22%,rgba(189,157,255,0.17),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,151,178,0.14),transparent_42%),linear-gradient(180deg,#0d0d18_0%,#090913_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-95">
        <HeroCanvas mobile={isMobile} />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center px-6 pb-14 pt-24 md:px-10 lg:grid-cols-2 lg:gap-10 lg:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-2xl"
        >
          <motion.p
            variants={itemVariants}
            className="mb-7 inline-flex rounded-full border border-[#bd9dff]/35 bg-[#12121e]/70 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-[#cdb8ff] backdrop-blur-md"
          >
            {heroCopy.badge}
          </motion.p>

          <motion.h1 variants={itemVariants} className="text-4xl font-black leading-[1.06] sm:text-5xl lg:text-6xl">
            <span>{heroCopy.titlePrefix} </span>
            <motion.span
              className="bg-gradient-to-r from-[#bd9dff] via-[#d8b5ff] to-[#ff97b2] bg-[length:180%_180%] bg-clip-text text-transparent"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
            >
              {heroCopy.titleHighlight}
            </motion.span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-xl text-base leading-relaxed text-[#c3c1d2] sm:text-lg"
          >
            {heroCopy.subtitle}
          </motion.p>

          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPrimaryClick}
              className="rounded-xl bg-gradient-to-r from-[#bd9dff] to-[#ff97b2] px-7 py-3.5 text-sm font-bold text-[#09090f] shadow-[0_0_36px_rgba(189,157,255,0.48)] transition-shadow hover:shadow-[0_0_48px_rgba(255,151,178,0.52)] sm:text-base"
            >
              Start Learning Free
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSecondaryClick}
              className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-[#e9e6f7] backdrop-blur-xl transition hover:border-[#bd9dff]/50 hover:bg-white/10 sm:text-base"
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>

        <div className="relative mt-16 h-[360px] lg:mt-0 lg:h-[520px]">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="absolute right-0 top-8 w-[78%] rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#aba9b9]">Live chat</p>
            <p className="mt-2 text-sm font-medium text-[#f0eefb] sm:text-base">Explain quantum physics...</p>
            <p className="mt-1 text-xs text-[#cbc9d8]">TutorAI is crafting a step-by-step explanation.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
            className="absolute left-6 top-44 w-[68%] rounded-2xl border border-[#bd9dff]/35 bg-[#1b1a2a]/55 p-4 backdrop-blur-2xl"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#c4b9e8]">Quiz result</p>
            <p className="mt-2 text-base font-semibold text-[#f4f0ff]">Score: 5/5 🌟</p>
            <p className="mt-1 text-xs text-[#d0cde0]">Mastery unlocked in 4m 12s.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7 }}
            className="absolute bottom-5 right-8 w-[62%] rounded-2xl border border-[#ff97b2]/35 bg-[#201926]/55 p-4 backdrop-blur-xl"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#f0b5c7]">Assignment</p>
            <p className="mt-2 text-sm font-medium text-[#ffe6ee]">AI-generated notes ready as PDF.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
