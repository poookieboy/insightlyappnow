// External Quiz — loads from external Supabase quiz_questions, saves results to Lovable Cloud quiz_attempts.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { externalSupabase, normalizeQuestion, type QuizQuestion, type QuizQuestionRow } from "@/integrations/external-supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/external-quiz")({
  component: () => (
    <RequireProfile>
      <ExternalQuiz />
    </RequireProfile>
  ),
});

type Phase = "setup" | "loading" | "taking" | "results";

function ExternalQuiz() {
  const navigate = useNavigate();
  const { state } = useStore();
  const profile = state.profile;

  const [phase, setPhase] = useState<Phase>("setup");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState<string>("any");
  const [difficulty, setDifficulty] = useState<string>("any");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [savingResult, setSavingResult] = useState(false);

  // Load filter options
  useEffect(() => {
    (async () => {
      const { data, error } = await externalSupabase
        .from("quiz_questions")
        .select("subject,topic,difficulty");
      if (error) { toast.error("Failed to load subjects: " + error.message); return; }
      const rows = (data ?? []) as { subject: string; topic: string | null; difficulty: string | null }[];
      setSubjects(Array.from(new Set(rows.map((r) => r.subject).filter(Boolean))).sort());
      setTopics(Array.from(new Set(rows.map((r) => r.topic).filter(Boolean) as string[])).sort());
      setDifficulties(Array.from(new Set(rows.map((r) => r.difficulty).filter(Boolean) as string[])).sort());
    })();
  }, []);

  const filteredTopics = useMemo(() => {
    if (!subject) return topics;
    // Refetch topics for subject on the fly (cheap)
    return topics;
  }, [subject, topics]);

  async function startQuiz() {
    if (!subject) { toast.error("Pick a subject"); return; }
    setPhase("loading");
    try {
      let q = externalSupabase.from("quiz_questions").select("*").eq("subject", subject);
      if (topic !== "any") q = q.eq("topic", topic);
      if (difficulty !== "any") q = q.eq("difficulty", difficulty);
      const { data, error } = await q;
      if (error) throw error;
      const rows = ((data ?? []) as QuizQuestionRow[]).map(normalizeQuestion);
      if (!rows.length) { toast.error("No questions match those filters"); setPhase("setup"); return; }
      // Shuffle
      rows.sort(() => Math.random() - 0.5);
      setQuestions(rows);
      setIdx(0);
      setAnswers({});
      setRevealed({});
      setPhase("taking");
    } catch (e: any) {
      toast.error(e.message || "Failed to load questions");
      setPhase("setup");
    }
  }

  function scoreQuestion(q: QuizQuestion): number {
    const given = (answers[String(q.id)] ?? "").trim();
    if (!given) return 0;
    const correct = String(q.correct_answer ?? "").trim();
    const max = Number(q.max ?? 1);
    if (q.type === "multiple_choice") {
      return given === correct ? max : 0;
    }
    // written — case/space insensitive contains match
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    return norm(given) === norm(correct) ? max : 0;
  }

  const totalMax = useMemo(() => questions.reduce((s, q) => s + Number(q.max ?? 1), 0), [questions]);
  const totalScore = useMemo(() => questions.reduce((s, q) => s + scoreQuestion(q), 0), [questions, answers]);
  const pct = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;

  async function finish() {
    setPhase("results");
    // Persist to Lovable Cloud quiz_attempts (best-effort)
    if (!profile) return;
    setSavingResult(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          subject,
          grade: profile.grade,
          curriculum: profile.curriculum,
          difficulty: difficulty === "any" ? "mixed" : difficulty,
          estimated_minutes: null,
          topics: topic === "any" ? [] : [topic],
          questions: questions as any,
          answers: answers as any,
          mcq_score: totalScore,
          mcq_total: totalMax,
          written_scores: {} as any,
          feedback: null,
          time_spent_seconds: null,
        });
      }
    } catch { /* non-fatal */ }
    setSavingResult(false);
  }

  if (!profile) return null;

  const current = questions[idx];

  return (
    <AppShell>
      <button onClick={() => navigate({ to: "/dashboard" })} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>
      <h1 className="mb-1 text-2xl font-bold">Quiz Bank</h1>
      <p className="mb-5 text-sm text-muted-foreground">Questions loaded from your external question bank.</p>

      {phase === "setup" && (
        <Card className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder={subjects.length ? "Pick a subject" : "Loading…"} /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any topic</SelectItem>
                {filteredTopics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any difficulty</SelectItem>
                {difficulties.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={startQuiz} className="w-full bg-gradient-primary text-primary-foreground">Start Quiz</Button>
        </Card>
      )}

      {phase === "loading" && (
        <Card className="flex flex-col items-center gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading questions…</p>
        </Card>
      )}

      {phase === "taking" && current && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Question {idx + 1} of {questions.length}</span>
            <span className="text-xs text-muted-foreground">{current.max} pt{current.max === 1 ? "" : "s"}</span>
          </div>
          <Progress value={((idx + 1) / questions.length) * 100} className="h-1.5" />

          <Card className="space-y-3 p-4">
            <p className="text-sm font-medium">{current.question}</p>

            {current.type === "multiple_choice" ? (
              <div className="grid gap-1">
                {(current.options ?? []).map((opt, oi) => {
                  const chosen = answers[String(current.id)] === opt;
                  const isCorrect = revealed[String(current.id)] && opt === current.correct_answer;
                  const isWrongChoice = revealed[String(current.id)] && chosen && opt !== current.correct_answer;
                  return (
                    <button
                      key={oi}
                      disabled={revealed[String(current.id)]}
                      onClick={() => setAnswers((a) => ({ ...a, [String(current.id)]: opt }))}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        isCorrect ? "border-emerald-500 bg-emerald-500/10"
                        : isWrongChoice ? "border-rose-500 bg-rose-500/10"
                        : chosen ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Textarea
                rows={4}
                value={answers[String(current.id)] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [String(current.id)]: e.target.value }))}
                placeholder="Type your answer…"
                disabled={revealed[String(current.id)]}
              />
            )}

            {!revealed[String(current.id)] ? (
              <Button
                onClick={() => setRevealed((r) => ({ ...r, [String(current.id)]: true }))}
                disabled={!answers[String(current.id)]}
                className="w-full"
              >
                Check answer
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                {(() => {
                  const s = scoreQuestion(current);
                  const ok = s > 0;
                  return (
                    <p className={`flex items-center gap-1 text-xs font-semibold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
                      {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {ok ? `Correct — +${s} pt${s === 1 ? "" : "s"}` : "Incorrect"}
                    </p>
                  );
                })()}
                {current.type === "written" && (
                  <p className="text-xs"><span className="font-semibold">Answer:</span> {current.correct_answer}</p>
                )}
                {current.explanation && (
                  <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Explanation:</span> {current.explanation}</p>
                )}
              </div>
            )}
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)} className="flex-1">
              <ArrowLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            {idx < questions.length - 1 ? (
              <Button onClick={() => setIdx((i) => i + 1)} className="flex-1 bg-gradient-primary text-primary-foreground">
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} className="flex-1 bg-gradient-primary text-primary-foreground">Finish</Button>
            )}
          </div>
        </div>
      )}

      {phase === "results" && (
        <div className="space-y-4">
          <Card className="space-y-2 p-6 text-center">
            <p className="text-sm text-muted-foreground">Final Score</p>
            <p className="text-4xl font-bold">{totalScore}<span className="text-xl text-muted-foreground"> / {totalMax}</span></p>
            <Progress value={pct} className="h-2" />
            <p className="text-sm font-semibold">{pct}%</p>
            {savingResult && <p className="text-xs text-muted-foreground">Saving your result…</p>}
          </Card>

          <h3 className="text-sm font-semibold">Review</h3>
          {questions.map((q, i) => {
            const s = scoreQuestion(q);
            const given = answers[String(q.id)] ?? "";
            const ok = s > 0;
            return (
              <Card key={String(q.id)} className="space-y-1 p-3">
                <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                <p className={`text-xs ${ok ? "text-emerald-600" : "text-rose-600"}`}>
                  Your answer: {given || <em>—</em>}
                </p>
                {!ok && <p className="text-xs text-muted-foreground">Correct: {q.correct_answer}</p>}
                {q.explanation && <p className="text-xs text-muted-foreground italic">{q.explanation}</p>}
                <p className="text-xs font-semibold">{s} / {q.max}</p>
              </Card>
            );
          })}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setPhase("setup"); }} className="flex-1">New Quiz</Button>
            <Button onClick={() => navigate({ to: "/dashboard" })} className="flex-1 bg-gradient-primary text-primary-foreground">Done</Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
