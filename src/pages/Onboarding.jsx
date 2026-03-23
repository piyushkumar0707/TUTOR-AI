import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PremiumHero from '../components/PremiumHero';

export default function Onboarding() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);

    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const sectionReveal = {
    hidden: { opacity: 0, y: 36 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: isMobile ? 0.52 : 0.85, ease: [0.2, 0.8, 0.2, 1] },
    },
  };

  const staggerGroup = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: isMobile ? 0.02 : 0.12,
        staggerChildren: isMobile ? 0.08 : 0.15,
      },
    },
  };

  const itemReveal = {
    hidden: { opacity: 0, y: 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: isMobile ? 0.42 : 0.62, ease: [0.22, 0.8, 0.25, 1] },
    },
  };

  const featureCards = [
    {
      title: 'AI Chat Mentor',
      desc: 'Ask complex questions and get guided explanations with practical examples.',
      tone: 'border-[#bd9dff]/25 bg-[#151426]/70',
    },
    {
      title: 'Adaptive Quizzes',
      desc: 'Auto-generated quizzes that reinforce weak topics and sharpen recall.',
      tone: 'border-[#8a4cfc]/30 bg-[#17142b]/70',
    },
    {
      title: 'Assignment Builder',
      desc: 'Create structured notes and polished assignments ready for submission.',
      tone: 'border-[#ff97b2]/25 bg-[#211727]/70',
    },
  ];

  return (
    <div className="bg-[#050509] text-white min-h-screen overflow-x-hidden font-['Plus_Jakarta_Sans']">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/30">
        <div className="flex justify-between items-center h-20 px-8 max-w-[1400px] mx-auto">
          <span className="text-lg font-bold text-primary">TutorAI</span>
          <button
            onClick={() => navigate('/signin')}
            className="px-5 py-2 bg-primary rounded-md text-sm font-semibold"
          >
            Log in
          </button>
        </div>
      </nav>

      <PremiumHero
        onPrimaryClick={() => navigate('/signup')}
        onSecondaryClick={() => navigate('/signin')}
      />

      {/* STORY SECTION */}
      <motion.section
        className="relative overflow-hidden px-6 py-24 md:px-10"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: isMobile ? 0.16 : 0.28 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(189,157,255,0.14),transparent_44%),radial-gradient(circle_at_85%_70%,rgba(255,151,178,0.12),transparent_40%)]" />

        <motion.div
          className="relative mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#0f0f1b]/80 p-8 text-center backdrop-blur-xl md:p-12"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: isMobile ? 0.18 : 0.3 }}
        >
          <motion.p
            variants={itemReveal}
            className="mx-auto mb-5 inline-flex rounded-full border border-[#bd9dff]/35 bg-[#18172b]/70 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-[#cfbeff]"
          >
            LEARNING, REIMAGINED
          </motion.p>

          <motion.h2
            variants={itemReveal}
            className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-[#f4f2ff] md:text-5xl"
          >
            Build deep understanding, not shallow memorization.
          </motion.h2>

          <motion.p
            variants={itemReveal}
            className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-[#b8b6c8] md:text-lg"
          >
            TutorAI transforms your questions into structured learning paths, then validates progress with
            adaptive quizzes and assignment-ready outputs.
          </motion.p>

          <motion.div variants={staggerGroup} className="mt-10 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            <motion.div variants={itemReveal} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs tracking-[0.12em] text-[#a8a4bb]">Response speed</p>
              <p className="mt-2 text-2xl font-bold text-[#f0ebff]">2.1s avg</p>
            </motion.div>
            <motion.div variants={itemReveal} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs tracking-[0.12em] text-[#a8a4bb]">Quiz completion</p>
              <p className="mt-2 text-2xl font-bold text-[#f0ebff]">94%</p>
            </motion.div>
            <motion.div variants={itemReveal} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs tracking-[0.12em] text-[#a8a4bb]">Learner satisfaction</p>
              <p className="mt-2 text-2xl font-bold text-[#f0ebff]">4.9/5</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* FEATURES */}
      <motion.section
        className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-3 md:px-10"
        variants={staggerGroup}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: isMobile ? 0.14 : 0.2 }}
      >
        {featureCards.map((f) => (
          <motion.article
            key={f.title}
            variants={itemReveal}
            className={`group rounded-2xl border p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#bd9dff]/45 ${f.tone}`}
          >
            <div className="mb-4 h-9 w-9 rounded-lg bg-gradient-to-br from-[#bd9dff] to-[#ff97b2] opacity-90 shadow-[0_0_24px_rgba(189,157,255,0.5)]" />
            <h3 className="text-xl font-semibold text-[#f2edff]">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#bbb8cc]">{f.desc}</p>
          </motion.article>
        ))}
      </motion.section>

      {/* CTA */}
      <motion.section
        className="px-6 pb-28 pt-24 md:px-10"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: isMobile ? 0.2 : 0.35 }}
      >
        <motion.div
          className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[linear-gradient(140deg,rgba(189,157,255,0.16),rgba(255,151,178,0.1))] p-8 text-center backdrop-blur-2xl md:p-14"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: isMobile ? 0.24 : 0.4 }}
        >
          <motion.h2 variants={itemReveal} className="text-3xl font-extrabold text-[#faf7ff] md:text-5xl">Ready to elevate your learning?</motion.h2>
          <motion.p variants={itemReveal} className="mx-auto mt-4 max-w-2xl text-sm text-[#d0cadf] md:text-lg">
            Join TutorAI and convert curiosity into measurable results with your personal AI tutor.
          </motion.p>

          <motion.div variants={itemReveal} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <motion.button
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl bg-gradient-to-r from-[#bd9dff] to-[#ff97b2] px-8 py-4 text-sm font-bold text-[#08080d] shadow-[0_0_36px_rgba(189,157,255,0.48)] transition hover:scale-[1.02] hover:shadow-[0_0_48px_rgba(255,151,178,0.55)] md:text-base"
            >
              Create Account
            </motion.button>
            <motion.button
              onClick={() => navigate('/signin')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border border-white/25 bg-white/5 px-8 py-4 text-sm font-semibold text-[#f3efff] backdrop-blur-xl transition hover:border-[#bd9dff]/55 hover:bg-white/10 md:text-base"
            >
              Sign In
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.section>

    </div>
  );
}