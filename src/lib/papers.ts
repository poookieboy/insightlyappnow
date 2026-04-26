// Mock test paper bank — multi-question papers per subject, per grade band.
// Each paper has a difficulty tag + topic tag so the UI can group by difficulty.

import type { Curriculum, Grade } from "./store";

export type QuestionKind = "mcq" | "short";
export type Difficulty = "easy" | "medium" | "hard";

export interface PaperQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  modelAnswer?: string;
  acceptable?: string[];
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

// Re-id a question array so collisions across packs never happen.
const reid = (qs: PaperQuestion[]): PaperQuestion[] =>
  qs.map((q, i) => ({ ...q, id: `q${i + 1}` }));

// ============================================================
// PRIMARY (Grades 1–5)
// ============================================================
const PRIMARY: Paper[] = [
  {
    id: "math-numbers", subject: "Mathematics", emoji: "🧮",
    title: "Numbers & Operations", topic: "Numbers", difficulty: "easy", durationMinutes: 30,
    questions: reid([
      mcq("", "5 + 3 = ?", ["6", "7", "8", "9"], 2),
      mcq("", "10 − 4 = ?", ["4", "5", "6", "7"], 2),
      mcq("", "Which is the smallest?", ["12", "21", "9", "15"], 2),
      mcq("", "Even number?", ["3", "5", "8", "11"], 2),
      mcq("", "Half of 10?", ["3", "4", "5", "6"], 2),
      mcq("", "9 + 6 = ?", ["14", "15", "16", "17"], 1),
      mcq("", "20 − 7 = ?", ["12", "13", "14", "15"], 1),
      mcq("", "3 × 4 = ?", ["10", "11", "12", "14"], 2),
      mcq("", "16 ÷ 4 = ?", ["3", "4", "5", "6"], 1),
      mcq("", "Which is largest?", ["48", "84", "78", "87"], 3),
      mcq("", "Place value of 4 in 245?", ["Tens", "Ones", "Hundreds", "Thousands"], 0),
      mcq("", "100 + 250 = ?", ["300", "340", "350", "450"], 2),
      short("", "Write 27 in words.", "twenty-seven", ["twenty seven"]),
      short("", "What is 14 + 14?", "28"),
      short("", "What is 50 − 23?", "27"),
      short("", "What is 6 × 7?", "42"),
      short("", "What is 36 ÷ 6?", "6"),
      short("", "Sum of 12, 13 and 14?", "39"),
      short("", "Round 47 to the nearest 10.", "50"),
      short("", "Half of 84 is?", "42"),
    ]),
  },
  {
    id: "math-shapes", subject: "Mathematics", emoji: "🧮",
    title: "Shapes, Measure & Money", topic: "Geometry", difficulty: "easy", durationMinutes: 25,
    questions: reid([
      mcq("", "Sides of a triangle?", ["2", "3", "4", "5"], 1),
      mcq("", "Sides of a hexagon?", ["5", "6", "7", "8"], 1),
      mcq("", "A square has __ equal sides.", ["2", "3", "4", "5"], 2),
      mcq("", "How many faces does a cube have?", ["4", "6", "8", "12"], 1),
      mcq("", "A circle has how many corners?", ["0", "1", "2", "4"], 0),
      mcq("", "1 metre = ? cm", ["10", "100", "1000", "60"], 1),
      mcq("", "1 hour = ? minutes", ["30", "60", "100", "120"], 1),
      mcq("", "1 kilogram = ? grams", ["10", "100", "1000", "10000"], 2),
      mcq("", "Half past 3 = ?", ["3:15", "3:30", "3:45", "4:30"], 1),
      mcq("", "How many sides does a pentagon have?", ["4", "5", "6", "7"], 1),
      mcq("", "Ksh 50 + Ksh 75 = ?", ["100", "115", "125", "135"], 2),
      mcq("", "How many days in a week?", ["5", "6", "7", "8"], 2),
      short("", "Name a 3D shape with no flat faces.", "sphere", ["a sphere", "ball"]),
      short("", "How many corners does a cube have?", "8"),
      short("", "Perimeter of a square with side 5 cm.", "20 cm", ["20"]),
      short("", "Area of a 3 by 4 rectangle?", "12", ["12 sq", "12 square"]),
      short("", "Months in a year?", "12"),
      short("", "Quarter of 20?", "5"),
      short("", "How many minutes in 2 hours?", "120"),
      short("", "Change from Ksh 100 if you spend Ksh 65?", "35"),
    ]),
  },
  {
    id: "eng-grammar", subject: "English", emoji: "📖",
    title: "Grammar & Vocabulary", topic: "Grammar", difficulty: "easy", durationMinutes: 30,
    questions: reid([
      mcq("", "Plural of 'child'?", ["childs", "children", "childes", "child"], 1),
      mcq("", "Plural of 'mouse'?", ["mouses", "mice", "mouse", "mises"], 1),
      mcq("", "Choose the noun:", ["run", "happy", "table", "quickly"], 2),
      mcq("", "Choose the verb:", ["blue", "sing", "tall", "soft"], 1),
      mcq("", "Choose the adjective:", ["tree", "green", "sing", "slowly"], 1),
      mcq("", "Past tense of 'eat'?", ["eated", "eaten", "ate", "eating"], 2),
      mcq("", "An article is:", ["a / an / the", "noun", "verb", "adverb"], 0),
      mcq("", "Which is a question word?", ["table", "where", "running", "blue"], 1),
      mcq("", "Punctuation at end of a question?", [".", "!", "?", ","], 2),
      mcq("", "Capital letter is used for:", ["names", "verbs", "colours", "numbers"], 0),
      mcq("", "Plural of 'bus'?", ["bus", "buss", "buses", "busses"], 2),
      mcq("", "Choose pronoun:", ["she", "blue", "fast", "table"], 0),
      short("", "Opposite of 'big'.", "small", ["little", "tiny"]),
      short("", "Opposite of 'happy'.", "sad", ["unhappy"]),
      short("", "Opposite of 'hot'.", "cold"),
      short("", "Plural of 'baby'.", "babies"),
      short("", "Past tense of 'go'.", "went"),
      short("", "Use 'a' or 'an': ___ apple.", "an"),
      short("", "Synonym of 'happy'.", "joyful", ["glad", "cheerful", "pleased"]),
      short("", "Rhyming word for 'cat'.", "bat", ["hat", "rat", "mat", "sat"]),
    ]),
  },
  {
    id: "sci-living", subject: "Science", emoji: "🔬",
    title: "Living Things & Our Body", topic: "Living Things", difficulty: "easy", durationMinutes: 30,
    questions: reid([
      mcq("", "Plants need this to make food.", ["Milk", "Sunlight", "Sugar", "Salt"], 1),
      mcq("", "Sense organ for seeing?", ["Ears", "Nose", "Eyes", "Skin"], 2),
      mcq("", "Sense organ for hearing?", ["Eyes", "Ears", "Tongue", "Skin"], 1),
      mcq("", "Animals that lay eggs?", ["Cow", "Goat", "Hen", "Dog"], 2),
      mcq("", "Animals that give milk are called?", ["Reptiles", "Mammals", "Insects", "Fish"], 1),
      mcq("", "We breathe in:", ["Oxygen", "Carbon dioxide", "Smoke", "Water"], 0),
      mcq("", "Bees make:", ["Milk", "Honey", "Eggs", "Wool"], 1),
      mcq("", "Where do fish live?", ["Trees", "Air", "Water", "Holes"], 2),
      mcq("", "Number of teeth in an adult?", ["20", "28", "32", "40"], 2),
      mcq("", "Which is a fruit?", ["Carrot", "Onion", "Mango", "Cabbage"], 2),
      mcq("", "Largest organ in the body?", ["Heart", "Brain", "Skin", "Liver"], 2),
      mcq("", "Solid, liquid and ___?", ["Air", "Gas", "Wood", "Stone"], 1),
      short("", "How many legs does a spider have?", "8"),
      short("", "Which gas do we breathe in?", "oxygen"),
      short("", "Which gas do we breathe out?", "carbon dioxide", ["co2"]),
      short("", "Name one source of light.", "sun", ["torch", "bulb", "lamp", "candle", "fire"]),
      short("", "Which organ pumps blood?", "heart"),
      short("", "Name one mineral our bones need.", "calcium"),
      short("", "Which insect makes honey?", "bee", ["bees"]),
      short("", "Name one healthy food.", "fruits", ["vegetables", "milk", "fish", "beans", "eggs", "fruit"]),
    ]),
  },
  {
    id: "ss-community", subject: "Social Studies", emoji: "🌍",
    title: "My Community & Country", topic: "Community", difficulty: "easy", durationMinutes: 25,
    questions: reid([
      mcq("", "Means of water transport?", ["Bus", "Boat", "Bicycle", "Train"], 1),
      mcq("", "Where do we learn?", ["Hospital", "School", "Market", "Park"], 1),
      mcq("", "Capital city of Kenya?", ["Mombasa", "Kisumu", "Nairobi", "Eldoret"], 2),
      mcq("", "Highest mountain in Kenya?", ["Mt Elgon", "Mt Kenya", "Mt Kilimanjaro", "Aberdares"], 1),
      mcq("", "Colours of the Kenyan flag include:", ["Blue, white, yellow", "Black, red, green, white", "Pink, gold", "Brown, orange"], 1),
      mcq("", "A person who teaches in school?", ["Doctor", "Teacher", "Farmer", "Driver"], 1),
      mcq("", "Continent Kenya is in?", ["Asia", "Europe", "Africa", "America"], 2),
      mcq("", "Currency of Kenya?", ["Dollar", "Shilling", "Pound", "Euro"], 1),
      mcq("", "Number of counties in Kenya?", ["10", "27", "47", "60"], 2),
      mcq("", "National language of Kenya?", ["French", "Swahili", "Arabic", "German"], 1),
      mcq("", "Person who heads a county?", ["Mayor", "Governor", "President", "Senator"], 1),
      mcq("", "Day Kenya got independence?", ["1st June", "12th December", "20th October", "1st May"], 1),
      short("", "Name one continent.", "Africa", ["asia", "europe", "north america", "south america", "antarctica", "australia"]),
      short("", "Name one community helper.", "doctor", ["nurse", "teacher", "police", "farmer", "driver", "fireman", "firefighter"]),
      short("", "Name one source of family income.", "salary", ["business", "farming", "wages", "rent", "trade"]),
      short("", "Largest lake in Kenya?", "lake victoria", ["victoria"]),
      short("", "Name one neighbour of Kenya.", "uganda", ["tanzania", "ethiopia", "somalia", "south sudan"]),
      short("", "Who is the head of state of Kenya?", "the president", ["president"]),
      short("", "Name one means of communication.", "phone", ["radio", "tv", "letter", "internet", "email", "newspaper"]),
      short("", "Name one traditional Kenyan food.", "ugali", ["chapati", "githeri", "sukuma", "irio", "mukimo"]),
    ]),
  },
  // ===== CBC-leaning subjects =====
  {
    id: "cre-foundations", subject: "CRE", emoji: "✝️",
    title: "Christian Religious Education — Foundations", topic: "Bible & Values", difficulty: "easy", durationMinutes: 25,
    questions: reid([
      mcq("", "First book of the Bible?", ["Exodus", "Genesis", "Psalms", "Matthew"], 1),
      mcq("", "Last book of the Bible?", ["Acts", "Revelation", "Jude", "Romans"], 1),
      mcq("", "Number of Commandments?", ["7", "10", "12", "5"], 1),
      mcq("", "Who built the ark?", ["Moses", "Abraham", "Noah", "David"], 2),
      mcq("", "Jesus was born in?", ["Nazareth", "Jerusalem", "Bethlehem", "Egypt"], 2),
      mcq("", "Number of disciples Jesus chose?", ["7", "10", "12", "14"], 2),
      mcq("", "Who led Israel out of Egypt?", ["Joseph", "Moses", "Joshua", "Samuel"], 1),
      mcq("", "First man and woman?", ["Cain & Abel", "Adam & Eve", "Abraham & Sarah", "Isaac & Rebecca"], 1),
      mcq("", "Day of rest for Christians?", ["Friday", "Saturday", "Sunday", "Monday"], 2),
      mcq("", "Author of many Psalms?", ["David", "Solomon", "Paul", "Peter"], 0),
      mcq("", "Symbol of Christianity?", ["Crescent", "Cross", "Star", "Wheel"], 1),
      mcq("", "Where Jesus turned water to wine?", ["Cana", "Capernaum", "Bethany", "Jericho"], 0),
      short("", "Name the Holy Trinity.", "father, son, holy spirit", ["father son and holy spirit"]),
      short("", "Mother of Jesus?", "mary"),
      short("", "Earthly father of Jesus?", "joseph"),
      short("", "First disciple Jesus called (one)?", "peter", ["andrew", "simon", "simon peter"]),
      short("", "Place Jesus was crucified?", "calvary", ["golgotha"]),
      short("", "Day Christians celebrate Jesus' resurrection?", "easter", ["easter sunday"]),
      short("", "Christian prayer Jesus taught?", "the lord's prayer", ["lords prayer", "our father"]),
      short("", "One fruit of the Spirit.", "love", ["joy", "peace", "patience", "kindness", "goodness", "faithfulness", "gentleness", "self-control"]),
    ]),
  },
  {
    id: "agri-basics", subject: "Agriculture", emoji: "🌾",
    title: "Agriculture — Basics", topic: "Farming", difficulty: "easy", durationMinutes: 25,
    questions: reid([
      mcq("", "Farming for own food only is called?", ["Commercial", "Subsistence", "Mixed", "Plantation"], 1),
      mcq("", "Animal kept for milk?", ["Goat", "Cow", "Hen", "Pig"], 1),
      mcq("", "Tool for digging?", ["Panga", "Jembe", "Wheelbarrow", "Rake"], 1),
      mcq("", "Crop grown for tea production?", ["Maize", "Tea", "Beans", "Cassava"], 1),
      mcq("", "Process of putting seeds in soil?", ["Weeding", "Planting", "Harvesting", "Pruning"], 1),
      mcq("", "Removing unwanted plants?", ["Pruning", "Weeding", "Mulching", "Spraying"], 1),
      mcq("", "Animal product used for clothing?", ["Eggs", "Wool", "Milk", "Meat"], 1),
      mcq("", "Rabbit meat is called?", ["Beef", "Mutton", "Pork", "Rabbit meat"], 3),
      mcq("", "Fertiliser supplies plants with?", ["Water", "Nutrients", "Sunlight", "Air"], 1),
      mcq("", "A nursery is used for?", ["Sleeping", "Growing seedlings", "Storing tools", "Cooking"], 1),
      mcq("", "Best time to plant in Kenya?", ["Drought", "Long rains", "Cold season", "Anytime"], 1),
      mcq("", "Pest of maize?", ["Aphid", "Stalk borer", "Tick", "Mite"], 1),
      short("", "Name one cereal crop.", "maize", ["wheat", "rice", "sorghum", "millet", "barley"]),
      short("", "Name one legume.", "beans", ["peas", "groundnuts", "soya", "cowpeas", "lentils"]),
      short("", "Name one root crop.", "cassava", ["sweet potato", "potato", "yam", "carrot"]),
      short("", "Name one source of farm power.", "human", ["animal", "tractor", "wind", "solar", "machine", "ox"]),
      short("", "Hen meat is called?", "poultry", ["chicken"]),
      short("", "Calf is the young of?", "cow", ["cattle"]),
      short("", "Name one farm record.", "production record", ["breeding record", "feeding record", "health record", "financial record"]),
      short("", "Name one method of irrigation.", "drip", ["sprinkler", "furrow", "flooding", "basin", "overhead"]),
    ]),
  },
  {
    id: "homesci-basics", subject: "Home Science", emoji: "🏠",
    title: "Home Science — Basics", topic: "Food, Clothing & Health", difficulty: "easy", durationMinutes: 25,
    questions: reid([
      mcq("", "Vitamin C is found in?", ["Bread", "Oranges", "Rice", "Oil"], 1),
      mcq("", "Best for body building?", ["Sugar", "Beans", "Butter", "Salt"], 1),
      mcq("", "Tool for ironing clothes?", ["Comb", "Iron box", "Brush", "Hammer"], 1),
      mcq("", "Cleanest water is?", ["Rain", "Boiled tap", "River", "Pond"], 1),
      mcq("", "Soap is made for?", ["Eating", "Cleaning", "Cooking", "Drinking"], 1),
      mcq("", "Synthetic fabric?", ["Cotton", "Wool", "Nylon", "Linen"], 2),
      mcq("", "First aid for a small cut?", ["Ignore", "Wash and bandage", "Apply mud", "Eat sugar"], 1),
      mcq("", "Storing perishable food?", ["Sun", "Refrigerator", "Cupboard", "Floor"], 1),
      mcq("", "A balanced diet has?", ["Only sugar", "All food groups", "Only meat", "Only water"], 1),
      mcq("", "Best fabric for hot weather?", ["Wool", "Polyester", "Cotton", "Leather"], 2),
      mcq("", "Tool for measuring fabric?", ["Spoon", "Tape measure", "Scale", "Cup"], 1),
      mcq("", "Personal hygiene includes?", ["Bathing", "Sleeping", "Eating", "Running"], 0),
      short("", "Name one body-building food.", "meat", ["fish", "beans", "eggs", "milk", "lentils"]),
      short("", "Name one energy food.", "rice", ["bread", "ugali", "potatoes", "sugar", "honey", "maize", "pasta"]),
      short("", "Name one protective food.", "fruits", ["vegetables", "milk", "fruit"]),
      short("", "Tool used for sewing by hand?", "needle"),
      short("", "Way to preserve milk?", "boiling", ["refrigeration", "fermenting", "pasteurizing"]),
      short("", "Name one waterborne disease.", "cholera", ["typhoid", "dysentery", "diarrhoea", "diarrhea"]),
      short("", "Best way to clean teeth?", "brushing", ["brushing teeth"]),
      short("", "Item used to wipe a kitchen surface?", "cloth", ["sponge", "rag", "wiper"]),
    ]),
  },
  {
    id: "pretech-basics", subject: "Pre-Technical Studies", emoji: "🔧",
    title: "Pre-Technical — Tools & Safety", topic: "Tools & Materials", difficulty: "easy", durationMinutes: 25,
    questions: reid([
      mcq("", "Tool for driving nails?", ["Saw", "Hammer", "Plane", "Chisel"], 1),
      mcq("", "Tool for cutting wood?", ["Saw", "Hammer", "File", "Mallet"], 0),
      mcq("", "Tool for tightening bolts?", ["Pliers", "Spanner", "Hammer", "Saw"], 1),
      mcq("", "Hand tool for measuring length?", ["Spoon", "Ruler", "Cup", "Scale"], 1),
      mcq("", "Material from trees?", ["Steel", "Plastic", "Wood", "Glass"], 2),
      mcq("", "PPE for the eyes?", ["Helmet", "Goggles", "Boots", "Gloves"], 1),
      mcq("", "Helmet protects?", ["Hands", "Head", "Feet", "Eyes"], 1),
      mcq("", "Symbol for danger?", ["Triangle ⚠", "Circle ⛔", "Square", "Star"], 0),
      mcq("", "Safer source of energy at home?", ["Petrol", "Solar", "Diesel", "Charcoal indoors"], 1),
      mcq("", "Which is recyclable?", ["Banana peel", "Plastic bottle", "Wet napkin", "Food waste"], 1),
      mcq("", "Use of a screwdriver?", ["Cut wood", "Drive screws", "Smoothen wood", "Measure"], 1),
      mcq("", "Best material for cooking pots?", ["Paper", "Aluminium", "Cloth", "Wax"], 1),
      short("", "Tool used to smoothen wood?", "plane", ["sandpaper"]),
      short("", "Tool used to make holes?", "drill", ["bradawl"]),
      short("", "Name one safety rule in the workshop.", "wear protective gear", ["no running", "follow instructions", "tidy tools", "wear ppe", "report accidents"]),
      short("", "Material made from clay?", "brick", ["pottery", "tile"]),
      short("", "Tool for holding hot items?", "tongs"),
      short("", "Name one renewable energy source.", "solar", ["wind", "hydro", "geothermal", "biomass"]),
      short("", "Name one digital device.", "phone", ["computer", "tablet", "laptop", "smartphone"]),
      short("", "Color of a fire extinguisher symbol?", "red"),
    ]),
  },
];

