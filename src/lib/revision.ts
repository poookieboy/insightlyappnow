// Curriculum-aware revision content: Subject → Topic → Subtopic → Questions.
// Each subtopic has up to 20 questions (mix of MCQ and short-answer).

import type { Curriculum, Grade } from "./store";

export interface Question {
  id: string;
  question: string;
  answer: string;
  options?: string[]; // optional MCQ
  correctIndex?: number;
}

export interface Subtopic {
  name: string;
  questions: Question[];
}

export interface Topic {
  name: string;
  subtopics: Subtopic[];
}

export interface SubjectPack {
  subject: string;
  emoji: string;
  topics: Topic[];
}

type Band = "primary" | "lower" | "upper" | "senior";

const GRADE_BAND: Record<Grade, Band> = {
  "Grade 1": "primary", "Grade 2": "primary", "Grade 3": "primary",
  "Grade 4": "primary", "Grade 5": "primary", "Grade 6": "lower",
  "Grade 7": "lower", "Grade 8": "lower",
  "Grade 9": "upper", "Grade 10": "upper",
  "Grade 11": "senior", "Grade 12": "senior",
};

// ---------- Content (curated; CBC-aligned where applicable) ----------

const PRIMARY: SubjectPack[] = [
  {
    subject: "Mathematics", emoji: "🧮",
    topics: [
      {
        name: "Numbers",
        subtopics: [
          {
            name: "Addition & Subtraction",
            questions: [
              { id: "n1", question: "12 + 7 = ?", answer: "19", options: ["17", "18", "19", "20"], correctIndex: 2 },
              { id: "n2", question: "20 − 8 = ?", answer: "12", options: ["10", "11", "12", "13"], correctIndex: 2 },
              { id: "n3", question: "45 + 23 = ?", answer: "68" },
              { id: "n4", question: "100 − 37 = ?", answer: "63" },
              { id: "n5", question: "Add 14, 15 and 16.", answer: "45" },
            ],
          },
          {
            name: "Multiplication & Division",
            questions: [
              { id: "m1", question: "5 × 4 = ?", answer: "20" },
              { id: "m2", question: "9 × 6 = ?", answer: "54" },
              { id: "m3", question: "36 ÷ 6 = ?", answer: "6" },
              { id: "m4", question: "Half of 18 is?", answer: "9" },
            ],
          },
        ],
      },
      {
        name: "Geometry",
        subtopics: [
          {
            name: "Shapes",
            questions: [
              { id: "g1", question: "How many sides does a triangle have?", answer: "3" },
              { id: "g2", question: "How many sides does a hexagon have?", answer: "6" },
              { id: "g3", question: "A square has how many equal sides?", answer: "4" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "English", emoji: "📖",
    topics: [
      {
        name: "Grammar",
        subtopics: [
          {
            name: "Nouns & Plurals",
            questions: [
              { id: "e1", question: "Plural of 'mouse'?", answer: "Mice", options: ["mouses", "mice", "mouse", "mises"], correctIndex: 1 },
              { id: "e2", question: "Plural of 'child'?", answer: "Children" },
              { id: "e3", question: "Give an example of a noun.", answer: "Any: book, school, dog, etc." },
            ],
          },
          {
            name: "Opposites",
            questions: [
              { id: "o1", question: "Antonym of 'happy'.", answer: "Sad" },
              { id: "o2", question: "Antonym of 'big'.", answer: "Small" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Science", emoji: "🔬",
    topics: [
      {
        name: "Living Things",
        subtopics: [
          {
            name: "Plants",
            questions: [
              { id: "s1", question: "What do plants need to grow?", answer: "Sunlight, water, air, soil" },
              { id: "s2", question: "Which part of the plant makes food?", answer: "Leaves" },
            ],
          },
          {
            name: "Human Body",
            questions: [
              { id: "h1", question: "Which sense organ helps us see?", answer: "Eyes" },
              { id: "h2", question: "How many bones in the adult human body?", answer: "206" },
            ],
          },
        ],
      },
      {
        name: "Matter",
        subtopics: [
          {
            name: "States of Matter",
            questions: [
              { id: "ma1", question: "Name the three states of matter.", answer: "Solid, liquid, gas" },
              { id: "ma2", question: "Ice is which state of matter?", answer: "Solid" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Social Studies", emoji: "🌍",
    topics: [
      {
        name: "My Environment",
        subtopics: [
          {
            name: "Home & Community",
            questions: [
              { id: "ss1", question: "Where do we live with our family?", answer: "Home" },
              { id: "ss2", question: "Name a means of water transport.", answer: "Boat or ship" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "CRE", emoji: "✝️",
    topics: [{ name: "Bible Stories", subtopics: [{ name: "Creation", questions: [
      { id: "cre1", question: "How many days did God take to create the world?", answer: "6" },
      { id: "cre2", question: "Who were the first humans?", answer: "Adam and Eve" },
      { id: "cre3", question: "On which day did God rest?", answer: "The seventh day" },
    ]}]}],
  },
  {
    subject: "Home Science", emoji: "🏠",
    topics: [{ name: "Healthy Living", subtopics: [{ name: "Food & Nutrition", questions: [
      { id: "hs1", question: "Name a body-building food.", answer: "Meat, beans, eggs, fish" },
      { id: "hs2", question: "Why do we wash hands before eating?", answer: "To remove germs and stay healthy" },
    ]}]}],
  },
  {
    subject: "Agriculture", emoji: "🌾",
    topics: [{ name: "Crops", subtopics: [{ name: "Growing Plants", questions: [
      { id: "ag1", question: "What do seeds need to germinate?", answer: "Water, warmth, oxygen" },
      { id: "ag2", question: "Name a cereal crop.", answer: "Maize, wheat, rice, sorghum" },
    ]}]}],
  },
  {
    subject: "Pre-Technical Studies", emoji: "🛠️",
    topics: [{ name: "Tools & Materials", subtopics: [{ name: "Basic Tools", questions: [
      { id: "pt1", question: "What tool is used to drive nails?", answer: "Hammer" },
      { id: "pt2", question: "Which tool measures length?", answer: "Ruler or tape measure" },
    ]}]}],
  },
];

const LOWER: SubjectPack[] = [
  {
    subject: "Mathematics", emoji: "🧮",
    topics: [
      {
        name: "Algebra",
        subtopics: [
          {
            name: "Linear Equations",
            questions: [
              { id: "a1", question: "Solve: 3x + 4 = 19", answer: "x = 5" },
              { id: "a2", question: "Solve: 2x − 7 = 1", answer: "x = 4" },
              { id: "a3", question: "Solve: x/3 = 6", answer: "x = 18" },
              { id: "a4", question: "Solve: 5(x − 1) = 20", answer: "x = 5" },
            ],
          },
          {
            name: "Expressions",
            questions: [
              { id: "ex1", question: "Simplify: 3a + 2a − a", answer: "4a" },
              { id: "ex2", question: "Expand: 2(x + 3)", answer: "2x + 6" },
            ],
          },
        ],
      },
      {
        name: "Geometry & Measurement",
        subtopics: [
          {
            name: "Area & Perimeter",
            questions: [
              { id: "ar1", question: "Area of a rectangle 8cm × 5cm.", answer: "40 cm²" },
              { id: "ar2", question: "Perimeter of a square with side 7cm.", answer: "28 cm" },
              { id: "ar3", question: "Area of a triangle base 10, height 6.", answer: "30 unit²" },
            ],
          },
        ],
      },
      {
        name: "Statistics",
        subtopics: [
          {
            name: "Averages",
            questions: [
              { id: "st1", question: "Mean of 4, 6, 8, 10.", answer: "7" },
              { id: "st2", question: "Median of 3, 7, 9, 12, 15.", answer: "9" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "English", emoji: "📖",
    topics: [
      {
        name: "Grammar",
        subtopics: [
          {
            name: "Parts of Speech",
            questions: [
              { id: "p1", question: "Identify the verb: 'She runs quickly.'", answer: "runs" },
              { id: "p2", question: "What is an adjective?", answer: "A describing word, e.g. 'red', 'tall'." },
            ],
          },
          {
            name: "Punctuation",
            questions: [
              { id: "pu1", question: "Punctuate: where are you going she asked", answer: "'Where are you going?' she asked." },
            ],
          },
        ],
      },
      {
        name: "Literature",
        subtopics: [
          {
            name: "Figurative Language",
            questions: [
              { id: "fl1", question: "Define metaphor with an example.", answer: "Direct comparison: 'time is money'." },
              { id: "fl2", question: "Define simile with an example.", answer: "Comparison using like/as: 'as brave as a lion'." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Biology", emoji: "🌱",
    topics: [
      {
        name: "Cells & Life Processes",
        subtopics: [
          {
            name: "The Cell",
            questions: [
              { id: "b1", question: "Powerhouse of the cell?", answer: "Mitochondria" },
              { id: "b2", question: "Site of photosynthesis in a plant cell?", answer: "Chloroplast" },
              { id: "b3", question: "Function of the cell membrane?", answer: "Controls what enters and leaves the cell." },
            ],
          },
          {
            name: "Photosynthesis",
            questions: [
              { id: "ph1", question: "What is photosynthesis?", answer: "Plants make food from sunlight, CO₂ and water." },
              { id: "ph2", question: "Word equation for photosynthesis.", answer: "carbon dioxide + water → glucose + oxygen (with light)" },
            ],
          },
        ],
      },
      {
        name: "Human Body",
        subtopics: [
          {
            name: "Respiration",
            questions: [
              { id: "r1", question: "Gas humans breathe out?", answer: "Carbon dioxide" },
              { id: "r2", question: "Word equation for aerobic respiration.", answer: "glucose + oxygen → carbon dioxide + water (+ energy)" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Chemistry", emoji: "⚗️",
    topics: [
      {
        name: "Matter",
        subtopics: [
          {
            name: "Elements & Compounds",
            questions: [
              { id: "c1", question: "Chemical symbol for water?", answer: "H₂O" },
              { id: "c2", question: "Chemical symbol for sodium?", answer: "Na" },
              { id: "c3", question: "Difference between an element and a compound?", answer: "Element: one type of atom. Compound: 2+ elements chemically bonded." },
            ],
          },
          {
            name: "Steel & Alloys",
            questions: [
              { id: "st1", question: "Which elements are used to make steel?", answer: "Iron and carbon (with small amounts of other metals like chromium or nickel for special steels)." },
              { id: "st2", question: "Give two uses of steel.", answer: "Construction (beams, bridges) and vehicles (car bodies)." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Physics", emoji: "⚙️",
    topics: [
      {
        name: "Forces & Motion",
        subtopics: [
          {
            name: "Forces",
            questions: [
              { id: "f1", question: "Unit of force?", answer: "Newton (N)" },
              { id: "f2", question: "Define speed.", answer: "Distance travelled per unit time." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Geography", emoji: "🗺️",
    topics: [
      {
        name: "Physical Geography",
        subtopics: [
          {
            name: "Continents & Rivers",
            questions: [
              { id: "g1", question: "Longest river in Africa?", answer: "Nile" },
              { id: "g2", question: "How many continents are there?", answer: "7" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "CRE", emoji: "✝️",
    topics: [{ name: "New Testament", subtopics: [{ name: "Life of Jesus", questions: [
      { id: "cre1", question: "Where was Jesus born?", answer: "Bethlehem" },
      { id: "cre2", question: "Name two disciples of Jesus.", answer: "Peter, John, James, Andrew (any two)" },
      { id: "cre3", question: "What is the greatest commandment?", answer: "Love God and love your neighbour as yourself" },
    ]}]}],
  },
  {
    subject: "Home Science", emoji: "🏠",
    topics: [{ name: "Nutrition & Hygiene", subtopics: [{ name: "Balanced Diet", questions: [
      { id: "hs1", question: "Name the three main food groups.", answer: "Carbohydrates, proteins, vitamins/minerals (and fats)" },
      { id: "hs2", question: "Why is fibre important?", answer: "Aids digestion and prevents constipation" },
    ]}]}],
  },
  {
    subject: "Agriculture", emoji: "🌾",
    topics: [{ name: "Crop Production", subtopics: [{ name: "Soil & Crops", questions: [
      { id: "ag1", question: "Name three types of soil.", answer: "Sandy, clay, loam" },
      { id: "ag2", question: "Which soil is best for farming?", answer: "Loam" },
    ]}]}],
  },
  {
    subject: "Pre-Technical Studies", emoji: "🛠️",
    topics: [{ name: "Materials & Production", subtopics: [{ name: "Workshop Safety", questions: [
      { id: "pt1", question: "Name one workshop safety rule.", answer: "Wear protective equipment / keep workspace tidy" },
      { id: "pt2", question: "What is a renewable energy source?", answer: "Solar, wind, hydro (any)" },
    ]}]}],
  },
];

const UPPER: SubjectPack[] = [
  {
    subject: "Mathematics", emoji: "🧮",
    topics: [
      {
        name: "Algebra",
        subtopics: [
          {
            name: "Quadratics",
            questions: [
              { id: "q1", question: "Factorise: x² − 9", answer: "(x − 3)(x + 3)" },
              { id: "q2", question: "Solve: 2x² − 8 = 0", answer: "x = ±2" },
              { id: "q3", question: "Factorise: x² + 5x + 6", answer: "(x + 2)(x + 3)" },
            ],
          },
          {
            name: "Indices",
            questions: [
              { id: "i1", question: "Simplify: (3x²)(2x³)", answer: "6x⁵" },
              { id: "i2", question: "Simplify: x⁵ ÷ x²", answer: "x³" },
            ],
          },
        ],
      },
      {
        name: "Trigonometry",
        subtopics: [
          {
            name: "Right-Angled Triangles",
            questions: [
              { id: "t1", question: "If sin θ = 0.5, find θ (0°–90°).", answer: "30°" },
              { id: "t2", question: "State Pythagoras' theorem.", answer: "a² + b² = c²" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Biology", emoji: "🌱",
    topics: [
      {
        name: "Transport in Organisms",
        subtopics: [
          {
            name: "Osmosis & Diffusion",
            questions: [
              { id: "o1", question: "Define osmosis.", answer: "Net movement of water from low to high solute concentration through a partially permeable membrane." },
              { id: "o2", question: "Define diffusion.", answer: "Net movement of particles from high to low concentration." },
            ],
          },
          {
            name: "Circulatory System",
            questions: [
              { id: "h1", question: "Name the four chambers of the heart.", answer: "Right atrium, right ventricle, left atrium, left ventricle." },
              { id: "h2", question: "Function of red blood cells?", answer: "Transport oxygen via haemoglobin." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Chemistry", emoji: "⚗️",
    topics: [
      {
        name: "Atomic Structure & Bonding",
        subtopics: [
          {
            name: "Bonding",
            questions: [
              { id: "b1", question: "Define an ionic bond.", answer: "Electrostatic attraction between oppositely charged ions formed by electron transfer." },
              { id: "b2", question: "Define a covalent bond.", answer: "A shared pair of electrons between two atoms." },
            ],
          },
          {
            name: "Equations",
            questions: [
              { id: "e1", question: "Balance: H₂ + O₂ → H₂O", answer: "2H₂ + O₂ → 2H₂O" },
              { id: "e2", question: "Balance: Mg + O₂ → MgO", answer: "2Mg + O₂ → 2MgO" },
            ],
          },
        ],
      },
      {
        name: "Metals",
        subtopics: [
          {
            name: "Iron & Steel",
            questions: [
              { id: "s1", question: "Which elements are used to make steel?", answer: "Iron and carbon, sometimes with chromium, nickel, or manganese for alloy steels." },
              { id: "s2", question: "Why is steel preferred over pure iron?", answer: "Stronger, less brittle, more resistant to corrosion (especially stainless steel)." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Physics", emoji: "⚙️",
    topics: [
      {
        name: "Mechanics",
        subtopics: [
          {
            name: "Newton's Laws",
            questions: [
              { id: "n1", question: "State Newton's First Law.", answer: "An object at rest stays at rest, an object in motion stays in motion, unless acted on by a resultant force." },
              { id: "n2", question: "Equation for kinetic energy.", answer: "KE = ½ m v²" },
            ],
          },
        ],
      },
      {
        name: "Electricity",
        subtopics: [
          {
            name: "Ohm's Law",
            questions: [
              { id: "el1", question: "State Ohm's law.", answer: "V = IR" },
              { id: "el2", question: "Unit of resistance?", answer: "Ohm (Ω)" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "English", emoji: "📖",
    topics: [
      {
        name: "Literary Devices",
        subtopics: [
          {
            name: "Figurative Language",
            questions: [
              { id: "f1", question: "Define personification with an example.", answer: "Giving human qualities to non-human things, e.g. 'The wind whispered.'" },
              { id: "f2", question: "Difference between theme and plot?", answer: "Plot = events; theme = underlying message." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Geography", emoji: "🗺️",
    topics: [
      {
        name: "Physical Processes",
        subtopics: [
          {
            name: "Weathering",
            questions: [
              { id: "w1", question: "Define weathering.", answer: "The breakdown of rocks in situ by physical, chemical or biological processes." },
              { id: "w2", question: "Name two greenhouse gases.", answer: "Carbon dioxide, methane" },
            ],
          },
        ],
      },
    ],
  },
];

const SENIOR: SubjectPack[] = [
  {
    subject: "Mathematics", emoji: "🧮",
    topics: [
      {
        name: "Calculus",
        subtopics: [
          {
            name: "Differentiation",
            questions: [
              { id: "d1", question: "Differentiate f(x) = 3x² + 2x − 5", answer: "f'(x) = 6x + 2" },
              { id: "d2", question: "Differentiate f(x) = sin(x)", answer: "f'(x) = cos(x)" },
            ],
          },
          {
            name: "Integration",
            questions: [
              { id: "i1", question: "Integrate ∫(2x + 3) dx", answer: "x² + 3x + C" },
              { id: "i2", question: "Integrate ∫ cos(x) dx", answer: "sin(x) + C" },
            ],
          },
        ],
      },
      {
        name: "Logarithms",
        subtopics: [
          {
            name: "Natural Log",
            questions: [
              { id: "l1", question: "Solve: ln(x) = 2", answer: "x = e² ≈ 7.389" },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Biology", emoji: "🌱",
    topics: [
      {
        name: "Genetics",
        subtopics: [
          {
            name: "Cell Division",
            questions: [
              { id: "g1", question: "Define meiosis.", answer: "Cell division producing 4 genetically different haploid gametes." },
              { id: "g2", question: "Role of DNA polymerase?", answer: "Synthesises new DNA strands during replication." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Chemistry", emoji: "⚗️",
    topics: [
      {
        name: "Physical Chemistry",
        subtopics: [
          {
            name: "Energetics",
            questions: [
              { id: "en1", question: "What is an exothermic reaction?", answer: "A reaction releasing heat (ΔH < 0)." },
              { id: "en2", question: "Define electronegativity.", answer: "Ability of an atom in a covalent bond to attract bonding electrons." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Physics", emoji: "⚙️",
    topics: [
      {
        name: "Modern Physics",
        subtopics: [
          {
            name: "Mass-Energy",
            questions: [
              { id: "m1", question: "Write Einstein's mass-energy equation.", answer: "E = mc²" },
              { id: "m2", question: "Conservation of momentum?", answer: "Total momentum in a closed system is constant if no external force acts." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "English Literature", emoji: "📖",
    topics: [
      {
        name: "Drama",
        subtopics: [
          {
            name: "Devices",
            questions: [
              { id: "dr1", question: "Define dramatic irony.", answer: "When the audience knows something a character does not." },
              { id: "dr2", question: "What is iambic pentameter?", answer: "Verse with five iambs per line (10 syllables, unstressed-stressed pattern)." },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: "Economics", emoji: "💹",
    topics: [
      {
        name: "Microeconomics",
        subtopics: [
          {
            name: "Core Concepts",
            questions: [
              { id: "m1", question: "Define opportunity cost.", answer: "Value of the next best alternative foregone." },
              { id: "m2", question: "What is inflation?", answer: "Sustained rise in the general price level over time." },
            ],
          },
        ],
      },
    ],
  },
];

const BANDS: Record<Band, SubjectPack[]> = {
  primary: PRIMARY, lower: LOWER, upper: UPPER, senior: SENIOR,
};

// CBC (Kenya) Junior & Senior School subject lists. Grade 7-9 do NOT take
// stand-alone Biology/Chemistry/Physics/Geography — those are Senior School
// pathway subjects. Filter accordingly so students see relevant subjects.
const CBC_JUNIOR_SUBJECTS = new Set([
  "Mathematics", "English", "Kiswahili", "Integrated Science",
  "Social Studies", "History", "CRE", "IRE",
  "Agriculture", "Home Science", "Pre-Technical Studies",
  "Business Studies", "Creative Arts",
]);

// Extra CBC-specific packs to surface for upper (Grade 7-9).
const CBC_UPPER_EXTRA: SubjectPack[] = [
  {
    subject: "Integrated Science", emoji: "🔬",
    topics: [{ name: "Living Things", subtopics: [{ name: "Cells & Body Systems", questions: [
      { id: "is1", question: "Powerhouse of the cell?", answer: "Mitochondria" },
      { id: "is2", question: "Site of photosynthesis?", answer: "Chloroplast" },
      { id: "is3", question: "Gas humans breathe out?", answer: "Carbon dioxide", options: ["Oxygen","Nitrogen","Carbon dioxide","Hydrogen"], correctIndex: 2 },
      { id: "is4", question: "Word equation for respiration.", answer: "glucose + oxygen → carbon dioxide + water" },
      { id: "is5", question: "Organ that pumps blood?", answer: "Heart" },
    ]}]}],
  },
  {
    subject: "Social Studies", emoji: "🌍",
    topics: [{ name: "People & Government", subtopics: [{ name: "Kenya Today", questions: [
      { id: "ss1", question: "How many counties does Kenya have?", answer: "47" },
      { id: "ss2", question: "Capital city of Kenya?", answer: "Nairobi" },
      { id: "ss3", question: "Head of a county government?", answer: "Governor" },
      { id: "ss4", question: "Currency of Kenya?", answer: "Shilling" },
      { id: "ss5", question: "Name one neighbour of Kenya.", answer: "Uganda" },
    ]}]}],
  },
  {
    subject: "History", emoji: "📜",
    topics: [{ name: "Kenyan History", subtopics: [{ name: "Independence", questions: [
      { id: "h1", question: "Year Kenya gained independence?", answer: "1963" },
      { id: "h2", question: "First president of Kenya?", answer: "Jomo Kenyatta" },
      { id: "h3", question: "Movement that fought for independence?", answer: "Mau Mau" },
    ]}]}],
  },
  {
    subject: "CRE", emoji: "✝️",
    topics: [{ name: "New Testament", subtopics: [{ name: "Life of Jesus", questions: [
      { id: "cre1", question: "Where was Jesus born?", answer: "Bethlehem" },
      { id: "cre2", question: "Name two disciples.", answer: "Peter and John" },
      { id: "cre3", question: "Greatest commandment?", answer: "Love God and love your neighbour" },
      { id: "cre4", question: "Day Christians celebrate the resurrection?", answer: "Easter" },
    ]}]}],
  },
  {
    subject: "Agriculture", emoji: "🌾",
    topics: [{ name: "Crop Production", subtopics: [{ name: "Soil & Crops", questions: [
      { id: "ag1", question: "Best soil for farming?", answer: "Loam" },
      { id: "ag2", question: "Name a cereal crop.", answer: "Maize" },
      { id: "ag3", question: "Process of removing weeds?", answer: "Weeding" },
    ]}]}],
  },
  {
    subject: "Pre-Technical Studies", emoji: "🛠️",
    topics: [{ name: "Tools & Safety", subtopics: [{ name: "Workshop", questions: [
      { id: "pt1", question: "Tool for driving nails?", answer: "Hammer" },
      { id: "pt2", question: "PPE for the eyes?", answer: "Goggles" },
      { id: "pt3", question: "Renewable energy source?", answer: "Solar" },
    ]}]}],
  },
  {
    subject: "Business Studies", emoji: "💼",
    topics: [{ name: "Trade", subtopics: [{ name: "Basics", questions: [
      { id: "bs1", question: "Define trade.", answer: "The buying and selling of goods and services." },
      { id: "bs2", question: "Document acknowledging payment?", answer: "Receipt" },
      { id: "bs3", question: "Person who starts a business?", answer: "Entrepreneur" },
    ]}]}],
  },
];

export function getSubjects(curriculum: Curriculum, grade: Grade): SubjectPack[] {
  const band = GRADE_BAND[grade] || "lower";
  let base = BANDS[band];

  // CBC: filter to CBC-relevant subjects for Junior/Senior school.
  if (curriculum === "CBC" && (band === "upper" || band === "senior")) {
    const extras = band === "upper" ? CBC_UPPER_EXTRA : [];
    const merged = [...base, ...extras];
    base = merged.filter((p) => CBC_JUNIOR_SUBJECTS.has(p.subject));
    // De-dup by subject name (extras win).
    const seen = new Set<string>();
    const unique: SubjectPack[] = [];
    for (const p of [...extras, ...base]) {
      if (seen.has(p.subject)) continue;
      seen.add(p.subject);
      unique.push(p);
    }
    base = unique;
  }

  // Prefix all question ids so they're unique per curriculum/grade context.
  return base.map((pack) => ({
    ...pack,
    topics: pack.topics.map((t) => ({
      ...t,
      subtopics: t.subtopics.map((st) => ({
        ...st,
        questions: st.questions.map((q) => ({
          ...q,
          id: `${curriculum}-${grade}-${pack.subject}-${t.name}-${st.name}-${q.id}`,
        })),
      })),
    })),
  }));
}

export function getAllQuestions(pack: SubjectPack): Question[] {
  return pack.topics.flatMap((t) => t.subtopics.flatMap((s) => s.questions));
}

// Backward-compat: flat list (used by Home preview).
export interface FlatQuestion extends Question {
  subject: string;
}
export function getQuestions(curriculum: Curriculum, grade: Grade): FlatQuestion[] {
  return getSubjects(curriculum, grade).flatMap((p) =>
    getAllQuestions(p).map((q) => ({ ...q, subject: p.subject })),
  );
}
