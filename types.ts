export type QuestionType = 'MCQ' | 'TF' | 'FIB';

export enum QuizDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  PHD = 'PHD'
}

export enum QuizType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TF',
  MIXED = 'MIXED'
}

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[]; // Only for MCQ
  answer: string;     // The correct answer
  explanation: string;
}

export interface UserAnswer {
  questionId: number;
  questionText: string;
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

export interface QuizConfig {
  topic: string;
  content: string;
  questionCount: number;
  selectedTypes?: QuestionType[]; // Optional to support different setup flows
  difficulty?: QuizDifficulty;    // Added for SetupPanel
  type?: QuizType;                // Added for SetupPanel
  timerSeconds?: number;          // Added for SetupPanel
}

export interface SavedQuiz {
  id: string;
  topic: string;
  date: string;
  score: number;
  totalQuestions: number;
}