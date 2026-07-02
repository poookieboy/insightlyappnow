// Subject Quiz — 10 MCQ + 10 written questions with pre-submit metadata and AI marking.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2, Clock, Target, BookOpen, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { CollapsibleAIResponse } from "@/components/CollapsibleAIResponse";

export const Route = createFileRoute("/quiz")({
  component: () => (
    <RequireProfile>
      <Quiz />
    </RequireProfile>
  ),
});

interface MCQ { id: string; question: string; options: string[]; correctIndex: number; topic?: string }
interface Written { id: string; question: string; modelAnswer: string; marks: number; topic?: string }
interface QuizPayload {
  difficulty: string;
  estimatedMinutes: number;
  topicsCovered: string[];
  mcq: MCQ[];
  written: Written[];
}

type Phase = "setup" | "loading" | "preview" | "taking" | "marking" | "results";

const SUBJECT_LIST: Record<string, string[]> = {
  primary: ["Mathematics", "English", "Kiswahili", "Science & Technology", "Social Studies", "CRE", "Creative Arts"],
  lower: ["Mathematics", "English", "Kiswahili", "Integrated Science", "Social Studies", "CRE", "Pre-Technical Studies", "Agriculture"],
  upper: ["Mathematics", "English", "Kiswahili", "Integrated Science", "Social Studies", "CRE", "Pre-Technical Studies", "Agriculture", "Business Studies"],
  senior: ["Mathematics", "English", "Kiswahili", "Biology", "Chemistry", "Physics", "Geography", "History", "Business Studies", "CRE"],
};

function subjectsFor(grade: string) {
  const n = parseInt(grade.replace(/\D/g, ""), 10) || 0;
  if (n <= 5) return SUBJECT_LIST.primary;
  if (n <= 8) return SUBJECT_LIST.lower;
  if (n <= 10) return SUBJECT_LIST.upper;
  return SUBJECT_LIST.senior;
}

