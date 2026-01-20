import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Type, List, CheckSquare } from 'lucide-react';
import { QuizQuestion } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for clean tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (answer: string) => void;
  isDisabled: boolean;
  userAnswer?: string;
  showResult: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({ 
  question, 
  onAnswer, 
  isDisabled,
  userAnswer,
  showResult 
}) => {
  const [textInput, setTextInput] = useState('');

  const handleSubmitFIB = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onAnswer(textInput.trim());
    }
  };

  const isCorrect = userAnswer?.toLowerCase() === question.answer.toLowerCase();

  const getIcon = () => {
    if (question.type === 'MCQ') return <List className="w-5 h-5 text-purple-300" />;
    if (question.type === 'TF') return <CheckSquare className="w-5 h-5 text-blue-300" />;
    return <Type className="w-5 h-5 text-green-300" />;
  };

  const getTypeLabel = () => {
    if (question.type === 'MCQ') return 'Multiple Choice';
    if (question.type === 'TF') return 'True or False';
    return 'Fill in the Blank';
  };

  return (
    <div className="w-full">
      {/* Type Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          {getIcon()}
        </div>
        <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">
          {getTypeLabel()}
        </span>
      </div>

      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
        {question.question}
      </h3>

      {/* Inputs based on Type */}
      <div className="space-y-4">
        
        {/* MCQ Handling */}
        {question.type === 'MCQ' && question.options?.map((option) => {
          const isSelected = userAnswer === option;
          const isActualAnswer = option === question.answer;
          
          let stateClass = "border-white/10 hover:bg-white/5 hover:border-purple-500/50";
          
          if (showResult) {
             if (isActualAnswer) stateClass = "border-green-500 bg-green-500/20";
             else if (isSelected && !isCorrect) stateClass = "border-red-500 bg-red-500/20";
             else stateClass = "border-white/5 opacity-50";
          } else if (isSelected) {
             stateClass = "border-purple-500 bg-purple-500/20";
          }

          return (
            <motion.button
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              key={option}
              onClick={() => !isDisabled && onAnswer(option)}
              disabled={isDisabled}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group",
                stateClass
              )}
            >
              <span className="font-medium text-lg text-gray-100">{option}</span>
              {showResult && isActualAnswer && <CheckCircle className="text-green-400 w-5 h-5" />}
              {showResult && isSelected && !isCorrect && <XCircle className="text-red-400 w-5 h-5" />}
            </motion.button>
          );
        })}

        {/* True/False Handling */}
        {question.type === 'TF' && (
          <div className="grid grid-cols-2 gap-4">
            {['True', 'False'].map((option) => {
               const isSelected = userAnswer === option;
               const isActualAnswer = option === question.answer;
               
               let stateClass = "border-white/10 hover:bg-white/5 hover:border-purple-500/50";
               if (showResult) {
                 if (isActualAnswer) stateClass = "border-green-500 bg-green-500/20";
                 else if (isSelected && !isCorrect) stateClass = "border-red-500 bg-red-500/20";
                 else stateClass = "border-white/5 opacity-50";
               } 

               return (
                <motion.button
                  whileHover={!isDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  key={option}
                  onClick={() => !isDisabled && onAnswer(option)}
                  disabled={isDisabled}
                  className={cn(
                    "h-24 rounded-xl border-2 text-xl font-bold transition-all duration-200",
                    stateClass
                  )}
                >
                  {option}
                </motion.button>
               );
            })}
          </div>
        )}

        {/* Fill In Blank Handling */}
        {question.type === 'FIB' && (
          <form onSubmit={handleSubmitFIB} className="relative">
             <input 
               type="text"
               disabled={isDisabled}
               value={isDisabled && userAnswer ? userAnswer : textInput}
               onChange={(e) => setTextInput(e.target.value)}
               placeholder="Type your answer here..."
               className={cn(
                 "w-full p-4 rounded-xl border-2 bg-black/20 text-lg outline-none transition-all",
                 showResult 
                   ? (isCorrect ? "border-green-500 text-green-400" : "border-red-500 text-red-400")
                   : "border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white"
               )}
             />
             {!isDisabled && (
               <button 
                 type="submit"
                 disabled={!textInput.trim()}
                 className="absolute right-2 top-2 bottom-2 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg font-bold transition-colors"
               >
                 Submit
               </button>
             )}
             {showResult && !isCorrect && (
               <div className="mt-2 text-green-400 text-sm font-medium flex items-center gap-2">
                 <CheckCircle className="w-4 h-4" /> Correct answer: {question.answer}
               </div>
             )}
          </form>
        )}
      </div>
    </div>
  );
};