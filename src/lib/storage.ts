"use client";

const CONSENT_KEY = "mcat-storage-consent";
const PROGRESS_KEY = "mcat-progress";

export interface DrillProgress {
  totalAnswered: number;
  totalCorrect: number;
  topicStats: Record<string, { answered: number; correct: number }>;
}

export interface MockResult {
  date: string;
  totalScore: number;
  percentile: number;
  sections: {
    sectionId: string;
    sectionName: string;
    correct: number;
    total: number;
    scaledScore: number;
  }[];
}

export interface StoredProgress {
  drill: DrillProgress;
  mockResults: MockResult[];
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "true";
}

export function setConsent(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(CONSENT_KEY, "true");
  } else {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  }
}

export function getConsentStatus(): "granted" | "denied" | "unset" {
  if (typeof window === "undefined") return "unset";
  const val = localStorage.getItem(CONSENT_KEY);
  if (val === "true") return "granted";
  if (val === "false") return "denied";
  return "unset";
}

export function getProgress(): StoredProgress {
  if (typeof window === "undefined" || !hasConsent()) {
    return {
      drill: { totalAnswered: 0, totalCorrect: 0, topicStats: {} },
      mockResults: [],
    };
  }
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) {
    return {
      drill: { totalAnswered: 0, totalCorrect: 0, topicStats: {} },
      mockResults: [],
    };
  }
  return JSON.parse(raw);
}

export function saveProgress(progress: StoredProgress): void {
  if (typeof window === "undefined" || !hasConsent()) return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function recordDrillAnswer(subtopic: string, correct: boolean): void {
  const progress = getProgress();
  progress.drill.totalAnswered++;
  if (correct) progress.drill.totalCorrect++;

  if (!progress.drill.topicStats[subtopic]) {
    progress.drill.topicStats[subtopic] = { answered: 0, correct: 0 };
  }
  progress.drill.topicStats[subtopic].answered++;
  if (correct) progress.drill.topicStats[subtopic].correct++;

  saveProgress(progress);
}

export function recordMockResult(result: MockResult): void {
  const progress = getProgress();
  progress.mockResults.push(result);
  saveProgress(progress);
}

export function getStorageSize(): string {
  if (typeof window === "undefined") return "0 KB";
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("mcat-")) {
      total += (localStorage.getItem(key) || "").length * 2; // UTF-16
    }
  }
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}
