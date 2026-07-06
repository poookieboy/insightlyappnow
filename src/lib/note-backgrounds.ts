// 200+ note backgrounds — solid colors, soft gradients, and patterns.
// Each entry is a CSS `background` shorthand + optional text color hint.

export interface NoteBackground {
  id: string;
  label: string;
  css: string;
  text?: "dark" | "light";
  group: "solid" | "gradient" | "pattern" | "paper";
}

// --- Solid pastels & vivid colors (72) ---
const SOLIDS: [string, string, "dark" | "light"][] = [
  ["#fef3c7", "Butter", "dark"], ["#fde68a", "Honey", "dark"], ["#fcd34d", "Amber", "dark"],
  ["#fbbf24", "Sunflower", "dark"], ["#f59e0b", "Marigold", "dark"], ["#d97706", "Copper", "light"],
  ["#fee2e2", "Blush", "dark"], ["#fecaca", "Petal", "dark"], ["#fca5a5", "Coral", "dark"],
  ["#f87171", "Salmon", "light"], ["#ef4444", "Rose", "light"], ["#dc2626", "Cherry", "light"],
  ["#fce7f3", "Cotton candy", "dark"], ["#fbcfe8", "Bubblegum", "dark"], ["#f9a8d4", "Flamingo", "dark"],
  ["#f472b6", "Pink lemonade", "light"], ["#ec4899", "Magenta", "light"], ["#db2777", "Berry", "light"],
  ["#f3e8ff", "Lilac mist", "dark"], ["#e9d5ff", "Lavender", "dark"], ["#d8b4fe", "Wisteria", "dark"],
  ["#c084fc", "Grape", "light"], ["#a855f7", "Violet", "light"], ["#9333ea", "Royal purple", "light"],
  ["#e0e7ff", "Periwinkle", "dark"], ["#c7d2fe", "Cornflower", "dark"], ["#a5b4fc", "Iris", "dark"],
  ["#818cf8", "Indigo mist", "light"], ["#6366f1", "Indigo", "light"], ["#4f46e5", "Deep indigo", "light"],
  ["#dbeafe", "Sky", "dark"], ["#bfdbfe", "Powder", "dark"], ["#93c5fd", "Cornflower blue", "dark"],
  ["#60a5fa", "Sapphire", "light"], ["#3b82f6", "Cobalt", "light"], ["#2563eb", "Royal blue", "light"],
  ["#cffafe", "Ice", "dark"], ["#a5f3fc", "Turquoise mist", "dark"], ["#67e8f9", "Aqua", "dark"],
  ["#22d3ee", "Cyan", "dark"], ["#06b6d4", "Peacock", "light"], ["#0891b2", "Deep teal", "light"],
  ["#d1fae5", "Mint", "dark"], ["#a7f3d0", "Sea foam", "dark"], ["#6ee7b7", "Jade", "dark"],
  ["#34d399", "Emerald mist", "dark"], ["#10b981", "Emerald", "light"], ["#059669", "Forest", "light"],
  ["#ecfccb", "Lime chiffon", "dark"], ["#d9f99d", "Lime cream", "dark"], ["#bef264", "Lime", "dark"],
  ["#a3e635", "Sour apple", "dark"], ["#84cc16", "Olive", "dark"], ["#65a30d", "Moss", "light"],
  ["#fef2f2", "Whisper rose", "dark"], ["#fefce8", "Whisper cream", "dark"], ["#f0fdf4", "Whisper mint", "dark"],
  ["#eff6ff", "Whisper sky", "dark"], ["#faf5ff", "Whisper lilac", "dark"], ["#fdf4ff", "Whisper pink", "dark"],
  ["#f5f5f4", "Stone", "dark"], ["#e7e5e4", "Pebble", "dark"], ["#d6d3d1", "Sand", "dark"],
  ["#a8a29e", "Taupe", "light"], ["#78716c", "Slate warm", "light"], ["#57534e", "Espresso", "light"],
  ["#f8fafc", "Snow", "dark"], ["#f1f5f9", "Cloud", "dark"], ["#e2e8f0", "Fog", "dark"],
  ["#cbd5e1", "Mist", "dark"], ["#94a3b8", "Steel", "light"], ["#475569", "Charcoal", "light"],
];

