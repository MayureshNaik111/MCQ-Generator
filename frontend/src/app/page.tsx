"use client";
import { useState } from "react";

type MCQ = {
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const resetQuiz = () => {
    setTopic("");
    setMcqs([]);
    setCurrentIndex(0);
    setUserScore(0);
    setFinished(false);
    setShowAnswer(false);
  };

  const fetchMCQs = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    resetQuiz();

    try {
      const maxRetries = 3;
      let res;
      let data;

      const backendUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!backendUrl) throw new Error("Backend URL not set in environment variables");

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          res = await fetch(`${backendUrl}/generate_mcqs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic }),
          });
          data = await res.json();
          if (res.ok) break;
          else if (attempt === maxRetries - 1)
            throw new Error(data?.detail || "Error generating MCQs");
        } catch (err) {
          if (attempt < maxRetries - 1)
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          else throw err;
        }
      }

      const processedMCQs: MCQ[] = (data.mcqs || []).map((mcq: any) => {
        const processedMcq: MCQ = {
          ...mcq,
          question: (mcq.question || "").trim(),
          correct_answer: String(mcq.correct_answer || "").trim(),
        };

        // Option extraction logic (same as before)
        let questionText = processedMcq.question;
        let extractedOptions: string[] = [];

        const labelLineRegex = /^\s*([A-Za-z0-9])[\)\.\-]\s*(.+)$/gm;
        const lineMatches = [...questionText.matchAll(labelLineRegex)];
        if (lineMatches.length >= 2) {
          extractedOptions = lineMatches.map((m) => (m[2] || "").trim()).filter(Boolean);
          const firstIndex = lineMatches[0].index ?? 0;
          questionText = (questionText.slice(0, firstIndex) || "").trim();
        } else {
          const parts = questionText.split(/(?=\s*[A-Za-z0-9][\)\.\-]\s*)/);
          if (parts.length > 1) {
            const potentialOptions = parts
              .slice(1)
              .map((p) => p.replace(/^[\s]*[A-Za-z0-9][\)\.\-]\s*/, "").trim())
              .filter(Boolean);
            if (potentialOptions.length >= 2) {
              extractedOptions = potentialOptions;
              questionText = parts[0].trim();
            }
          }
        }

        if (extractedOptions.length < 2) {
          const lines = processedMcq.question
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          const shortLines = lines.filter((l) => l.length > 0 && l.length < 120);
          if (shortLines.length >= 2) {
            const take = shortLines.slice(-4);
            if (take.some((t) => processedMcq.question.indexOf(t) >= 0 && t.length < processedMcq.question.length)) {
              extractedOptions = take;
              const remainder = lines.slice(0, lines.length - take.length).join(" ").trim();
              if (remainder) questionText = remainder;
            }
          }
        }

        if ((!processedMcq.options || processedMcq.options.length === 0) && extractedOptions.length >= 2) {
          processedMcq.options = extractedOptions;
        } else if (!processedMcq.options || processedMcq.options.length === 0) {
          processedMcq.options = ["Option 1", "Option 2", "Option 3", "Option 4"];
        }

        processedMcq.question = questionText.length > 3 ? questionText : processedMcq.question;
        processedMcq.options = (processedMcq.options || []).map((opt: string) => (opt || "").trim());

        return processedMcq;
      }).filter((mcq: MCQ) => mcq.options && mcq.options.length > 0 && mcq.correct_answer);

      setMcqs(processedMCQs);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error connecting to API");
    } finally {
      setLoading(false);
    }
  };

  const stripLeadingLabel = (text: string) =>
    String(text || "").trim().replace(/^[\s]*[A-Za-z0-9]+[\)\.\-:\s]+/, "").trim();

  const normalize = (text: string) => stripLeadingLabel(text).toLowerCase();

  const getCorrectIndex = (mcq: MCQ): number => {
    const ans = (mcq.correct_answer || "").trim();
    if (/^[a-dA-D]$/.test(ans)) return ans.toLowerCase().charCodeAt(0) - 97;
    if (/^[1-4]$/.test(ans)) return parseInt(ans, 10) - 1;
    const normalizedAns = normalize(ans);
    for (let i = 0; i < (mcq.options || []).length; i++) {
      if (normalize(mcq.options![i]) === normalizedAns) return i;
    }
    for (let i = 0; i < (mcq.options || []).length; i++) {
      if (stripLeadingLabel(mcq.options![i]).toLowerCase() === stripLeadingLabel(ans).toLowerCase()) return i;
    }
    return -1;
  };

  const handleAnswer = (choiceIdx: number) => {
    if (!mcqs.length) return;
    const currentMCQ = mcqs[currentIndex];
    if (!currentMCQ || !currentMCQ.correct_answer) return;
    const correctIdx = getCorrectIndex(currentMCQ);
    const isCorrect =
      correctIdx >= 0
        ? choiceIdx === correctIdx
        : normalize(currentMCQ.options![choiceIdx]) === normalize(currentMCQ.correct_answer);
    if (isCorrect) setUserScore((p) => p + 1);
    setShowAnswer(true);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= mcqs.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex(nextIndex);
    setShowAnswer(false);
  };

  const current = mcqs[currentIndex];

  return (
    <main className="font-sans min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 p-6">
      <h1 className="text-4xl font-bold mb-4 text-white text-center sm:text-4xl md:text-4xl lg:text-[3rem]"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
        MCQ Generator
      </h1>

      {/* Input screen */}
      {mcqs.length === 0 && !loading && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
          <input
            type="text"
            placeholder="Enter a topic (e.g., Maths, Science)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && topic.trim() && !loading) fetchMCQs();
            }}
            className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 placeholder-gray-500 transition duration-150"
          />
          <button
            onClick={fetchMCQs}
            disabled={!topic.trim() || loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:bg-blue-700 transition mt-1 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.01]"
          >
            {loading ? "Generating..." : "Generate MCQs"}
          </button>
        </div>
      )}

      {/* MCQ screen */}
      {mcqs.length > 0 && !finished && current && (
        <div className="border border-gray-300 rounded-xl p-8 w-full max-w-lg bg-white mt-4 shadow-2xl">
          <p className="text-gray-600 text-sm font-medium">
            Question {currentIndex + 1} of {mcqs.length}
          </p>

          <p className="mt-4 mb-6 text-gray-900 text-xl font-semibold whitespace-pre-line leading-snug">
            {current.question}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(current.options ?? []).map((opt, idx) => {
              const correctIdx = getCorrectIndex(current);
              const isCorrect =
                correctIdx >= 0 ? idx === correctIdx : normalize(opt) === normalize(current.correct_answer);
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showAnswer}
                  className={`px-4 py-3 rounded-lg text-left transition shadow-md font-medium text-base
                    ${showAnswer
                      ? isCorrect
                        ? "bg-green-100 text-green-700 border-2 border-green-500"
                        : "bg-red-100 text-red-700 line-through opacity-80"
                      : "bg-gray-50 text-blue-800 hover:bg-blue-100 hover:shadow-lg disabled:cursor-not-allowed"
                    }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {showAnswer && (
            <div className="mt-6 border-t pt-4 border-gray-200">
              {current.explanation && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4 border-l-4 border-indigo-400">
                  <p className="text-gray-700 text-sm font-semibold mb-1">Explanation:</p>
                  <p className="text-gray-800 italic">{current.explanation}</p>
                </div>
              )}
              <button
                onClick={handleNext}
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg font-semibold"
              >
                {currentIndex + 1 === mcqs.length ? "Finish Quiz" : "Next Question"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Finished screen */}
      {finished && (
        <div className="mt-6 text-center bg-white rounded-xl p-8 w-full max-w-md border-t-8 border-green-500 shadow-2xl">
          <h2 className="text-3xl font-bold text-green-700">Quiz Finished! 🎉</h2>
          <p className="mt-4 text-gray-800 text-xl">
            Your Score: <span className="font-extrabold text-indigo-600">{userScore}</span> / {mcqs.length}
          </p>
          <button
            onClick={resetQuiz}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-lg font-semibold transform hover:scale-[1.05]"
          >
            Start New Quiz
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
          <p className="text-lg text-blue-600 font-semibold animate-pulse">Loading MCQs...</p>
        </div>
      )}
    </main>
  );
}
