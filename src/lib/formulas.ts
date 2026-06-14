export type Formula = { name: string; expression: string; note?: string };
export type FormulaSubject = { id: string; name: string; emoji: string; sections: { heading: string; formulas: Formula[] }[] };

export const FORMULAS: FormulaSubject[] = [
  {
    id: "math",
    name: "Mathematics",
    emoji: "➗",
    sections: [
      {
        heading: "Algebra",
        formulas: [
          { name: "Quadratic formula", expression: "x = (-b ± √(b² - 4ac)) / 2a" },
          { name: "Difference of squares", expression: "a² - b² = (a - b)(a + b)" },
          { name: "Perfect square", expression: "(a ± b)² = a² ± 2ab + b²" },
          { name: "Arithmetic sum", expression: "Sₙ = n/2 (2a + (n − 1)d)" },
          { name: "Geometric sum", expression: "Sₙ = a(1 − rⁿ) / (1 − r)" },
        ],
      },
      {
        heading: "Geometry",
        formulas: [
          { name: "Pythagoras", expression: "a² + b² = c²" },
          { name: "Circle area", expression: "A = πr²" },
          { name: "Circle circumference", expression: "C = 2πr" },
          { name: "Sphere volume", expression: "V = 4/3 πr³" },
          { name: "Cylinder volume", expression: "V = πr²h" },
          { name: "Cone volume", expression: "V = 1/3 πr²h" },
        ],
      },
      {
        heading: "Trigonometry",
        formulas: [
          { name: "Sine rule", expression: "a/sin A = b/sin B = c/sin C" },
          { name: "Cosine rule", expression: "c² = a² + b² − 2ab·cos C" },
          { name: "Identity", expression: "sin²θ + cos²θ = 1" },
          { name: "Tan identity", expression: "tan θ = sin θ / cos θ" },
        ],
      },
      {
        heading: "Calculus",
        formulas: [
          { name: "Power rule", expression: "d/dx (xⁿ) = n·xⁿ⁻¹" },
          { name: "Product rule", expression: "(uv)' = u'v + uv'" },
          { name: "Quotient rule", expression: "(u/v)' = (u'v − uv') / v²" },
          { name: "Integral of xⁿ", expression: "∫xⁿ dx = xⁿ⁺¹ / (n+1) + C" },
        ],
      },
    ],
  },
  {
    id: "physics",
    name: "Physics",
    emoji: "⚡",
    sections: [
      {
        heading: "Mechanics",
        formulas: [
          { name: "Newton's 2nd law", expression: "F = ma" },
          { name: "Kinematics", expression: "v = u + at" },
          { name: "Displacement", expression: "s = ut + ½at²" },
          { name: "Velocity²", expression: "v² = u² + 2as" },
          { name: "Momentum", expression: "p = mv" },
          { name: "Kinetic energy", expression: "Eₖ = ½mv²" },
          { name: "Potential energy", expression: "Eₚ = mgh" },
          { name: "Work", expression: "W = F·d·cosθ" },
          { name: "Power", expression: "P = W/t" },
        ],
      },
      {
        heading: "Electricity",
        formulas: [
          { name: "Ohm's law", expression: "V = IR" },
          { name: "Power (electrical)", expression: "P = VI = I²R" },
          { name: "Charge", expression: "Q = It" },
          { name: "Series resistance", expression: "R = R₁ + R₂ + …" },
          { name: "Parallel resistance", expression: "1/R = 1/R₁ + 1/R₂ + …" },
        ],
      },
      {
        heading: "Waves & Optics",
        formulas: [
          { name: "Wave speed", expression: "v = fλ" },
          { name: "Refractive index", expression: "n = sin i / sin r" },
          { name: "Lens equation", expression: "1/f = 1/u + 1/v" },
        ],
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    emoji: "🧪",
    sections: [
      {
        heading: "Moles & Concentration",
        formulas: [
          { name: "Moles (mass)", expression: "n = m / M" },
          { name: "Moles (gas STP)", expression: "n = V / 22.4" },
          { name: "Concentration", expression: "C = n / V" },
          { name: "Dilution", expression: "C₁V₁ = C₂V₂" },
        ],
      },
      {
        heading: "Gas Laws",
        formulas: [
          { name: "Ideal gas", expression: "PV = nRT" },
          { name: "Boyle's law", expression: "P₁V₁ = P₂V₂" },
          { name: "Charles's law", expression: "V₁/T₁ = V₂/T₂" },
          { name: "Combined", expression: "P₁V₁/T₁ = P₂V₂/T₂" },
        ],
      },
      {
        heading: "pH & Energy",
        formulas: [
          { name: "pH", expression: "pH = −log[H⁺]" },
          { name: "Kw", expression: "Kw = [H⁺][OH⁻] = 1×10⁻¹⁴" },
          { name: "Heat", expression: "q = mcΔT" },
        ],
      },
    ],
  },
  {
    id: "biology",
    name: "Biology",
    emoji: "🧬",
    sections: [
      {
        heading: "Cellular",
        formulas: [
          { name: "Magnification", expression: "M = image size / actual size" },
          { name: "Photosynthesis", expression: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂" },
          { name: "Respiration", expression: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP" },
        ],
      },
      {
        heading: "Genetics & Ecology",
        formulas: [
          { name: "Hardy-Weinberg", expression: "p² + 2pq + q² = 1" },
          { name: "Allele freq", expression: "p + q = 1" },
          { name: "Population growth", expression: "dN/dt = rN" },
          { name: "BMI", expression: "BMI = mass(kg) / height(m)²" },
        ],
      },
    ],
  },
  {
    id: "business",
    name: "Business & Economics",
    emoji: "📊",
    sections: [
      {
        heading: "Accounting",
        formulas: [
          { name: "Profit", expression: "Profit = Revenue − Cost" },
          { name: "Gross margin", expression: "GM% = (Revenue − COGS) / Revenue × 100" },
          { name: "Markup", expression: "Markup% = (Price − Cost) / Cost × 100" },
          { name: "Break-even", expression: "BE = Fixed / (Price − Variable)" },
        ],
      },
      {
        heading: "Finance",
        formulas: [
          { name: "Simple interest", expression: "I = PRT" },
          { name: "Compound interest", expression: "A = P(1 + r/n)^(nt)" },
          { name: "Present value", expression: "PV = FV / (1 + r)ⁿ" },
        ],
      },
    ],
  },
  {
    id: "geography",
    name: "Geography",
    emoji: "🌍",
    sections: [
      {
        heading: "Climate & Stats",
        formulas: [
          { name: "Population density", expression: "Density = Population / Area" },
          { name: "Birth rate", expression: "BR = (Births / Population) × 1000" },
          { name: "Mean rainfall", expression: "x̄ = Σx / n" },
          { name: "Map scale distance", expression: "Real = Map × Scale" },
        ],
      },
    ],
  },
];