// --- Gradients (80) ---
const GRADIENTS: [string, string, "dark" | "light"][] = [
  ["linear-gradient(135deg,#fef3c7 0%,#fcd34d 100%)", "Sunrise", "dark"],
  ["linear-gradient(135deg,#fecaca 0%,#f9a8d4 100%)", "Rose petal", "dark"],
  ["linear-gradient(135deg,#a5f3fc 0%,#818cf8 100%)", "Ocean breeze", "dark"],
  ["linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)", "Meadow", "dark"],
  ["linear-gradient(135deg,#e9d5ff 0%,#f9a8d4 100%)", "Cotton candy", "dark"],
  ["linear-gradient(135deg,#fde68a 0%,#fca5a5 100%)", "Peach cobbler", "dark"],
  ["linear-gradient(135deg,#93c5fd 0%,#c4b5fd 100%)", "Blueberry", "dark"],
  ["linear-gradient(135deg,#fbbf24 0%,#f87171 100%)", "Marmalade", "light"],
  ["linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)", "Tropical", "light"],
  ["linear-gradient(135deg,#a855f7 0%,#ec4899 100%)", "Berry blast", "light"],
  ["linear-gradient(135deg,#f472b6 0%,#c084fc 100%)", "Fairy floss", "light"],
  ["linear-gradient(135deg,#22d3ee 0%,#34d399 100%)", "Lagoon", "light"],
  ["linear-gradient(135deg,#f59e0b 0%,#dc2626 100%)", "Sunset", "light"],
  ["linear-gradient(135deg,#0ea5e9 0%,#8b5cf6 100%)", "Twilight", "light"],
  ["linear-gradient(135deg,#059669 0%,#0891b2 100%)", "Forest lake", "light"],
  ["linear-gradient(135deg,#f97316 0%,#eab308 100%)", "Autumn", "light"],
  ["linear-gradient(135deg,#0f172a 0%,#334155 100%)", "Midnight", "light"],
  ["linear-gradient(135deg,#1e3a8a 0%,#4c1d95 100%)", "Galaxy", "light"],
  ["linear-gradient(135deg,#7c2d12 0%,#831843 100%)", "Wine", "light"],
  ["linear-gradient(135deg,#064e3b 0%,#134e4a 100%)", "Deep forest", "light"],
  ["linear-gradient(135deg,#fff7ed 0%,#fef3c7 50%,#fecaca 100%)", "Morning glow", "dark"],
  ["linear-gradient(135deg,#ecfeff 0%,#e0f2fe 50%,#e0e7ff 100%)", "Arctic", "dark"],
  ["linear-gradient(135deg,#fdf4ff 0%,#fce7f3 50%,#fee2e2 100%)", "Blush cloud", "dark"],
  ["linear-gradient(135deg,#f0fdf4 0%,#dcfce7 50%,#d1fae5 100%)", "Fresh mint", "dark"],
  ["linear-gradient(135deg,#fefce8 0%,#fef9c3 50%,#fef3c7 100%)", "Vanilla", "dark"],
  ["linear-gradient(180deg,#e0f2fe 0%,#f0f9ff 100%)", "Baby blue", "dark"],
  ["linear-gradient(180deg,#fce7f3 0%,#fdf2f8 100%)", "Baby pink", "dark"],
  ["linear-gradient(180deg,#dcfce7 0%,#f0fdf4 100%)", "Baby green", "dark"],
  ["linear-gradient(180deg,#fef3c7 0%,#fffbeb 100%)", "Baby yellow", "dark"],
  ["linear-gradient(180deg,#ede9fe 0%,#f5f3ff 100%)", "Baby purple", "dark"],
  ["radial-gradient(circle at 30% 20%,#fbcfe8 0%,#f9a8d4 40%,#f472b6 100%)", "Pink sphere", "light"],
  ["radial-gradient(circle at 70% 30%,#bae6fd 0%,#7dd3fc 40%,#0ea5e9 100%)", "Blue sphere", "light"],
  ["radial-gradient(circle at 50% 20%,#fde68a 0%,#f59e0b 60%,#b45309 100%)", "Sun beam", "light"],
  ["radial-gradient(circle at 20% 80%,#c4b5fd 0%,#8b5cf6 60%,#6d28d9 100%)", "Purple orb", "light"],
  ["radial-gradient(circle at 80% 80%,#6ee7b7 0%,#10b981 60%,#065f46 100%)", "Emerald orb", "light"],
  ["linear-gradient(45deg,#ff9a9e 0%,#fad0c4 100%)", "Peachy", "dark"],
  ["linear-gradient(45deg,#a1c4fd 0%,#c2e9fb 100%)", "Sky wash", "dark"],
  ["linear-gradient(45deg,#d4fc79 0%,#96e6a1 100%)", "Spring", "dark"],
  ["linear-gradient(45deg,#84fab0 0%,#8fd3f4 100%)", "Seaside", "dark"],
  ["linear-gradient(45deg,#a6c1ee 0%,#fbc2eb 100%)", "Dreamy", "dark"],
  ["linear-gradient(45deg,#ffecd2 0%,#fcb69f 100%)", "Cream soda", "dark"],
  ["linear-gradient(45deg,#ff9a9e 0%,#fecfef 100%)", "Rose water", "dark"],
  ["linear-gradient(45deg,#fbc2eb 0%,#a6c1ee 100%)", "Cotton", "dark"],
  ["linear-gradient(45deg,#fdcbf1 0%,#e6dee9 100%)", "Petal soft", "dark"],
  ["linear-gradient(45deg,#e0c3fc 0%,#8ec5fc 100%)", "Lavender sky", "dark"],
  ["linear-gradient(45deg,#f093fb 0%,#f5576c 100%)", "Fuchsia", "light"],
  ["linear-gradient(45deg,#4facfe 0%,#00f2fe 100%)", "Neon ocean", "light"],
  ["linear-gradient(45deg,#43e97b 0%,#38f9d7 100%)", "Neon jade", "dark"],
  ["linear-gradient(45deg,#fa709a 0%,#fee140 100%)", "Watermelon", "light"],
  ["linear-gradient(45deg,#30cfd0 0%,#330867 100%)", "Deep sea", "light"],
  ["linear-gradient(45deg,#a8edea 0%,#fed6e3 100%)", "Cotton sea", "dark"],
  ["linear-gradient(45deg,#ff6e7f 0%,#bfe9ff 100%)", "Popsicle", "dark"],
  ["linear-gradient(45deg,#e8198b 0%,#c7eafd 100%)", "Bubble party", "light"],
  ["linear-gradient(45deg,#f6d365 0%,#fda085 100%)", "Mango lassi", "dark"],
  ["linear-gradient(45deg,#5ee7df 0%,#b490ca 100%)", "Mermaid", "dark"],
  ["linear-gradient(45deg,#c471f5 0%,#fa71cd 100%)", "Unicorn", "light"],
  ["linear-gradient(45deg,#48c6ef 0%,#6f86d6 100%)", "Steel blue", "light"],
  ["linear-gradient(45deg,#f78ca0 0%,#f9748f 50%,#fd868c 51%,#fe9a8b 100%)", "Sunset stripe", "light"],
  ["linear-gradient(45deg,#0ba360 0%,#3cba92 100%)", "Emerald wave", "light"],
  ["linear-gradient(45deg,#ff512f 0%,#f09819 100%)", "Fire", "light"],
  ["linear-gradient(45deg,#654ea3 0%,#eaafc8 100%)", "Grape jelly", "light"],
  ["linear-gradient(45deg,#3f2b96 0%,#a8c0ff 100%)", "Denim", "light"],
  ["linear-gradient(45deg,#22c1c3 0%,#fdbb2d 100%)", "Beach", "dark"],
  ["linear-gradient(45deg,#232526 0%,#414345 100%)", "Charcoal", "light"],
  ["linear-gradient(45deg,#141e30 0%,#243b55 100%)", "Night sky", "light"],
  ["linear-gradient(45deg,#8e2de2 0%,#4a00e0 100%)", "Electric grape", "light"],
  ["linear-gradient(45deg,#00c9ff 0%,#92fe9d 100%)", "Aqua lime", "dark"],
  ["linear-gradient(45deg,#f7971e 0%,#ffd200 100%)", "Golden hour", "dark"],
  ["linear-gradient(45deg,#e65c00 0%,#f9d423 100%)", "Tangerine", "dark"],
  ["linear-gradient(45deg,#11998e 0%,#38ef7d 100%)", "Rainforest", "light"],
  ["linear-gradient(45deg,#ee0979 0%,#ff6a00 100%)", "Sunset pop", "light"],
  ["linear-gradient(45deg,#000428 0%,#004e92 100%)", "Deep ocean", "light"],
  ["linear-gradient(45deg,#dd1818 0%,#333333 100%)", "Ember", "light"],
  ["linear-gradient(45deg,#20002c 0%,#cbb4d4 100%)", "Twilight rose", "light"],
  ["linear-gradient(45deg,#1f4037 0%,#99f2c8 100%)", "Pine mist", "dark"],
  ["linear-gradient(45deg,#c33764 0%,#1d2671 100%)", "Nightfall", "light"],
  ["linear-gradient(45deg,#603813 0%,#b29f94 100%)", "Cocoa", "light"],
  ["linear-gradient(45deg,#ff0084 0%,#33001b 100%)", "Neon pink night", "light"],
  ["linear-gradient(45deg,#00b09b 0%,#96c93d 100%)", "Kiwi", "dark"],
  ["linear-gradient(45deg,#2196f3 0%,#f44336 100%)", "Red vs blue", "light"],
  ["linear-gradient(45deg,#7f00ff 0%,#e100ff 100%)", "Ultra violet", "light"],
];

