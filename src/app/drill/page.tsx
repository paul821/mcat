"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useRouter } from "next/navigation";
import { sections, Section } from "@/data/sections";
import {
  loadQuestionsForTopics,
  shuffleArray,
  Question,
} from "@/lib/questions";
import { recordDrillAnswer } from "@/lib/storage";
import BackButton from "@/components/BackButton";
import MathText, { MathBlock } from "@/components/MathText";

type Step = "sections" | "topics" | "drilling";

interface DrillQuestion {
  passage: string;
  question: Question;
  subtopic: string;
}

export default function DrillPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sections");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<
    Record<string, string[]>
  >({});
  const [questionPool, setQuestionPool] = useState<DrillQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });

  const currentQuestion = questionPool[currentIndex];

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleTopic = (sectionId: string, topicId: string) => {
    setSelectedTopics((prev) => {
      const current = prev[sectionId] || [];
      const updated = current.includes(topicId)
        ? current.filter((t) => t !== topicId)
        : [...current, topicId];
      return { ...prev, [sectionId]: updated };
    });
  };

  const proceedToTopics = () => {
    const initial: Record<string, string[]> = {};
    for (const id of selectedSections) {
      initial[id] = [];
    }
    setSelectedTopics(initial);
    setStep("topics");
  };

  const startDrilling = useCallback(async () => {
    const files: string[] = [];
    for (const sectionId of selectedSections) {
      const section = sections.find((s) => s.id === sectionId)!;
      const topics = selectedTopics[sectionId] || [];
      for (const topicId of topics) {
        const subtopic = section.subtopics.find((st) => st.id === topicId);
        if (subtopic) files.push(subtopic.questionFile);
      }
    }

    const pool = await loadQuestionsForTopics(files);
    setQuestionPool(shuffleArray(pool));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setStep("drilling");
  }, [selectedSections, selectedTopics]);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setSubmitted(true);
    const isCorrect = selectedAnswer === currentQuestion.question.correct;
    setStats((prev) => ({
      answered: prev.answered + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
    recordDrillAnswer(currentQuestion.subtopic, isCorrect);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questionPool.length) {
      setQuestionPool(shuffleArray(questionPool));
      setCurrentIndex(0);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
    setSelectedAnswer(null);
    setSubmitted(false);
  };

  const handleBack = () => {
    if (step === "drilling") {
      setStep("topics");
      setQuestionPool([]);
      setStats({ answered: 0, correct: 0 });
    } else if (step === "topics") {
      setStep("sections");
    } else {
      router.push("/");
    }
  };

  const hasTopicsSelected = Object.values(selectedTopics).some(
    (arr) => arr.length > 0
  );

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {/* STEP 1: Section Selection */}
          {step === "sections" && (
            <motion.div
              key="sections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Top nav */}
              <div className="px-6 py-4">
                <BackButton onClick={handleBack} label="Home" />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
                <h2 className="text-2xl font-bold mb-2">Select Sections</h2>
                <p className="text-muted text-sm mb-10">
                  Choose which sections to practice
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-10">
                  {sections.map((section) => {
                    const isSelected = selectedSections.includes(section.id);
                    return (
                      <motion.button
                        key={section.id}
                        layoutId={`section-${section.id}`}
                        onClick={() => toggleSection(section.id)}
                        whileTap={{ scale: 0.97 }}
                        className={`relative rounded-2xl border p-5 text-left cursor-pointer ${
                          isSelected
                            ? "border-transparent bg-card"
                            : "border-card-border bg-card hover:border-muted"
                        }`}
                        style={
                          isSelected
                            ? {
                                boxShadow: `0 0 0 2px ${section.color}, 0 0 16px ${section.color}40`,
                              }
                            : { boxShadow: "none" }
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
                          {section.subtopics.length} topics
                        </div>
                        {isSelected && (
                          <div
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: section.color }}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {selectedSections.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={proceedToTopics}
                    className="bg-foreground text-background px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90"
                  >
                    Select Topics
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Topic Selection */}
          {step === "topics" && (
            <motion.div
              key="topics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Top nav */}
              <div className="px-6 py-4">
                <BackButton onClick={handleBack} label="Sections" />
              </div>

              <div className="flex-1 px-6 pb-24 max-w-3xl mx-auto w-full">
                <h2 className="text-xl font-bold mb-1">Select Topics</h2>
                <p className="text-muted text-sm mb-8">
                  Pick subtopics to drill
                </p>

                {selectedSections.map((sectionId) => {
                  const section = sections.find(
                    (s) => s.id === sectionId
                  ) as Section;
                  const selected = selectedTopics[sectionId] || [];

                  return (
                    <div key={sectionId} className="mb-10">
                      <motion.div
                        layoutId={`section-${sectionId}`}
                        className="inline-block rounded-xl px-4 py-2 mb-4 text-sm font-semibold"
                        style={{
                          backgroundColor: `${section.color}18`,
                          color: section.color,
                          border: `1px solid ${section.color}40`,
                        }}
                      >
                        {section.shortName}
                      </motion.div>

                      <div className="flex flex-wrap gap-2">
                        {section.subtopics.map((subtopic) => {
                          const isSelected = selected.includes(subtopic.id);
                          return (
                            <button
                              key={subtopic.id}
                              onClick={() =>
                                toggleTopic(sectionId, subtopic.id)
                              }
                              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                                isSelected
                                  ? "border-transparent text-white"
                                  : "border-card-border bg-card text-foreground hover:border-muted"
                              }`}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: section.color,
                                      boxShadow: `0 0 12px ${section.color}50`,
                                    }
                                  : undefined
                              }
                            >
                              {subtopic.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasTopicsSelected && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed bottom-8 right-8 bg-foreground text-background px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 shadow-lg z-30"
                  onClick={startDrilling}
                >
                  Start Drilling
                </motion.button>
              )}
            </motion.div>
          )}

          {/* STEP 3: Drill Session */}
          {step === "drilling" && currentQuestion && (
            <motion.div
              key="drilling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Top bar with integrated back button */}
              <div className="border-b border-card-border px-6 py-3 flex items-center justify-between bg-card sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <BackButton onClick={handleBack} label="Topics" />
                  <span className="text-card-border">|</span>
                  <span className="text-xs text-muted">
                    Question {stats.answered + 1}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {stats.correct}/{stats.answered} correct
                  {stats.answered > 0 && (
                    <span className="ml-2">
                      ({Math.round((stats.correct / stats.answered) * 100)}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full">
                {/* Passage */}
                <div className="lg:w-1/2 p-6 lg:border-r border-card-border overflow-y-auto lg:max-h-[calc(100vh-52px)]">
                  <div className="text-xs text-muted uppercase tracking-wider mb-3">
                    Passage &middot; {currentQuestion.subtopic}
                  </div>
                  <MathBlock
                    text={currentQuestion.passage}
                    className="passage-text text-sm leading-relaxed whitespace-pre-line"
                  />
                </div>

                {/* Question */}
                <div className="lg:w-1/2 p-6 overflow-y-auto lg:max-h-[calc(100vh-52px)]">
                  <div className="text-sm font-medium mb-6 leading-relaxed">
                    <MathText text={currentQuestion.question.stem} />
                  </div>

                  <div className="space-y-3 mb-6">
                    {currentQuestion.question.options.map((option, idx) => {
                      let borderClass = "border-card-border";
                      let bgClass = "bg-card";

                      if (submitted) {
                        if (idx === currentQuestion.question.correct) {
                          borderClass = "border-success";
                          bgClass = "bg-success/10";
                        } else if (
                          idx === selectedAnswer &&
                          idx !== currentQuestion.question.correct
                        ) {
                          borderClass = "border-error";
                          bgClass = "bg-error/10";
                        }
                      } else if (idx === selectedAnswer) {
                        borderClass = "border-accent";
                        bgClass = "bg-accent/10";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            !submitted && setSelectedAnswer(idx)
                          }
                          disabled={submitted}
                          className={`w-full text-left rounded-xl border ${borderClass} ${bgClass} p-4 text-sm transition-all ${
                            !submitted ? "hover:border-muted cursor-pointer" : ""
                          }`}
                        >
                          <MathText text={option} />
                        </button>
                      );
                    })}
                  </div>

                  {!submitted ? (
                    <button
                      onClick={handleSubmit}
                      disabled={selectedAnswer === null}
                      className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-semibold disabled:opacity-30 hover:opacity-90"
                    >
                      Submit
                    </button>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border p-4 mb-4 text-sm ${
                          selectedAnswer === currentQuestion.question.correct
                            ? "border-success bg-success/10"
                            : "border-error bg-error/10"
                        }`}
                      >
                        <div className="font-semibold mb-2">
                          {selectedAnswer === currentQuestion.question.correct
                            ? "Correct!"
                            : "Incorrect"}
                        </div>
                        <div className="text-muted leading-relaxed">
                          <MathText text={currentQuestion.question.explanation} />
                        </div>
                      </motion.div>

                      <button
                        onClick={nextQuestion}
                        className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-semibold hover:opacity-90"
                      >
                        Next Question
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading state */}
          {step === "drilling" && !currentQuestion && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-muted text-sm">Loading questions...</div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </main>
  );
}
