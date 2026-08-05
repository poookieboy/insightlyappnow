import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Target, TrendingUp, Sparkles, Loader2,
  CheckCircle2, FolderOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore, uid, type ExamResult, type Goal } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/exams")({
  component: () => (
    <RequireProfile>
      <ExamsPage />
    </RequireProfile>
  ),
});

function ExamsPage() {
  return (
    <AppShell>
      <div className="mb-3 flex items-center justify-between">
        <Link to="/home" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Home
        </Link>
      </div>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
        <TrendingUp className="h-6 w-6 text-primary" /> Exam Analysis
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Log results, get AI feedback, track progress, set goals.
      </p>

      <Tabs defaultValue="add" className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add">Add</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="add"><AddExam /></TabsContent>
        <TabsContent value="history"><History /></TabsContent>
        <TabsContent value="goals"><Goals /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

export const EXAM_CATEGORIES = [
  "CAT 1",
  "CAT 2",
  "CAT 3",
  "Midterm",
  "End Term",
  "Mock Exam",
  "Other",
] as const;

function AddExam() {
  const { state, update } = useStore();
  const profile = state.profile!;
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<string>("CAT 1");
  const [rows, setRows] = useState<{ subject: string; score: string; outOf: string }[]>([
    { subject: "Mathematics", score: "", outOf: "100" },
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const addRow = () => setRows((r) => [...r, { subject: "", score: "", outOf: "100" }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const setRow = (i: number, field: keyof typeof rows[number], v: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: v } : row)));

  const activeGoal = state.goals.find((g) => !g.done)?.title;

  const save = async () => {
    const cleaned = rows
      .filter((r) => r.subject.trim() && r.score.trim())
      .map((r) => ({
        subject: r.subject.trim(),
        score: parseFloat(r.score),
        outOf: parseFloat(r.outOf) || 100,
      }))
      .filter((r) => !isNaN(r.score) && r.outOf > 0);
    if (cleaned.length === 0) { toast.error("Add at least one subject + score"); return; }

    setLoading(true);
    let feedback = "";
    try {
      const { data, error } = await supabase.functions.invoke("ai-exam", {
        body: {
          results: cleaned,
          grade: profile.grade,
          curriculum: profile.curriculum,
          goal: activeGoal,
          notes,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      feedback = data.content ?? "";
    } catch (e: any) {
      toast.error(e?.message || "AI feedback failed — result still saved");
    }

    const result: ExamResult = {
      id: uid(),
      date: new Date().toISOString(),
      label: label.trim() || `${category} — ${new Date().toLocaleDateString()}`,
      category,
      subjects: cleaned,
      feedback,
    };
    update((s) => ({ ...s, examResults: [result, ...s.examResults] }));
    setLoading(false);
    setLabel(""); setRows([{ subject: "", score: "", outOf: "100" }]); setNotes("");
    toast.success(`Saved to ${category} ✨`);
  };

  return (
    <div className="mt-3 space-y-3">
      <Card className="p-4">
        <label className="mb-1 block text-xs font-medium">Exam name</label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Mid-term 2, Mock Paper 1" />
        <label className="mb-1 mt-3 block text-xs font-medium">Folder</label>
        <div className="flex flex-wrap gap-1.5">
          {EXAM_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all active:scale-95 ${
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>


      <Card className="space-y-2 p-4">
        <div className="mb-1 grid grid-cols-[1fr_60px_60px_auto] gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
          <span>Subject</span><span className="text-center">Score</span><span className="text-center">Out of</span><span></span>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_60px_auto] gap-2">
            <Input value={row.subject} onChange={(e) => setRow(i, "subject", e.target.value)} placeholder="Subject" />
            <Input value={row.score} onChange={(e) => setRow(i, "score", e.target.value)} placeholder="0" inputMode="decimal" className="text-center" />
            <Input value={row.outOf} onChange={(e) => setRow(i, "outOf", e.target.value)} inputMode="decimal" className="text-center" />
            <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="h-9 w-9">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addRow} className="w-full">
          <Plus className="mr-1 h-4 w-4" /> Add subject
        </Button>
      </Card>

      <Card className="p-4">
        <label className="mb-1 block text-xs font-medium">Notes (optional)</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything you want Iris to know — e.g. 'I struggled with algebra'" />
      </Card>

      <Button onClick={save} disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
        {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analysing…</> : <><Sparkles className="mr-1 h-4 w-4" /> Save & analyse</>}
      </Button>
    </div>
  );
}

function pctOf(r: ExamResult) {
  const total = r.subjects.reduce((a, b) => a + b.score, 0);
  const outOf = r.subjects.reduce((a, b) => a + b.outOf, 0);
  return { total, outOf, pct: Math.round((total / Math.max(1, outOf)) * 100) };
}

function History() {
  const { state, update } = useStore();
  const items = state.examResults;
  const [folder, setFolder] = useState<string | null>(null);

  const remove = (id: string) => {
    if (!confirm("Delete this exam result?")) return;
    update((s) => ({ ...s, examResults: s.examResults.filter((r) => r.id !== id) }));
  };

  if (items.length === 0) {
    return <p className="mt-6 text-center text-sm text-muted-foreground">No exam results yet. Add one on the first tab.</p>;
  }

  // Group into folders
  const folders = new Map<string, ExamResult[]>();
  for (const r of items) {
    const key = r.category || "Other";
    if (!folders.has(key)) folders.set(key, []);
    folders.get(key)!.push(r);
  }
  const ordered = Array.from(folders.entries()).sort((a, b) => {
    const ia = EXAM_CATEGORIES.indexOf(a[0] as never);
    const ib = EXAM_CATEGORIES.indexOf(b[0] as never);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  // ---- Folder list view ----
  if (!folder) {
    return (
      <div className="mt-3 space-y-3">
        <SubjectTrends items={items} />
        {ordered.map(([name, list]) => {
          const avg = Math.round(list.reduce((a, r) => a + pctOf(r).pct, 0) / list.length);
          const best = [...list].sort((a, b) => pctOf(b).pct - pctOf(a).pct)[0];
          const tone = avg >= 70 ? "text-emerald-600" : avg >= 50 ? "text-amber-600" : "text-rose-600";
          return (
            <button
              key={name}
              onClick={() => setFolder(name)}
              className="w-full text-left transition-transform active:scale-[0.99]"
            >
              <Card className="flex items-center gap-3 p-4 hover:border-primary/50">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {list.length} {list.length === 1 ? "record" : "records"} · best {pctOf(best).pct}% ({best.label})
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${tone}`}>{avg}%</p>
                  <p className="text-[10px] text-muted-foreground">average</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Card>
            </button>
          );
        })}
      </div>
    );
  }

  // ---- Inside a folder ----
  const list = folders.get(folder) ?? [];
  const avg = list.length ? Math.round(list.reduce((a, r) => a + pctOf(r).pct, 0) / list.length) : 0;

  return (
    <div className="mt-3 space-y-3">
      <button
        onClick={() => setFolder(null)}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> All folders
      </button>

      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="font-display text-lg font-bold">{folder}</p>
          <p className="text-[11px] text-muted-foreground">{list.length} records logged</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{avg}%</p>
          <p className="text-[10px] text-muted-foreground">folder average</p>
        </div>
      </Card>

      <SubjectTrends items={list} />

      {list.map((r) => {
        const { total, outOf, pct } = pctOf(r);
        return (
          <Card key={r.id} className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{r.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(r.date).toLocaleDateString()} · {pct}% overall ({total}/{outOf})
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {r.subjects.map((s, i) => {
                const p = Math.round((s.score / Math.max(1, s.outOf)) * 100);
                const color = p >= 70 ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                  : p >= 50 ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                  : "bg-rose-500/15 text-rose-700 border-rose-500/30";
                return (
                  <span key={i} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
                    {s.subject}: {p}%
                  </span>
                );
              })}
            </div>
            {r.feedback && (
              <div className="prose prose-sm max-w-none rounded-lg border bg-muted/30 p-3 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.feedback}</ReactMarkdown>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function SubjectTrends({ items }: { items: ExamResult[] }) {
  const perSubject = new Map<string, { date: string; pct: number }[]>();
  for (const r of [...items].reverse()) {
    for (const s of r.subjects) {
      const pct = Math.round((s.score / Math.max(1, s.outOf)) * 100);
      if (!perSubject.has(s.subject)) perSubject.set(s.subject, []);
      perSubject.get(s.subject)!.push({ date: r.date, pct });
    }
  }
  if (perSubject.size < 2) return null;

  return (
    <Card className="p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject trends</p>
      <div className="space-y-1.5">
        {Array.from(perSubject.entries()).map(([subject, pts]) => {
          const first = pts[0].pct, last = pts[pts.length - 1].pct;
          const delta = last - first;
          return (
            <div key={subject} className="flex items-center gap-2 text-xs">
              <span className="w-28 truncate">{subject}</span>
              <div className="flex h-4 flex-1 gap-0.5">
                {pts.map((p, i) => (
                  <div key={i} className="flex-1 rounded bg-primary/20" style={{ height: `${Math.max(10, p.pct)}%`, alignSelf: "flex-end" }} title={`${p.pct}%`} />
                ))}
              </div>
              <span className="w-10 text-right font-semibold">{last}%</span>
              <span className={`w-10 text-right text-[10px] ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {delta >= 0 ? "+" : ""}{delta}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}


function Goals() {
  const { state, update } = useStore();
  const [title, setTitle] = useState("");
  const [targetPercent, setTargetPercent] = useState("80");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");

  const add = () => {
    if (!title.trim()) return toast.error("Name your goal");
    const g: Goal = {
      id: uid(),
      title: title.trim(),
      targetPercent: parseInt(targetPercent, 10) || 80,
      subject: subject.trim() || undefined,
      deadline: deadline || undefined,
      createdAt: new Date().toISOString(),
    };
    update((s) => ({ ...s, goals: [g, ...s.goals] }));
    setTitle(""); setSubject(""); setDeadline("");
    toast.success("Goal added 🎯");
  };

  const toggle = (id: string) => update((s) => ({
    ...s, goals: s.goals.map((g) => g.id === id ? { ...g, done: !g.done } : g),
  }));
  const remove = (id: string) => update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));

  // progress calc from latest exam per subject
  const latestBySubject = new Map<string, number>();
  const sorted = [...state.examResults].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const r of sorted) {
    for (const s of r.subjects) {
      if (!latestBySubject.has(s.subject)) {
        latestBySubject.set(s.subject, Math.round((s.score / Math.max(1, s.outOf)) * 100));
      }
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <Card className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <Target className="h-3 w-3" /> New goal
        </p>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Score 85% in Math by mid-term" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" />
          <Input value={targetPercent} onChange={(e) => setTargetPercent(e.target.value)} type="number" placeholder="Target %" />
        </div>
        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <Button onClick={add} className="w-full bg-gradient-primary text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Add goal
        </Button>
      </Card>

      {state.goals.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No goals yet.</p>
      ) : (
        <div className="space-y-2">
          {state.goals.map((g) => {
            const latest = g.subject ? latestBySubject.get(g.subject) : undefined;
            const progress = latest !== undefined ? Math.min(100, Math.round((latest / g.targetPercent) * 100)) : null;
            return (
              <Card key={g.id} className={`p-3 ${g.done ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-2">
                  <button onClick={() => toggle(g.id)} className="mt-0.5 shrink-0">
                    <CheckCircle2 className={`h-5 w-5 ${g.done ? "fill-primary text-primary-foreground" : "text-muted-foreground"}`} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${g.done ? "line-through" : ""}`}>{g.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Target {g.targetPercent}%{g.subject ? ` · ${g.subject}` : ""}
                      {g.deadline ? ` · by ${new Date(g.deadline).toLocaleDateString()}` : ""}
                    </p>
                    {progress !== null && (
                      <div className="mt-1.5">
                        <div className="h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Current: {latest}% · {progress}% of target
                        </p>
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(g.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
