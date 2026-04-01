// MCAT Scoring: 472-528 total, 118-132 per section
// Each section raw score → scaled score via approximate conversion

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  correct: number;
  total: number;
  rawPercent: number;
  scaledScore: number;
}

export interface MockScore {
  sections: SectionScore[];
  totalScaled: number;
  percentile: number;
}

// Approximate raw % → scaled score mapping per section (118-132)
function rawPercentToScaled(rawPercent: number): number {
  // Linear interpolation: 0% → 118, 100% → 132
  // With slight curve to approximate real MCAT distribution
  const curved = Math.pow(rawPercent / 100, 0.9) * 100;
  const scaled = 118 + (curved / 100) * 14;
  return Math.round(scaled);
}

// Approximate total scaled → percentile
function scaledToPercentile(total: number): number {
  if (total >= 524) return 99;
  if (total >= 521) return 97;
  if (total >= 518) return 95;
  if (total >= 515) return 90;
  if (total >= 512) return 83;
  if (total >= 510) return 78;
  if (total >= 508) return 72;
  if (total >= 506) return 65;
  if (total >= 504) return 57;
  if (total >= 502) return 49;
  if (total >= 500) return 42;
  if (total >= 498) return 34;
  if (total >= 496) return 27;
  if (total >= 494) return 21;
  if (total >= 492) return 16;
  if (total >= 490) return 11;
  if (total >= 488) return 8;
  if (total >= 486) return 5;
  if (total >= 484) return 3;
  if (total >= 480) return 2;
  return 1;
}

export function calculateMockScore(
  sectionResults: {
    sectionId: string;
    sectionName: string;
    answers: { questionId: string; selected: number; correct: number }[];
  }[]
): MockScore {
  const sections: SectionScore[] = sectionResults.map((sr) => {
    const correct = sr.answers.filter((a) => a.selected === a.correct).length;
    const total = sr.answers.length;
    const rawPercent = total > 0 ? (correct / total) * 100 : 0;
    const scaledScore = rawPercentToScaled(rawPercent);

    return {
      sectionId: sr.sectionId,
      sectionName: sr.sectionName,
      correct,
      total,
      rawPercent,
      scaledScore,
    };
  });

  const totalScaled = sections.reduce((sum, s) => sum + s.scaledScore, 0);
  const percentile = scaledToPercentile(totalScaled);

  return { sections, totalScaled, percentile };
}
