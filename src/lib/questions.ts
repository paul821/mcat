export interface Question {
  id: string;
  stem: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface PassageSet {
  id: string;
  passage: string;
  questions: Question[];
}

export interface SubtopicData {
  subtopic: string;
  sectionId: string;
  passageSets: PassageSet[];
}

// Cache loaded question data
const questionCache: Map<string, SubtopicData> = new Map();

export async function loadQuestions(questionFile: string): Promise<SubtopicData> {
  if (questionCache.has(questionFile)) {
    return questionCache.get(questionFile)!;
  }

  const response = await fetch(`/questions/${questionFile}`);
  const data: SubtopicData = await response.json();
  questionCache.set(questionFile, data);
  return data;
}

export async function loadQuestionsForTopics(
  questionFiles: string[]
): Promise<{ passage: string; question: Question; subtopic: string }[]> {
  const allData = await Promise.all(questionFiles.map(loadQuestions));
  const pool: { passage: string; question: Question; subtopic: string }[] = [];

  for (const data of allData) {
    for (const ps of data.passageSets) {
      for (const q of ps.questions) {
        pool.push({
          passage: ps.passage,
          question: q,
          subtopic: data.subtopic,
        });
      }
    }
  }

  return pool;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomQuestions(
  pool: { passage: string; question: Question; subtopic: string }[],
  count?: number
): { passage: string; question: Question; subtopic: string }[] {
  const shuffled = shuffleArray(pool);
  if (count) {
    return shuffled.slice(0, count);
  }
  return shuffled;
}
