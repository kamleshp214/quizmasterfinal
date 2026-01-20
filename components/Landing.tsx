import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useQuizStore } from '../store/useQuizStore';

export const Landing = () => {
  const setView = useQuizStore(s => s.setView);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
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
    <div className="flex flex-col items-center justify-center min-h-[85vh] perspective-1000 p-4">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl"
      >
        <div style={{ transform: "translateZ(50px)" }} className="flex flex-col items-center text-center">
          <div className="mb-6 p-3 bg-neon-cyan/10 rounded-full border border-neon-cyan/30">
            <Sparkles className="w-6 h-6 text-neon-cyan" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-white leading-tight">
            Master Any <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-violet to-neon-cyan">
              Concept
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-md">
            Upload your documents. Our AI Architect constructs the perfect assessment to test your knowledge gaps.
          </p>

          <button
            onClick={() => setView('SETUP')}
            className="relative z-50 cursor-pointer px-8 py-4 bg-white text-obsidian font-bold rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
          >
            Launch Studio
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Shine Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
};