function Quiz() {
  const navigate = useNavigate();
  const { state } = useStore();
  const profile = state.profile;
  const [phase, setPhase] = useState<Phase>("setup");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<string, string>>({});
  const [marks, setMarks] = useState<Record<string, { score: number; outOf: number; correct: boolean; feedback: string; improvementTip?: string }>>({});
  const [markingIdx, setMarkingIdx] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const subjects = useMemo(() => (profile ? subjectsFor(profile.grade) : []), [profile]);

  useEffect(() => {
    if (phase !== "taking") return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  async function generate() {
    if (!subject || !profile) return toast.error("Pick a subject first");
    setPhase("loading");
    try {
      const { data, error } = await supabase.functions.invoke("ai-quiz", {
        body: { action: "generate", subject, grade: profile.grade, curriculum: profile.curriculum, difficulty },
      });
      if (error) throw error;
      const q = data.quiz as QuizPayload;
      if (!q?.mcq?.length || !q?.written?.length) throw new Error("Quiz generation failed");
      setQuiz(q);
      setPhase("preview");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate quiz");
      setPhase("setup");
    }
  }

  function startTaking() {
    startedAtRef.current = Date.now();
    setElapsed(0);
    setPhase("taking");
  }

  async function submit() {
    if (!quiz || !profile) return;
    setPhase("marking");
    // MCQ auto-mark
    let mcqScore = 0;
    for (const m of quiz.mcq) if (mcqAnswers[m.id] === m.correctIndex) mcqScore++;

    // Written AI mark
    const wMarks: typeof marks = {};
    for (let i = 0; i < quiz.written.length; i++) {
      setMarkingIdx(i + 1);
      const w = quiz.written[i];
      const ans = (writtenAnswers[w.id] || "").trim();
      if (!ans) {
        wMarks[w.id] = { score: 0, outOf: 5, correct: false, feedback: "No answer provided." };
        continue;
      }
      try {
        const { data, error } = await supabase.functions.invoke("ai-quiz", {
          body: { action: "mark", question: w.question, modelAnswer: w.modelAnswer, studentAnswer: ans, subject, grade: profile.grade },
        });
        if (error) throw error;
        wMarks[w.id] = {
          score: Number(data.score ?? 0), outOf: Number(data.outOf ?? 5),
          correct: !!data.correct, feedback: String(data.feedback ?? ""), improvementTip: data.improvementTip,
        };
      } catch {
        wMarks[w.id] = { score: 0, outOf: 5, correct: false, feedback: "Marking error — try again later." };
      }
    }
    setMarks(wMarks);

    // Persist attempt
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id, subject, grade: profile.grade, curriculum: profile.curriculum,
          difficulty: quiz.difficulty, estimated_minutes: quiz.estimatedMinutes,
          topics: quiz.topicsCovered ?? [],
          questions: quiz as any, answers: { mcq: mcqAnswers, written: writtenAnswers } as any,
          mcq_score: mcqScore, mcq_total: quiz.mcq.length,
          written_scores: wMarks as any, feedback: null,
          time_spent_seconds: elapsed,
        });
      }
    } catch { /* non-fatal */ }

    setPhase("results");
  }

  if (!profile) return null;

  return (
    <AppShell>
      <button onClick={() => navigate({ to: "/dashboard" })} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>
      <h1 className="mb-1 text-2xl font-bold">Subject Quiz</h1>
      <p className="mb-5 text-sm text-muted-foreground">10 multiple-choice + 10 written — with AI marking and feedback.</p>

      {phase === "setup" && (
        <Card className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder="Pick a subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} className="w-full bg-gradient-primary text-primary-foreground">Generate Quiz</Button>
        </Card>
      )}

      {phase === "loading" && (
        <Card className="flex flex-col items-center gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Iris is building your quiz…</p>
        </Card>
      )}

      {phase === "preview" && quiz && (
        <Card className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2">
            <MetaTile Icon={Target} label="Difficulty" value={quiz.difficulty} />
            <MetaTile Icon={Clock} label="Est. time" value={`${quiz.estimatedMinutes} min`} />
            <MetaTile Icon={BookOpen} label="Questions" value={`${quiz.mcq.length}+${quiz.written.length}`} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Topics covered</p>
            <div className="flex flex-wrap gap-1">
              {(quiz.topicsCovered ?? []).map((t) => (
                <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            You'll answer 10 multiple-choice and 10 written questions. MCQs are marked instantly; Iris will grade written answers with feedback.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPhase("setup")} className="flex-1">Change</Button>
            <Button onClick={startTaking} className="flex-1 bg-gradient-primary text-primary-foreground">Start</Button>
          </div>
        </Card>
      )}

      {phase === "taking" && quiz && (
        <div className="space-y-4">
          <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-background/80 px-4 py-2 backdrop-blur">
            <span className="text-xs text-muted-foreground">Time: {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
            <Button size="sm" onClick={submit} className="bg-gradient-primary text-primary-foreground">Submit</Button>
          </div>

          <h2 className="text-lg font-semibold">Multiple Choice</h2>
          {quiz.mcq.map((m, i) => (
            <Card key={m.id} className="space-y-2 p-3">
              <p className="text-sm font-medium">{i + 1}. {m.question}</p>
              <div className="grid gap-1">
                {m.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setMcqAnswers((a) => ({ ...a, [m.id]: oi }))}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      mcqAnswers[m.id] === oi ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                ))}
              </div>
            </Card>
          ))}

          <h2 className="pt-2 text-lg font-semibold">Written</h2>
          {quiz.written.map((w, i) => (
            <Card key={w.id} className="space-y-2 p-3">
              <p className="text-sm font-medium">{i + 1}. {w.question} <span className="text-xs text-muted-foreground">({w.marks} marks)</span></p>
              <Textarea
                rows={4}
                value={writtenAnswers[w.id] || ""}
                onChange={(e) => setWrittenAnswers((a) => ({ ...a, [w.id]: e.target.value }))}
                placeholder="Write your answer here…"
              />
            </Card>
          ))}

          <Button onClick={submit} className="w-full bg-gradient-primary text-primary-foreground">Submit Quiz</Button>
        </div>
      )}

      {phase === "marking" && quiz && (
        <Card className="space-y-3 p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Iris is marking your answers…</p>
          <Progress value={(markingIdx / quiz.written.length) * 100} />
          <p className="text-xs text-muted-foreground">{markingIdx} of {quiz.written.length} written questions marked</p>
        </Card>
      )}

      {phase === "results" && quiz && (
        <Results quiz={quiz} mcqAnswers={mcqAnswers} writtenAnswers={writtenAnswers} marks={marks} elapsed={elapsed} onRetry={() => setPhase("setup")} />
      )}
    </AppShell>
  );
}

