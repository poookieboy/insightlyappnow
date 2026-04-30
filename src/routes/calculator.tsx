import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, BookOpen, ChevronLeft, Delete } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/calculator")({
  component: () => (
    <RequireProfile>
      <CalculatorPage />
    </RequireProfile>
  ),
});

function CalculatorPage() {
  return (
    <AppShell>
      <div className="mb-3 flex items-center justify-between">
        <Link to="/home" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Home
        </Link>
      </div>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
        <Calculator className="h-6 w-6 text-primary" /> Scientific Calculator
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">Casio-style. With conversions and 4-figure tables.</p>

      <Tabs defaultValue="calc" className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calc">Calc</TabsTrigger>
          <TabsTrigger value="convert">Convert</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
        </TabsList>
        <TabsContent value="calc"><SciCalc /></TabsContent>
        <TabsContent value="convert"><Converter /></TabsContent>
        <TabsContent value="tables"><FourFigureTables /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

// ============================================================
// Scientific calculator
// ============================================================
function SciCalc() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string>("");
  const [angleMode, setAngleMode] = useState<"deg" | "rad">("deg");
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<{ e: string; r: string }[]>([]);

  const append = (s: string) => setExpr((e) => e + s);
  const back = () => setExpr((e) => e.slice(0, -1));
  const clear = () => { setExpr(""); setResult(""); };

  const compute = () => {
    try {
      const value = evaluate(expr, angleMode);
      const r = formatResult(value);
      setResult(r);
      setHistory((h) => [{ e: expr, r }, ...h].slice(0, 12));
    } catch (err: any) {
      setResult("Error");
      toast.error(err?.message || "Couldn't evaluate");
    }
  };

  const keys: { label: string; onClick: () => void; cls?: string }[][] = [
    [
      { label: "sin", onClick: () => append("sin(") },
      { label: "cos", onClick: () => append("cos(") },
      { label: "tan", onClick: () => append("tan(") },
      { label: "π", onClick: () => append("pi") },
      { label: "e", onClick: () => append("e") },
    ],
    [
      { label: "ln", onClick: () => append("ln(") },
      { label: "log", onClick: () => append("log(") },
      { label: "√", onClick: () => append("sqrt(") },
      { label: "x²", onClick: () => append("^2") },
      { label: "^", onClick: () => append("^") },
    ],
    [
      { label: "(", onClick: () => append("(") },
      { label: ")", onClick: () => append(")") },
      { label: "!", onClick: () => append("!") },
      { label: "%", onClick: () => append("%") },
      { label: "←", onClick: back, cls: "bg-muted" },
    ],
    [
      { label: "7", onClick: () => append("7") },
      { label: "8", onClick: () => append("8") },
      { label: "9", onClick: () => append("9") },
      { label: "÷", onClick: () => append("/") },
      { label: "C", onClick: clear, cls: "bg-destructive/10 text-destructive" },
    ],
    [
      { label: "4", onClick: () => append("4") },
      { label: "5", onClick: () => append("5") },
      { label: "6", onClick: () => append("6") },
      { label: "×", onClick: () => append("*") },
      { label: "M+", onClick: () => { setMemory((m) => m + (parseFloat(result) || 0)); toast.success("Added to memory"); } },
    ],
    [
      { label: "1", onClick: () => append("1") },
      { label: "2", onClick: () => append("2") },
      { label: "3", onClick: () => append("3") },
      { label: "−", onClick: () => append("-") },
      { label: "MR", onClick: () => append(String(memory)) },
    ],
    [
      { label: "0", onClick: () => append("0") },
      { label: ".", onClick: () => append(".") },
      { label: "±", onClick: () => setExpr((e) => (e.startsWith("-") ? e.slice(1) : "-" + e)) },
      { label: "+", onClick: () => append("+") },
      { label: "=", onClick: compute, cls: "bg-gradient-primary text-primary-foreground" },
    ],
  ];

  return (
    <Card className="mt-3 p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Mode</span>
          <div className="flex rounded-md border text-[11px]">
            <button
              onClick={() => setAngleMode("deg")}
              className={"px-2 py-0.5 " + (angleMode === "deg" ? "bg-primary text-primary-foreground rounded-l" : "")}
            >DEG</button>
            <button
              onClick={() => setAngleMode("rad")}
              className={"px-2 py-0.5 " + (angleMode === "rad" ? "bg-primary text-primary-foreground rounded-r" : "")}
            >RAD</button>
          </div>
        </div>
        <span className="text-muted-foreground">M: {memory}</span>
      </div>
      <div className="mb-3 rounded-xl bg-muted/60 p-3">
        <div className="min-h-[20px] break-all text-right font-mono text-sm text-muted-foreground">{expr || "0"}</div>
        <div className="min-h-[32px] break-all text-right font-mono text-2xl font-bold">{result || ""}</div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {keys.flat().map((k, i) => (
          <button
            key={i}
            onClick={k.onClick}
            className={`rounded-lg border px-1 py-2.5 text-sm font-medium active:scale-95 hover:bg-muted ${k.cls ?? ""}`}
          >
            {k.label}
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">History</p>
          <div className="space-y-0.5 text-xs font-mono">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between gap-2 rounded px-2 py-1 hover:bg-muted">
                <span className="truncate text-muted-foreground">{h.e}</span>
                <span className="font-semibold">= {h.r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// Safe-ish math evaluator supporting sin/cos/tan/ln/log/sqrt/^/!/%/pi/e
function evaluate(rawIn: string, angleMode: "deg" | "rad"): number {
  if (!rawIn.trim()) return 0;
  let s = rawIn;
  // unicode to ascii
  s = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "pi");
  // factorial n! -> fact(n) ; handle parentheses & numbers
  s = s.replace(/(\d+(?:\.\d+)?|\([^()]*\))!/g, "fact($1)");
  // percent -> /100 when trailing
  s = s.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  // caret power -> **
  s = s.replace(/\^/g, "**");
  // constants
  s = s.replace(/\bpi\b/g, "PI").replace(/\be\b/g, "E");

  // Whitelist tokens
  if (!/^[0-9+\-*/().,\s PIEfactsincoataqrlgn]+$/i.test(s)) {
    throw new Error("Invalid characters");
  }

  const trig = (fn: (x: number) => number) => (x: number) => fn(angleMode === "deg" ? (x * Math.PI) / 180 : x);
  const atrig = (fn: (x: number) => number) => (x: number) => angleMode === "deg" ? (fn(x) * 180) / Math.PI : fn(x);
  const ctx = {
    sin: trig(Math.sin), cos: trig(Math.cos), tan: trig(Math.tan),
    asin: atrig(Math.asin), acos: atrig(Math.acos), atan: atrig(Math.atan),
    ln: Math.log, log: Math.log10, sqrt: Math.sqrt,
    fact: (n: number) => { if (n < 0 || !Number.isFinite(n)) return NaN; let f = 1; for (let i = 2; i <= Math.floor(n); i++) f *= i; return f; },
    PI: Math.PI, E: Math.E,
  };

  // eslint-disable-next-line no-new-func
  const fn = new Function(...Object.keys(ctx), `"use strict"; return (${s});`);
  const out = fn(...Object.values(ctx));
  if (typeof out !== "number" || !Number.isFinite(out)) throw new Error("Not a number");
  return out;
}

function formatResult(n: number): string {
  if (Object.is(n, -0)) n = 0;
  if (Math.abs(n) > 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(6);
  return String(parseFloat(n.toFixed(10)));
}

// ============================================================
// Unit converter
// ============================================================
const UNITS: Record<string, { name: string; units: Record<string, number> }> = {
  length: {
    name: "Length",
    units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
  },
  mass: {
    name: "Mass",
    units: { mg: 0.000001, g: 0.001, kg: 1, t: 1000, oz: 0.0283495, lb: 0.453592 },
  },
  volume: {
    name: "Volume",
    units: { ml: 0.001, l: 1, "m³": 1000, cup: 0.2366, pt: 0.4732, gal: 3.7854 },
  },
  time: {
    name: "Time",
    units: { s: 1, min: 60, h: 3600, day: 86400, week: 604800 },
  },
  area: {
    name: "Area",
    units: { "mm²": 1e-6, "cm²": 1e-4, "m²": 1, ha: 10000, "km²": 1e6, acre: 4046.86 },
  },
  speed: {
    name: "Speed",
    units: { "m/s": 1, "km/h": 0.2777778, "mph": 0.44704, knot: 0.514444 },
  },
};

function Converter() {
  const [category, setCategory] = useState("length");
  const unitList = Object.keys(UNITS[category].units);
  const [from, setFrom] = useState(unitList[0]);
  const [to, setTo] = useState(unitList[1]);
  const [value, setValue] = useState("1");

  const num = parseFloat(value);
  const out = isNaN(num)
    ? ""
    : formatResult((num * UNITS[category].units[from]) / UNITS[category].units[to]);

  const changeCat = (c: string) => {
    setCategory(c);
    const list = Object.keys(UNITS[c].units);
    setFrom(list[0]);
    setTo(list[1] ?? list[0]);
  };

  return (
    <Card className="mt-3 p-4">
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium">Category</label>
        <Select value={category} onValueChange={changeCat}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(UNITS).map(([k, v]) => <SelectItem key={k} value={k}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">From</label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(UNITS[category].units).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">To</label>
          <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 font-mono text-sm">
            {out || "—"}
          </div>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(UNITS[category].units).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// Four-figure mathematical tables (CBC style)
// ============================================================
type TableKind = "log" | "antilog" | "sin" | "cos" | "tan" | "sqrt" | "square";
function FourFigureTables() {
  const [kind, setKind] = useState<TableKind>("log");

  const { headers, rows, caption } = buildTable(kind);

  return (
    <Card className="mt-3 p-3">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <Select value={kind} onValueChange={(v) => setKind(v as TableKind)}>
          <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="log">Logarithms</SelectItem>
            <SelectItem value="antilog">Antilogarithms</SelectItem>
            <SelectItem value="sin">Sines (deg)</SelectItem>
            <SelectItem value="cos">Cosines (deg)</SelectItem>
            <SelectItem value="tan">Tangents (deg)</SelectItem>
            <SelectItem value="sqrt">Square roots</SelectItem>
            <SelectItem value="square">Squares</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground">{caption}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-right font-mono text-[11px]">
          <thead>
            <tr className="bg-muted/60">
              <th className="sticky left-0 bg-muted/60 px-2 py-1 text-left">x</th>
              {headers.map((h) => <th key={h} className="px-1.5 py-1">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-muted/20" : ""}>
                <th className="sticky left-0 bg-background px-2 py-1 text-left font-semibold">{r.label}</th>
                {r.values.map((v, j) => <td key={j} className="px-1.5 py-1">{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function buildTable(kind: TableKind): { headers: string[]; rows: { label: string; values: string[] }[]; caption: string } {
  switch (kind) {
    case "log": {
      const headers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const rows = [];
      for (let a = 10; a <= 99; a++) {
        const values = headers.map((h) => {
          const x = a + parseInt(h, 10) / 10;
          return Math.log10(x).toFixed(4).slice(2);
        });
        rows.push({ label: (a / 10).toFixed(1), values });
      }
      return { headers, rows, caption: "log x — 4-figure (read digits after decimal)." };
    }
    case "antilog": {
      const headers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const rows = [];
      for (let a = 0; a <= 99; a++) {
        const values = headers.map((h) => {
          const x = a / 100 + parseInt(h, 10) / 1000;
          return (Math.pow(10, x) * 1000).toFixed(0);
        });
        rows.push({ label: "." + String(a).padStart(2, "0"), values });
      }
      return { headers, rows, caption: "antilog — result × 10⁻³ to get actual mantissa" };
    }
    case "sin":
    case "cos":
    case "tan": {
      const fn = kind === "sin" ? Math.sin : kind === "cos" ? Math.cos : Math.tan;
      const headers = ["0'", "6'", "12'", "18'", "24'", "30'", "36'", "42'", "48'", "54'"];
      const rows = [];
      for (let d = 0; d <= 89; d++) {
        const values = headers.map((h) => {
          const min = parseInt(h, 10);
          const x = ((d + min / 60) * Math.PI) / 180;
          const v = fn(x);
          return Math.abs(v) > 1000 ? "∞" : v.toFixed(4);
        });
        rows.push({ label: `${d}°`, values });
      }
      return { headers, rows, caption: `${kind}(θ) — θ in degrees ° with minutes '` };
    }
    case "sqrt": {
      const headers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const rows = [];
      for (let a = 10; a <= 99; a++) {
        const values = headers.map((h) => {
          const x = a + parseInt(h, 10) / 10;
          return Math.sqrt(x).toFixed(4);
        });
        rows.push({ label: (a / 10).toFixed(1), values });
      }
      return { headers, rows, caption: "√x — x from 1.0 to 9.99" };
    }
    case "square": {
      const headers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const rows = [];
      for (let a = 10; a <= 99; a++) {
        const values = headers.map((h) => {
          const x = a + parseInt(h, 10) / 10;
          return (x * x).toFixed(2);
        });
        rows.push({ label: (a / 10).toFixed(1), values });
      }
      return { headers, rows, caption: "x² — x from 1.0 to 9.99" };
    }
  }
}
