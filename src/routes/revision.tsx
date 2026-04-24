import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, ChevronLeft, FileText, ChevronRight, Sparkles, Trophy, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { getSubjects, getAllQuestions, type SubjectPack, type Topic, type Subtopic, type Question } from "@/lib/revision";
import { evaluateBadges, notifyBadges } from "@/lib/badges";
import { motivation } from "@/lib/motivation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/revision")({
  component: () => (
    <RequireProfile>
      <Revision />
    </RequireProfile>
  ),
});

type View =
  | { kind: "subjects" }
  | { kind: "topics"; subject: string }
  | { kind: "subtopics"; subject: string; topic: string }
  | { kind: "questions"; subject: string; topic: string; subtopic: string }
  | { kind: "test"; subject: string };

function Revision() {
  const { state, update } = useStore();
  const profile = state.profile!;
  const subjects = useMemo(
    () => getSubjects(profile.curriculum, profile.grade),
    [profile],
  );
  const doneIds = new Set(state.revisionDone.map((r) => r.questionId));
  const [view, setView] = useState<View>({ kind: "subjects" });
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const markDone = (qid: string) => {
    if (doneIds.has(qid)) return;
    update((s) => {
      const revisionDone = [
        ...s.revisionDone,
        { questionId: qid, doneAt: new Date().toISOString() },
      ];
      const { next, newly } = evaluateBadges(s.badges, { tasks: s.tasks, revisionDone });
      if (newly.length) setTimeout(() => notifyBadges(newly), 100);
      setTimeout(() => toast.success(motivation.onRevision()), 100);
      return { ...s, revisionDone, badges: next };
    });
  };

  const reset = () => update((s) => ({ ...s, revisionDone: [] }));

  const toggleReveal = (id: string) =>
    setRevealed((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const totals = useMemo(() => {
    const all = subjects.flatMap((s) => getAllQuestions(s));
    return { total: all.length, done: all.filter((q) => doneIds.has(q.id)).length };
  }, [subjects, doneIds]);

  // ---- TEST MODE ----
  if (view.kind === "test") {
    const subject = subjects.find((s) => s.subject === view.subject);
    if (!subject) { setView({ kind: "subjects" }); return null; }
    return (
      <SubjectTest
        subject={subject}
        onExit={() => setView({ kind: "topics", subject: subject.subject })}
      />
    );
  }

  // ---- QUESTIONS (subtopic) ----
  if (view.kind === "questions") {
    const subject = subjects.find((s) => s.subject === view.subject);
    const topic = subject?.topics.find((t) => t.name === view.topic);
    const sub = topic?.subtopics.find((st) => st.name === view.subtopic);
    if (!subject || !topic || !sub) { setView({ kind: "subjects" }); return null; }
    const subDone = sub.questions.filter((q) => doneIds.has(q.id)).length;

    return (
      <AppShell>
        <Crumbs onBack={() => setView({ kind: "subtopics", subject: subject.subject, topic: topic.name })}>
          {subject.subject} · {topic.name}
        </Crumbs>
        <h1 className="text-xl font-bold">{sub.name}</h1>
        <div className="mt-2 mb-4 flex items-center gap-3">
          <Progress value={(subDone / sub.questions.length) * 100} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground">{subDone}/{sub.questions.length}</span>
        </div>

        <div className="space-y-3">
          {sub.questions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              done={doneIds.has(q.id)}
              open={revealed.has(q.id)}
              onToggle={() => toggleReveal(q.id)}
              onDone={() => markDone(q.id)}
            />
          ))}
        </div>
      </AppShell>
    );
  }

  // ---- SUBTOPICS ----
  if (view.kind === "subtopics") {
    const subject = subjects.find((s) => s.subject === view.subject);
    const topic = subject?.topics.find((t) => t.name === view.topic);
    if (!subject || !topic) { setView({ kind: "subjects" }); return null; }
    return (
      <AppShell>
        <Crumbs onBack={() => setView({ kind: "topics", subject: subject.subject })}>
          {subject.subject}
        </Crumbs>
        <h1 className="mb-4 text-xl font-bold">{topic.name}</h1>
        <div className="space-y-2">
          {topic.subtopics.map((st) => {
            const done = st.questions.filter((q) => doneIds.has(q.id)).length;
            return (
              <button
                key={st.name}
                onClick={() => setView({ kind: "questions", subject: subject.subject, topic: topic.name, subtopic: st.name })}
                className="w-full text-left"
              >
                <Card className="flex items-center justify-between p-4 transition-all hover:shadow-glow active:scale-[0.98]">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{st.name}</p>
                    <p className="text-xs text-muted-foreground">{done}/{st.questions.length} questions done</p>
                    <Progress value={(done / st.questions.length) * 100} className="mt-2 h-1.5" />
                  </div>
                  <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
                </Card>
              </button>
            );
          })}
        </div>
      </AppShell>
    );
  }

  // ---- TOPICS ----
  if (view.kind === "topics") {
    const subject = subjects.find((s) => s.subject === view.subject);
    if (!subject) { setView({ kind: "subjects" }); return null; }
    const all = getAllQuestions(subject);
    const done = all.filter((q) => doneIds.has(q.id)).length;

    return (
      <AppShell>
        <Crumbs onBack={() => setView({ kind: "subjects" })}>All subjects</Crumbs>
        <div className="mb-4">
          <p className="text-3xl">{subject.emoji}</p>
          <h1 className="mt-1 text-2xl font-bold">{subject.subject}</h1>
          <p className="text-sm text-muted-foreground">{profile.curriculum} · {profile.grade}</p>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={(done / all.length) * 100} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground">{done}/{all.length}</span>
          </div>
        </div>

        <Button
          className="mb-4 w-full bg-gradient-primary text-primary-foreground"
          onClick={() => setView({ kind: "test", subject: subject.subject })}
        >
          <FileText className="mr-2 h-4 w-4" /> Start Subject Test ({all.length} Qs)
        </Button>

        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Topics</h2>
        <div className="space-y-2">
          {subject.topics.map((t) => {
            const tq = t.subtopics.flatMap((s) => s.questions);
            const td = tq.filter((q) => doneIds.has(q.id)).length;
            return (
              <button
                key={t.name}
                onClick={() => setView({ kind: "subtopics", subject: subject.subject, topic: t.name })}
                className="w-full text-left"
              >
                <Card className="flex items-center justify-between p-4 transition-all hover:shadow-glow active:scale-[0.98]">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.subtopics.length} subtopics · {td}/{tq.length} done
                    </p>
                    <Progress value={(td / tq.length) * 100} className="mt-2 h-1.5" />
                  </div>
                  <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
                </Card>
              </button>
            );
          })}
        </div>
      </AppShell>
    );
  }

  // ---- SUBJECTS GRID ----
  return (
    <AppShell>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revision</h1>
          <p className="text-sm text-muted-foreground">{profile.curriculum} · {profile.grade}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reset
        </Button>
      </div>

      <Card className="mb-5 border-0 bg-gradient-primary p-4 text-primary-foreground shadow-glow">
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">Overall progress</p>
        <p className="mt-1 text-2xl font-bold">{totals.done}/{totals.total}</p>
        <Progress value={totals.total ? (totals.done / totals.total) * 100 : 0} className="mt-2 h-2 bg-white/20" />
      </Card>

      <Link to="/tutor">
        <Card className="mb-5 flex items-center gap-3 border-dashed bg-muted/40 p-3 transition-all hover:shadow-glow">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Stuck? Ask the AI Tutor</p>
            <p className="text-xs text-muted-foreground">Step-by-step explanations & diagrams</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Subjects</h2>
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((s) => {
          const all = getAllQuestions(s);
          const done = all.filter((q) => doneIds.has(q.id)).length;
          return (
            <button
              key={s.subject}
              onClick={() => setView({ kind: "topics", subject: s.subject })}
              className="text-left"
            >
              <Card className="h-full p-4 transition-all hover:shadow-glow active:scale-95">
                <p className="text-3xl">{s.emoji}</p>
                <p className="mt-2 text-sm font-semibold">{s.subject}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.topics.length} topics · {done}/{all.length}
                </p>
                <Progress value={(done / all.length) * 100} className="mt-2 h-1.5" />
              </Card>
            </button>
          );
        })}
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