function MetaTile({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}

function Results({ quiz, mcqAnswers, writtenAnswers, marks, elapsed, onRetry }: {
  quiz: QuizPayload;
  mcqAnswers: Record<string, number>;
  writtenAnswers: Record<string, string>;
  marks: Record<string, { score: number; outOf: number; correct: boolean; feedback: string; improvementTip?: string }>;
  elapsed: number;
  onRetry: () => void;
}) {
  const mcqCorrect = quiz.mcq.filter((m) => mcqAnswers[m.id] === m.correctIndex).length;
  const mcqTotal = quiz.mcq.length;
  const writtenScore = quiz.written.reduce((s, w) => s + (marks[w.id]?.score ?? 0), 0);
  const writtenTotal = quiz.written.length * 5;
  const overallPct = Math.round(((mcqCorrect + writtenScore) / (mcqTotal + writtenTotal)) * 100);

  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-4">
        <h2 className="text-lg font-semibold">Your Results</h2>
        <div className="grid grid-cols-3 gap-2">
          <MetaTile Icon={Target} label="MCQ" value={`${mcqCorrect}/${mcqTotal}`} />
          <MetaTile Icon={BookOpen} label="Written" value={`${writtenScore}/${writtenTotal}`} />
          <MetaTile Icon={Clock} label="Time" value={`${Math.floor(elapsed / 60)}m`} />
        </div>
        <div>
          <p className="mt-2 text-xs text-muted-foreground">Overall</p>
          <Progress value={overallPct} className="h-2" />
          <p className="mt-1 text-right text-xs font-semibold">{overallPct}%</p>
        </div>
      </Card>

      <h3 className="text-sm font-semibold">MCQ Review</h3>
      {quiz.mcq.map((m, i) => {
        const chosen = mcqAnswers[m.id];
        const ok = chosen === m.correctIndex;
        return (
          <Card key={m.id} className="p-3">
            <p className="text-sm font-medium">{i + 1}. {m.question}</p>
            <p className={`mt-1 text-xs ${ok ? "text-emerald-600" : "text-rose-600"}`}>
              {ok ? <CheckCircle2 className="inline h-3.5 w-3.5" /> : <XCircle className="inline h-3.5 w-3.5" />} Your answer: {chosen != null ? m.options[chosen] : "—"}
            </p>
            {!ok && <p className="text-xs text-muted-foreground">Correct: {m.options[m.correctIndex]}</p>}
          </Card>
        );
      })}

      <h3 className="pt-2 text-sm font-semibold">Written Feedback</h3>
      {quiz.written.map((w, i) => {
        const mk = marks[w.id];
        return (
          <Card key={w.id} className="space-y-2 p-3">
            <p className="text-sm font-medium">{i + 1}. {w.question}</p>
            <p className="rounded bg-muted/40 p-2 text-xs whitespace-pre-wrap">{writtenAnswers[w.id] || <em>No answer</em>}</p>
            {mk && (
              <div className="rounded-lg border border-border/60 p-2">
                <p className="text-xs font-semibold">Score: {mk.score}/{mk.outOf}</p>
                <p className="mt-1 text-xs">{mk.feedback}</p>
                {mk.improvementTip && <p className="mt-1 text-xs text-primary">💡 {mk.improvementTip}</p>}
              </div>
            )}
          </Card>
        );
      })}

      <Button onClick={onRetry} className="w-full bg-gradient-primary text-primary-foreground">New Quiz</Button>
    </div>
  );
}
