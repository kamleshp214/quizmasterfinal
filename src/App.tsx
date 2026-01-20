
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  FileText, 
  Play, 
  RotateCcw, 
  Check, 
  X, 
  Loader2, 
  Plus,
  BookOpen,
  ArrowLeft,
  Settings2,
  Trophy,
  Brain
} from 'lucide-react';
import { extractTextFromPDF, generateQuiz, generateCriticism, Question } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Component: GlassCard ---
// Typed with React.FC to fix children and key property errors in JSX
const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("glass rounded-[28px] p-6 shadow-2xl overflow-hidden", className)}>
    {children}
  </div>
);

// --- Component: iOS Button ---
// Typed with React.FC to fix children property errors in JSX
const IOSButton: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled,
  isLoading
}) => {
  const variants = {
    primary: "bg-[#007aff] text-white shadow-blue-500/25",
    secondary: "bg-white/10 dark:bg-white/10 text-black dark:text-white border border-white/10",
    ghost: "bg-transparent text-[#007aff]",
    danger: "bg-red-500 text-white shadow- red-500/25"
  };

  return (
    <button 
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(
        "ios-transition relative flex items-center justify-center gap-2 font-semibold text-lg rounded-[18px] py-4 px-8 tap-highlight active:scale-[0.97] disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
};

// --- Main App ---
export default function App() {
  const [view, setView] = useState<'landing' | 'setup' | 'game' | 'results'>('landing');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<('MCQ' | 'TF' | 'FIB')[]>(['MCQ']);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{questionId: number, answer: string, isCorrect: boolean}[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  // Spring animation settings for that iOS bounce
  const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 };

  const handleStartSetup = () => setView('setup');

  // Added missing resetGame function to fix reference errors
  const resetGame = () => {
    setView('landing');
    setTopic('');
    setFile(null);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers([]);
    setAiFeedback('');
    setSelectedTypes(['MCQ']);
    setLoading(false);
  };
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      let content = topic;
      if (file) content = await extractTextFromPDF(file);
      const generated = await generateQuiz(topic || file?.name || 'General', content, selectedTypes);
      setQuestions(generated);
      setCurrentIndex(0);
      setUserAnswers([]);
      setView('game');
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const q = questions[currentIndex];
    const isCorrect = answer.toLowerCase().trim() === q.answer.toLowerCase().trim();
    const result = { questionId: q.id, answer, isCorrect };
    
    setUserAnswers(prev => [...prev, result]);
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        const finalAnswers = [...userAnswers, result];
        const correctCount = finalAnswers.filter(a => a.isCorrect).length;
        const score = Math.round((correctCount / questions.length) * 100);
        
        const mistakes = questions
          .map((q, i) => finalAnswers[i] && !finalAnswers[i].isCorrect ? { question: q.text, user: finalAnswers[i].answer, correct: q.answer } : null)
          .filter(Boolean) as any;

        generateCriticism(score, mistakes).then(setAiFeedback);
        setView('results');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-black dark:text-white transition-colors duration-500 overflow-x-hidden">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW: LANDING */}
        {view === 'landing' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springConfig}
            className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="mb-8 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-4">QuizMaster</h1>
            <p className="text-xl md:text-2xl text-neutral-500 dark:text-neutral-400 max-w-lg mb-12">
              The intelligent way to master any subject. Powered by AI, designed for humans.
            </p>
            <IOSButton onClick={handleStartSetup} className="w-full max-w-xs">
              Get Started <ChevronRight className="w-5 h-5" />
            </IOSButton>
          </motion.div>
        )}

        {/* VIEW: SETUP */}
        {view === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={springConfig}
            className="relative min-h-screen flex flex-col p-6 pt-20"
          >
            <div className="max-w-xl mx-auto w-full space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-bold">New Quiz</h2>
                <button onClick={() => setView('landing')} className="p-2 bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
              </div>

              <GlassCard className="space-y-6 border-white/5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Knowledge Source</label>
                  <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-[14px]">
                    <button 
                      onClick={() => {setTopic(''); setFile(null);}} 
                      className={cn("flex-1 py-2 text-sm font-semibold rounded-[10px] transition-all", !file ? "bg-white dark:bg-white/10 shadow-sm" : "text-neutral-500")}
                    >Topic</button>
                    <button 
                      onClick={() => setFile(null)} 
                      className={cn("flex-1 py-2 text-sm font-semibold rounded-[10px] transition-all", file ? "bg-white dark:bg-white/10 shadow-sm" : "text-neutral-500")}
                    >Upload</button>
                  </div>
                </div>

                {!file ? (
                  <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g. Quantum Physics or paste your notes here..."
                    className="w-full h-32 text-lg font-medium p-4 bg-black/5 dark:bg-white/5 rounded-[18px] focus:ring-2 focus:ring-[#007aff]/50 transition-all resize-none"
                  />
                ) : (
                  <div className="h-32 border-2 border-dashed border-white/10 rounded-[18px] flex flex-col items-center justify-center gap-2">
                    <FileText className="text-[#007aff]" />
                    <span className="font-semibold">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-xs text-red-500 font-bold uppercase">Remove</button>
                  </div>
                )}

                {/* File picker hidden trigger */}
                {!file && !topic && (
                  <label className="flex items-center justify-center gap-2 text-[#007aff] font-semibold cursor-pointer py-2">
                    <Plus className="w-4 h-4" /> Import Document
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                  </label>
                )}

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Question Style</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['MCQ', 'TF', 'FIB'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setSelectedTypes(prev => prev.includes(type as any) ? prev.filter(t => t !== type) : [...prev, type as any])}
                        className={cn(
                          "py-3 rounded-[14px] font-bold text-sm border-2 transition-all",
                          selectedTypes.includes(type as any) ? "bg-[#007aff]/10 border-[#007aff] text-[#007aff]" : "bg-transparent border-white/5 text-neutral-500"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>

              <IOSButton 
                isLoading={loading}
                disabled={!topic && !file} 
                onClick={handleGenerate} 
                className="w-full py-5"
              >
                Create Session
              </IOSButton>
            </div>
          </motion.div>
        )}

        {/* VIEW: GAME */}
        {view === 'game' && questions.length > 0 && (
          <motion.div 
            key="game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative min-h-screen flex flex-col p-6 pt-20"
          >
            <div className="max-w-xl mx-auto w-full">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
                  <div className="h-1.5 w-48 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#007aff]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono">
                  {Math.round((userAnswers.filter(a => a.isCorrect).length / (currentIndex || 1)) * 100)}%
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassCard className="mb-6 py-8">
                    <h3 className="text-3xl font-bold leading-tight mb-10">{questions[currentIndex].text}</h3>
                    
                    <div className="space-y-4">
                      {questions[currentIndex].type === 'FIB' ? (
                        <FIBInput 
                          isCorrect={userAnswers[currentIndex]?.isCorrect}
                          isAnswered={!!userAnswers[currentIndex]}
                          onAnswer={handleAnswer} 
                        />
                      ) : (
                        questions[currentIndex].options.map((opt, i) => {
                          const isAnswered = !!userAnswers[currentIndex];
                          const isSelected = userAnswers[currentIndex]?.answer === opt;
                          const isCorrect = questions[currentIndex].answer === opt;

                          return (
                            <button
                              key={i}
                              disabled={isAnswered}
                              onClick={() => handleAnswer(opt)}
                              className={cn(
                                "w-full p-5 rounded-[20px] text-left text-lg font-semibold transition-all border-2 flex justify-between items-center tap-highlight",
                                !isAnswered ? "bg-white/5 border-transparent hover:border-white/10" : 
                                isCorrect ? "bg-green-500/10 border-green-500 text-green-500" :
                                isSelected ? "bg-red-500/10 border-red-500 text-red-500" : "bg-white/5 border-transparent opacity-40"
                              )}
                            >
                              {opt}
                              {isAnswered && isCorrect && <Check className="w-5 h-5" />}
                              {isAnswered && isSelected && !isCorrect && <X className="w-5 h-5" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* VIEW: RESULTS */}
        {view === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative min-h-screen flex flex-col p-6 pt-20 pb-20"
          >
            <div className="max-w-2xl mx-auto w-full space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">Session Complete</h2>
                <div className="inline-flex items-center justify-center p-8 w-40 h-40 rounded-full border-[6px] border-[#007aff]/20 relative">
                  <div className="text-5xl font-black">{Math.round((userAnswers.filter(a => a.isCorrect).length / questions.length) * 100)}%</div>
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle 
                      cx="50%" cy="50%" r="46%" 
                      fill="none" 
                      stroke="#007aff" 
                      strokeWidth="6" 
                      strokeDasharray={`${(userAnswers.filter(a => a.isCorrect).length / questions.length) * 289}% 289%`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              <GlassCard className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="text-blue-500" />
                  <h4 className="font-bold text-lg">AI Performance Analysis</h4>
                </div>
                <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
                  "{aiFeedback || "Analyzing your cognitive patterns..."}"
                </p>
              </GlassCard>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Review Details</h4>
                {questions.map((q, idx) => (
                  <GlassCard key={idx} className="p-5 py-6 space-y-3">
                    <div className="flex justify-between gap-4">
                      <p className="font-bold text-lg leading-tight">{q.text}</p>
                      {userAnswers[idx]?.isCorrect ? <Check className="text-green-500 flex-shrink-0" /> : <X className="text-red-500 flex-shrink-0" />}
                    </div>
                    {!userAnswers[idx]?.isCorrect && (
                      <div className="text-sm space-y-2">
                        <div className="flex gap-2 text-red-500 font-bold"><span className="opacity-50 font-medium">Your answer:</span> {userAnswers[idx]?.answer}</div>
                        <div className="flex gap-2 text-green-500 font-bold"><span className="opacity-50 font-medium">Correct:</span> {q.answer}</div>
                      </div>
                    )}
                    <div className="text-sm text-neutral-500 bg-black/5 dark:bg-white/5 p-3 rounded-[14px]">
                      {q.explanation}
                    </div>
                  </GlassCard>
                ))}
              </div>

              <IOSButton onClick={resetGame} className="w-full py-5" variant="secondary">
                <RotateCcw className="w-5 h-5" /> Start New Session
              </IOSButton>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Footer Navigation (only in setup/game) */}
      {view !== 'landing' && view !== 'results' && (
        <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none">
          <div className="glass px-6 py-4 rounded-[32px] flex items-center gap-8 shadow-2xl pointer-events-auto border-white/5">
             <button onClick={() => setView('landing')} className="tap-highlight active:scale-90 transition-transform"><BookOpen className="w-6 h-6 text-neutral-500" /></button>
             <button onClick={() => setView('setup')} className={cn("tap-highlight active:scale-90 transition-transform", view === 'setup' ? "text-[#007aff]" : "text-neutral-500")}><Settings2 className="w-6 h-6" /></button>
             <button className="tap-highlight active:scale-90 transition-transform text-neutral-500"><Trophy className="w-6 h-6" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Subcomponent: FIB Input ---
function FIBInput({ onAnswer, isAnswered, isCorrect }: { onAnswer: (val: string) => void, isAnswered: boolean, isCorrect?: boolean }) {
  const [val, setVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) onAnswer(val);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <input 
        type="text" 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={isAnswered}
        placeholder="Type the answer..."
        className={cn(
          "w-full bg-black/5 dark:bg-white/5 p-5 text-xl font-semibold rounded-[20px] border-2 transition-all outline-none",
          isAnswered ? (isCorrect ? "border-green-500" : "border-red-500") : "border-transparent focus:border-[#007aff]"
        )}
      />
      {!isAnswered && (
        <IOSButton className="w-full py-4 text-base" onClick={() => { if (val.trim()) onAnswer(val); }}>
          Submit Answer
        </IOSButton>
      )}
    </form>
  );
}