function QuestionCard({
  q, done, onDone,
}: { q: Question; done: boolean; open: boolean; onToggle: () => void; onDone: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [reveal, setReveal] = useState(false);
  const isMcq = q.options && q.options.length > 0;

  const normalizeAns = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9αβπΩμ°\-+./²³√]+/gi, " ").replace(/\s+/g, " ").trim();
  const correctTyped = useMemo(() => {
    if (isMcq) return false;
    const u = normalizeAns(typed);
    if (!u) return false;
    const t = normalizeAns(q.answer);
    return t === u || (t.length > 3 && u.includes(t)) || (u.length > 3 && t.includes(u));
  }, [typed, q.answer, isMcq]);

  const handleCheck = () => {
    setChecked(true);
    if ((isMcq && picked === q.correctIndex) || (!isMcq && correctTyped)) {
      if (!done) onDone();
    }
  };

  const reset = () => { setChecked(false); setPicked(null); setTyped(""); setReveal(false); };

  const isRight = isMcq ? picked === q.correctIndex : correctTyped;

  return (
    <Card className={cn("p-4 animate-fade-in", done && "opacity-80")}>
      <p className="text-sm font-medium">{q.question}</p>

      {isMcq ? (
        <div className="mt-3 space-y-2">
          {q.options!.map((opt, i) => {
            const isCorrect = i === q.correctIndex;
            const showResult = checked;
            return (
              <button
                key={i}
                disabled={showResult}
                onClick={() => setPicked(i)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all",
                  !showResult && picked === i && "border-primary bg-primary/10",
                  !showResult && picked !== i && "hover:border-primary",
                  showResult && isCorrect && "border-primary bg-primary/15 font-medium",
                  showResult && !isCorrect && picked === i && "border-destructive bg-destructive/10",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your answer…"
            disabled={checked && isRight}
          />
          {checked && (
            <div className={cn(
              "flex items-start gap-2 rounded-lg p-2 text-xs",
              isRight ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
            )}>
              {isRight
                ? <><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> <span>Correct! Nice work.</span></>
                : <><XCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>Not quite. {reveal ? <>Model: <strong>{q.answer}</strong></> : "Try again or reveal the answer."}</span></>}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!checked ? (
          <Button
            size="sm"
            className="flex-1 bg-gradient-primary text-primary-foreground"
            disabled={isMcq ? picked === null : !typed.trim()}
            onClick={handleCheck}
          >
            Check answer
          </Button>
        ) : isRight ? (
          <Button size="sm" variant="outline" className="flex-1" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" /> Try again
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" className="flex-1" onClick={reset}>
              Retry
            </Button>
            {!isMcq && !reveal && (
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => setReveal(true)}>
                Reveal answer
              </Button>
            )}
            {isMcq && (
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => onDone()} disabled={done}>
                Mark done anyway
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

// ---------- Subject Test ----------
function SubjectTest({ subject, onExit }: { subject: SubjectPack; onExit: () => void }) {
  const questions = useMemo(() => getAllQuestions(subject), [subject]);
  const durationSec = Math.max(60, questions.length * 60); // 1 min per Q, min 1m
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { picked?: number; revealed?: boolean }>>({});
  const [submitted, setSubmitted] = useState(false);

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(t); setSubmitted(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const q = questions[idx];
  const isMcq = !!q.options;

  const score = useMemo(() => {
    let correct = 0, mcqTotal = 0;
    for (const qq of questions) {
      if (qq.options) {
        mcqTotal++;
        if (answers[qq.id]?.picked === qq.correctIndex) correct++;
      }
    }
    return { correct, mcqTotal };
  }, [answers, questions]);

  if (submitted) {
    const pct = score.mcqTotal ? Math.round((score.correct / score.mcqTotal) * 100) : 0;
    return (
      <AppShell>
        <Crumbs onBack={onExit}>Back to {subject.subject}</Crumbs>
        <Card className="border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-glow">
          <Trophy className="mx-auto h-10 w-10" />
          <h1 className="mt-2 text-2xl font-bold">Test Complete</h1>
          <p className="mt-1 text-sm opacity-90">{subject.subject}</p>
          <p className="mt-4 text-4xl font-bold">{pct}%</p>
          <p className="text-sm opacity-90">{score.correct} / {score.mcqTotal} MCQs correct</p>
          <p className="mt-1 text-xs opacity-75">Short-answer questions are self-marked below.</p>
        </Card>

        <h2 className="mt-5 mb-2 text-sm font-semibold text-muted-foreground">Review</h2>
        <div className="space-y-3">
          {questions.map((qq) => {
            const a = answers[qq.id];
            const correct = qq.options && a?.picked === qq.correctIndex;
            return (
              <Card key={qq.id} className="p-4">
                <p className="text-sm font-medium">{qq.question}</p>
                {qq.options ? (
                  <p className={cn("mt-2 text-sm", correct ? "text-green-600" : "text-red-600")}>
                    Your answer: {a?.picked != null ? qq.options[a.picked] : "—"} · Correct: {qq.options[qq.correctIndex!]}
                  </p>
                ) : (
                  <p className="mt-2 rounded-lg bg-muted p-2 text-sm">
                    <span className="font-semibold">Model answer:</span> {qq.answer}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
        <Button className="mt-4 w-full" onClick={onExit}>Done</Button>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-3 flex items-center justify-between">
        <Crumbs onBack={onExit}>Exit test</Crumbs>
        <span className={cn(
          "rounded-full px-3 py-1 text-xs font-bold tabular-nums",
          secondsLeft < 60 ? "bg-red-500/15 text-red-600" : "bg-primary/10 text-primary",
        )}>{mm}:{ss}</span>
      </div>

      <h1 className="text-lg font-bold">{subject.emoji} {subject.subject} Test</h1>
      <p className="mb-3 text-xs text-muted-foreground">
        Question {idx + 1} of {questions.length}
      </p>
      <Progress value={((idx + 1) / questions.length) * 100} className="mb-4 h-1.5" />

      <Card className="p-4">
        <p className="text-sm font-medium">{q.question}</p>
        {isMcq ? (
          <div className="mt-3 space-y-2">
            {q.options!.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: { picked: i } }))}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all",
                  answers[q.id]?.picked === i ? "border-primary bg-primary/10" : "hover:border-primary",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: { revealed: !a[q.id]?.revealed } }))}
            >
              {answers[q.id]?.revealed ? "Hide model answer" : "Reveal model answer"}
            </Button>
            {answers[q.id]?.revealed && (
              <p className="mt-2 rounded-lg bg-muted p-2 text-sm">
                <span className="font-semibold">Model:</span> {q.answer}
              </p>
            )}
          </>
        )}
      </Card>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
          Previous
        </Button>
        {idx < questions.length - 1 ? (
          <Button className="flex-1 bg-gradient-primary text-primary-foreground" onClick={() => setIdx((i) => i + 1)}>
            Next
          </Button>
        ) : (
          <Button className="flex-1 bg-gradient-primary text-primary-foreground" onClick={() => setSubmitted(true)}>
            Submit
          </Button>
        )}
      </div>
    </AppShell>
  );
}

// Suppress unused imports for narrow types referenced via types only
export type { Topic, Subtopic };
