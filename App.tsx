
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
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
  Brain,
  Clock,
  Flame,
  Target,
  ChevronDown
} from 'lucide-react';
import { extractTextFromPDF, generateQuiz, generateCriticism, generateStudyGuide, Question } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Component: GlassCard ---
const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <motion.div 
    layout
    onClick={onClick} 
    className={cn(
      "glass rounded-[32px] p-6 md:p-8 shadow-xl overflow-hidden backdrop-blur-2xl border border-white/20 dark:border-white/5 transition-colors duration-300 relative",
      className
    )}
  >
    {children}
  </motion.div>
);

// --- Component: iOS Button ---
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
    primary: "bg-[#007aff] text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02]",
    secondary: "bg-white/50 dark:bg-white/10 text-black dark:text-white border border-white/20 hover:bg-white/60 dark:hover:bg-white/20",
    ghost: "bg-transparent text-[#007aff] hover:bg-[#007aff]/5",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600"
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.96 }}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center gap-2 font-display font-semibold text-[17px] rounded-[20px] py-4 px-8 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none",
        variants[variant],
        className
      )}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </motion.button>
  );
};

// --- Component: Loading View ---
const LoadingView = () => {
  const [msg, setMsg] = useState("Initializing AI...");
  useEffect(() => {
    const msgs = ["Reading document...", "Identifying key concepts...", "Structuring assessment...", "Polishing options..."];
    let i = 0;
    const interval = setInterval(() => {
      setMsg(msgs[i % msgs.length]);
      i++;
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
       <div className="relative w-28 h-28 mb-10">
         <div className="absolute inset-0 rounded-full border-[6px] border-t-[#007aff] border-r-transparent border-b-[#007aff] border-l-transparent animate-spin" />
         <div className="absolute inset-3 rounded-full border-[6px] border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent animate-spin-reverse opacity-70" />
         <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-10 h-10 text-neutral-400 animate-pulse" />
         </div>
       </div>
       <motion.h3 
         key={msg}
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -10 }}
         className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-center px-4"
       >
         {msg}
       </motion.h3>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [view, setView] = useState<'landing' | 'setup' | 'game' | 'results'>('landing');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Settings
  const [selectedTypes, setSelectedTypes] = useState<('MCQ' | 'TF' | 'FIB')[]>(['MCQ']);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qCount, setQCount] = useState(5);
  
  // Game State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{questionId: number, answer: string, isCorrect: boolean}[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [studyGuide, setStudyGuide] = useState('');
  const [loadingGuide, setLoadingGuide] = useState(false);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.05, filter: "blur(10px)" }
  };

  const containerVariants = {
    animate: {
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const handleStartSetup = () => setView('setup');

  const resetGame = () => {
    setView('landing');
    setTopic('');
    setFile(null);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers([]);
    setAiFeedback('');
    setStudyGuide('');
    setStreak(0);
    setLoading(false);
  };
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      let content = topic;
      if (file) content = await extractTextFromPDF(file);
      const generated = await generateQuiz(
        topic || file?.name || 'General', 
        content, 
        selectedTypes,
        difficulty,
        qCount
      );
      if (generated.length === 0) throw new Error("No questions generated");
      setQuestions(generated);
      setCurrentIndex(0);
      setUserAnswers([]);
      setStreak(0);
      setView('game');
    } catch (e) {
      console.error(e);
      alert("AI Service is currently busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const q = questions[currentIndex];
    const isCorrect = answer.toLowerCase().trim() === q.answer.toLowerCase().trim();
    const result = { questionId: q.id, answer, isCorrect };
    
    // Streak logic
    if (isCorrect) setStreak(s => s + 1);
    else setStreak(0);

    setUserAnswers(prev => [...prev, result]);
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        finishQuiz([...userAnswers, result]);
      }
    }, 600);
  };

  const finishQuiz = async (finalAnswers: any[]) => {
    const correctCount = finalAnswers.filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);
    
    setView('results');

    if (score > 70) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
    
    const mistakes = questions
      .map((q, i) => finalAnswers[i] && !finalAnswers[i].isCorrect ? { questionText: q.text, selectedOption: finalAnswers[i].answer, correctAnswer: q.answer } : null)
      .filter(Boolean) as any;

    generateCriticism(score, mistakes.map((m: any) => ({ question: m.questionText, user: m.selectedOption, correct: m.correctAnswer }))).then(setAiFeedback);
    
    setLoadingGuide(true);
    generateStudyGuide(topic || "General Knowledge", mistakes).then((guide) => {
      setStudyGuide(guide);
      setLoadingGuide(false);
    });
  };

  return (
    <div className="min-h-screen bg-[var(--ios-bg)] text-[var(--ios-text)] transition-colors duration-500 overflow-x-hidden font-sans selection:bg-[#007aff]/30">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-blue-500/10 blur-[150px] rounded-full animate-pulse-slow mix-blend-multiply dark:mix-blend-normal" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-purple-500/10 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW: LANDING */}
        {view === 'landing' && (
          <motion.div 
            key="landing"
            variants={pageVariants}
            initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            <GlassCard className="max-w-md w-full flex flex-col items-center py-12 px-8 border-t-white/60 dark:border-white/10 shadow-2xl shadow-blue-500/10">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="mb-8 w-28 h-28 bg-gradient-to-br from-[#007aff] to-purple-600 rounded-[30px] flex items-center justify-center shadow-2xl shadow-blue-500/40"
              >
                <Brain className="w-14 h-14 text-white" />
              </motion.div>
              <h1 className="text-6xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                QuizMaster
              </h1>
              <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed font-medium">
                Transform any document or topic into interactive mastery sessions in seconds.
              </p>
              <IOSButton onClick={handleStartSetup} className="w-full text-lg shadow-xl shadow-blue-500/20">
                Begin Session <ChevronRight className="w-5 h-5 ml-1" />
              </IOSButton>
            </GlassCard>
            
            <p className="fixed bottom-6 text-xs font-semibold text-neutral-400 uppercase tracking-widest opacity-50">Powered by Google Gemini 2.0</p>
          </motion.div>
        )}

        {/* VIEW: SETUP */}
        {view === 'setup' && (
          <motion.div 
            key="setup"
            variants={pageVariants}
            initial="initial" animate="animate" exit="exit"
            className="relative min-h-screen flex flex-col p-6 pt-safe-top pb-safe-bottom max-w-3xl mx-auto w-full"
          >
             <header className="flex items-center justify-between mb-8 px-2">
                <button onClick={() => setView('landing')} className="flex items-center text-[#007aff] font-bold active:opacity-60 transition-opacity"><ChevronLeft className="w-6 h-6" /> Back</button>
                <h2 className="text-[17px] font-semibold opacity-0">Config</h2>
                <div className="w-[50px]"></div>
              </header>

              <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <h2 className="text-3xl font-display font-bold mb-6 px-2">Setup Session</h2>
                  
                  <GlassCard className="space-y-4">
                    <div className="flex p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-[16px] mb-2">
                       <button 
                         onClick={() => {setTopic(''); setFile(null);}} 
                         className={cn("flex-1 py-2.5 text-[15px] font-bold rounded-[12px] transition-all duration-300", !file ? "bg-white dark:bg-neutral-600 shadow-sm text-black dark:text-white" : "text-neutral-500 hover:text-neutral-700")}
                       >Topic</button>
                       <button 
                         onClick={() => setFile(null)} 
                         className={cn("flex-1 py-2.5 text-[15px] font-bold rounded-[12px] transition-all duration-300", file ? "bg-white dark:bg-neutral-600 shadow-sm text-black dark:text-white" : "text-neutral-500 hover:text-neutral-700")}
                       >File</button>
                    </div>

                    <div className="min-h-[140px] flex flex-col">
                      {!file ? (
                        <textarea 
                          autoFocus
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="What do you want to learn today?"
                          className="w-full h-full flex-1 text-[20px] bg-transparent resize-none outline-none placeholder-neutral-300 dark:placeholder-neutral-600 font-medium"
                        />
                      ) : (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="flex-1 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-[20px] flex flex-col items-center justify-center gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-6"
                        >
                          <div className="p-3 bg-blue-500/10 rounded-full">
                            <FileText className="text-[#007aff] w-8 h-8" />
                          </div>
                          <span className="font-bold text-base text-center break-all px-4">{file.name}</span>
                          <button onClick={() => setFile(null)} className="text-xs text-red-500 font-bold uppercase hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors">Remove File</button>
                        </motion.div>
                      )}
                    </div>
                    
                    {!file && !topic && (
                       <label className="flex items-center justify-center gap-2 text-[#007aff] font-bold cursor-pointer py-3 border-t border-neutral-200 dark:border-white/10 mt-2 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5 rounded-xl">
                         <Plus className="w-5 h-5" /> Import PDF Document
                         <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                       </label>
                    )}
                  </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <GlassCard className="space-y-8">
                    {/* Difficulty */}
                    <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 block ml-1">Complexity</label>
                       <div className="grid grid-cols-3 gap-3">
                          {['Easy', 'Medium', 'Hard'].map((d) => (
                            <button 
                              key={d}
                              onClick={() => setDifficulty(d as any)}
                              className={cn(
                                "py-3 rounded-[16px] text-sm font-bold border-2 transition-all duration-200",
                                difficulty === d 
                                  ? "border-[#007aff] bg-[#007aff]/10 text-[#007aff] shadow-sm" 
                                  : "border-transparent bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                              )}
                            >
                              {d}
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Question Count */}
                    <div>
                       <div className="flex justify-between mb-4">
                         <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-1">Length</label>
                         <span className="text-sm font-bold text-[#007aff] bg-[#007aff]/10 px-3 py-1 rounded-full">{qCount} Questions</span>
                       </div>
                       <input 
                         type="range" min="3" max="15" step="1" 
                         value={qCount} 
                         onChange={(e) => setQCount(parseInt(e.target.value))}
                         className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#007aff] hover:accent-blue-600"
                       />
                       <div className="flex justify-between text-[10px] text-neutral-400 mt-2 px-1 font-bold">
                          <span>Quick (3)</span><span>Deep Dive (15)</span>
                       </div>
                    </div>

                    {/* Types */}
                    <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 block ml-1">Format</label>
                       <div className="flex gap-3 flex-wrap">
                          {['MCQ', 'TF', 'FIB'].map(t => (
                             <button 
                               key={t}
                               onClick={() => setSelectedTypes(prev => prev.includes(t as any) ? prev.filter(x => x !== t) : [...prev, t as any])}
                               className={cn(
                                 "px-5 py-2.5 rounded-full text-sm font-bold border transition-all duration-200 flex items-center gap-2",
                                 selectedTypes.includes(t as any) ? "bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-md" : "border-neutral-200 dark:border-neutral-700 text-neutral-500 bg-transparent"
                               )}
                             >
                               {t === 'MCQ' ? 'Multiple Choice' : t === 'TF' ? 'True/False' : 'Fill-in-Blank'}
                             </button>
                          ))}
                       </div>
                    </div>
                  </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-4">
                  <IOSButton 
                    isLoading={loading}
                    disabled={!topic && !file} 
                    onClick={handleGenerate} 
                    className="w-full py-5 text-lg shadow-xl shadow-blue-500/20"
                  >
                    Generate Session
                  </IOSButton>
                </motion.div>
              </motion.div>
          </motion.div>
        )}

        {/* VIEW: GAME */}
        {view === 'game' && (
          <motion.div 
            key="game"
            variants={pageVariants}
            initial="initial" animate="animate" exit="exit"
            className="relative min-h-screen flex flex-col p-6 pt-safe-top max-w-2xl mx-auto w-full"
          >
            {loading ? (
               <LoadingView />
            ) : questions.length > 0 ? (
              <div className="flex flex-col h-full">
                
                {/* Header */}
                <header className="flex justify-between items-center mb-10 pt-4">
                   <div className="flex items-center gap-3 bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/20 pl-2 pr-4 py-1.5 rounded-full shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-[#007aff] flex items-center justify-center text-white font-bold text-xs">
                        {currentIndex + 1}
                      </div>
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                        of {questions.length}
                      </span>
                   </div>

                   {streak > 1 && (
                     <motion.div 
                       initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                       className="flex items-center gap-1.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full border border-orange-200 dark:border-orange-500/30 shadow-sm"
                     >
                        <Flame className="w-4 h-4 fill-orange-500" />
                        <span className="text-xs font-bold">{streak} Streak</span>
                     </motion.div>
                   )}
                </header>

                {/* Question Card */}
                <div className="flex-1 flex flex-col justify-center pb-12">
                   <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, x: 50, filter: "blur(5px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: -50, filter: "blur(5px)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="w-full"
                    >
                      <GlassCard className="mb-8 min-h-[220px] flex flex-col justify-center border-t-white/40 dark:border-t-white/10">
                        <span className="text-xs font-bold text-[#007aff] uppercase tracking-widest mb-4 opacity-80">{questions[currentIndex].type}</span>
                        <h3 className="text-2xl md:text-3xl font-display font-bold leading-tight tracking-tight">{questions[currentIndex].text}</h3>
                      </GlassCard>
                      
                      <div className="space-y-3">
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
                              <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                disabled={isAnswered}
                                onClick={() => handleAnswer(opt)}
                                className={cn(
                                  "w-full p-5 rounded-[20px] text-left text-[17px] font-medium transition-all border-2 flex justify-between items-center relative overflow-hidden group",
                                  !isAnswered ? "bg-white dark:bg-white/5 border-transparent shadow-sm hover:border-[#007aff]/30 hover:scale-[1.01]" : 
                                  isCorrect ? "bg-green-500 text-white border-green-500 shadow-green-500/20" :
                                  isSelected ? "bg-red-500 text-white border-red-500 shadow-red-500/20" : "bg-white/50 dark:bg-white/5 border-transparent opacity-40 grayscale"
                                )}
                              >
                                <span className="relative z-10">{opt}</span>
                                {isAnswered && isCorrect && <Check className="w-5 h-5 relative z-10" />}
                                {isAnswered && isSelected && !isCorrect && <X className="w-5 h-5 relative z-10" />}
                              </motion.button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* VIEW: RESULTS */}
        {view === 'results' && (
          <motion.div 
            key="results"
            variants={pageVariants}
            initial="initial" animate="animate" exit="exit"
            className="relative min-h-screen flex flex-col p-6 pt-safe-top pb-20 max-w-3xl mx-auto w-full"
          >
            <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
              
              {/* Score Header */}
              <motion.div variants={itemVariants} className="text-center py-6">
                 <div className="inline-block relative">
                   <svg width="180" height="180" className="rotate-[-90deg]">
                      <circle cx="90" cy="90" r="80" fill="none" stroke="currentColor" strokeWidth="12" className="text-neutral-200 dark:text-neutral-800" />
                      <motion.circle 
                        cx="90" cy="90" r="80" fill="none" stroke="#007aff" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={502}
                        strokeDashoffset={502}
                        animate={{ strokeDashoffset: 502 - (502 * (userAnswers.filter(a => a.isCorrect).length / questions.length)) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="text-5xl font-display font-bold"
                      >
                        {Math.round((userAnswers.filter(a => a.isCorrect).length / questions.length) * 100)}%
                      </motion.span>
                   </div>
                 </div>
                 <h2 className="text-2xl font-display font-bold mt-4">Session Complete</h2>
              </motion.div>

              {/* Feedback Card */}
              <motion.div variants={itemVariants}>
                <GlassCard className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/10">
                  <div className="flex items-center gap-2 mb-3 text-[#007aff]">
                    <Sparkles className="w-5 h-5" />
                    <h4 className="font-bold uppercase tracking-wider text-xs">AI Analysis</h4>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                    {aiFeedback || "Analyzing performance patterns..."}
                  </p>
                </GlassCard>
              </motion.div>

              {/* Study Guide Dropdown */}
              <motion.div variants={itemVariants}>
                {userAnswers.some(a => !a.isCorrect) && (
                  <div className="rounded-[24px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg">
                    <details className="group" open>
                      <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
                             <Target className="w-6 h-6" />
                           </div>
                           <div>
                             <span className="font-bold text-lg block">Smart Study Guide</span>
                             <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Personalized Review</span>
                           </div>
                        </div>
                        <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-neutral-400" />
                      </summary>
                      <div className="p-8 pt-2 border-t border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-black/20">
                        {loadingGuide ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-3 text-neutral-500">
                            <Loader2 className="animate-spin w-6 h-6 text-purple-500" /> 
                            <span className="text-sm font-medium">Generating personalized notes...</span>
                          </div>
                        ) : (
                          <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-neutral-600 dark:prose-p:text-neutral-300 prose-li:text-neutral-600 dark:prose-li:text-neutral-300 prose-strong:text-purple-600 dark:prose-strong:text-purple-400">
                            <ReactMarkdown>{studyGuide}</ReactMarkdown>
                          </article>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </motion.div>

              {/* Answer Review */}
              <motion.div variants={itemVariants} className="space-y-4 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 ml-2">Question Breakdown</h4>
                {questions.map((q, idx) => (
                  <GlassCard key={idx} className="p-5 flex gap-5 items-start">
                     <div className={cn("mt-1 p-1.5 rounded-full flex-shrink-0", userAnswers[idx]?.isCorrect ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400")}>
                        {userAnswers[idx]?.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-[16px] mb-2 leading-snug">{q.text}</p>
                        {!userAnswers[idx]?.isCorrect && (
                           <div className="text-sm mb-3 text-red-500 font-medium">
                             You chose: <span className="font-bold">{userAnswers[idx]?.answer}</span>
                           </div>
                        )}
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-100 dark:bg-white/5 p-4 rounded-xl">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1 text-xs uppercase tracking-wider">Explanation</span>
                          {q.explanation}
                        </div>
                     </div>
                  </GlassCard>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="pt-4">
                <IOSButton onClick={resetGame} variant="secondary" className="w-full">
                  <RotateCcw className="w-5 h-5" /> Start New Session
                </IOSButton>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
        placeholder="Type answer here..."
        className={cn(
          "w-full bg-white dark:bg-white/5 p-6 text-xl font-bold rounded-[20px] border-2 transition-all outline-none shadow-sm",
          isAnswered ? (isCorrect ? "border-green-500 bg-green-500/10 text-green-600" : "border-red-500 bg-red-500/10 text-red-500") : "border-transparent focus:border-[#007aff] focus:bg-white dark:focus:bg-black placeholder-neutral-300"
        )}
      />
      {!isAnswered && (
        <IOSButton className="w-full py-4 shadow-lg shadow-blue-500/20" onClick={() => { if (val.trim()) onAnswer(val); }}>
          Submit Answer
        </IOSButton>
      )}
    </form>
  );
}
