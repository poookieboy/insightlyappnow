import type { Curriculum, Grade } from "./store";

export interface Question {
  id: string;
  subject: string;
  question: string;
  answer: string;
}

// Predefined real questions per grade. Compact but real, not random.
const BANK: Record<string, Question[]> = {
  "Grade 1": [
    { id: "g1-1", subject: "Math", question: "What is 5 + 3?", answer: "8" },
    { id: "g1-2", subject: "Math", question: "What is 10 - 4?", answer: "6" },
    { id: "g1-3", subject: "English", question: "What letter comes after M?", answer: "N" },
    { id: "g1-4", subject: "Science", question: "Name 2 farm animals.", answer: "Cow, sheep" },
  ],
  "Grade 4": [
    { id: "g4-1", subject: "Math", question: "What is 12 × 7?", answer: "84" },
    { id: "g4-2", subject: "Math", question: "Convert 1/2 to a decimal.", answer: "0.5" },
    { id: "g4-3", subject: "Science", question: "What gas do plants release?", answer: "Oxygen" },
    { id: "g4-4", subject: "English", question: "What is the plural of 'child'?", answer: "Children" },
  ],
  "Grade 7": [
    { id: "g7-1", subject: "Math", question: "Solve: 2x + 5 = 17", answer: "x = 6" },
    { id: "g7-2", subject: "Math", question: "Area of a triangle with base 8 and height 5?", answer: "20" },
    { id: "g7-3", subject: "Science", question: "What is photosynthesis?", answer: "Plants making food from sunlight, CO2 and water" },
    { id: "g7-4", subject: "Geography", question: "Which is the longest river in Africa?", answer: "Nile" },
  ],
  "Grade 9": [
    { id: "g9-1", subject: "Algebra", question: "Factorise: x² - 9", answer: "(x-3)(x+3)" },
    { id: "g9-2", subject: "Algebra", question: "Solve: 3x - 7 = 11", answer: "x = 6" },
    { id: "g9-3", subject: "Physics", question: "State Newton's First Law.", answer: "An object stays at rest or in motion unless acted on by a force" },
    { id: "g9-4", subject: "Chemistry", question: "What is the chemical symbol for sodium?", answer: "Na" },
    { id: "g9-5", subject: "Biology", question: "Name the powerhouse of the cell.", answer: "Mitochondria" },
  ],
  "Grade 11": [
    { id: "g11-1", subject: "Math", question: "Differentiate: f(x) = 3x² + 2x", answer: "f'(x) = 6x + 2" },
    { id: "g11-2", subject: "Physics", question: "Define acceleration.", answer: "Rate of change of velocity with time" },
    { id: "g11-3", subject: "Chemistry", question: "What is Avogadro's number?", answer: "6.022 × 10²³" },
    { id: "g11-4", subject: "Biology", question: "What is meiosis?", answer: "Cell division producing 4 haploid gametes" },
  ],
  "Grade 12": [
    { id: "g12-1", subject: "Math", question: "Integrate: ∫ 2x dx", answer: "x² + C" },
    { id: "g12-2", subject: "Physics", question: "State the equation E = ?", answer: "E = mc²" },
    { id: "g12-3", subject: "Chemistry", question: "Define electronegativity.", answer: "Tendency of an atom to attract bonding electrons" },
    { id: "g12-4", subject: "Biology", question: "What is DNA replication?", answer: "Process of copying DNA before cell division" },
  ],
};

const GRADE_FALLBACK: Record<Grade, Grade> = {
  "Grade 1": "Grade 1", "Grade 2": "Grade 1", "Grade 3": "Grade 4",
  "Grade 4": "Grade 4", "Grade 5": "Grade 4", "Grade 6": "Grade 7",
  "Grade 7": "Grade 7", "Grade 8": "Grade 7", "Grade 9": "Grade 9",
  "Grade 10": "Grade 9", "Grade 11": "Grade 11", "Grade 12": "Grade 12",
};

export function getQuestions(curriculum: Curriculum, grade: Grade): Question[] {
  const key = GRADE_FALLBACK[grade] || "Grade 7";
  const base = BANK[key] || [];
  // tag with curriculum prefix to feel personalised
  return base.map((q) => ({ ...q, id: `${curriculum}-${q.id}` }));
}