// --- Patterns via SVG data URIs (dots, grid, lines, checker) — 30 variants ---
function dots(color: string, bg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='2' cy='2' r='1.6' fill='${color}'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${bg}`;
}
function grid(color: string, bg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M0 0H24M0 0V24' stroke='${color}' stroke-width='1'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${bg}`;
}
function lines(color: string, bg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M0 23H24' stroke='${color}' stroke-width='1'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${bg}`;
}
function checker(a: string, b: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect width='10' height='10' fill='${a}'/><rect x='10' y='10' width='10' height='10' fill='${a}'/><rect x='10' width='10' height='10' fill='${b}'/><rect y='10' width='10' height='10' fill='${b}'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const PATTERN_PAIRS: [string, string, string, "dark" | "light"][] = [
  ["#00000015", "#fef3c7", "Dots on butter", "dark"],
  ["#00000015", "#fecaca", "Dots on blush", "dark"],
  ["#00000015", "#dbeafe", "Dots on sky", "dark"],
  ["#00000015", "#d1fae5", "Dots on mint", "dark"],
  ["#00000015", "#e9d5ff", "Dots on lilac", "dark"],
  ["#ffffff40", "#334155", "Dots on slate", "light"],
  ["#ffffff40", "#1e3a8a", "Dots on navy", "light"],
  ["#ffffff40", "#7c2d12", "Dots on brick", "light"],
];
const PATTERNS: NoteBackground[] = [];
PATTERN_PAIRS.forEach(([c, bg, label, text], i) => {
  PATTERNS.push({ id: `pattern-dots-${i}`, label, css: dots(c, bg), text, group: "pattern" });
  PATTERNS.push({ id: `pattern-grid-${i}`, label: label.replace("Dots", "Grid"), css: grid(c, bg), text, group: "pattern" });
  PATTERNS.push({ id: `pattern-lines-${i}`, label: label.replace("Dots", "Lines"), css: lines(c, bg), text, group: "pattern" });
});
// A few checkers
[["#fef3c7", "#fde68a", "Butter check"], ["#dbeafe", "#bfdbfe", "Sky check"], ["#fecaca", "#fca5a5", "Coral check"], ["#d1fae5", "#a7f3d0", "Mint check"], ["#e9d5ff", "#d8b4fe", "Lilac check"], ["#f1f5f9", "#e2e8f0", "Cloud check"]].forEach(([a, b, l], i) => {
  PATTERNS.push({ id: `pattern-check-${i}`, label: l, css: checker(a, b), text: "dark", group: "pattern" });
});

// --- Paper looks (lined, dotted, graph) — 8 ---
const PAPERS: NoteBackground[] = [
  { id: "paper-lined-white", label: "Lined paper", css: lines("#93c5fd66", "#ffffff"), text: "dark", group: "paper" },
  { id: "paper-lined-cream", label: "Lined cream", css: lines("#f59e0b55", "#fffbeb"), text: "dark", group: "paper" },
  { id: "paper-grid-white", label: "Grid paper", css: grid("#93c5fd44", "#ffffff"), text: "dark", group: "paper" },
  { id: "paper-grid-cream", label: "Grid cream", css: grid("#a16207aa", "#fffbeb"), text: "dark", group: "paper" },
  { id: "paper-dotted-white", label: "Dotted paper", css: dots("#94a3b866", "#ffffff"), text: "dark", group: "paper" },
  { id: "paper-dotted-cream", label: "Dotted cream", css: dots("#a1621766", "#fffbeb"), text: "dark", group: "paper" },
  { id: "paper-kraft", label: "Kraft paper", css: "#d6bd8a", text: "dark", group: "paper" },
  { id: "paper-parchment", label: "Parchment", css: "linear-gradient(135deg,#f5e6c8,#eddcb0)", text: "dark", group: "paper" },
];

export const NOTE_BACKGROUNDS: NoteBackground[] = [
  ...SOLIDS.map(([hex, label, text], i) => ({
    id: `solid-${i}`, label, css: hex, text, group: "solid" as const,
  })),
  ...GRADIENTS.map(([css, label, text], i) => ({
    id: `grad-${i}`, label, css, text, group: "gradient" as const,
  })),
  ...PATTERNS,
  ...PAPERS,
];

export function getBackground(id?: string | null): NoteBackground {
  if (!id) return NOTE_BACKGROUNDS[0];
  return NOTE_BACKGROUNDS.find((b) => b.id === id) ?? NOTE_BACKGROUNDS[0];
}

// Deterministic fallback background for notes without one chosen.
export function autoBackground(seed: string): NoteBackground {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const softs = NOTE_BACKGROUNDS.filter((b) => b.text === "dark" && (b.group === "solid" || b.group === "gradient"));
  return softs[h % softs.length];
}

export const NOTE_ICONS = [
  "📝", "📚", "🧪", "🧮", "🎨", "🎵", "⚽", "🌍", "🔬", "💡",
  "❤️", "⭐", "🔥", "🌱", "☕", "🎯", "🏆", "📌", "✨", "🎓",
  "📖", "🖊️", "🧠", "🍎", "🌈", "🌙", "☀️", "⚡", "🎲", "🧩",
];
