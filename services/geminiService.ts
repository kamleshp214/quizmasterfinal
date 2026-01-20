import { GoogleGenAI } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';

// Force usage of unpkg CDN for the worker to avoid Vite build issues
// We use version 3.11.174 to match package.json
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

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
    
    // Limit pages to prevent token limits on large docs
    const maxPages = Math.min(pdf.numPages, 15);
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // @ts-ignore
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  } catch (e) {
    console.error("PDF Parse Error", e);
    throw new Error("Unable to read PDF. Please ensure it contains selectable text.");
  }
};

export const generateQuiz = async (
  topic: string,
  content: string,
  types: string[],
  difficulty: string = "Medium",
  count: number = 5
): Promise<Question[]> => {
  // Defensive truncation
  const safeContent = content.slice(0, 30000);
  
  const prompt = `
    Role: Expert Examiner.
    Context: ${topic}
    Source Material: ${safeContent}
    
    Task: Create exactly ${count} assessment questions.
    Difficulty: ${difficulty}.
    Allowed Types: ${types.join(', ')}.
    
    Rules:
    1. Questions must be derived from the source material.
    2. Explanations must be educational, explaining the *why*.
    3. 'FIB' (Fill-In-Blank) answers must be 1-2 words.
    4. 'MCQ' must have 4 options.
    5. 'TF' must have ["True", "False"].
    
    Output JSON Schema:
    [
      {
        "id": number,
        "type": "MCQ" | "TF" | "FIB",
        "text": "Question text...",
        "options": ["A", "B", ...],
        "answer": "Correct answer",
        "explanation": "Deep explanation..."
      }
    ]
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        temperature: difficulty === 'Hard' ? 0.7 : 0.5 
      }
    });
    
    const text = result.text || "[]";
    const data = JSON.parse(text);
    return data.slice(0, count);
  } catch (e) {
    console.error("Quiz Gen Error", e);
    throw new Error("AI Service unavailable. Please try again.");
  }
};

export const generateCriticism = async (
  score: number,
  mistakes: { question: string; user: string; correct: string }[]
): Promise<string> => {
  const prompt = `
    Role: Empathetic Tutor.
    Score: ${score}%
    Mistakes: ${JSON.stringify(mistakes)}
    
    Task: Write a short, encouraging 2-sentence feedback. 
    If score > 80, praise their mastery. 
    If score < 60, focus on a key concept they missed.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return result.text || "Performance analysis complete.";
  } catch (e) {
    return "Great job completing the quiz!";
  }
};

export const generateStudyGuide = async (
  topic: string,
  mistakes: { questionText: string; selectedOption: string; correctAnswer: string }[]
): Promise<string> => {
  if (mistakes.length === 0) return "## Mastery Achieved! \n\nYou answered everything correctly. Great job demonstrating your understanding of this topic.";

  const prompt = `
    Role: Expert Teacher.
    Topic: ${topic}
    Mistakes: ${JSON.stringify(mistakes.map(m => ({
      concept: m.questionText,
      misconception: m.selectedOption,
      correction: m.correctAnswer
    })))}

    Task: Create a Markdown study guide to fix these knowledge gaps.
    
    Format Requirements:
    - Use H2 (##) for key concepts (e.g. "## Understanding Photosynthesis").
    - Use bullet points (*) for details.
    - Use bold (**) for keywords.
    - Do NOT mention "Question 1" etc. Focus on the concepts.
    - Keep it concise (under 250 words).
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