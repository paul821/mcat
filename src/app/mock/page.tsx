"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { sections, Section } from "@/data/sections";
import {
  loadQuestionsForTopics,
  shuffleArray,
  Question,
} from "@/lib/questions";
import { calculateMockScore, MockScore } from "@/lib/scoring";
import { recordMockResult } from "@/lib/storage";
import BackButton from "@/components/BackButton";

type Step = "sections" | "config" | "testing" | "results";

interface MockQuestion {
  passage: string;
  question: Question;
  subtopic: string;
  sectionId: string;
}

interface SectionBlock {
  section: Section;
  questions: MockQuestion[];
  timeMinutes: number;
  answers: (number | null)[];
  flagged: boolean[];
}

export default function MockPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sections");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [condensed, setCondensed] = useState(false);
  const [sectionBlocks, setSectionBlocks] = useState<SectionBlock[]>([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState<MockScore | null>(null);
  const [reviewQuestionIdx, setReviewQuestionIdx] = useState<number | null>(null);
  const [reviewSectionIdx, setReviewSectionIdx] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const currentBlock = sectionBlocks[currentSectionIdx];
  const currentQuestion = currentBlock?.questions[currentQuestionIdx];

  const startMock = useCallback(async () => {
    const blocks: SectionBlock[] = [];

    for (const sectionId of selectedSections) {
      const section = sections.find((s) => s.id === sectionId)!;
      const files = section.subtopics.map((st) => st.questionFile);
      const pool = await loadQuestionsForTopics(files);
      const shuffled = shuffleArray(pool);

      const questionCount = condensed
        ? Math.ceil(section.questionCount / 3)
        : section.questionCount;
      const timeMinutes = condensed
        ? Math.ceil(section.timeMinutes / 3)
        : section.timeMinutes;

      const selected = shuffled.slice(0, questionCount).map((q) => ({
        ...q,
        sectionId,
      }));

      blocks.push({
        section,
        questions: selected,
        timeMinutes,
        answers: new Array(selected.length).fill(null),
        flagged: new Array(selected.length).fill(false),
      });
    }

    setSectionBlocks(blocks);
    setCurrentSectionIdx(0);
    setCurrentQuestionIdx(0);
    setTimeRemaining(blocks[0].timeMinutes * 60);
    setStep("testing");
  }, [selectedSections, condensed]);

  // Timer
  useEffect(() => {
    if (step !== "testing") return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-advance to next section or finish
          handleEndSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, currentSectionIdx]);

  const handleEndSection = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentSectionIdx < sectionBlocks.length - 1) {
      const nextIdx = currentSectionIdx + 1;
      setCurrentSectionIdx(nextIdx);
      setCurrentQuestionIdx(0);
      setTimeRemaining(sectionBlocks[nextIdx].timeMinutes * 60);
    } else {
      // Calculate scores
      const results = sectionBlocks.map((block) => ({
        sectionId: block.section.id,
        sectionName: block.section.shortName,
        answers: block.questions.map((q, i) => ({
          questionId: q.question.id,
          selected: block.answers[i] ?? -1,
          correct: q.question.correct,
        })),
      }));

      const mockScore = calculateMockScore(results);
      setScore(mockScore);

      // Save to localStorage
      recordMockResult({
        date: new Date().toISOString(),
        totalScore: mockScore.totalScaled,
        percentile: mockScore.percentile,
        sections: mockScore.sections.map((s) => ({
          sectionId: s.sectionId,
          sectionName: s.sectionName,
          correct: s.correct,
          total: s.total,
          scaledScore: s.scaledScore,
        })),
      });

      setStep("results");
    }
  }, [currentSectionIdx, sectionBlocks]);

  const selectAnswer = (idx: number) => {
    setSectionBlocks((prev) => {
      const updated = [...prev];
      const block = { ...updated[currentSectionIdx] };
      const answers = [...block.answers];
      answers[currentQuestionIdx] = idx;
      block.answers = answers;
      updated[currentSectionIdx] = block;
      return updated;
    });
  };

  const toggleFlag = () => {
    setSectionBlocks((prev) => {
      const updated = [...prev];
      const block = { ...updated[currentSectionIdx] };
      const flagged = [...block.flagged];
      flagged[currentQuestionIdx] = !flagged[currentQuestionIdx];
      block.flagged = flagged;
      updated[currentSectionIdx] = block;
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleBack = () => {
    if (step === "testing") {
      if (
        confirm(
          "Are you sure you want to leave? Your progress will be lost."
        )
      ) {
        if (timerRef.current) clearInterval(timerRef.current);
        setStep("sections");
        setSectionBlocks([]);
      }
    } else if (step === "config") {
      setStep("sections");
    } else if (step === "results") {
      router.push("/");
    } else {
      router.push("/");
    }
  };

  // Review mode within results
  const reviewQuestion =
    reviewSectionIdx !== null && reviewQuestionIdx !== null
      ? sectionBlocks[reviewSectionIdx]?.questions[reviewQuestionIdx]
      : null;
  const reviewAnswer =
    reviewSectionIdx !== null && reviewQuestionIdx !== null
      ? sectionBlocks[reviewSectionIdx]?.answers[reviewQuestionIdx]
      : null;

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <BackButton onClick={handleBack} />

      <AnimatePresence mode="wait">
        {/* STEP 1: Section Selection */}
        {step === "sections" && (
          <motion.div
            key="sections"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-20"
          >
            <h2 className="text-2xl font-bold mb-2">Mock Exam</h2>
            <p className="text-muted text-sm mb-10">
              Select sections to include
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-8">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`relative rounded-2xl border p-5 text-left transition-all ${
                    selectedSections.includes(section.id)
                      ? "border-transparent"
                      : "border-card-border bg-card hover:border-muted"
                  }`}
                  style={
                    selectedSections.includes(section.id)
                      ? {
                          boxShadow: `0 0 0 2px ${section.color}, 0 0 16px ${section.color}40`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="text-xs font-mono mb-1"
                    style={{ color: section.color }}
                  >
                    {section.shortName}
                  </div>
                  <div className="text-sm font-medium leading-tight">
                    {section.name}
                  </div>
                  <div className="text-muted text-xs mt-2">
                    {section.questionCount} questions &middot;{" "}
                    {section.timeMinutes} min
                  </div>
                </button>
              ))}
            </div>

            {selectedSections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <div
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      condensed ? "bg-accent" : "bg-card-border"
                    }`}
                    onClick={() => setCondensed(!condensed)}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        condensed ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                  <span className="text-muted">
                    Condensed (1/3 time & questions)
                  </span>
                </label>

                <button
                  onClick={startMock}
                  className="bg-foreground text-background px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90"
                >
                  Begin Exam
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STEP 2: Active Test */}
        {step === "testing" && currentBlock && currentQuestion && (
          <motion.div
            key="testing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Timer Bar */}
            <div className="border-b border-card-border px-4 py-2 flex items-center justify-between bg-card sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <span
                  className="text-xs font-mono px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${currentBlock.section.color}18`,
                    color: currentBlock.section.color,
                  }}
                >
                  {currentBlock.section.shortName}
                </span>
                <span className="text-xs text-muted">
                  Section {currentSectionIdx + 1} of {sectionBlocks.length}
                </span>
              </div>

              <div
                className={`font-mono text-sm font-semibold ${
                  timeRemaining < 300 ? "text-error" : "text-foreground"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {currentQuestionIdx + 1} / {currentBlock.questions.length}
                </span>
                <button
                  onClick={handleEndSection}
                  className="text-xs text-muted hover:text-foreground border border-card-border rounded px-3 py-1"
                >
                  {currentSectionIdx < sectionBlocks.length - 1
                    ? "End Section"
                    : "Finish Exam"}
                </button>
              </div>
            </div>

            <div className="flex-1 flex">
              {/* Question Navigation Sidebar */}
              <div className="hidden md:block w-16 border-r border-card-border p-2 overflow-y-auto">
                {currentBlock.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-full text-xs py-1.5 rounded mb-1 font-mono ${
                      idx === currentQuestionIdx
                        ? "bg-accent text-white"
                        : currentBlock.answers[idx] !== null
                        ? "bg-surface text-foreground"
                        : "text-muted hover:bg-surface"
                    } ${currentBlock.flagged[idx] ? "ring-1 ring-yellow-500" : ""}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col lg:flex-row">
                {/* Passage */}
                <div className="lg:w-1/2 p-6 lg:border-r border-card-border overflow-y-auto lg:max-h-[calc(100vh-52px)]">
                  <div className="text-xs text-muted uppercase tracking-wider mb-3">
                    Passage
                  </div>
                  <div className="passage-text text-sm leading-relaxed whitespace-pre-line">
                    {currentQuestion.passage}
                  </div>
                </div>

                {/* Question */}
                <div className="lg:w-1/2 p-6 overflow-y-auto lg:max-h-[calc(100vh-52px)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted">
                      Question {currentQuestionIdx + 1}
                    </span>
                    <button
                      onClick={toggleFlag}
                      className={`text-xs px-2 py-1 rounded border ${
                        currentBlock.flagged[currentQuestionIdx]
                          ? "border-yellow-500 text-yellow-500 bg-yellow-500/10"
                          : "border-card-border text-muted"
                      }`}
                    >
                      {currentBlock.flagged[currentQuestionIdx]
                        ? "Flagged"
                        : "Flag"}
                    </button>
                  </div>

                  <div className="text-sm font-medium mb-6 leading-relaxed">
                    {currentQuestion.question.stem}
                  </div>

                  <div className="space-y-3 mb-6">
                    {currentQuestion.question.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectAnswer(idx)}
                        className={`w-full text-left rounded-xl border p-4 text-sm transition-all hover:border-muted cursor-pointer ${
                          currentBlock.answers[currentQuestionIdx] === idx
                            ? "border-accent bg-accent/10"
                            : "border-card-border bg-card"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))
                      }
                      disabled={currentQuestionIdx === 0}
                      className="flex-1 border border-card-border py-3 rounded-xl text-sm font-medium disabled:opacity-30 hover:bg-surface"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        if (
                          currentQuestionIdx <
                          currentBlock.questions.length - 1
                        ) {
                          setCurrentQuestionIdx(currentQuestionIdx + 1);
                        }
                      }}
                      disabled={
                        currentQuestionIdx >=
                        currentBlock.questions.length - 1
                      }
                      className="flex-1 bg-foreground text-background py-3 rounded-xl text-sm font-semibold disabled:opacity-30 hover:opacity-90"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Results */}
        {step === "results" && score && !reviewQuestion && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center px-6 py-20"
          >
            <h2 className="text-2xl font-bold mb-2">Your Score</h2>
            <p className="text-muted text-sm mb-10">Mock exam results</p>

            {/* Total Score */}
            <div className="text-center mb-10">
              <div className="text-6xl font-bold font-mono mb-1">
                {score.totalScaled}
              </div>
              <div className="text-muted text-sm">
                out of 528 &middot; {score.percentile}th percentile
              </div>
            </div>

            {/* Section Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-10">
              {score.sections.map((s) => {
                const section = sections.find(
                  (sec) => sec.id === s.sectionId
                );
                return (
                  <div
                    key={s.sectionId}
                    className="rounded-2xl border border-card-border bg-card p-5"
                  >
                    <div
                      className="text-xs font-mono mb-2"
                      style={{ color: section?.color }}
                    >
                      {s.sectionName}
                    </div>
                    <div className="text-3xl font-bold font-mono">
                      {s.scaledScore}
                    </div>
                    <div className="text-muted text-xs mt-1">
                      {s.correct}/{s.total} correct (
                      {Math.round(s.rawPercent)}%)
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Question Grid */}
            <div className="w-full max-w-3xl">
              <h3 className="text-sm font-semibold mb-4">Question Review</h3>
              {sectionBlocks.map((block, sIdx) => (
                <div key={block.section.id} className="mb-6">
                  <div
                    className="text-xs font-mono mb-2"
                    style={{ color: block.section.color }}
                  >
                    {block.section.shortName}
                  </div>
                  <div className="grid grid-cols-10 sm:grid-cols-15 gap-1">
                    {block.questions.map((q, qIdx) => {
                      const answer = block.answers[qIdx];
                      const isCorrect = answer === q.question.correct;
                      const isUnanswered = answer === null;

                      return (
                        <button
                          key={qIdx}
                          onClick={() => {
                            setReviewSectionIdx(sIdx);
                            setReviewQuestionIdx(qIdx);
                          }}
                          className={`aspect-square rounded text-xs font-mono flex items-center justify-center border cursor-pointer hover:opacity-80 ${
                            isUnanswered
                              ? "border-card-border bg-surface text-muted"
                              : isCorrect
                              ? "border-success bg-success/15 text-success"
                              : "border-error bg-error/15 text-error"
                          }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/")}
              className="mt-10 bg-foreground text-background px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90"
            >
              Back to Home
            </button>
          </motion.div>
        )}

        {/* STEP 4: Review a Specific Question */}
        {step === "results" && reviewQuestion && (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="border-b border-card-border px-6 py-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setReviewQuestionIdx(null);
                  setReviewSectionIdx(null);
                }}
                className="text-sm text-muted hover:text-foreground flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to Results
              </button>
              <span className="text-xs text-muted">
                Question {reviewQuestionIdx! + 1}
              </span>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full">
              <div className="lg:w-1/2 p-6 lg:border-r border-card-border overflow-y-auto">
                <div className="text-xs text-muted uppercase tracking-wider mb-3">
                  Passage
                </div>
                <div className="passage-text text-sm leading-relaxed whitespace-pre-line">
                  {reviewQuestion.passage}
                </div>
              </div>

              <div className="lg:w-1/2 p-6 overflow-y-auto">
                <div className="text-sm font-medium mb-6 leading-relaxed">
                  {reviewQuestion.question.stem}
                </div>

                <div className="space-y-3 mb-6">
                  {reviewQuestion.question.options.map((option, idx) => {
                    let borderClass = "border-card-border";
                    let bgClass = "bg-card";

                    if (idx === reviewQuestion.question.correct) {
                      borderClass = "border-success";
                      bgClass = "bg-success/10";
                    } else if (
                      idx === reviewAnswer &&
                      idx !== reviewQuestion.question.correct
                    ) {
                      borderClass = "border-error";
                      bgClass = "bg-error/10";
                    }

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border ${borderClass} ${bgClass} p-4 text-sm`}
                      >
                        {option}
                        {idx === reviewQuestion.question.correct && (
                          <span className="ml-2 text-success text-xs">
                            (Correct)
                          </span>
                        )}
                        {idx === reviewAnswer &&
                          idx !== reviewQuestion.question.correct && (
                            <span className="ml-2 text-error text-xs">
                              (Your answer)
                            </span>
                          )}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-card-border bg-surface p-4 text-sm">
                  <div className="font-semibold mb-2">Explanation</div>
                  <div className="text-muted leading-relaxed">
                    {reviewQuestion.question.explanation}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
