import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function Revision() {
  const { state, update } = useStore();
  const profile = state.profile!;
  const subjects = useMemo(
    () => getSubjects(profile.curriculum, profile.grade),
    [profile],
  );
  const doneIds = new Set(state.revisionDone.map((r) => r.questionId));
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const markDone = (qid: string) => {
    if (doneIds.has(qid)) return;
    update((s) => {
      const revisionDone = [
        ...s.revisionDone,
        { questionId: qid, doneAt: new Date().toISOString() },
      ];
      const { next, newly } = evaluateBadges(s.badges, {
        tasks: s.tasks,
        revisionDone,
      });
      if (newly.length) setTimeout(() => notifyBadges(newly), 100);
      setTimeout(() => toast.success(motivation.onRevision()), 100);
      return { ...s, revisionDone, badges: next };
    });
  };

  const reset = () => update((s) => ({ ...s, revisionDone: [] }));

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalQ = subjects.reduce((n, s) => n + s.questions.length, 0);
  const totalDone = subjects.reduce(
    (n, s) => n + s.questions.filter((q) => doneIds.has(q.id)).length,
    0,
  );

  // Detail view for a single subject
  if (activeSubject) {
    const subject = subjects.find((s) => s.subject === activeSubject);
    if (!subject) {
      setActiveSubject(null);
      return null;
    }
    const subjDone = subject.questions.filter((q) => doneIds.has(q.id)).length;

    return (
      <AppShell>
        <button
          onClick={() => setActiveSubject(null)}
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> All subjects
        </button>

        <div className="mb-4">
          <p className="text-3xl">{subject.emoji}</p>
          <h1 className="mt-1 text-2xl font-bold">{subject.subject}</h1>
          <p className="text-sm text-muted-foreground">
            {profile.curriculum} · {profile.grade}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Progress
              value={(subjDone / subject.questions.length) * 100}
              className="h-2 flex-1"
            />
            <span className="text-xs font-medium text-muted-foreground">
              {subjDone}/{subject.questions.length}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {subject.questions.map((q) => {
            const done = doneIds.has(q.id);
            const open = revealed.has(q.id);
            return (
              <Card
                key={q.id}
                className={cn("p-4 animate-fade-in", done && "opacity-70")}
              >
                <p className="text-sm font-medium">{q.question}</p>
                {open && (
                  <p className="mt-2 rounded-lg bg-muted p-2 text-sm">
                    <span className="font-semibold">Answer:</span> {q.answer}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toggleReveal(q.id)}
                  >
                    {open ? "Hide answer" : "Show answer"}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-primary text-primary-foreground"
                    disabled={done}
                    onClick={() => markDone(q.id)}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    {done ? "Done" : "Mark done"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </AppShell>
    );
  }

  // Subject grid view
  return (
    <AppShell>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revision</h1>
          <p className="text-sm text-muted-foreground">
            {profile.curriculum} · {profile.grade}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reset
        </Button>
      </div>

      <Card className="mb-5 border-0 bg-gradient-primary p-4 text-primary-foreground shadow-glow">
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
          Overall progress
        </p>
        <p className="mt-1 text-2xl font-bold">
          {totalDone}/{totalQ}
        </p>
        <Progress
          value={totalQ ? (totalDone / totalQ) * 100 : 0}
          className="mt-2 h-2 bg-white/20"
        />
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Subjects
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((s) => {
          const done = s.questions.filter((q) => doneIds.has(q.id)).length;
          const pct = (done / s.questions.length) * 100;
          return (
            <button
              key={s.subject}
              onClick={() => setActiveSubject(s.subject)}
              className="text-left"
            >
              <Card className="h-full p-4 transition-all hover:shadow-glow active:scale-95">
                <p className="text-3xl">{s.emoji}</p>
                <p className="mt-2 text-sm font-semibold">{s.subject}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {done}/{s.questions.length} done
                </p>
                <Progress value={pct} className="mt-2 h-1.5" />
              </Card>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}
