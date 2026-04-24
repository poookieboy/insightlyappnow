// Mock test paper bank — multi-question papers per subject, per grade band.
// Each paper has a difficulty tag + topic tag so the UI can group by difficulty.

import type { Curriculum, Grade } from "./store";

export type QuestionKind = "mcq" | "short";
export type Difficulty = "easy" | "medium" | "hard";

export interface PaperQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options?: string[]; // for MCQ
  correctIndex?: number; // for MCQ
  modelAnswer?: string; // for short — used to grade typed answers
  acceptable?: string[]; // alternate accepted short answers (lowercased compare)
  marks: number;
}

export interface Paper {
  id: string;
  subject: string;
  emoji: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  durationMinutes: number;
  questions: PaperQuestion[];
}

type Band = "primary" | "lower" | "upper" | "senior";

// Helper to keep the literal arrays compact.
const mcq = (
  id: string,
  prompt: string,
  options: string[],
  correctIndex: number,
  marks = 1,
): PaperQuestion => ({ id, kind: "mcq", prompt, options, correctIndex, marks });

const short = (
  id: string,
  prompt: string,
  modelAnswer: string,
  acceptable: string[] = [],
  marks = 2,
): PaperQuestion => ({ id, kind: "short", prompt, modelAnswer, acceptable, marks });

// ============================================================
// PRIMARY (Grades 1–5)
// ============================================================
const PRIMARY: Paper[] = [
  {
    id: "math-numbers-easy", subject: "Mathematics", emoji: "🧮",
    title: "Numbers — Easy", topic: "Numbers", difficulty: "easy", durationMinutes: 15,
    questions: [
      mcq("q1", "5 + 3 = ?", ["6", "7", "8", "9"], 2),
      mcq("q2", "10 − 4 = ?", ["4", "5", "6", "7"], 2),
      mcq("q3", "Which is the smallest?", ["12", "21", "9", "15"], 2),
      mcq("q4", "Even number?", ["3", "5", "8", "11"], 2),
      mcq("q5", "Half of 10?", ["3", "4", "5", "6"], 2),
      short("q6", "Write 27 in words.", "twenty-seven", ["twenty seven"]),
      short("q7", "What is 14 + 14?", "28"),
    ],
  },
  {
    id: "math-numbers-medium", subject: "Mathematics", emoji: "🧮",
    title: "Numbers — Medium", topic: "Numbers", difficulty: "medium", durationMinutes: 20,
    questions: [
      mcq("q1", "45 + 27 = ?", ["62", "70", "72", "82"], 2),
      mcq("q2", "100 − 36 = ?", ["54", "62", "64", "74"], 2),
      mcq("q3", "9 × 7 = ?", ["56", "63", "64", "72"], 1),
      mcq("q4", "72 ÷ 8 = ?", ["7", "8", "9", "10"], 2),
      short("q5", "Half of 86 is?", "43"),
      short("q6", "Round 87 to the nearest 10.", "90"),
      short("q7", "Sum of 25, 30 and 45?", "100"),
    ],
  },
  {
    id: "math-shapes-easy", subject: "Mathematics", emoji: "🧮",
    title: "Shapes — Easy", topic: "Geometry", difficulty: "easy", durationMinutes: 15,
    questions: [
      mcq("q1", "Sides of a triangle?", ["2", "3", "4", "5"], 1),
      mcq("q2", "Sides of a hexagon?", ["5", "6", "7", "8"], 1),
      mcq("q3", "A square has __ equal sides.", ["2", "3", "4", "5"], 2),
      short("q4", "Name a 3D shape with no flat faces.", "sphere", ["a sphere"]),
      short("q5", "How many corners does a cube have?", "8"),
    ],
  },
  {
    id: "eng-grammar-easy", subject: "English", emoji: "📖",
    title: "Grammar — Easy", topic: "Grammar", difficulty: "easy", durationMinutes: 15,
    questions: [
      mcq("q1", "Plural of 'child'?", ["childs", "children", "childes", "child"], 1),
      mcq("q2", "Plural of 'mouse'?", ["mouses", "mice", "mouse", "mises"], 1),
      mcq("q3", "Choose the noun:", ["run", "happy", "table", "quickly"], 2),
      mcq("q4", "Choose the verb:", ["blue", "sing", "tall", "soft"], 1),
      short("q5", "Opposite of 'big'.", "small", ["little", "tiny"]),
      short("q6", "Opposite of 'happy'.", "sad", ["unhappy"]),
    ],
  },
  {
    id: "sci-living-easy", subject: "Science", emoji: "🔬",
    title: "Living Things — Easy", topic: "Living Things", difficulty: "easy", durationMinutes: 15,
    questions: [
      mcq("q1", "Plants need this to make food.", ["Milk", "Sunlight", "Sugar", "Salt"], 1),
      mcq("q2", "Sense organ for seeing?", ["Ears", "Nose", "Eyes", "Skin"], 2),
      short("q3", "How many legs does a spider have?", "8"),
      short("q4", "Which gas do we breathe in?", "oxygen"),
    ],
  },
  {
    id: "ss-community-easy", subject: "Social Studies", emoji: "🌍",
    title: "My Community — Easy", topic: "Community", difficulty: "easy", durationMinutes: 10,
    questions: [
      mcq("q1", "Which is a means of water transport?", ["Bus", "Boat", "Bicycle", "Train"], 1),
      mcq("q2", "Where do we learn?", ["Hospital", "School", "Market", "Park"], 1),
      short("q3", "Name one continent.", "Africa", ["asia", "europe", "north america", "south america", "antarctica", "australia"]),
    ],
  },
];

