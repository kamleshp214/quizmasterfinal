import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '../store/useQuizStore';
import { clsx } from 'clsx';

export const QuizGame = () => {
  const { questions, addAnswer, setView } = useQuizStore();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [reveal, setReveal] = useState(false);

  const q = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  const handleSubmit = () => {
    setReveal(true);
    setTimeout(() => {
      const isCorrect = selected.toLowerCase().trim() === q.answer.toLowerCase().trim();
      addAnswer({
        questionId: q.id,
        questionText: q.text,
        userValue: selected,
        correctValue: q.answer,
        isCorrect
      });

      if (index < questions.length - 1) {
        setIndex(i => i + 1);
        setSelected('');
        setReveal(false);
      } else {
        setView('RESULTS');
      }
    }, 1500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress */}
      <div className="h-1 w-full bg-white/10 mb-12">
        <motion.div 
          animate={{ width: `${progress}%` }}
          className="h-full bg-neon-cyan shadow-[0_0_10px_#06b6d4]"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-8 md:p-12 rounded-3xl"
        >
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 block">
            Question {index + 1} of {questions.length}
          </span>
          
          <h2 className="text-3xl font-bold mb-10 leading-tight">{q.text}</h2>

          <div className="space-y-4">
            {q.type === 'MCQ' && q.options.map(opt => {
              const isSelected = selected === opt;
              const isCorrect = opt === q.answer;
              let style = "border-white/10 text-gray-400 hover:bg-white/5";

              if (reveal) {
                if (isCorrect) style = "bg-green-500/20 border-green-500 text-green-400";
                else if (isSelected) style = "bg-red-500/20 border-red-500 text-red-400";
              } else if (isSelected) {
                style = "bg-neon-cyan/10 border-neon-cyan text-white";
              }

              return (
                <button
                  key={opt}
                  onClick={() => !reveal && setSelected(opt)}
                  className={clsx("w-full p-6 text-left border rounded-xl transition-all", style)}
                >
                  {opt}
                </button>
              );
            })}

            {q.type === 'TF' && ['True', 'False'].map(opt => (
              <button
                key={opt}
                onClick={() => !reveal && setSelected(opt)}
                className={clsx(
                  "w-full p-6 text-left border rounded-xl transition-all mb-4",
                  selected === opt ? "bg-neon-cyan/10 border-neon-cyan text-white" : "border-white/10 text-gray-400 hover:bg-white/5"
                )}
              >
                {opt}
              </button>
            ))}

            {q.type === 'FIB' && (
              <input 
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                placeholder="Type your answer..."
                className="w-full bg-transparent border-b border-white/20 p-4 text-2xl outline-none focus:border-neon-cyan transition-colors"
              />
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!selected || reveal}
              className="px-8 py-3 bg-white text-black font-bold rounded-full disabled:opacity-0 transition-opacity"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};