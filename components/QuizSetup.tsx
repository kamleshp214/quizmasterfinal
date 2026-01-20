import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, Loader2 } from 'lucide-react';
import { useQuizStore, QuestionType } from '../store/useQuizStore';
import { generateQuiz, extractTextFromPDF } from '../services/geminiService';
import { clsx } from 'clsx';

export const QuizSetup = () => {
  const startQuiz = useQuizStore(s => s.startQuiz);
  const [mode, setMode] = useState<'topic' | 'file'>('topic');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<QuestionType[]>(['MCQ']);

  const toggleType = (t: QuestionType) => {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleStart = async () => {
    if (!types.length) return;
    setLoading(true);
    try {
      let content = topic;
      if (mode === 'file' && file) {
        content = await extractTextFromPDF(file);
      }
      const questions = await generateQuiz(topic || file?.name || 'General', content, types);
      startQuiz(topic || file?.name || 'Quiz', questions);
    } catch (e) {
      alert("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto glass-card rounded-3xl p-8"
    >
      <h2 className="text-3xl font-bold mb-8">Configure Session</h2>

      {/* Mode Toggles */}
      <div className="flex p-1 bg-white/5 rounded-xl mb-8">
        <button 
          onClick={() => setMode('topic')}
          className={clsx("flex-1 py-3 rounded-lg font-medium transition-colors", mode === 'topic' ? "bg-white/10 text-white" : "text-gray-500")}
        >
          Topic Mode
        </button>
        <button 
          onClick={() => setMode('file')}
          className={clsx("flex-1 py-3 rounded-lg font-medium transition-colors", mode === 'file' ? "bg-white/10 text-white" : "text-gray-500")}
        >
          Upload PDF
        </button>
      </div>

      {/* Inputs */}
      <div className="mb-8 min-h-[150px]">
        {mode === 'topic' ? (
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic or paste text..."
            className="w-full h-32 bg-transparent border-b border-white/20 text-xl focus:outline-none focus:border-neon-cyan transition-colors resize-none placeholder-gray-600"
          />
        ) : (
          <div className="border-2 border-dashed border-white/20 rounded-xl h-32 flex flex-col items-center justify-center text-gray-400 hover:border-white/40 hover:bg-white/5 transition-all relative">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            {file ? (
              <div className="flex items-center gap-2 text-neon-cyan">
                <FileText /> {file.name}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="mb-2" />
                <span>Drop PDF Here</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Types */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(['MCQ', 'TF', 'FIB'] as QuestionType[]).map(t => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={clsx(
              "p-4 rounded-xl border font-bold flex flex-col items-center gap-2 transition-all",
              types.includes(t) ? "bg-white text-black border-white" : "border-white/10 text-gray-500 hover:bg-white/5"
            )}
          >
            {t}
            {types.includes(t) && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={loading || (!topic && !file)}
        className="w-full py-4 bg-gradient-to-r from-neon-violet to-neon-cyan rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Initiate Sequence"}
      </button>
    </motion.div>
  );
};