// Subject-organized question bank for the Revision page.
// Curriculum-aware, grouped by subject; each subject has multiple questions.

import type { Curriculum, Grade } from "./store";

export interface Question {
  id: string;
  question: string;
  answer: string;
}

export interface SubjectPack {
  subject: string;
  emoji: string;
  questions: Question[];
}

// Compact but realistic per-subject content, scaled by grade band.
const SUBJECTS_BY_BAND: Record<"primary" | "lower" | "upper" | "senior", SubjectPack[]> = {
  primary: [
    {
      subject: "Mathematics",
      emoji: "🧮",
      questions: [
        { id: "m1", question: "What is 12 + 7?", answer: "19" },
        { id: "m2", question: "What is 20 − 8?", answer: "12" },
        { id: "m3", question: "What is 5 × 4?", answer: "20" },
        { id: "m4", question: "Half of 18 is?", answer: "9" },
        { id: "m5", question: "How many sides does a triangle have?", answer: "3" },
      ],
    },
    {
      subject: "English",
      emoji: "📖",
      questions: [
        { id: "e1", question: "What is the plural of 'mouse'?", answer: "Mice" },
        { id: "e2", question: "Give an antonym for 'happy'.", answer: "Sad" },
        { id: "e3", question: "Which letter comes after 'P'?", answer: "Q" },
        { id: "e4", question: "What is a noun? Give one example.", answer: "A naming word, e.g. 'book'" },
      ],
    },
    {
      subject: "Science",
      emoji: "🔬",
      questions: [
        { id: "s1", question: "Name three states of matter.", answer: "Solid, liquid, gas" },
        { id: "s2", question: "Which sense organ helps us see?", answer: "Eyes" },
        { id: "s3", question: "What do plants need to grow?", answer: "Sunlight, water, air, soil" },
      ],
    },
    {
      subject: "Social Studies",
      emoji: "🌍",
      questions: [
        { id: "so1", question: "What do we call the place where we live with our family?", answer: "Home" },
        { id: "so2", question: "Name a means of transport on water.", answer: "Boat / ship" },
      ],
    },
  ],
  lower: [
    {
      subject: "Mathematics",
      emoji: "🧮",
      questions: [
        { id: "m1", question: "Solve: 3x + 4 = 19", answer: "x = 5" },
        { id: "m2", question: "Find the area of a rectangle 8 cm × 5 cm.", answer: "40 cm²" },
        { id: "m3", question: "Convert 3/4 to a decimal.", answer: "0.75" },
        { id: "m4", question: "What is 15% of 200?", answer: "30" },
        { id: "m5", question: "Find the mean of 4, 6, 8, 10.", answer: "7" },
      ],
    },
    {
      subject: "English",
      emoji: "📖",
      questions: [
        { id: "e1", question: "Identify the verb: 'She runs quickly.'", answer: "runs" },
        { id: "e2", question: "What is a metaphor? Give an example.", answer: "Comparing two things directly, e.g. 'time is money'." },
        { id: "e3", question: "Punctuate: 'where are you going she asked'", answer: "'Where are you going?' she asked." },
      ],
    },
    {
      subject: "Biology",
      emoji: "🌱",
      questions: [
        { id: "b1", question: "What is photosynthesis?", answer: "Plants make food using sunlight, CO₂ and water." },
        { id: "b2", question: "Name the powerhouse of the cell.", answer: "Mitochondria" },
        { id: "b3", question: "What gas do humans breathe out?", answer: "Carbon dioxide" },
      ],
    },
    {
      subject: "Chemistry",
      emoji: "⚗️",
      questions: [
        { id: "c1", question: "What is the chemical symbol for water?", answer: "H₂O" },
        { id: "c2", question: "Name the 3 states of matter and a property of each.", answer: "Solid (fixed shape), liquid (takes container shape), gas (fills container)." },
      ],
    },
    {
      subject: "Physics",
      emoji: "⚙️",
      questions: [
        { id: "p1", question: "State the unit of force.", answer: "Newton (N)" },
        { id: "p2", question: "What is speed?", answer: "Distance travelled per unit time." },
      ],
    },
    {
      subject: "Geography",
      emoji: "🌍",
      questions: [
        { id: "g1", question: "What is the longest river in Africa?", answer: "Nile" },
        { id: "g2", question: "Name the 7 continents.", answer: "Africa, Asia, Europe, N. America, S. America, Australia/Oceania, Antarctica." },
      ],
    },
  ],
  upper: [
    {
      subject: "Mathematics",
      emoji: "🧮",
      questions: [
        { id: "m1", question: "Factorise: x² − 9", answer: "(x − 3)(x + 3)" },
        { id: "m2", question: "Solve: 2x² − 8 = 0", answer: "x = ±2" },
        { id: "m3", question: "Find the gradient of the line through (1, 2) and (4, 11).", answer: "3" },
        { id: "m4", question: "Simplify: (3x²)(2x³)", answer: "6x⁵" },
        { id: "m5", question: "If sin θ = 0.5, find θ (0°–90°).", answer: "30°" },
      ],
    },
    {
      subject: "Biology",
      emoji: "🌱",
      questions: [
        { id: "b1", question: "Define osmosis.", answer: "Net movement of water molecules from low to high solute concentration through a partially permeable membrane." },
        { id: "b2", question: "Name the 4 chambers of the heart.", answer: "Right atrium, right ventricle, left atrium, left ventricle." },
        { id: "b3", question: "What is the function of red blood cells?", answer: "Transport oxygen via haemoglobin." },
      ],
    },
    {
      subject: "Chemistry",
      emoji: "⚗️",
      questions: [
        { id: "c1", question: "What is the chemical symbol for sodium?", answer: "Na" },
        { id: "c2", question: "Define an ionic bond.", answer: "Electrostatic attraction between oppositely charged ions formed by electron transfer." },
        { id: "c3", question: "Balance: H₂ + O₂ → H₂O", answer: "2H₂ + O₂ → 2H₂O" },
      ],
    },
    {
      subject: "Physics",
      emoji: "⚙️",
      questions: [
        { id: "p1", question: "State Newton's First Law.", answer: "An object remains at rest or in uniform motion unless acted on by a resultant force." },
        { id: "p2", question: "Give the equation for kinetic energy.", answer: "KE = ½ m v²" },
        { id: "p3", question: "What is Ohm's law?", answer: "V = IR" },
      ],
    },
    {
      subject: "English",
      emoji: "📖",
      questions: [
        { id: "e1", question: "Define personification with an example.", answer: "Giving human qualities to non-human things, e.g. 'The wind whispered.'" },
        { id: "e2", question: "What is the difference between a theme and a plot?", answer: "Plot = events; theme = underlying message/idea." },
      ],
    },
    {
      subject: "Geography",
      emoji: "🌍",
      questions: [
        { id: "g1", question: "Define weathering.", answer: "The breakdown of rocks in situ by physical, chemical or biological processes." },
        { id: "g2", question: "Name two greenhouse gases.", answer: "Carbon dioxide, methane" },
      ],
    },
  ],
  senior: [
    {
      subject: "Mathematics",
      emoji: "🧮",
      questions: [
        { id: "m1", question: "Differentiate f(x) = 3x² + 2x − 5", answer: "f'(x) = 6x + 2" },
        { id: "m2", question: "Integrate ∫(2x + 3) dx", answer: "x² + 3x + C" },
        { id: "m3", question: "Solve: ln(x) = 2", answer: "x = e² ≈ 7.389" },
        { id: "m4", question: "State the binomial expansion of (a + b)².", answer: "a² + 2ab + b²" },
      ],
    },
    {
      subject: "Biology",
      emoji: "🌱",
      questions: [
        { id: "b1", question: "Define meiosis.", answer: "Cell division producing 4 genetically different haploid gametes." },
        { id: "b2", question: "What is the role of DNA polymerase?", answer: "Synthesises new DNA strands during replication using a template." },
      ],
    },
    {
      subject: "Chemistry",
      emoji: "⚗️",
      questions: [
        { id: "c1", question: "Define electronegativity.", answer: "Ability of an atom in a covalent bond to attract bonding electrons." },
        { id: "c2", question: "State Avogadro's number.", answer: "6.022 × 10²³ mol⁻¹" },
        { id: "c3", question: "What is an exothermic reaction?", answer: "A reaction that releases heat to the surroundings (ΔH < 0)." },
      ],
    },
    {
      subject: "Physics",
      emoji: "⚙️",
      questions: [
        { id: "p1", question: "Write Einstein's mass-energy equation.", answer: "E = mc²" },
        { id: "p2", question: "State the principle of conservation of momentum.", answer: "Total momentum in a closed system is constant if no external force acts." },
      ],
    },
    {
      subject: "English Literature",
      emoji: "📖",
      questions: [
        { id: "e1", question: "Define dramatic irony.", answer: "When the audience knows something a character does not." },
        { id: "e2", question: "What is iambic pentameter?", answer: "A line of verse with five iambs (10 syllables, unstressed-stressed pattern)." },
      ],
    },
    {
      subject: "Economics",
      emoji: "💹",
      questions: [
        { id: "ec1", question: "Define opportunity cost.", answer: "The value of the next best alternative foregone." },
        { id: "ec2", question: "What is inflation?", answer: "A sustained rise in the general price level over time." },
      ],
    },
  ],
};

const GRADE_BAND: Record<Grade, "primary" | "lower" | "upper" | "senior"> = {
  "Grade 1": "primary", "Grade 2": "primary", "Grade 3": "primary",
  "Grade 4": "primary", "Grade 5": "primary", "Grade 6": "lower",
  "Grade 7": "lower", "Grade 8": "lower",
  "Grade 9": "upper", "Grade 10": "upper",
  "Grade 11": "senior", "Grade 12": "senior",
};

export function getSubjects(curriculum: Curriculum, grade: Grade): SubjectPack[] {
  const band = GRADE_BAND[grade] || "lower";
  const base = SUBJECTS_BY_BAND[band];
  return base.map((pack) => ({
    ...pack,
    questions: pack.questions.map((q) => ({
      ...q,
      id: `${curriculum}-${grade}-${pack.subject}-${q.id}`,
    })),
  }));
}

// Backward-compat: flat list (used by Home preview)
export interface FlatQuestion extends Question {
  subject: string;
}
export function getQuestions(curriculum: Curriculum, grade: Grade): FlatQuestion[] {
  return getSubjects(curriculum, grade).flatMap((p) =>
    p.questions.map((q) => ({ ...q, subject: p.subject })),
  );
}
