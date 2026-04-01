export interface Subtopic {
  id: string;
  name: string;
  questionFile: string;
}

export interface Section {
  id: string;
  name: string;
  shortName: string;
  color: string;
  colorLight: string;
  questionCount: number; // for mock mode
  timeMinutes: number; // for mock mode
  subtopics: Subtopic[];
}

export const sections: Section[] = [
  {
    id: "chem-phys",
    name: "Chemical & Physical Foundations of Biological Systems",
    shortName: "Chem/Phys",
    color: "#3b82f6",
    colorLight: "#93c5fd",
    questionCount: 59,
    timeMinutes: 95,
    subtopics: [
      { id: "kinematics", name: "Kinematics & Dynamics", questionFile: "chem-phys/kinematics.json" },
      { id: "thermodynamics", name: "Work, Energy & Thermodynamics", questionFile: "chem-phys/thermodynamics.json" },
      { id: "fluids", name: "Fluids & Solids", questionFile: "chem-phys/fluids.json" },
      { id: "electrostatics", name: "Electrostatics & Circuits", questionFile: "chem-phys/electrostatics.json" },
      { id: "waves", name: "Waves & Sound", questionFile: "chem-phys/waves.json" },
      { id: "optics", name: "Light & Optics", questionFile: "chem-phys/optics.json" },
      { id: "atomic-structure", name: "Atomic Structure & Periodic Table", questionFile: "chem-phys/atomic-structure.json" },
      { id: "bonding", name: "Bonding & Chemical Interactions", questionFile: "chem-phys/bonding.json" },
      { id: "stoichiometry", name: "Stoichiometry & Solutions", questionFile: "chem-phys/stoichiometry.json" },
      { id: "acids-bases", name: "Acids, Bases & Buffers", questionFile: "chem-phys/acids-bases.json" },
      { id: "electrochemistry", name: "Electrochemistry", questionFile: "chem-phys/electrochemistry.json" },
      { id: "organic-reactions", name: "Organic Chemistry Reactions", questionFile: "chem-phys/organic-reactions.json" },
    ],
  },
  {
    id: "cars",
    name: "Critical Analysis & Reasoning Skills",
    shortName: "CARS",
    color: "#8b5cf6",
    colorLight: "#c4b5fd",
    questionCount: 53,
    timeMinutes: 90,
    subtopics: [
      { id: "humanities", name: "Humanities", questionFile: "cars/humanities.json" },
      { id: "social-sciences", name: "Social Sciences", questionFile: "cars/social-sciences.json" },
    ],
  },
  {
    id: "bio-biochem",
    name: "Biological & Biochemical Foundations of Living Systems",
    shortName: "Bio/Biochem",
    color: "#10b981",
    colorLight: "#6ee7b7",
    questionCount: 59,
    timeMinutes: 95,
    subtopics: [
      { id: "amino-acids", name: "Amino Acids & Proteins", questionFile: "bio-biochem/amino-acids.json" },
      { id: "enzyme-kinetics", name: "Enzyme Kinetics & Regulation", questionFile: "bio-biochem/enzyme-kinetics.json" },
      { id: "molecular-bio", name: "DNA, RNA & Protein Synthesis", questionFile: "bio-biochem/molecular-bio.json" },
      { id: "metabolism", name: "Cellular Metabolism", questionFile: "bio-biochem/metabolism.json" },
      { id: "cell-bio", name: "Cell Biology & Organelles", questionFile: "bio-biochem/cell-bio.json" },
      { id: "genetics", name: "Genetics & Heredity", questionFile: "bio-biochem/genetics.json" },
      { id: "evolution", name: "Evolution & Natural Selection", questionFile: "bio-biochem/evolution.json" },
      { id: "nervous-system", name: "Nervous System & Neuroscience", questionFile: "bio-biochem/nervous-system.json" },
      { id: "endocrine", name: "Endocrine System", questionFile: "bio-biochem/endocrine.json" },
      { id: "cardiovascular", name: "Cardiovascular & Respiratory Systems", questionFile: "bio-biochem/cardiovascular.json" },
      { id: "immune", name: "Immune System", questionFile: "bio-biochem/immune.json" },
      { id: "digestive", name: "Digestive & Excretory Systems", questionFile: "bio-biochem/digestive.json" },
    ],
  },
  {
    id: "psych-soc",
    name: "Psychological, Social & Biological Foundations of Behavior",
    shortName: "Psych/Soc",
    color: "#f59e0b",
    colorLight: "#fcd34d",
    questionCount: 59,
    timeMinutes: 95,
    subtopics: [
      { id: "sensation-perception", name: "Sensation & Perception", questionFile: "psych-soc/sensation-perception.json" },
      { id: "learning-memory", name: "Learning & Memory", questionFile: "psych-soc/learning-memory.json" },
      { id: "cognition", name: "Cognition & Language", questionFile: "psych-soc/cognition.json" },
      { id: "motivation-emotion", name: "Motivation & Emotion", questionFile: "psych-soc/motivation-emotion.json" },
      { id: "identity-personality", name: "Identity & Personality", questionFile: "psych-soc/identity-personality.json" },
      { id: "psychological-disorders", name: "Psychological Disorders & Treatment", questionFile: "psych-soc/psychological-disorders.json" },
      { id: "social-psychology", name: "Social Psychology & Group Behavior", questionFile: "psych-soc/social-psychology.json" },
      { id: "sociology", name: "Sociology & Social Structures", questionFile: "psych-soc/sociology.json" },
      { id: "health-disparities", name: "Health Disparities & Demographics", questionFile: "psych-soc/health-disparities.json" },
    ],
  },
];

export function getSectionById(id: string): Section | undefined {
  return sections.find((s) => s.id === id);
}
