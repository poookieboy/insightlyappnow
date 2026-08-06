/**
 * Converts LaTeX-flavoured maths coming back from the AI into clean, readable
 * plain-text maths. Students should never see `$`, `\(`, `\frac{}{}` etc.
 */

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", n: "ⁿ", i: "ⁱ",
};
const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", n: "ₙ", x: "ₓ",
};

const SYMBOLS: [RegExp, string][] = [
  [/\\times/g, "×"], [/\\div/g, "÷"], [/\\cdot/g, "·"],
  [/\\pm/g, "±"], [/\\mp/g, "∓"],
  [/\\leq?/g, "≤"], [/\\geq?/g, "≥"], [/\\neq/g, "≠"], [/\\approx/g, "≈"],
  [/\\infty/g, "∞"], [/\\degree/g, "°"], [/\\circ/g, "°"],
  [/\\alpha/g, "α"], [/\\beta/g, "β"], [/\\gamma/g, "γ"], [/\\delta/g, "δ"],
  [/\\theta/g, "θ"], [/\\lambda/g, "λ"], [/\\mu/g, "μ"], [/\\sigma/g, "σ"],
  [/\\omega/g, "ω"], [/\\Delta/g, "Δ"], [/\\pi/g, "π"],
  [/\\rightarrow|\\to/g, "→"], [/\\Rightarrow/g, "⇒"], [/\\leftarrow/g, "←"],
  [/\\sum/g, "Σ"], [/\\int/g, "∫"], [/\\partial/g, "∂"],
  [/\\%/g, "%"], [/\\\$/g, "$"], [/\\&/g, "&"], [/\\_/g, "_"],
  [/\\,|\\;|\\!|\\:/g, " "], [/\\quad|\\qquad/g, "  "],
  [/\\left|\\right/g, ""], [/\\displaystyle|\\textstyle|\\limits/g, ""],
];

/** Matches a `{...}` group with balanced braces starting at index i. */
function readGroup(src: string, i: number): { body: string; end: number } | null {
  if (src[i] !== "{") return null;
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") {
      depth--;
      if (depth === 0) return { body: src.slice(i + 1, j), end: j + 1 };
    }
  }
  return null;
}

/** Expand \frac, \sqrt, \text and friends (recursively). */
function expandCommands(input: string): string {
  let out = "";
  let i = 0;
  while (i < input.length) {
    if (input[i] !== "\\") { out += input[i++]; continue; }
    const rest = input.slice(i);
    const frac = /^\\d?frac\s*/.exec(rest);
    if (frac) {
      const a = readGroup(input, i + frac[0].length);
      const b = a ? readGroup(input, a.end) : null;
      if (a && b) {
        const top = expandCommands(a.body);
        const bottom = expandCommands(b.body);
        const wrap = (s: string) => (/^[\w.]+$/.test(s.trim()) ? s.trim() : `(${s.trim()})`);
        out += `${wrap(top)}/${wrap(bottom)}`;
        i = b.end;
        continue;
      }
    }
    const sqrt = /^\\sqrt\s*/.exec(rest);
    if (sqrt) {
      const g = readGroup(input, i + sqrt[0].length);
      if (g) { out += `√(${expandCommands(g.body).trim()})`; i = g.end; continue; }
    }
    const txt = /^\\(text|mathrm|mathbf|textbf|mathit|operatorname)\s*/.exec(rest);
    if (txt) {
      const g = readGroup(input, i + txt[0].length);
      if (g) { out += expandCommands(g.body); i = g.end; continue; }
    }
    const boxed = /^\\boxed\s*/.exec(rest);
    if (boxed) {
      const g = readGroup(input, i + boxed[0].length);
      if (g) { out += expandCommands(g.body).trim(); i = g.end; continue; }
    }
    out += input[i++];
  }
  return out;
}

function scripts(input: string): string {
  const map = (chars: string, table: Record<string, string>) =>
    [...chars].every((c) => table[c]) ? [...chars].map((c) => table[c]).join("") : null;

  return input
    .replace(/\^\{([^{}]+)\}/g, (m, g) => map(g, SUP) ?? `^(${g})`)
    .replace(/\^(\w)/g, (m, g) => SUP[g] ?? `^${g}`)
    .replace(/_\{([^{}]+)\}/g, (m, g) => map(g, SUB) ?? `_(${g})`)
    .replace(/_(\w)/g, (m, g) => SUB[g] ?? `_${g}`);
}

function cleanFragment(fragment: string): string {
  let s = expandCommands(fragment);
  for (const [re, to] of SYMBOLS) s = s.replace(re, to);
  s = scripts(s);
  s = s.replace(/\\\\/g, " ").replace(/[{}]/g, "");
  s = s.replace(/\\([a-zA-Z]+)/g, "$1");
  return s.replace(/[ \t]{2,}/g, " ").trim();
}

/**
 * Strips LaTeX delimiters and rewrites the maths inside them as readable text.
 * Fenced code blocks (including mermaid) are left untouched.
 */
export function humanizeMath(markdown: string): string {
  if (!markdown) return markdown;
  const blocks: string[] = [];
  const guarded = markdown.replace(/```[\s\S]*?```|`[^`\n]*`/g, (m) => {
    blocks.push(m);
    return `\u0000${blocks.length - 1}\u0000`;
  });

  let out = guarded
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, g) => `\n\n${cleanFragment(g)}\n\n`)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_m, g) => `\n\n${cleanFragment(g)}\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, g) => cleanFragment(g))
    .replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_m, g) => cleanFragment(g));

  // Any stray LaTeX left outside delimiters
  if (/\\(frac|sqrt|times|cdot|pi|leq|geq|neq|left|right|text)\b/.test(out)) {
    out = out
      .split("\n")
      .map((line) => (/\\[a-zA-Z]/.test(line) ? cleanFragment(line) : line))
      .join("\n");
  }

  return out.replace(/\u0000(\d+)\u0000/g, (_m, i) => blocks[Number(i)]);
}
