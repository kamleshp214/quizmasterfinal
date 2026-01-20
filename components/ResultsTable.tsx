import React from 'react';
import { useQuizStore } from '../store/quizStore';
import { Download, RotateCcw, Target, Clock, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { clsx } from 'clsx';

export const ResultsTable: React.FC = () => {
  const { userAnswers, activeQuizConfig, activeQuestions, resetGame, retryIncorrect } = useQuizStore();

  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const score = Math.round((correctCount / activeQuestions.length) * 100);
  const avgTime = Math.round(userAnswers.reduce((acc, curr) => acc + curr.timeTaken, 0) / userAnswers.length);
  const hasIncorrect = correctCount < activeQuestions.length;

  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Quiz Analysis Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Topic: ${activeQuizConfig?.topic}`, 14, 30);
    doc.text(`Score: ${score}%`, 14, 36);

    const rows = userAnswers.map((a, i) => [
      `Q${i+1}`,
      a.questionText.substring(0, 50) + "...",
      a.selectedOption,
      a.correctAnswer,
      a.isCorrect ? "PASS" : "FAIL"
    ]);

    autoTable(doc, {
      head: [['#', 'Question', 'User Input', 'Correct Key', 'Status']],
      body: rows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] }
    });

    doc.save('quiz-report.pdf');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary"><Target className="w-6 h-6" /></div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">Accuracy Score</p>
            <p className="text-3xl font-mono text-white font-bold">{score}%</p>
          </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">Avg Time/Question</p>
            <p className="text-3xl font-mono text-white font-bold">{avgTime}s</p>
          </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-2xl flex items-center gap-4">
           {hasIncorrect ? (
             <button onClick={retryIncorrect} className="w-full h-full flex items-center justify-between text-left group">
               <div>
                  <p className="text-red-400 text-xs uppercase font-semibold group-hover:text-red-300">Action Required</p>
                  <p className="text-lg font-bold text-white">Retry Missed</p>
               </div>
               <RotateCcw className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
             </button>
           ) : (
             <div className="w-full">
               <p className="text-green-500 text-xs uppercase font-semibold">Status</p>
               <p className="text-lg font-bold text-white">All Clear</p>
             </div>
           )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-white">Detailed Analysis</h3>
          <button onClick={handleExport} className="text-sm text-primary hover:text-white transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV/PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-surfaceHighlight">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4 w-1/3">Question</th>
                <th className="px-6 py-4">Response</th>
                <th className="px-6 py-4">Solution</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {userAnswers.map((row, i) => (
                <tr key={i} className="hover:bg-surfaceHighlight/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-500">{i + 1}</td>
                  <td className="px-6 py-4 text-gray-300 truncate max-w-xs">{row.questionText}</td>
                  <td className={clsx("px-6 py-4 font-mono", row.isCorrect ? "text-gray-400" : "text-red-400 font-bold")}>
                    {row.selectedOption}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-400">{row.correctAnswer}</td>
                  <td className="px-6 py-4 font-mono text-gray-500">{row.timeTaken.toFixed(1)}s</td>
                  <td className="px-6 py-4">
                    {row.isCorrect ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-900">PASS</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-900">FAIL</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={resetGame}
          className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};