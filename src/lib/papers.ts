// Mock test paper bank — multi-question papers per subject.

import type { Curriculum, Grade } from "./store";

export type QuestionKind = "mcq" | "short";

export interface PaperQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options?: string[]; // for MCQ
  correctIndex?: number; // for MCQ
  modelAnswer?: string; // for short
  marks: number;
}

export interface Paper {
  id: string;
  subject: string;
  emoji: string;
  title: string; // e.g. "Paper 1 — Algebra Foundations"
  durationMinutes: number;
  questions: PaperQuestion[];
}

type Band = "primary" | "lower" | "upper" | "senior";

const PAPERS_BY_BAND: Record<Band, Paper[]> = {
  primary: [
    {
      id: "math-p1",
      subject: "Mathematics",
      emoji: "🧮",
      title: "Paper 1 — Number & Operations",
      durationMinutes: 20,
      questions: [
        { id: "q1", kind: "mcq", prompt: "What is 14 + 9?", options: ["21", "22", "23", "24"], correctIndex: 2, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Which is even?", options: ["7", "11", "12", "15"], correctIndex: 2, marks: 1 },
        { id: "q3", kind: "mcq", prompt: "30 ÷ 5 = ?", options: ["5", "6", "7", "8"], correctIndex: 1, marks: 1 },
        { id: "q4", kind: "short", prompt: "Write 234 in words.", modelAnswer: "Two hundred and thirty-four", marks: 2 },
        { id: "q5", kind: "short", prompt: "A bag has 12 sweets. You give 5 away. How many remain?", modelAnswer: "7 sweets", marks: 2 },
      ],
    },
    {
      id: "eng-p1",
      subject: "English",
      emoji: "📖",
      title: "Paper 1 — Grammar Basics",
      durationMinutes: 15,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Plural of 'child'?", options: ["childs", "children", "childes", "childer"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Choose the noun:", options: ["run", "happy", "table", "quickly"], correctIndex: 2, marks: 1 },
        { id: "q3", kind: "short", prompt: "Write a sentence using the word 'because'.", modelAnswer: "Any correct sentence, e.g. 'I was tired because I ran a lot.'", marks: 2 },
      ],
    },
  ],
  lower: [
    {
      id: "math-p1",
      subject: "Mathematics",
      emoji: "🧮",
      title: "Paper 1 — Algebra & Arithmetic",
      durationMinutes: 30,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Solve: 2x + 3 = 11", options: ["x = 3", "x = 4", "x = 5", "x = 6"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Simplify: 3(x + 2)", options: ["3x + 2", "3x + 6", "x + 6", "3x + 5"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "mcq", prompt: "What is 25% of 80?", options: ["15", "20", "25", "30"], correctIndex: 1, marks: 1 },
        { id: "q4", kind: "short", prompt: "Find the area of a triangle with base 10 cm and height 6 cm. Show working.", modelAnswer: "Area = ½ × 10 × 6 = 30 cm²", marks: 3 },
        { id: "q5", kind: "short", prompt: "A car travels 120 km in 2 hours. Find its average speed.", modelAnswer: "Speed = 120 ÷ 2 = 60 km/h", marks: 3 },
      ],
    },
    {
      id: "math-p2",
      subject: "Mathematics",
      emoji: "🧮",
      title: "Paper 2 — Geometry & Statistics",
      durationMinutes: 30,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Sum of interior angles of a triangle?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Mean of 3, 5, 7, 9, 11?", options: ["6", "7", "8", "9"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "short", prompt: "List the modes of: 2, 4, 4, 5, 6, 6, 6, 8.", modelAnswer: "Mode = 6 (it appears most often).", marks: 2 },
      ],
    },
    {
      id: "sci-p1",
      subject: "Science",
      emoji: "🔬",
      title: "Paper 1 — General Science",
      durationMinutes: 30,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Which gas do plants take in for photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctIndex: 2, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Boiling point of pure water?", options: ["50°C", "75°C", "100°C", "150°C"], correctIndex: 2, marks: 1 },
        { id: "q3", kind: "short", prompt: "Explain photosynthesis in one sentence.", modelAnswer: "Plants use sunlight, water, and CO₂ to make glucose and release oxygen.", marks: 3 },
      ],
    },
    {
      id: "eng-p1",
      subject: "English",
      emoji: "📖",
      title: "Paper 1 — Comprehension & Grammar",
      durationMinutes: 30,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Identify the adjective: 'The blue car raced past.'", options: ["car", "blue", "raced", "past"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "short", prompt: "Define 'simile' and give an example.", modelAnswer: "A comparison using 'like' or 'as'. E.g. 'as brave as a lion'.", marks: 3 },
      ],
    },
  ],
  upper: [
    {
      id: "math-p1",
      subject: "Mathematics",
      emoji: "🧮",
      title: "Paper 1 — Algebra & Functions",
      durationMinutes: 45,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Factorise: x² − 16", options: ["(x−4)²", "(x−4)(x+4)", "(x−2)(x+8)", "x(x−16)"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Solve: x² = 49", options: ["x = 7", "x = ±7", "x = ±49", "x = 14"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "mcq", prompt: "Gradient through (2,3) and (5,12)?", options: ["2", "3", "4", "5"], correctIndex: 1, marks: 1 },
        { id: "q4", kind: "short", prompt: "Solve the simultaneous equations: x + y = 7, x − y = 1.", modelAnswer: "Adding: 2x = 8 → x = 4. Then y = 3.", marks: 4 },
        { id: "q5", kind: "short", prompt: "Expand and simplify: (x + 3)(x − 5).", modelAnswer: "x² − 5x + 3x − 15 = x² − 2x − 15", marks: 3 },
      ],
    },
    {
      id: "math-p2",
      subject: "Mathematics",
      emoji: "🧮",
      title: "Paper 2 — Geometry & Trigonometry",
      durationMinutes: 45,
      questions: [
        { id: "q1", kind: "mcq", prompt: "sin 30° = ?", options: ["0", "0.5", "√2/2", "1"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Pythagoras: hypotenuse for sides 3 and 4?", options: ["5", "6", "7", "12"], correctIndex: 0, marks: 1 },
        { id: "q3", kind: "short", prompt: "Calculate the circumference of a circle with radius 7 cm. Use π ≈ 3.14.", modelAnswer: "C = 2πr = 2 × 3.14 × 7 ≈ 43.96 cm", marks: 3 },
      ],
    },
    {
      id: "bio-p1",
      subject: "Biology",
      emoji: "🌱",
      title: "Paper 1 — Cells & Systems",
      durationMinutes: 45,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Which organelle makes proteins?", options: ["Nucleus", "Ribosome", "Mitochondrion", "Vacuole"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Largest artery in the body?", options: ["Vena cava", "Aorta", "Pulmonary", "Carotid"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "short", prompt: "Describe the function of the small intestine.", modelAnswer: "Absorbs digested nutrients into the bloodstream via villi.", marks: 3 },
      ],
    },
    {
      id: "chem-p1",
      subject: "Chemistry",
      emoji: "⚗️",
      title: "Paper 1 — Atoms & Bonding",
      durationMinutes: 45,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Charge of an electron?", options: ["+1", "0", "−1", "+2"], correctIndex: 2, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "NaCl is held together by:", options: ["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "short", prompt: "Balance: Mg + O₂ → MgO", modelAnswer: "2Mg + O₂ → 2MgO", marks: 2 },
      ],
    },
    {
      id: "phy-p1",
      subject: "Physics",
      emoji: "⚙️",
      title: "Paper 1 — Forces & Motion",
      durationMinutes: 45,
      questions: [
        { id: "q1", kind: "mcq", prompt: "Unit of power?", options: ["Joule", "Newton", "Watt", "Pascal"], correctIndex: 2, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "F = ma. Force on 5 kg with a = 2 m/s²?", options: ["2.5 N", "7 N", "10 N", "25 N"], correctIndex: 2, marks: 1 },
        { id: "q3", kind: "short", prompt: "State Newton's Second Law in words.", modelAnswer: "The acceleration of an object is proportional to the resultant force and inversely proportional to its mass.", marks: 3 },
      ],
    },
  ],
  senior: [
    {
      id: "math-p1",
      subject: "Mathematics",
      emoji: "🧮",
      title: "Paper 1 — Calculus",
      durationMinutes: 60,
      questions: [
        { id: "q1", kind: "mcq", prompt: "d/dx (x³) = ?", options: ["x²", "3x²", "3x", "x⁴/4"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "∫ 2x dx = ?", options: ["x²", "x² + C", "2x² + C", "x"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "short", prompt: "Differentiate y = (2x + 1)³ using the chain rule.", modelAnswer: "dy/dx = 3(2x + 1)² × 2 = 6(2x + 1)²", marks: 4 },
        { id: "q4", kind: "short", prompt: "Evaluate ∫₀² (3x² + 1) dx.", modelAnswer: "[x³ + x]₀² = (8 + 2) − 0 = 10", marks: 4 },
      ],
    },
    {
      id: "math-p2",
      subject: "Mathematics",
      emoji: "🧮",
      title: "Paper 2 — Algebra & Trigonometry",
      durationMinutes: 60,
      questions: [
        { id: "q1", kind: "mcq", prompt: "log₁₀(1000) = ?", options: ["1", "2", "3", "10"], correctIndex: 2, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "cos(0°) = ?", options: ["0", "0.5", "1", "−1"], correctIndex: 2, marks: 1 },
        { id: "q3", kind: "short", prompt: "Solve for x: 2ˣ = 32", modelAnswer: "x = 5 (since 2⁵ = 32).", marks: 3 },
      ],
    },
    {
      id: "phy-p1",
      subject: "Physics",
      emoji: "⚙️",
      title: "Paper 1 — Mechanics & Energy",
      durationMinutes: 60,
      questions: [
        { id: "q1", kind: "mcq", prompt: "KE of a 2 kg object at 4 m/s?", options: ["4 J", "8 J", "16 J", "32 J"], correctIndex: 2, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Acceleration due to gravity (Earth)?", options: ["1.6 m/s²", "9.8 m/s²", "12 m/s²", "20 m/s²"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "short", prompt: "Define momentum and state its formula.", modelAnswer: "Momentum = mass × velocity (p = mv); a vector quantity.", marks: 3 },
      ],
    },
    {
      id: "chem-p1",
      subject: "Chemistry",
      emoji: "⚗️",
      title: "Paper 1 — Reactions & Bonding",
      durationMinutes: 60,
      questions: [
        { id: "q1", kind: "mcq", prompt: "pH of a neutral solution?", options: ["0", "7", "10", "14"], correctIndex: 1, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Which is an alkali?", options: ["HCl", "NaOH", "CO₂", "CH₄"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "short", prompt: "Define an exothermic reaction with one example.", modelAnswer: "Releases heat to surroundings (ΔH < 0). Example: combustion of methane.", marks: 3 },
      ],
    },
    {
      id: "bio-p1",
      subject: "Biology",
      emoji: "🌱",
      title: "Paper 1 — Genetics & Cells",
      durationMinutes: 60,
      questions: [
        { id: "q1", kind: "mcq", prompt: "DNA bases pair as:", options: ["A-T, C-G", "A-G, C-T", "A-C, T-G", "A-A, T-T"], correctIndex: 0, marks: 1 },
        { id: "q2", kind: "mcq", prompt: "Mitosis produces:", options: ["2 haploid cells", "2 identical diploid cells", "4 haploid gametes", "4 diploid cells"], correctIndex: 1, marks: 1 },
        { id: "q3", kind: "short", prompt: "Describe the role of mRNA in protein synthesis.", modelAnswer: "Carries the genetic code from DNA in the nucleus to ribosomes for translation.", marks: 3 },
      ],
    },
  ],
};

const GRADE_BAND: Record<Grade, Band> = {
  "Grade 1": "primary", "Grade 2": "primary", "Grade 3": "primary",
  "Grade 4": "primary", "Grade 5": "primary", "Grade 6": "lower",
  "Grade 7": "lower", "Grade 8": "lower",
  "Grade 9": "upper", "Grade 10": "upper",
  "Grade 11": "senior", "Grade 12": "senior",
};

export function getPapers(curriculum: Curriculum, grade: Grade): Paper[] {
  const band = GRADE_BAND[grade] || "lower";
  return PAPERS_BY_BAND[band].map((p) => ({
    ...p,
    id: `${curriculum}-${grade}-${p.id}`,
    title: `${p.title}`,
  }));
}

export function getPaper(curriculum: Curriculum, grade: Grade, paperId: string): Paper | undefined {
  return getPapers(curriculum, grade).find((p) => p.id === paperId);
}
