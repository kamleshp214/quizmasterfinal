import { GoogleGenAI } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';

// FORCE CDN WORKER for Vercel Stability
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

// API Key from process.env (Vite define handles this)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface Question {
  id: number;
  type: 'MCQ' | 'TF' | 'FIB';
  text: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // @ts-ignore
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText.slice(0, 40000);
  } catch (e) {
    console.error("PDF Error", e);
    throw new Error("Could not parse PDF. Ensure it is text-based.");
  }
};

export const generateQuiz = async (
  topic: string,
  content: string,
  types: string[]
): Promise<Question[]> => {
  const prompt = `
    Role: Expert Exam Creator.
    Topic: ${topic}
    Content Context: ${content.slice(0, 30000)}
    
    Task: Generate 5 challenging questions.
    Allowed Types: ${types.join(', ')}.
    
    Rules:
    - For 'MCQ', provide 4 distinct options.
    - For 'TF' (True/False), provide options ["True", "False"].
    - For 'FIB' (Fill-In-Blank), provide an empty options array []. The 'answer' must be the exact word(s) missing.
    
    Output Format: RAW JSON Array ONLY. No markdown.
    Schema:
    [
      {
        "id": 1,
        "type": "MCQ" | "TF" | "FIB",
        "text": "Question content",
        "options": ["A", "B", "C", "D"], 
        "answer": "Correct Answer String",
        "explanation": "Detailed explanation of why this is correct."
      }
    ]
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const text = result.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error("GenAI Error", e);
    throw new Error("Failed to generate quiz. Try a shorter text.");
  }
};

export const generateCriticism = async (
  score: number,
  mistakes: { question: string; user: string; correct: string }[]
): Promise<string> => {
  const prompt = `
    Role: Analytical Tutor.
    Student Score: ${score}%
    Mistakes made:
    ${JSON.stringify(mistakes)}
    
    Task: Provide a 3-sentence constructive critique of the student's performance. Explain the pattern of their errors if any. Be direct but helpful.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return result.text || "Analysis unavailable.";
  } catch (e) {
    return "Great effort! Review the explanations above to improve further.";
  }
};

export const generateStudyGuide = async (
  topic: string,
  mistakes: { questionText: string; selectedOption: string; correctAnswer: string }[]
): Promise<string> => {
  const prompt = `
    Role: Expert Tutor.
    Topic: ${topic}
    Mistakes: ${JSON.stringify(mistakes.map(m => ({
      question: m.questionText,
      wrongAnswer: m.selectedOption,
      correctAnswer: m.correctAnswer
    })))}

    Task: Create a concise, structured markdown study guide (max 300 words) addressing these mistakes. Explain the concepts the student missed.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return result.text || "Study guide unavailable.";
  } catch (e) {
    console.error("Study Guide Error", e);
    return "Could not generate study guide.";
  }
};