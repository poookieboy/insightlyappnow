import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { getQuestions } from "@/lib/revision";
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
  const questions = useMemo(() => getQuestions(profile.curriculum, profile.grade), [profile]);
  const doneIds = new Set(state.revisionDone.map((r) => r.questionId));
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const markDone = (qid: string) => {
    if (doneIds.has(qid)) return;
    update((s) => {
      const revisionDone = [...s.revisionDone, { questionId: qid, doneAt: new Date().toISOString() }];
      const { next, newly } = evaluateBadges(s.badges, { tasks: s.tasks, revisionDone });
      if (newly.length) setTimeout(() => notifyBadges(newly), 100);
      setTimeout(() => toast.success(motivation.onRevision()), 100);
      return { ...s, revisionDone, badges: next };
    });
  };

  const reset = () => update((s) => ({ ...s, revisionDone: [] }));

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revision</h1>
          <p className="text-sm text-muted-foreground">{profile.curriculum} · {profile.grade}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reset
        </Button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {state.revisionDone.length}/{questions.length} done
      </p>

      <div className="space-y-3">
        {questions.map((q) => {
          const done = doneIds.has(q.id);
          const open = revealed.has(q.id);
          return (
            <Card key={q.id} className={cn("p-4 animate-fade-in", done && "opacity-70")}>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{q.subject}</p>
              <p className="mt-1 text-sm font-medium">{q.question}</p>
              {open && (
                <p className="mt-2 rounded-lg bg-muted p-2 text-sm text-foreground">
                  <span className="font-semibold">Answer:</span> {q.answer}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toggleReveal(q.id)}>
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
