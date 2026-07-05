import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Sparkles, RotateCcw, Lightbulb,
  CheckCircle2, XCircle, Loader2, Send, BookOpen,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { getSubjects } from "@/lib/revision";
import { evaluateBadges, notifyBadges } from "@/lib/badges";
import { motivation } from "@/lib/motivation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/revision")({
  component: () => (
    <RequireProfile>
      <Revision />
    </RequireProfile>
  ),
});

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-revision`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type View =
  | { kind: "subjects" }
  | { kind: "topics"; subject: string }
  | { kind: "subtopics"; subject: string; topic: string }
  | { kind: "practice"; subject: string; topic: string; subtopic: string };

interface AIQuestion { question: string; modelAnswer: string; hints: string[]; }
interface MarkResult { correct: boolean; score: number; feedback: string; }

async function aiCall<T>(payload: unknown): Promise<T> {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
}

function Revision() {
  const { state, update } = useStore();
  const profile = state.profile!;
  const subjects = useMemo(() => getSubjects(profile.curriculum, profile.grade), [profile]);
  const [view, setView] = useState<View>({ kind: "subjects" });

  if (view.kind === "practice") {
    const subject = subjects.find((s) => s.subject === view.subject);
    const topic = subject?.topics.find((t) => t.name === view.topic);
    const sub = topic?.subtopics.find((st) => st.name === view.subtopic);
    if (!subject || !topic || !sub) { setView({ kind: "subjects" }); return null; }
    return (
      <PracticeSession
        subject={subject.subject}
        topic={topic.name}
        subtopic={sub.name}
        curriculum={profile.curriculum}
        grade={profile.grade}
        onExit={() => setView({ kind: "subtopics", subject: subject.subject, topic: topic.name })}
        onCompletedOne={() => {
          // Track as one revision done — keeps streaks + badges working.
          const qid = `${profile.curriculum}-${profile.grade}-${subject.subject}-${topic.name}-${sub.name}-ai-${Date.now()}`;
          update((s) => {
            const revisionDone = [...s.revisionDone, { questionId: qid, doneAt: new Date().toISOString() }];
            const { next, newly } = evaluateBadges(s.badges, { tasks: s.tasks, revisionDone, notes: s.notes, examResults: s.examResults, goals: s.goals, tutorConversations: s.tutorConversations });
            if (newly.length) setTimeout(() => notifyBadges(newly), 100);
            return { ...s, revisionDone, badges: next };
          });
        }}
      />
    );
  }

  if (view.kind === "subtopics") {
    const subject = subjects.find((s) => s.subject === view.subject);
    const topic = subject?.topics.find((t) => t.name === view.topic);
    if (!subject || !topic) { setView({ kind: "subjects" }); return null; }
    return (
      <AppShell>
        <Crumbs onBack={() => setView({ kind: "topics", subject: subject.subject })}>{subject.subject}</Crumbs>
        <h1 className="mb-1 text-xl font-bold">{topic.name}</h1>
        <p className="mb-4 text-xs text-muted-foreground">Tap a subtopic to start an AI-powered practice session.</p>
        <div className="space-y-2">
          {topic.subtopics.map((st) => (
            <button
              key={st.name}
              onClick={() => setView({ kind: "practice", subject: subject.subject, topic: topic.name, subtopic: st.name })}
              className="w-full text-left"
            >
              <Card className="flex items-center justify-between p-4 transition-all hover:shadow-glow active:scale-[0.98]">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{st.name}</p>
                  <p className="text-xs text-muted-foreground">AI-generated questions · free-form answers</p>
                </div>
                <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
              </Card>
            </button>
          ))}
        </div>
      </AppShell>
    );
  }

  if (view.kind === "topics") {
    const subject = subjects.find((s) => s.subject === view.subject);
    if (!subject) { setView({ kind: "subjects" }); return null; }
    return (
      <AppShell>
        <Crumbs onBack={() => setView({ kind: "subjects" })}>All subjects</Crumbs>
        <div className="mb-4">
          <p className="text-3xl">{subject.emoji}</p>
          <h1 className="mt-1 text-2xl font-bold">{subject.subject}</h1>
          <p className="text-sm text-muted-foreground">{profile.curriculum} · {profile.grade}</p>
        </div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Topics</h2>
        <div className="space-y-2">
          {subject.topics.map((t) => (
            <button
              key={t.name}
              onClick={() => setView({ kind: "subtopics", subject: subject.subject, topic: t.name })}
              className="w-full text-left"
            >
              <Card className="flex items-center justify-between p-4 transition-all hover:shadow-glow active:scale-[0.98]">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.subtopics.length} subtopics</p>
                </div>
                <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
              </Card>
            </button>
          ))}
        </div>
      </AppShell>
    );
  }

  // SUBJECTS
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Revision</h1>
        <p className="text-sm text-muted-foreground">{profile.curriculum} · {profile.grade}</p>
      </div>

      <Card className="mb-5 border-0 bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">AI-powered revision</p>
            <p className="mt-1 text-sm leading-relaxed">
              Pick a subject → topic → subtopic. Iris generates fresh, exam-quality questions tailored to {profile.curriculum} {profile.grade}.
              Write answers in any format — the AI marks them and gives feedback.
            </p>
          </div>
        </div>
      </Card>

      <Link to="/tutor">
        <Card className="mb-5 flex items-center gap-3 border-dashed bg-muted/40 p-3 transition-all hover:shadow-glow">
          <BookOpen className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Want a deeper explanation? Ask Iris</p>
            <p className="text-xs text-muted-foreground">Step-by-step walkthroughs & diagrams</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Subjects</h2>
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((s) => (
          <button
            key={s.subject}
            onClick={() => setView({ kind: "topics", subject: s.subject })}
            className="text-left"
          >
            <Card className="h-full p-4 transition-all hover:shadow-glow active:scale-95">
              <p className="text-3xl">{s.emoji}</p>
              <p className="mt-2 text-sm font-semibold">{s.subject}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.topics.length} topics</p>
            </Card>
          </button>
        ))}
      </div>
    </AppShell>
  );
}

function Crumbs({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onBack}
      className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> {children}
    </button>
  );
}

function PracticeSession({
  subject, topic, subtopic, curriculum, grade, onExit, onCompletedOne,
}: {
  subject: string; topic: string; subtopic: string;
  curriculum: string; grade: string;
  onExit: () => void; onCompletedOne: () => void;
}) {
  const [q, setQ] = useState<AIQuestion | null>(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [answer, setAnswer] = useState("");
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<MarkResult | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = async () => {
    setLoadingQ(true);
    setError(null);
    setAnswer(""); setResult(null); setHint(null); setRevealed(false);
    try {
      const data = await aiCall<AIQuestion>({
        action: "generate",
        subject, topic, subtopic, curriculum, grade,
        difficulty: "medium",
        avoid: recent,
      });
      setQ(data);
      setRecent((r) => [data.question, ...r].slice(0, 5));
    } catch (e: any) {
      setError(e?.message || "Couldn't load a question");
    } finally {
      setLoadingQ(false);
    }
  };

  useEffect(() => { loadQuestion(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = async () => {
    if (!q || !answer.trim()) return;
    setMarking(true);
    try {
      const r = await aiCall<MarkResult>({
        action: "mark",
        question: q.question,
        modelAnswer: q.modelAnswer,
        studentAnswer: answer,
        subject, curriculum, grade,
      });
      setResult(r);
      setStats((s) => ({ answered: s.answered + 1, correct: s.correct + (r.correct ? 1 : 0) }));
      if (r.correct) {
        onCompletedOne();
        setTimeout(() => toast.success(motivation.onRevision()), 100);
      }
    } catch (e: any) {
      toast.error(e?.message || "Marking failed");
    } finally {
      setMarking(false);
    }
  };

  const askHint = async () => {
    if (!q) return;
    setHintLoading(true);
    try {
      const r = await aiCall<{ hint: string }>({
        action: "hint",
        question: q.question,
        modelAnswer: q.modelAnswer,
        studentAnswer: answer || undefined,
      });
      setHint(r.hint || q.hints?.[0] || "Try breaking the problem into smaller steps.");
    } catch {
      setHint(q.hints?.[0] || "Try breaking the problem into smaller steps.");
    } finally {
      setHintLoading(false);
    }
  };

  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;

  return (
    <AppShell>
      <Crumbs onBack={onExit}>{subject} · {topic}</Crumbs>
      <div className="mb-3">
        <h1 className="text-xl font-bold">{subtopic}</h1>
        <p className="text-xs text-muted-foreground">Free-form answers · AI marked</p>
      </div>

      {stats.answered > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <Progress value={accuracy} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground">
            {stats.correct}/{stats.answered} · {accuracy}%
          </span>
        </div>
      )}

      <Card className="p-4">
        {loadingQ ? (
          <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Iris is preparing a question…
          </div>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={loadQuestion} variant="outline" size="sm" className="w-full">
              <RotateCcw className="mr-1 h-4 w-4" /> Retry
            </Button>
          </div>
        ) : q ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{q.question}</p>

            <div className="mt-4 space-y-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer in any format…"
                rows={5}
                disabled={!!result && result.correct}
              />
            </div>

            {hint && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{hint}</p>
              </div>
            )}

            {result && (
              <div className={cn(
                "mt-3 rounded-lg p-3 text-sm",
                result.correct ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
              )}>
                <div className="flex items-center gap-2 font-semibold">
                  {result.correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {result.correct ? "Correct" : "Not quite"} · {result.score}/100
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">{result.feedback}</p>
              </div>
            )}

            {revealed && (
              <div className="mt-3 rounded-lg border border-dashed bg-muted/50 p-3 text-xs">
                <p className="font-semibold">Model answer</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{q.modelAnswer}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!result ? (
                <>
                  <Button
                    onClick={submit}
                    disabled={marking || !answer.trim()}
                    className="flex-1 bg-gradient-primary text-primary-foreground"
                  >
                    {marking ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                    Submit answer
                  </Button>
                  <Button onClick={askHint} variant="outline" size="default" disabled={hintLoading}>
                    {hintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lightbulb className="mr-1 h-4 w-4" /> Stuck?</>}
                  </Button>
                </>
              ) : result.correct ? (
                <Button onClick={loadQuestion} className="flex-1 bg-gradient-primary text-primary-foreground">
                  Next question →
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => { setResult(null); }}
                    variant="outline"
                    className="flex-1"
                  >
                    <RotateCcw className="mr-1 h-4 w-4" /> Try again
                  </Button>
                  {!revealed && (
                    <Button onClick={() => setRevealed(true)} variant="ghost" size="default">
                      Reveal answer
                    </Button>
                  )}
                  <Button onClick={loadQuestion} variant="ghost" size="default">
                    Skip
                  </Button>
                </>
              )}
            </div>
          </>
        ) : null}
      </Card>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Tip: Iris accepts any wording or format — write in your own words.
      </p>
    </AppShell>
  );
}
