import { create } from 'zustand';

export type QuestionType = 'MCQ' | 'TF' | 'FIB';

export interface Question {
  id: number;
  type: QuestionType;
  text: string;
  options: string[]; // Empty for TF/FIB
  answer: string;
  explanation: string;
}

export interface UserAnswer {
  questionId: number;
  questionText: string;
  userValue: string;
  correctValue: string;
  isCorrect: boolean;
}

interface QuizState {
  view: 'INTRO' | 'SETUP' | 'QUIZ' | 'RESULTS';
  topic: string;
  questions: Question[];
  userAnswers: UserAnswer[];
  aiRoast: string | null;

  setView: (view: 'INTRO' | 'SETUP' | 'QUIZ' | 'RESULTS') => void;
  startQuiz: (topic: string, questions: Question[]) => void;
  addAnswer: (answer: UserAnswer) => void;
  setRoast: (roast: string) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  view: 'INTRO',
  topic: '',
  questions: [],
  userAnswers: [],
  aiRoast: null,

  setView: (view) => set({ view }),

  startQuiz: (topic, questions) => set({
    view: 'QUIZ',
    topic,
    questions,
    userAnswers: [],
    aiRoast: null
  }),

  addAnswer: (answer) => set((state) => ({
    userAnswers: [...state.userAnswers, answer]
  })),

  setRoast: (roast) => set({ aiRoast: roast }),

  reset: () => set({
    view: 'INTRO',
    topic: '',
    questions: [],
    userAnswers: [],
    aiRoast: null
  })
}));