// ============================================================
// LOWER (Grades 6–8)
// ============================================================
const LOWER: Paper[] = [
  {
    id: "math-algebra-easy", subject: "Mathematics", emoji: "🧮",
    title: "Algebra — Easy", topic: "Algebra", difficulty: "easy", durationMinutes: 20,
    questions: [
      mcq("q1", "Solve: x + 5 = 12", ["5", "6", "7", "8"], 2),
      mcq("q2", "Solve: 2x = 14", ["5", "6", "7", "8"], 2),
      mcq("q3", "Simplify: 3a + 2a", ["5", "5a", "6a", "a²"], 1),
      short("q4", "Solve: x − 4 = 9", "13"),
      short("q5", "Simplify: 4y − y", "3y"),
    ],
  },
  {
    id: "math-algebra-medium", subject: "Mathematics", emoji: "🧮",
    title: "Algebra — Medium", topic: "Algebra", difficulty: "medium", durationMinutes: 30,
    questions: [
      mcq("q1", "Solve: 2x + 3 = 11", ["3", "4", "5", "6"], 1),
      mcq("q2", "Expand: 3(x + 2)", ["3x+2", "3x+6", "x+6", "3x+5"], 1),
      mcq("q3", "25% of 80?", ["15", "20", "25", "30"], 1),
      short("q4", "Solve: 5(x − 1) = 20", "5"),
      short("q5", "If y = 2x + 1 and x = 4, find y.", "9"),
      short("q6", "Factorise: 6a + 9", "3(2a + 3)", ["3(2a+3)"]),
    ],
  },
  {
    id: "math-geometry-medium", subject: "Mathematics", emoji: "🧮",
    title: "Geometry & Stats — Medium", topic: "Geometry", difficulty: "medium", durationMinutes: 25,
    questions: [
      mcq("q1", "Sum of interior angles of a triangle?", ["90°", "180°", "270°", "360°"], 1),
      mcq("q2", "Mean of 3, 5, 7, 9, 11?", ["6", "7", "8", "9"], 1),
      mcq("q3", "Area of a 6×4 rectangle?", ["10", "20", "24", "30"], 2),
      short("q4", "Mode of: 2, 4, 4, 5, 6, 6, 6, 8.", "6"),
      short("q5", "Perimeter of a square with side 9 cm.", "36 cm", ["36"]),
    ],
  },
  {
    id: "sci-general-easy", subject: "Science", emoji: "🔬",
    title: "General Science — Easy", topic: "General", difficulty: "easy", durationMinutes: 20,
    questions: [
      mcq("q1", "Plants take in which gas for photosynthesis?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2),
      mcq("q2", "Boiling point of pure water at sea level?", ["50°C", "75°C", "100°C", "150°C"], 2),
      mcq("q3", "Unit of force?", ["Joule", "Newton", "Watt", "Pascal"], 1),
      short("q4", "Name the three states of matter.", "solid, liquid, gas", ["solid liquid gas"]),
      short("q5", "Which organ pumps blood?", "heart", ["the heart"]),
    ],
  },
  {
    id: "eng-grammar-medium", subject: "English", emoji: "📖",
    title: "Grammar — Medium", topic: "Grammar", difficulty: "medium", durationMinutes: 20,
    questions: [
      mcq("q1", "Identify the adjective: 'The blue car raced past.'", ["car", "blue", "raced", "past"], 1),
      mcq("q2", "Past tense of 'go'?", ["goed", "gone", "went", "going"], 2),
      short("q3", "Define a 'simile' with one example.", "a comparison using like or as, e.g. as brave as a lion", ["like or as"]),
      short("q4", "Plural of 'analysis'.", "analyses"),
    ],
  },
];

// ============================================================
// UPPER (Grades 9–10)
// ============================================================
const UPPER: Paper[] = [
  {
    id: "math-algebra-medium", subject: "Mathematics", emoji: "🧮",
    title: "Algebra — Medium", topic: "Algebra", difficulty: "medium", durationMinutes: 30,
    questions: [
      mcq("q1", "Factorise: x² − 16", ["(x−4)²", "(x−4)(x+4)", "(x−2)(x+8)", "x(x−16)"], 1),
      mcq("q2", "Solve: x² = 49", ["7", "±7", "±49", "14"], 1),
      mcq("q3", "Gradient through (2,3) and (5,12)?", ["2", "3", "4", "5"], 1),
      short("q4", "Solve: x + y = 7 and x − y = 1.", "x = 4, y = 3", ["x=4, y=3", "x=4 y=3"]),
      short("q5", "Expand: (x + 3)(x − 5).", "x² − 2x − 15", ["x^2-2x-15"]),
    ],
  },
  {
    id: "math-algebra-hard", subject: "Mathematics", emoji: "🧮",
    title: "Algebra — Hard", topic: "Algebra", difficulty: "hard", durationMinutes: 40,
    questions: [
      mcq("q1", "Roots of x² − 5x + 6 = 0?", ["1, 6", "2, 3", "−2, −3", "1, −6"], 1),
      mcq("q2", "If 3ˣ = 81, x = ?", ["2", "3", "4", "5"], 2),
      short("q3", "Solve x² − 6x + 9 = 0.", "x = 3", ["3"]),
      short("q4", "Make r the subject of A = πr².", "r = √(A/π)", ["sqrt(A/pi)"]),
    ],
  },
  {
    id: "math-trig-medium", subject: "Mathematics", emoji: "🧮",
    title: "Trigonometry — Medium", topic: "Trigonometry", difficulty: "medium", durationMinutes: 30,
    questions: [
      mcq("q1", "sin 30° = ?", ["0", "0.5", "√2/2", "1"], 1),
      mcq("q2", "Hypotenuse for sides 3 and 4?", ["5", "6", "7", "12"], 0),
      short("q3", "Circumference of a circle with r = 7 cm. (π ≈ 3.14)", "43.96 cm", ["43.96"]),
      short("q4", "tan 45° = ?", "1"),
    ],
  },
  {
    id: "bio-cells-medium", subject: "Biology", emoji: "🌱",
    title: "Cells & Systems — Medium", topic: "Cells", difficulty: "medium", durationMinutes: 30,
    questions: [
      mcq("q1", "Which organelle makes proteins?", ["Nucleus", "Ribosome", "Mitochondrion", "Vacuole"], 1),
      mcq("q2", "Largest artery in the body?", ["Vena cava", "Aorta", "Pulmonary", "Carotid"], 1),
      mcq("q3", "Powerhouse of the cell?", ["Nucleus", "Mitochondria", "Ribosome", "Golgi"], 1),
      short("q4", "Function of red blood cells?", "transport oxygen", ["carry oxygen"]),
      short("q5", "Define osmosis.", "movement of water across a partially permeable membrane from low to high solute concentration", ["water across membrane"]),
    ],
  },
  {
    id: "chem-bonding-medium", subject: "Chemistry", emoji: "⚗️",
    title: "Atoms & Bonding — Medium", topic: "Bonding", difficulty: "medium", durationMinutes: 30,
    questions: [
      mcq("q1", "Charge of an electron?", ["+1", "0", "−1", "+2"], 2),
      mcq("q2", "NaCl is held together by:", ["Covalent", "Ionic", "Metallic", "Hydrogen"], 1),
      short("q3", "Balance: Mg + O₂ → MgO", "2Mg + O₂ → 2MgO", ["2mg + o2 -> 2mgo"]),
      short("q4", "Symbol for sodium?", "Na"),
    ],
  },
  {
    id: "phy-forces-medium", subject: "Physics", emoji: "⚙️",
    title: "Forces & Motion — Medium", topic: "Mechanics", difficulty: "medium", durationMinutes: 30,
    questions: [
      mcq("q1", "Unit of power?", ["Joule", "Newton", "Watt", "Pascal"], 2),
      mcq("q2", "Force on 5 kg with a = 2 m/s²?", ["2.5 N", "7 N", "10 N", "25 N"], 2),
      mcq("q3", "Acceleration due to gravity (Earth)?", ["1.6", "9.8", "12", "20"], 1),
      short("q4", "State Newton's Second Law.", "force equals mass times acceleration", ["f=ma", "f = ma"]),
      short("q5", "Unit of resistance?", "ohm", ["ohms", "Ω"]),
    ],
  },
];

// ============================================================
// SENIOR (Grades 11–12)
// ============================================================
const SENIOR: Paper[] = [
  {
    id: "math-calc-medium", subject: "Mathematics", emoji: "🧮",
    title: "Calculus — Medium", topic: "Calculus", difficulty: "medium", durationMinutes: 45,
    questions: [
      mcq("q1", "d/dx (x³) = ?", ["x²", "3x²", "3x", "x⁴/4"], 1),
      mcq("q2", "∫ 2x dx = ?", ["x²", "x² + C", "2x² + C", "x"], 1),
      short("q3", "Differentiate y = (2x + 1)³.", "6(2x + 1)²", ["6(2x+1)^2"]),
      short("q4", "∫₀² (3x² + 1) dx = ?", "10"),
    ],
  },
  {
    id: "math-calc-hard", subject: "Mathematics", emoji: "🧮",
    title: "Calculus — Hard", topic: "Calculus", difficulty: "hard", durationMinutes: 60,
    questions: [
      mcq("q1", "d/dx (sin x) = ?", ["cos x", "−cos x", "−sin x", "tan x"], 0),
      mcq("q2", "∫ eˣ dx = ?", ["eˣ", "eˣ + C", "x·eˣ", "ln x"], 1),
      short("q3", "Stationary point of y = x² − 6x + 5.", "(3, −4)", ["3,-4", "x=3"]),
      short("q4", "∫₁² (1/x) dx = ?", "ln 2", ["ln(2)"]),
    ],
  },
  {
    id: "math-algtrig-medium", subject: "Mathematics", emoji: "🧮",
    title: "Algebra & Trig — Medium", topic: "Algebra", difficulty: "medium", durationMinutes: 45,
    questions: [
      mcq("q1", "log₁₀(1000) = ?", ["1", "2", "3", "10"], 2),
      mcq("q2", "cos(0°) = ?", ["0", "0.5", "1", "−1"], 2),
      short("q3", "Solve 2ˣ = 32.", "5"),
      short("q4", "ln(e³) = ?", "3"),
    ],
  },
  {
    id: "phy-mechanics-medium", subject: "Physics", emoji: "⚙️",
    title: "Mechanics & Energy — Medium", topic: "Mechanics", difficulty: "medium", durationMinutes: 45,
    questions: [
      mcq("q1", "KE of a 2 kg object at 4 m/s?", ["4 J", "8 J", "16 J", "32 J"], 2),
      mcq("q2", "g on Earth ≈ ?", ["1.6", "9.8", "12", "20"], 1),
      short("q3", "Define momentum and its formula.", "mass × velocity, p = mv", ["p=mv"]),
      short("q4", "Power for 600 J done in 30 s?", "20 W", ["20"]),
    ],
  },
  {
    id: "chem-react-medium", subject: "Chemistry", emoji: "⚗️",
    title: "Reactions & Bonding — Medium", topic: "Reactions", difficulty: "medium", durationMinutes: 45,
    questions: [
      mcq("q1", "pH of a neutral solution?", ["0", "7", "10", "14"], 1),
      mcq("q2", "Which is an alkali?", ["HCl", "NaOH", "CO₂", "CH₄"], 1),
      short("q3", "Define an exothermic reaction.", "releases heat to the surroundings", ["releases heat"]),
      short("q4", "Conjugate base of HCl?", "Cl⁻", ["cl-"]),
    ],
  },
  {
    id: "bio-genetics-medium", subject: "Biology", emoji: "🌱",
    title: "Genetics & Cells — Medium", topic: "Genetics", difficulty: "medium", durationMinutes: 45,
    questions: [
      mcq("q1", "DNA bases pair as:", ["A-T, C-G", "A-G, C-T", "A-C, T-G", "A-A, T-T"], 0),
      mcq("q2", "Mitosis produces:", ["2 haploid", "2 identical diploid", "4 haploid gametes", "4 diploid"], 1),
      short("q3", "Role of mRNA?", "carries genetic code from DNA to ribosomes for translation", ["dna to ribosome"]),
      short("q4", "Define an allele.", "an alternative form of a gene", ["form of a gene"]),
    ],
  },
];

const PAPERS_BY_BAND: Record<Band, Paper[]> = {
  primary: PRIMARY, lower: LOWER, upper: UPPER, senior: SENIOR,
};

const GRADE_BAND: Record<Grade, Band> = {
  "Grade 1": "primary", "Grade 2": "primary", "Grade 3": "primary",
  "Grade 4": "primary", "Grade 5": "primary", "Grade 6": "lower",
  "Grade 7": "lower", "Grade 8": "lower",
  "Grade 9": "upper", "Grade 10": "upper",
  "Grade 11": "senior", "Grade 12": "senior",
};

export const CURRICULA: Curriculum[] = ["CBC", "IGCSE", "Cambridge", "British", "American", "IB"];
export const GRADES: Grade[] = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
];

export function getPapers(curriculum: Curriculum, grade: Grade): Paper[] {
  const band = GRADE_BAND[grade] || "lower";
  return PAPERS_BY_BAND[band].map((p) => ({
    ...p,
    id: `${curriculum}-${grade}-${p.id}`,
  }));
}

export function getPaper(curriculum: Curriculum, grade: Grade, paperId: string): Paper | undefined {
  return getPapers(curriculum, grade).find((p) => p.id === paperId);
}

// Loose grader for typed short answers (case + whitespace insensitive,
// strips punctuation, also tries acceptable list).
export function gradeShortAnswer(q: PaperQuestion, userAnswer: string): boolean {
  if (q.kind !== "short") return false;
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9αβπΩμ°\-+./²³√]+/gi, " ").replace(/\s+/g, " ").trim();
  const u = norm(userAnswer);
  if (!u) return false;
  const targets = [q.modelAnswer || "", ...(q.acceptable || [])].map(norm);
  return targets.some((t) => t && (t === u || (t.length > 3 && u.includes(t)) || (u.length > 3 && t.includes(u))));
}