// ============================================================
// LOWER (Grades 6–8)
// ============================================================
const LOWER: Paper[] = [
  {
    id: "math-algebra", subject: "Mathematics", emoji: "🧮",
    title: "Algebra & Numbers", topic: "Algebra", difficulty: "medium", durationMinutes: 40,
    questions: reid([
      mcq("", "Solve: x + 5 = 12", ["5", "6", "7", "8"], 2),
      mcq("", "Solve: 2x = 14", ["5", "6", "7", "8"], 2),
      mcq("", "Simplify: 3a + 2a", ["5", "5a", "6a", "a²"], 1),
      mcq("", "Solve: 2x + 3 = 11", ["3", "4", "5", "6"], 1),
      mcq("", "Expand: 3(x + 2)", ["3x+2", "3x+6", "x+6", "3x+5"], 1),
      mcq("", "25% of 80?", ["15", "20", "25", "30"], 1),
      mcq("", "LCM of 4 and 6?", ["12", "10", "24", "8"], 0),
      mcq("", "HCF of 12 and 18?", ["3", "6", "9", "12"], 1),
      mcq("", "Square root of 144?", ["10", "11", "12", "14"], 2),
      mcq("", "0.25 as a fraction?", ["1/2", "1/3", "1/4", "1/5"], 2),
      mcq("", "Convert 3/4 to %.", ["25%", "50%", "60%", "75%"], 3),
      mcq("", "Reciprocal of 5?", ["5", "1/5", "−5", "0"], 1),
      short("", "Solve: x − 4 = 9", "13"),
      short("", "Simplify: 4y − y", "3y"),
      short("", "Solve: 5(x − 1) = 20", "5"),
      short("", "If y = 2x + 1 and x = 4, find y.", "9"),
      short("", "Factorise: 6a + 9", "3(2a + 3)", ["3(2a+3)"]),
      short("", "12 ÷ 0.5 = ?", "24"),
      short("", "Average of 6, 8 and 10.", "8"),
      short("", "Increase 80 by 10%.", "88"),
    ]),
  },
  {
    id: "math-geometry", subject: "Mathematics", emoji: "🧮",
    title: "Geometry, Measure & Stats", topic: "Geometry", difficulty: "medium", durationMinutes: 40,
    questions: reid([
      mcq("", "Sum of interior angles of a triangle?", ["90°", "180°", "270°", "360°"], 1),
      mcq("", "Sum of angles in a quadrilateral?", ["180°", "270°", "360°", "540°"], 2),
      mcq("", "Mean of 3, 5, 7, 9, 11?", ["6", "7", "8", "9"], 1),
      mcq("", "Area of a 6×4 rectangle?", ["10", "20", "24", "30"], 2),
      mcq("", "Volume of a 2×3×4 cuboid?", ["18", "20", "24", "28"], 2),
      mcq("", "Right angle is?", ["45°", "60°", "90°", "120°"], 2),
      mcq("", "An equilateral triangle has angles of?", ["45°", "60°", "90°", "120°"], 1),
      mcq("", "1 km = ? m", ["100", "500", "1000", "10000"], 2),
      mcq("", "Type of angle bigger than 90°?", ["Acute", "Right", "Obtuse", "Reflex"], 2),
      mcq("", "Pi (π) ≈ ?", ["1.41", "2.71", "3.14", "9.81"], 2),
      mcq("", "Median of 3, 5, 8, 9?", ["5", "6", "6.5", "8"], 2),
      mcq("", "Range of 4, 9, 12, 7?", ["3", "5", "8", "12"], 2),
      short("", "Mode of 2, 4, 4, 5, 6, 6, 6, 8.", "6"),
      short("", "Perimeter of a square with side 9 cm.", "36 cm", ["36"]),
      short("", "Area of a triangle base 8 cm height 5 cm.", "20", ["20 cm²", "20cm2"]),
      short("", "Number of edges of a cube.", "12"),
      short("", "Convert 2.5 hours to minutes.", "150"),
      short("", "Probability of getting a head when tossing a coin.", "1/2", ["0.5", "50%"]),
      short("", "Name a quadrilateral with all sides equal.", "rhombus", ["square"]),
      short("", "If a rectangle is 10 by 5, what is its perimeter?", "30", ["30 cm"]),
    ]),
  },
  {
    id: "sci-general", subject: "Science", emoji: "🔬",
    title: "Integrated Science", topic: "General", difficulty: "medium", durationMinutes: 40,
    questions: reid([
      mcq("", "Plants take in which gas for photosynthesis?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2),
      mcq("", "Boiling point of pure water at sea level?", ["50°C", "75°C", "100°C", "150°C"], 2),
      mcq("", "Unit of force?", ["Joule", "Newton", "Watt", "Pascal"], 1),
      mcq("", "Speed = distance ÷ ?", ["mass", "time", "force", "area"], 1),
      mcq("", "Largest planet?", ["Earth", "Mars", "Jupiter", "Saturn"], 2),
      mcq("", "Star at the centre of our solar system?", ["Moon", "Mars", "Sun", "Venus"], 2),
      mcq("", "Gas needed for burning?", ["Nitrogen", "Oxygen", "Carbon dioxide", "Hydrogen"], 1),
      mcq("", "Type of energy in moving things?", ["Potential", "Kinetic", "Chemical", "Heat"], 1),
      mcq("", "Magnet attracts?", ["Plastic", "Iron", "Wood", "Glass"], 1),
      mcq("", "Disease caused by mosquitoes?", ["Cholera", "Malaria", "Cold", "TB"], 1),
      mcq("", "Process by which water vapour becomes liquid?", ["Evaporation", "Condensation", "Freezing", "Melting"], 1),
      mcq("", "Soil best for growing crops?", ["Sand", "Loam", "Clay only", "Rock"], 1),
      short("", "Name the three states of matter.", "solid, liquid, gas", ["solid liquid gas"]),
      short("", "Which organ pumps blood?", "heart", ["the heart"]),
      short("", "Gas plants release during photosynthesis.", "oxygen"),
      short("", "Reproduction in plants involves?", "pollination"),
      short("", "Unit of electric current?", "ampere", ["amp", "amps", "amperes"]),
      short("", "Name one renewable energy source.", "solar", ["wind", "hydro", "geothermal", "biomass"]),
      short("", "Force that pulls objects to the ground?", "gravity"),
      short("", "Tool used to measure temperature?", "thermometer"),
    ]),
  },
  {
    id: "eng-grammar-medium", subject: "English", emoji: "📖",
    title: "Grammar & Composition", topic: "Grammar", difficulty: "medium", durationMinutes: 35,
    questions: reid([
      mcq("", "Identify the adjective: 'The blue car raced past.'", ["car", "blue", "raced", "past"], 1),
      mcq("", "Past tense of 'go'?", ["goed", "gone", "went", "going"], 2),
      mcq("", "Choose the adverb:", ["quick", "quickly", "quickness", "quicker"], 1),
      mcq("", "Plural of 'leaf'?", ["leafs", "leaves", "leafes", "leave"], 1),
      mcq("", "Antonym of 'ancient'?", ["old", "modern", "ruined", "vintage"], 1),
      mcq("", "A simile uses?", ["metaphor", "like or as", "rhyme", "alliteration"], 1),
      mcq("", "Direct speech is enclosed in?", ["( )", "“ ”", "[ ]", "{ }"], 1),
      mcq("", "Active voice example?", ["The cake was eaten.", "She ate the cake.", "It is being eaten.", "Eaten was the cake."], 1),
      mcq("", "Article used before vowel sound?", ["a", "an", "the only", "no article"], 1),
      mcq("", "Choose conjunction:", ["because", "table", "fast", "blue"], 0),
      mcq("", "Synonym of 'rapid'?", ["slow", "quick", "calm", "tired"], 1),
      mcq("", "Past tense of 'sing'?", ["singed", "sanged", "sang", "sung"], 2),
      short("", "Define a 'simile' with one example.", "a comparison using like or as", ["like or as"]),
      short("", "Plural of 'analysis'.", "analyses"),
      short("", "Opposite of 'generous'.", "stingy", ["selfish", "mean"]),
      short("", "Past tense of 'write'.", "wrote"),
      short("", "Use a comma after this conjunctive adverb: ___, the test was easy.", "however"),
      short("", "Punctuation that ends an exclamation.", "!", ["exclamation mark"]),
      short("", "What is a noun? (one word)", "naming word", ["naming"]),
      short("", "Pronoun for two or more people not me.", "they"),
    ]),
  },
  {
    id: "cre-bible-stories", subject: "CRE", emoji: "✝️",
    title: "Bible Stories & Teachings", topic: "Bible", difficulty: "medium", durationMinutes: 35,
    questions: reid([
      mcq("", "Author of Acts of the Apostles?", ["Paul", "Luke", "Peter", "John"], 1),
      mcq("", "Who denied Jesus three times?", ["Judas", "Peter", "Thomas", "John"], 1),
      mcq("", "Who wrote most of the New Testament letters?", ["Peter", "Paul", "James", "John"], 1),
      mcq("", "First martyr of the Church?", ["James", "Stephen", "Paul", "Peter"], 1),
      mcq("", "Book between Malachi and Matthew?", ["None", "Acts", "Revelation", "James"], 0),
      mcq("", "Number of books in the Bible?", ["50", "66", "72", "100"], 1),
      mcq("", "Number of OT books?", ["27", "39", "46", "50"], 1),
      mcq("", "Number of NT books?", ["20", "25", "27", "30"], 2),
      mcq("", "Day Pentecost is celebrated after?", ["Christmas", "Easter", "Lent", "Advent"], 1),
      mcq("", "Sermon on the Mount is in?", ["Mark", "Luke", "Matthew", "John"], 2),
      mcq("", "Jesus' first miracle was at?", ["Bethany", "Cana", "Bethlehem", "Jericho"], 1),
      mcq("", "King who built the temple?", ["David", "Saul", "Solomon", "Hezekiah"], 2),
      short("", "Who baptised Jesus?", "john the baptist", ["john"]),
      short("", "Name two of Jesus' parables (one is enough).", "the prodigal son", ["good samaritan", "sower", "lost sheep", "talents", "mustard seed"]),
      short("", "Place Jesus prayed before arrest?", "gethsemane", ["garden of gethsemane"]),
      short("", "Holy book of Christians?", "the bible", ["bible"]),
      short("", "Who freed the Israelites from Egypt?", "moses"),
      short("", "Author of Proverbs?", "solomon"),
      short("", "Name one work of mercy.", "feeding the hungry", ["clothing the naked", "visiting the sick", "burying the dead", "sheltering the homeless", "giving drink to the thirsty", "visiting the imprisoned"]),
      short("", "Number of sacraments in the Catholic Church?", "7"),
    ]),
  },
  {
    id: "agri-crops-livestock", subject: "Agriculture", emoji: "🌾",
    title: "Crops & Livestock", topic: "Production", difficulty: "medium", durationMinutes: 35,
    questions: reid([
      mcq("", "Crop grown for sugar?", ["Maize", "Sugarcane", "Beans", "Cassava"], 1),
      mcq("", "Animal used to plough?", ["Sheep", "Goat", "Ox", "Pig"], 2),
      mcq("", "Plant disease caused by fungi?", ["Aphid", "Smut", "Tick", "Worm"], 1),
      mcq("", "Cash crop in coastal Kenya?", ["Tea", "Coffee", "Coconut", "Pyrethrum"], 2),
      mcq("", "Grade given to fresh milk?", ["A B C D", "1 2 3", "Fresh, sour", "Hot, cold"], 0),
      mcq("", "Best soil for vegetables?", ["Sandy", "Clay", "Loam", "Rocky"], 2),
      mcq("", "When planting maize use spacing?", ["10×10cm", "75×30cm", "5×5cm", "1m×1m"], 1),
      mcq("", "Benefit of crop rotation?", ["Increase pests", "Improve soil fertility", "Cut yields", "Reduce sunlight"], 1),
      mcq("", "Animal vaccinated against rabies?", ["Cow", "Dog", "Hen", "Fish"], 1),
      mcq("", "Honey is produced by?", ["Termites", "Bees", "Ants", "Flies"], 1),
      mcq("", "Hatching of chicks needs?", ["Wind", "Warmth", "Cold", "Rain"], 1),
      mcq("", "Best time to harvest maize?", ["When green", "When silks brown and dry", "Before flowering", "During rain"], 1),
      short("", "Name one cereal grown in Kenya.", "maize", ["wheat", "rice", "sorghum", "millet"]),
      short("", "Young of a goat?", "kid"),
      short("", "Young of a pig?", "piglet"),
      short("", "Tool used for spraying pesticide?", "sprayer", ["knapsack sprayer", "knapsack"]),
      short("", "Name one cash crop.", "tea", ["coffee", "pyrethrum", "sugarcane", "cotton", "tobacco", "sisal"]),
      short("", "Name one organic manure.", "farmyard manure", ["compost", "green manure", "fym"]),
      short("", "Name one method of preserving milk.", "boiling", ["refrigeration", "fermenting", "pasteurization", "pasteurizing"]),
      short("", "Name one beef breed of cattle.", "boran", ["hereford", "angus", "charolais", "brahman", "shorthorn"]),
    ]),
  },
];

// ============================================================
// UPPER (Grades 9–10)
// ============================================================
const UPPER: Paper[] = [
  {
    id: "math-algebra", subject: "Mathematics", emoji: "🧮",
    title: "Algebra", topic: "Algebra", difficulty: "medium", durationMinutes: 45,
    questions: reid([
      mcq("", "Factorise: x² − 16", ["(x−4)²", "(x−4)(x+4)", "(x−2)(x+8)", "x(x−16)"], 1),
      mcq("", "Solve: x² = 49", ["7", "±7", "±49", "14"], 1),
      mcq("", "Gradient through (2,3) and (5,12)?", ["2", "3", "4", "5"], 1),
      mcq("", "Roots of x² − 5x + 6 = 0?", ["1, 6", "2, 3", "−2, −3", "1, −6"], 1),
      mcq("", "If 3ˣ = 81, x = ?", ["2", "3", "4", "5"], 2),
      mcq("", "Simplify: 2x² · 3x³.", ["5x⁵", "6x⁵", "6x⁶", "5x⁶"], 1),
      mcq("", "Solve |x| = 5.", ["5 only", "−5 only", "±5", "0"], 2),
      mcq("", "Sequence 2,5,8,11... 5th term?", ["12", "13", "14", "15"], 2),
      mcq("", "log₂ 8 = ?", ["1", "2", "3", "8"], 2),
      mcq("", "Slope of y = 4x − 7?", ["−7", "4", "−4", "7"], 1),
      mcq("", "Solve: 3(x − 2) = 12.", ["2", "4", "6", "8"], 2),
      mcq("", "Domain restriction of 1/x?", ["x ≠ 1", "x ≠ 0", "x > 0", "x < 0"], 1),
      short("", "Solve: x + y = 7 and x − y = 1.", "x = 4, y = 3", ["x=4, y=3", "x=4 y=3"]),
      short("", "Expand: (x + 3)(x − 5).", "x² − 2x − 15", ["x^2-2x-15"]),
      short("", "Solve x² − 6x + 9 = 0.", "x = 3", ["3"]),
      short("", "Make r the subject of A = πr².", "r = √(A/π)", ["sqrt(A/pi)"]),
      short("", "Sum of first 10 natural numbers.", "55"),
      short("", "If f(x)=2x+1, find f(3).", "7"),
      short("", "Simplify: (x²)³.", "x⁶", ["x^6"]),
      short("", "Solve: 2/x = 4.", "0.5", ["1/2"]),
    ]),
  },
  {
    id: "math-trig", subject: "Mathematics", emoji: "🧮",
    title: "Trigonometry & Geometry", topic: "Trigonometry", difficulty: "medium", durationMinutes: 45,
    questions: reid([
      mcq("", "sin 30° = ?", ["0", "0.5", "√2/2", "1"], 1),
      mcq("", "Hypotenuse for sides 3 and 4?", ["5", "6", "7", "12"], 0),
      mcq("", "cos 60° = ?", ["0", "0.5", "1", "−1"], 1),
      mcq("", "tan 0° = ?", ["0", "1", "−1", "undefined"], 0),
      mcq("", "Sum of angles in pentagon?", ["360°", "450°", "540°", "720°"], 2),
      mcq("", "Area of circle with r=7? (π=22/7)", ["44", "144", "154", "176"], 2),
      mcq("", "Pythagoras: 5² + 12² = ?²", ["13", "15", "17", "20"], 0),
      mcq("", "Angle on a straight line is?", ["90°", "180°", "270°", "360°"], 1),
      mcq("", "Bearings are measured from?", ["West", "South", "North", "East"], 2),
      mcq("", "Polygon with 8 sides?", ["Hexagon", "Heptagon", "Octagon", "Nonagon"], 2),
      mcq("", "Volume of a cylinder?", ["πr²", "2πr", "πr²h", "4/3πr³"], 2),
      mcq("", "If sin θ = 0.5, θ = ?", ["15°", "30°", "45°", "60°"], 1),
      short("", "Circumference of a circle r=7 cm. (π≈3.14)", "43.96 cm", ["43.96", "44"]),
      short("", "tan 45° = ?", "1"),
      short("", "Hypotenuse of 6,8 right triangle.", "10"),
      short("", "Area of triangle base 10 height 6.", "30"),
      short("", "Angle complementary to 35°.", "55"),
      short("", "sin² θ + cos² θ = ?", "1"),
      short("", "Surface area of a cube edge 4.", "96"),
      short("", "Convert 90° to radians (in terms of π).", "π/2", ["pi/2"]),
    ]),
  },
  {
    id: "bio-cells", subject: "Biology", emoji: "🌱",
    title: "Cells & Body Systems", topic: "Cells", difficulty: "medium", durationMinutes: 45,
    questions: reid([
      mcq("", "Which organelle makes proteins?", ["Nucleus", "Ribosome", "Mitochondrion", "Vacuole"], 1),
      mcq("", "Largest artery in the body?", ["Vena cava", "Aorta", "Pulmonary", "Carotid"], 1),
      mcq("", "Powerhouse of the cell?", ["Nucleus", "Mitochondria", "Ribosome", "Golgi"], 1),
      mcq("", "Plant cells have but animal don't?", ["Nucleus", "Cell wall", "Membrane", "Ribosome"], 1),
      mcq("", "Pigment for photosynthesis?", ["Hemoglobin", "Chlorophyll", "Melanin", "Keratin"], 1),
      mcq("", "Type of blood cell that fights infection?", ["RBC", "WBC", "Platelet", "Plasma"], 1),
      mcq("", "Number of chambers in human heart?", ["2", "3", "4", "5"], 2),
      mcq("", "Site of digestion of starch starts?", ["Stomach", "Mouth", "Small intestine", "Liver"], 1),
      mcq("", "Excretory organ that filters blood?", ["Liver", "Kidney", "Spleen", "Lung"], 1),
      mcq("", "The basic unit of life is?", ["Tissue", "Organ", "Cell", "Atom"], 2),
      mcq("", "Gas removed from blood in lungs?", ["O₂", "N₂", "CO₂", "H₂"], 2),
      mcq("", "Where is bile produced?", ["Stomach", "Liver", "Pancreas", "Gall bladder"], 1),
      short("", "Function of red blood cells?", "transport oxygen", ["carry oxygen"]),
      short("", "Define osmosis.", "movement of water across a partially permeable membrane", ["water across membrane"]),
      short("", "Name one type of muscle.", "skeletal", ["smooth", "cardiac"]),
      short("", "Vitamin made by skin in sunlight?", "vitamin d", ["d"]),
      short("", "Process by which plants lose water?", "transpiration"),
      short("", "Female reproductive cell?", "egg", ["ovum"]),
      short("", "Largest organ in the human body?", "skin"),
      short("", "Word equation for respiration: glucose + oxygen → ?", "carbon dioxide + water", ["co2 and water", "water and carbon dioxide"]),
    ]),
  },
  {
    id: "chem-bonding", subject: "Chemistry", emoji: "⚗️",
    title: "Atoms, Bonding & Reactions", topic: "Bonding", difficulty: "medium", durationMinutes: 45,
    questions: reid([
      mcq("", "Charge of an electron?", ["+1", "0", "−1", "+2"], 2),
      mcq("", "NaCl is held together by:", ["Covalent", "Ionic", "Metallic", "Hydrogen"], 1),
      mcq("", "Atomic number = number of?", ["Neutrons", "Protons", "Electrons in shells", "Atomic mass"], 1),
      mcq("", "pH of pure water?", ["1", "5", "7", "10"], 2),
      mcq("", "Acid + base → ?", ["Salt + water", "Gas only", "Metal", "Sugar"], 0),
      mcq("", "Element with symbol K?", ["Carbon", "Calcium", "Potassium", "Krypton"], 2),
      mcq("", "Most reactive group of metals?", ["Group 1", "Group 7", "Group 0", "Transition"], 0),
      mcq("", "Halogens are in group?", ["1", "2", "7", "0"], 2),
      mcq("", "Test for hydrogen gas?", ["Glowing splint", "Pop with lit splint", "Limewater", "Litmus"], 1),
      mcq("", "Test for oxygen?", ["Limewater", "Glowing splint relights", "Pop", "Damp litmus"], 1),
      mcq("", "Limewater turns ___ with CO₂.", ["Red", "Milky", "Blue", "Green"], 1),
      mcq("", "State at 25°C of mercury?", ["Solid", "Liquid", "Gas", "Plasma"], 1),
      short("", "Balance: Mg + O₂ → MgO", "2Mg + O₂ → 2MgO", ["2mg + o2 -> 2mgo"]),
      short("", "Symbol for sodium?", "Na"),
      short("", "Symbol for iron?", "Fe"),
      short("", "Process of changing liquid to gas?", "evaporation"),
      short("", "Name one alkali metal.", "sodium", ["lithium", "potassium", "rubidium", "caesium"]),
      short("", "Number of electrons in second shell (max).", "8"),
      short("", "Conjugate base of HCl?", "Cl⁻", ["cl-"]),
      short("", "Name one noble gas.", "helium", ["neon", "argon", "krypton", "xenon", "radon"]),
    ]),
  },
  {
    id: "phy-forces", subject: "Physics", emoji: "⚙️",
    title: "Forces, Motion & Electricity", topic: "Mechanics", difficulty: "medium", durationMinutes: 45,
    questions: reid([
      mcq("", "Unit of power?", ["Joule", "Newton", "Watt", "Pascal"], 2),
      mcq("", "Force on 5 kg with a = 2 m/s²?", ["2.5 N", "7 N", "10 N", "25 N"], 2),
      mcq("", "Acceleration due to gravity (Earth)?", ["1.6", "9.8", "12", "20"], 1),
      mcq("", "Speed = ?", ["m × a", "d × t", "d ÷ t", "F ÷ m"], 2),
      mcq("", "Energy in moving object?", ["Potential", "Kinetic", "Sound", "Heat"], 1),
      mcq("", "Voltage is measured in?", ["Amp", "Ohm", "Volt", "Watt"], 2),
      mcq("", "Resistance is measured in?", ["Volts", "Ohms", "Watts", "Joules"], 1),
      mcq("", "Series circuit: current is?", ["Same", "Different", "Zero", "Doubled"], 0),
      mcq("", "Type of energy in a stretched spring?", ["Kinetic", "Elastic potential", "Heat", "Sound"], 1),
      mcq("", "Wavelength is the distance between?", ["Crests", "Troughs only", "Crest and crest", "Particles"], 2),
      mcq("", "Light travels at?", ["340 m/s", "3×10⁸ m/s", "9.8 m/s²", "1.5 m/s"], 1),
      mcq("", "Reflection of sound is called?", ["Echo", "Resonance", "Pitch", "Loudness"], 0),
      short("", "State Newton's Second Law.", "force equals mass times acceleration", ["f=ma", "f = ma"]),
      short("", "Unit of resistance?", "ohm", ["ohms", "Ω"]),
      short("", "Formula for electrical power?", "p = vi", ["p=vi", "voltage times current"]),
      short("", "Tool used to measure current?", "ammeter"),
      short("", "Energy stored in food?", "chemical", ["chemical energy"]),
      short("", "Work done = force × ?", "distance"),
      short("", "Unit of frequency?", "hertz", ["hz"]),
      short("", "Speed of sound in air ≈ ?", "340", ["330", "343"]),
    ]),
  },
];

// ============================================================
// SENIOR (Grades 11–12)
// ============================================================
const SENIOR: Paper[] = [
  {
    id: "math-calc", subject: "Mathematics", emoji: "🧮",
    title: "Calculus", topic: "Calculus", difficulty: "hard", durationMinutes: 60,
    questions: reid([
      mcq("", "d/dx (x³) = ?", ["x²", "3x²", "3x", "x⁴/4"], 1),
      mcq("", "∫ 2x dx = ?", ["x²", "x² + C", "2x² + C", "x"], 1),
      mcq("", "d/dx (sin x) = ?", ["cos x", "−cos x", "−sin x", "tan x"], 0),
      mcq("", "∫ eˣ dx = ?", ["eˣ", "eˣ + C", "x·eˣ", "ln x"], 1),
      mcq("", "d/dx (ln x) = ?", ["1/x", "ln x / x", "x", "e^x"], 0),
      mcq("", "Chain rule: d/dx f(g(x)) = ?", ["f'(g)", "f'(g)·g'(x)", "f(g')", "f·g"], 1),
      mcq("", "∫ cos x dx = ?", ["sin x + C", "−sin x + C", "cos x + C", "tan x + C"], 0),
      mcq("", "Stationary point where dy/dx = ?", ["0", "1", "−1", "x"], 0),
      mcq("", "Max/min: 2nd derivative > 0 means?", ["Max", "Min", "Inflection", "Saddle"], 1),
      mcq("", "d/dx (x² + 3x) = ?", ["2x + 3", "x² + 3", "2x", "3"], 0),
      mcq("", "∫₀¹ x dx = ?", ["0", "1/2", "1", "2"], 1),
      mcq("", "Limit of (1+1/n)^n as n → ∞ = ?", ["1", "2", "e", "π"], 2),
      short("", "Differentiate y = (2x + 1)³.", "6(2x + 1)²", ["6(2x+1)^2"]),
      short("", "∫₀² (3x² + 1) dx = ?", "10"),
      short("", "Stationary point of y = x² − 6x + 5.", "(3, −4)", ["3,-4", "x=3"]),
      short("", "∫₁² (1/x) dx = ?", "ln 2", ["ln(2)"]),
      short("", "d/dx (cos x) = ?", "-sin x", ["-sinx"]),
      short("", "Tangent slope of y=x² at x=3.", "6"),
      short("", "Differentiate xeˣ.", "eˣ(1+x)", ["e^x(1+x)"]),
      short("", "∫ (1/x²) dx = ?", "-1/x + c", ["-1/x"]),
    ]),
  },
  {
    id: "math-algtrig", subject: "Mathematics", emoji: "🧮",
    title: "Algebra, Logs & Trig", topic: "Algebra", difficulty: "medium", durationMinutes: 50,
    questions: reid([
      mcq("", "log₁₀(1000) = ?", ["1", "2", "3", "10"], 2),
      mcq("", "cos(0°) = ?", ["0", "0.5", "1", "−1"], 2),
      mcq("", "ln(1) = ?", ["0", "1", "e", "undefined"], 0),
      mcq("", "Solve 2ˣ = 16.", ["2", "3", "4", "5"], 2),
      mcq("", "Solve log₂ x = 5.", ["10", "16", "32", "64"], 2),
      mcq("", "(a+b)² = ?", ["a²+b²", "a²+2ab+b²", "a²-b²", "a²-2ab+b²"], 1),
      mcq("", "Sum of GP: 2,4,8,...8 terms?", ["255", "510", "256", "512"], 1),
      mcq("", "Discriminant of ax²+bx+c = ?", ["b²-4ac", "b²+4ac", "4ac-b²", "2a"], 0),
      mcq("", "If sin θ = 3/5, cos θ = ?", ["4/5", "5/4", "3/4", "1/5"], 0),
      mcq("", "tan(π/4) = ?", ["0", "1/2", "1", "√3"], 2),
      mcq("", "i² = ?", ["1", "−1", "0", "i"], 1),
      mcq("", "Number of solutions of sin x = 0 in [0,2π]?", ["1", "2", "3", "4"], 2),
      short("", "Solve 2ˣ = 32.", "5"),
      short("", "ln(e³) = ?", "3"),
      short("", "Sum of arithmetic series 1+2+...+50.", "1275"),
      short("", "Simplify (2+i)(2-i).", "5"),
      short("", "Modulus of 3+4i.", "5"),
      short("", "Solve cos x = 0 in [0,2π] (one value).", "π/2", ["pi/2", "3π/2", "3pi/2"]),
      short("", "Expand (x+y)³.", "x³+3x²y+3xy²+y³", ["x^3+3x^2y+3xy^2+y^3"]),
      short("", "log(100) (base 10).", "2"),
    ]),
  },
  {
    id: "phy-mechanics", subject: "Physics", emoji: "⚙️",
    title: "Mechanics & Energy", topic: "Mechanics", difficulty: "medium", durationMinutes: 50,
    questions: reid([
      mcq("", "KE of a 2 kg object at 4 m/s?", ["4 J", "8 J", "16 J", "32 J"], 2),
      mcq("", "g on Earth ≈ ?", ["1.6", "9.8", "12", "20"], 1),
      mcq("", "Power = ?", ["work × time", "work ÷ time", "force × distance", "mass × velocity"], 1),
      mcq("", "PE of 5 kg at 10 m?", ["50 J", "100 J", "490 J", "500 J"], 2),
      mcq("", "Momentum unit?", ["N", "kg·m/s", "J", "W"], 1),
      mcq("", "Newton's 3rd Law?", ["F=ma", "Inertia", "Action-reaction", "Energy conserved"], 2),
      mcq("", "Friction acts?", ["With motion", "Against motion", "Up only", "None"], 1),
      mcq("", "Pendulum period depends on?", ["mass", "amplitude", "length", "weight"], 2),
      mcq("", "Hooke's Law: F = ?", ["mv", "kx", "mg", "ma²"], 1),
      mcq("", "1 horsepower ≈ ?", ["100 W", "200 W", "746 W", "1000 W"], 2),
      mcq("", "Centripetal force is directed?", ["Outward", "Inward", "Tangent", "Up"], 1),
      mcq("", "Acceleration is the rate of change of?", ["position", "velocity", "force", "momentum"], 1),
      short("", "Define momentum and its formula.", "mass × velocity, p = mv", ["p=mv"]),
      short("", "Power for 600 J done in 30 s?", "20 W", ["20"]),
      short("", "Work to lift 10 kg by 2 m? (g=10)", "200", ["200 j"]),
      short("", "State the principle of conservation of energy.", "energy cannot be created or destroyed", ["energy is conserved"]),
      short("", "Velocity is a __ quantity.", "vector"),
      short("", "Speed when 60 m covered in 5 s?", "12", ["12 m/s"]),
      short("", "If F=20N and m=4kg, a = ?", "5", ["5 m/s2"]),
      short("", "Unit of impulse?", "ns", ["n.s", "newton second", "kgm/s"]),
    ]),
  },
  {
    id: "chem-react", subject: "Chemistry", emoji: "⚗️",
    title: "Reactions, Acids & Bonding", topic: "Reactions", difficulty: "medium", durationMinutes: 50,
    questions: reid([
      mcq("", "pH of a neutral solution?", ["0", "7", "10", "14"], 1),
      mcq("", "Which is an alkali?", ["HCl", "NaOH", "CO₂", "CH₄"], 1),
      mcq("", "Catalysts work by?", ["Increasing E_a", "Lowering E_a", "Adding heat", "Removing reactants"], 1),
      mcq("", "Oxidation is loss of?", ["protons", "electrons", "neutrons", "mass"], 1),
      mcq("", "Reduction is gain of?", ["oxygen", "electrons", "protons", "mass"], 1),
      mcq("", "Strong acid?", ["CH₃COOH", "H₂CO₃", "HCl", "NH₄OH"], 2),
      mcq("", "Most reactive non-metal?", ["F", "Cl", "Br", "I"], 0),
      mcq("", "Avogadro's number ≈ ?", ["6×10²³", "9.8", "1.6×10⁻¹⁹", "3×10⁸"], 0),
      mcq("", "Number of electrons in O (Z=8)?", ["6", "7", "8", "10"], 2),
      mcq("", "Salt of HCl + NaOH?", ["NaCl", "KCl", "NH₄Cl", "CaCl₂"], 0),
      mcq("", "Type of bond in O₂?", ["Single", "Double", "Triple", "Ionic"], 1),
      mcq("", "Indicator turning red in acid?", ["Methyl orange", "Phenolphthalein", "Litmus", "Bromothymol blue"], 2),
      short("", "Define an exothermic reaction.", "releases heat to the surroundings", ["releases heat"]),
      short("", "Conjugate base of HCl?", "Cl⁻", ["cl-"]),
      short("", "Symbol of potassium?", "K"),
      short("", "Limewater's chemical name?", "calcium hydroxide", ["ca(oh)2"]),
      short("", "Number of moles in 36 g of water?", "2"),
      short("", "Common name for sodium chloride?", "salt", ["table salt"]),
      short("", "Test for chloride ion?", "silver nitrate", ["agno3"]),
      short("", "Name one greenhouse gas.", "carbon dioxide", ["co2", "methane", "ch4", "water vapor"]),
    ]),
  },
  {
    id: "bio-genetics", subject: "Biology", emoji: "🌱",
    title: "Genetics, Cells & Ecology", topic: "Genetics", difficulty: "medium", durationMinutes: 50,
    questions: reid([
      mcq("", "DNA bases pair as:", ["A-T, C-G", "A-G, C-T", "A-C, T-G", "A-A, T-T"], 0),
      mcq("", "Mitosis produces:", ["2 haploid", "2 identical diploid", "4 haploid gametes", "4 diploid"], 1),
      mcq("", "Number of chromosomes in human body cells?", ["23", "44", "46", "48"], 2),
      mcq("", "Sex chromosomes of human males?", ["XX", "XY", "YY", "XXY"], 1),
      mcq("", "Site of protein synthesis?", ["Nucleus", "Ribosome", "Lysosome", "Golgi"], 1),
      mcq("", "Genetic info in genes is in form of?", ["RNA", "DNA", "Protein", "Lipids"], 1),
      mcq("", "Producer in food chain?", ["Lion", "Cow", "Grass", "Hyena"], 2),
      mcq("", "Herbivore example?", ["Lion", "Hyena", "Cow", "Snake"], 2),
      mcq("", "Most diverse ecosystem?", ["Desert", "Tundra", "Rainforest", "Ocean trench"], 2),
      mcq("", "Variation can be?", ["Continuous only", "Discontinuous only", "Both", "Neither"], 2),
      mcq("", "Punnett square shows?", ["Energy flow", "Genotypes of offspring", "Cell parts", "Phyla"], 1),
      mcq("", "Nitrogen fixation done by?", ["Algae", "Bacteria", "Viruses", "Fungi"], 1),
      short("", "Role of mRNA?", "carries genetic code from dna to ribosomes", ["dna to ribosome"]),
      short("", "Define an allele.", "an alternative form of a gene", ["form of a gene"]),
      short("", "Founder of evolution by natural selection.", "darwin", ["charles darwin"]),
      short("", "Asexual reproduction in bacteria is called?", "binary fission", ["fission"]),
      short("", "Gas given out in respiration?", "carbon dioxide", ["co2"]),
      short("", "Word equation for photosynthesis: CO₂ + water → ?", "glucose + oxygen", ["sugar and oxygen"]),
      short("", "Group of similar cells doing one job?", "tissue"),
      short("", "Place where organisms live?", "habitat"),
    ]),
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

function withBandId(band: Band, papers: Paper[]): Paper[] {
  return papers.map((p) => ({ ...p, id: `${band}-${p.id}` }));
}

export function getPapers(_curriculum: Curriculum, grade: Grade): Paper[] {
  const band = GRADE_BAND[grade] || "lower";
  return withBandId(band, PAPERS_BY_BAND[band]);
}

export function getPaper(_curriculum: Curriculum, _grade: Grade, paperId: string, generated: Paper[] = []): Paper | undefined {
  const fromGen = generated.find((p) => p.id === paperId);
  if (fromGen) return fromGen;
  for (const band of Object.keys(PAPERS_BY_BAND) as Band[]) {
    const found = withBandId(band, PAPERS_BY_BAND[band]).find((p) => p.id === paperId);
    if (found) return found;
  }
  return undefined;
}

// Normalise an AI-generated paper payload into a valid Paper.
export function normaliseGeneratedPaper(raw: any, opts: {
  subject: string; curriculum: Curriculum; grade: Grade; difficulty: Difficulty;
}): Paper {
  const id = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const questions: PaperQuestion[] = (raw.questions || [])
    .filter((q: any) => q && (q.kind === "mcq" || q.kind === "short") && typeof q.prompt === "string")
    .map((q: any, i: number) => {
      const marks = Number(q.marks) > 0 ? Number(q.marks) : 1;
      if (q.kind === "mcq") {
        return {
          id: `q${i + 1}`,
          kind: "mcq" as const,
          prompt: q.prompt,
          options: Array.isArray(q.options) ? q.options.map(String) : [],
          correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
          marks,
        };
      }
      return {
        id: `q${i + 1}`,
        kind: "short" as const,
        prompt: q.prompt,
        modelAnswer: String(q.modelAnswer ?? ""),
        acceptable: Array.isArray(q.acceptable) ? q.acceptable.map(String) : [],
        marks,
      };
    });
  return {
    id,
    subject: opts.subject,
    emoji: typeof raw.emoji === "string" ? raw.emoji : "📝",
    title: typeof raw.title === "string" ? raw.title : `${opts.subject} mock paper`,
    topic: typeof raw.topic === "string" ? raw.topic : opts.subject,
    difficulty: opts.difficulty,
    durationMinutes: Number(raw.durationMinutes) > 0 ? Number(raw.durationMinutes) : 30,
    questions,
  };
}

export function gradeShortAnswer(q: PaperQuestion, userAnswer: string): boolean {
  if (q.kind !== "short") return false;
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9αβπΩμ°\-+./²³√]+/gi, " ").replace(/\s+/g, " ").trim();
  const u = norm(userAnswer);
  if (!u) return false;
  const targets = [q.modelAnswer || "", ...(q.acceptable || [])].map(norm);
  return targets.some((t) => t && (t === u || (t.length > 3 && u.includes(t)) || (u.length > 3 && t.includes(u))));
}
