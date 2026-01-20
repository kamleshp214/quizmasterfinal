import { create } from 'zustand';
import { QuizQuestion, UserAnswer, QuizConfig } from '../types';

export type ViewState = 'HERO' | 'SETUP' | 'QUIZ' | 'RESULTS';

interface QuizState {
  view: ViewState;
  
  // Quiz Data
  config: QuizConfig | null;
  questions: QuizQuestion[];
  userAnswers: UserAnswer[];
  
  // Results Data
  aiFeedback: string | null;
  
  // Actions
  setView: (view: ViewState) => void;
  startSetup: () => void;
  startQuiz: (config: QuizConfig, questions: QuizQuestion[]) => void;
  submitAnswer: (answer: UserAnswer) => void;
  setAiFeedback: (feedback: string) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  view: 'HERO',
  config: null,
  questions: [],
  userAnswers: [],
  aiFeedback: null,

  setView: (view) => set({ view }),
  
  startSetup: () => set({ view: 'SETUP' }),
  
  startQuiz: (config, questions) => set({ 
    config, 
    questions, 
    userAnswers: [], 
    aiFeedback: null,
    view: 'QUIZ' 
  }),
  
  submitAnswer: (answer) => set((state) => ({ 
    userAnswers: [...state.userAnswers, answer] 
  })),
  
  setAiFeedback: (feedback) => set({ aiFeedback: feedback }),
  
  reset: () => set({ 
    view: 'HERO', 
    config: null, 
    questions: [], 
    userAnswers: [], 
    aiFeedback: null 
  })
}));