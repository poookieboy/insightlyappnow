import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { getPaper, gradeShortAnswer, type PaperQuestion } from "@/lib/papers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/tests/$paperId")({
  component: () => (
    <RequireProfile>
      <PaperRunner />
    </RequireProfile>
  ),
});

interface AnswerState {
  selected?: number; // mcq
  text?: string; // short
  graded?: boolean; // true once auto-graded
  correct?: boolean;
}

function PaperRunner() {
  const { paperId } = Route.useParams();
  const navigate = useNavigate();
  const { state } = useStore();
  const profile = state.profile!;
  const paper = useMemo(
    () => getPaper(profile.curriculum, profile.grade, paperId),
    [profile, paperId],
  );

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    paper ? paper.durationMinutes * 60 : 0,
  );
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!paper || submitted) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (!submittedRef.current) {
            submittedRef.current = true;
            setSubmitted(true);
            toast.info("⏰ Time's up — paper submitted");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paper, submitted]);

  if (!paper) {
    return (
      <AppShell>
        <p className="mb-4 text-sm text-muted-foreground">Paper not found.</p>
        <Link to="/tests">
          <Button variant="outline">Back to papers</Button>
        </Link>
      </AppShell>
    );
  }

  const q = paper.questions[idx];
  const ans = answers[q.id] || {};
  const totalMarks = paper.questions.reduce((n, x) => n + x.marks, 0);

  const setAns = (next: AnswerState) =>
    setAnswers((a) => ({ ...a, [q.id]: { ...a[q.id], ...next } }));

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const submitPaper = () => {
    // Auto-grade everything before showing results
    setAnswers((prev) => {
      const next = { ...prev };
      paper.questions.forEach((qq) => {
        const a = next[qq.id] || {};
        if (qq.kind === "mcq") {
          next[qq.id] = { ...a, graded: true, correct: a.selected === qq.correctIndex };
        } else {
          const correct = !!a.text && gradeShortAnswer(qq, a.text);
          next[qq.id] = { ...a, graded: true, correct };
        }
      });
      return next;
    });
    setSubmitted(true);
  };

  if (submitted) {
    let scored = 0;
    paper.questions.forEach((qq) => {
      const a = answers[qq.id];
      if (a?.correct) scored += qq.marks;
    });
    const pct = Math.round((scored / totalMarks) * 100);

    return (
      <AppShell>
        <div className="mb-4">
          <Link to="/tests" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> All papers
          </Link>
        </div>

        <Card className="mb-5 border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-glow">
          <Trophy className="mx-auto h-10 w-10" />
          <p className="mt-2 text-sm uppercase tracking-wide opacity-80">Final score</p>
          <p className="mt-1 text-4xl font-bold">{scored}/{totalMarks}</p>
          <p className="text-sm opacity-90">{pct}%</p>
        </Card>

        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Review</h2>
        <div className="space-y-3">
          {paper.questions.map((qq, i) => {
            const a = answers[qq.id] || {};
            const correct = !!a.correct;
            return (
              <Card key={qq.id} className="p-4">
                <div className="mb-2 flex items-start gap-2">
                  {correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <p className="text-sm font-medium">
                    Q{i + 1}. {qq.prompt}
                  </p>
                </div>
                {qq.kind === "mcq" && qq.options && (
                  <p className="text-xs text-muted-foreground">
                    Your answer: <span className="font-semibold">{a.selected != null ? qq.options[a.selected] : "—"}</span>
                    {" · "}Correct: <span className="font-semibold">{qq.options[qq.correctIndex!]}</span>
                  </p>
                )}
                {qq.kind === "short" && (
                  <>
                    {a.text && (
                      <p className="rounded-lg bg-muted p-2 text-xs">
                        <span className="font-semibold">Your answer:</span> {a.text}
                      </p>
                    )}
                    <p className="mt-2 rounded-lg bg-primary/10 p-2 text-xs">
                      <span className="font-semibold">Model answer:</span> {qq.modelAnswer}
                    </p>
                  </>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
              submittedRef.current = false;
              setSecondsLeft(paper.durationMinutes * 60);
              setIdx(0);
            }}
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Retake
          </Button>
          <Button
            className="flex-1 bg-gradient-primary text-primary-foreground"
            onClick={() => navigate({ to: "/tests" })}
          >
            Done
          </Button>
        </div>
      </AppShell>
    );
  }

  const answeredCount = paper.questions.filter((qq) => {
    const a = answers[qq.id];
    if (!a) return false;
    if (qq.kind === "mcq") return a.selected !== undefined;
    return !!a.text?.trim();
  }).length;

  return (
    <AppShell>
      <div className="mb-3 flex items-center justify-between">
        <Link to="/tests" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Exit
        </Link>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums",
            secondsLeft < 60 && "bg-destructive/15 text-destructive",
          )}
        >
          <Clock className="h-3 w-3" /> {formatTime(secondsLeft)}
        </div>
      </div>

      <h1 className="text-base font-bold leading-tight">{paper.title}</h1>
      <p className="mb-3 text-xs text-muted-foreground">
        {paper.subject} · {paper.questions.length} Qs · {totalMarks} marks · {paper.difficulty}
      </p>

      <div className="mb-3 flex items-center gap-2">
        <Progress value={(answeredCount / paper.questions.length) * 100} className="h-1.5 flex-1" />
        <span className="text-[10px] font-medium text-muted-foreground">
          {answeredCount}/{paper.questions.length}
        </span>
      </div>

      <Card className="mb-4 p-4 animate-fade-in">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Question {idx + 1} · {q.marks} mark{q.marks > 1 ? "s" : ""}
        </p>
        <p className="text-sm font-medium leading-relaxed">{q.prompt}</p>

        {q.kind === "mcq" && q.options && (
          <div className="mt-4 space-y-2">
            {q.options.map((opt, i) => {
              const selected = ans.selected === i;
              return (
                <button
                  key={i}
                  onClick={() => setAns({ selected: i })}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left text-sm transition-all",
                    selected
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.kind === "short" && (
          <div className="mt-4">
            <Textarea
              placeholder="Type your answer…"
              value={ans.text || ""}
              onChange={(e) => setAns({ text: e.target.value })}
              rows={4}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Auto-graded against the model answer when you submit.
            </p>
          </div>
        )}
      </Card>

      <QuestionDots
        total={paper.questions.length}
        current={idx}
        onJump={setIdx}
        questions={paper.questions}
        answers={answers}
      />

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {idx < paper.questions.length - 1 ? (
          <Button
            className="flex-1 bg-gradient-primary text-primary-foreground"
            onClick={() => setIdx((i) => i + 1)}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="flex-1 bg-gradient-primary text-primary-foreground"
            onClick={submitPaper}
          >
            Submit paper
          </Button>
        )}
      </div>
    </AppShell>
  );
}

function QuestionDots({
  total, current, onJump, questions, answers,
}: {
  total: number;
  current: number;
  onJump: (i: number) => void;
  questions: PaperQuestion[];
  answers: Record<string, AnswerState>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const qq = questions[i];
        const a = answers[qq.id];
        const answered =
          qq.kind === "mcq" ? a?.selected !== undefined : !!a?.text?.trim();
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={cn(
              "h-7 w-7 rounded-lg border text-xs font-semibold transition-all",
              i === current
                ? "border-primary bg-primary text-primary-foreground"
                : answered
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground",
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
