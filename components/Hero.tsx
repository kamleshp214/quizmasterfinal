import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useQuizStore } from '../store/useQuizStore';

export const Hero = () => {
  const startSetup = useQuizStore(s => s.startSetup);
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-glow/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-glow/10 rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateY,
          rotateX,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full max-w-2xl aspect-[1.6/1] rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center p-8 md:p-12 text-center"
      >
        <div 
          style={{ transform: "translateZ(75px)" }} 
          className="flex flex-col items-center gap-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-glow" />
            <span className="text-xs font-mono tracking-widest text-gray-300 uppercase">AI Knowledge Engine</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter text-white leading-[0.9]">
            Master Any <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-glow to-cyan-glow">
              Concept.
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-md font-light">
            Transform static documents into dynamic, intelligent assessments. 
            Instant feedback. Deep mastery.
          </p>

          <motion.button
            onClick={startSetup}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 px-8 py-4 bg-white text-black font-bold rounded-xl flex items-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow"
          >
            Initialize Quiz
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
};