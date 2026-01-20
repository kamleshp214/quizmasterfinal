import React, { useEffect } from 'react';
import { useQuizStore } from '../store/useQuizStore';
import { generateCriticism } from '../services/geminiService';
import { BrainCircuit, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export const Results = () => {
  const { topic, answers, questions, aiFeedback, setFeedback, reset } = useQuizStore();
  const correct = answers.filter(a => a.isCorrect).length;
  const score = Math.round((correct / questions.length) * 100);

  useEffect(() => {
    const run = async () => {
      const mistakes = answers.filter(a => !a.isCorrect);
      const text = await generateCriticism(topic, mistakes);
      setFeedback(text);
    };
    run();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Score Card */}
        <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center">
          <div className="text-6xl font-display font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            {score}%
          </div>
          <p className="text-gray-400 uppercase tracking-widest text-sm">Accuracy</p>
        </div>

        {/* The Truth Section */}
        <div className="md:col-span-2 glass-card p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <BrainCircuit className="w-32 h-32 text-neon-violet" />
          </div>
          
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-neon-violet">
            <BrainCircuit className="w-5 h-5" />
            AI Analysis
          </h3>
          
          <div className="relative z-10 text-gray-300 leading-relaxed text-lg">
            {aiFeedback ? (
              aiFeedback
            ) : (
              <span className="animate-pulse">Analyzing your cognitive patterns...</span>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {answers.map((a, i) => (
          <div key={i} className="p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between">
            <div className="flex-1 pr-4">
              <p className="text-gray-400 text-sm mb-1">{a.questionText}</p>
              <div className="flex items-center gap-4">
                <span className={a.isCorrect ? "text-green-400" : "text-red-400 line-through"}>
                  {a.userValue}
                </span>
                {!a.isCorrect && <span className="text-green-400">{a.correctValue}</span>}
              </div>
            </div>
            {a.isCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button 
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset Simulation
        </button>
      </div>
    </div>
  );
};