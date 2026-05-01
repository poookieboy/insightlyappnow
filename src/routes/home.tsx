import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Sparkles, ArrowRight, CheckCircle2, BookOpen, Settings as SettingsIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { useStore } from "@/lib/store";
import { motivation } from "@/lib/motivation";
import { smartSuggestion } from "@/lib/suggestions";
import { scheduleChecks, ensureNotificationPermission } from "@/lib/notifications";
import { getQuestions } from "@/lib/revision";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/home")({
  component: () => (
    <RequireProfile>
      <HomeScreen />
    </RequireProfile>
  ),
});

function HomeScreen() {
  const { state, update } = useStore();

  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  useEffect(() => {
    return scheduleChecks(state.tasks, state.timetable);
  }, [state.tasks, state.timetable]);

  // Update lastActive
  useEffect(() => {
    update((s) => (s.profile ? { ...s, profile: { ...s.profile, lastActive: new Date().toISOString() } } : s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profile = state.profile!;
  const opener = useMemo(() => motivation.opener(), []);
  const suggestion = smartSuggestion(profile, state.tasks, state.revisionDone);

  const upcoming = state.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const questions = getQuestions(profile.curriculum, profile.grade);
  const doneIds = new Set(state.revisionDone.map((r) => r.questionId));
  const nextRevision = questions.find((q) => !doneIds.has(q.id));

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{opener}</p>
          <h1 className="mt-1 truncate text-2xl font-bold">Welcome back, {profile.name} 👋</h1>
          <p className="text-[11px] text-muted-foreground">Insightly · powered by Nexus</p>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-foreground hover:shadow-glow transition-all"
        >
          <SettingsIcon className="h-5 w-5" />
        </Link>
      </header>

      <Card className="mb-4 overflow-hidden border-0 bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">Smart suggestion</p>
            <p className="mt-1 text-sm leading-relaxed">{suggestion}</p>
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Upcoming tasks</h2>
          <Link to="/tasks" className="text-xs font-medium text-primary">See all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet — add one to get started.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(t.deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Next revision</h2>
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        {nextRevision ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{nextRevision.subject}</p>
            <p className="mt-1 text-sm">{nextRevision.question}</p>
            <Link to="/revision">
              <Button className="mt-3 w-full bg-gradient-primary text-primary-foreground" size="sm">
                Start revising <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">All revision done — amazing! 🎉</p>
        )}
      </Card>
    </AppShell>
  );
}
