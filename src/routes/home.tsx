import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Sparkles, ArrowRight, CheckCircle2, BookOpen } from "lucide-react";
import { StreakFlame } from "@/components/StreakFlame";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { useStore } from "@/lib/store";
import { useProfile } from "@/hooks/useProfile";
import { motivation } from "@/lib/motivation";
import { smartSuggestion } from "@/lib/suggestions";
import { scheduleChecks, ensureNotificationPermission } from "@/lib/notifications";
import { getSubjects } from "@/lib/revision";
import { computeStreak } from "@/lib/streak";
import { BADGES } from "@/lib/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IntroTutorial } from "@/components/IntroTutorial";

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
  const { profile: dbProfile } = useProfile();
  const opener = useMemo(() => motivation.opener(), []);
  const suggestion = smartSuggestion(profile, state.tasks, state.revisionDone, state.streakSettings);
  const streak = computeStreak(state.tasks, state.revisionDone, state.streakSettings);
  const badgeCount = state.badges.unlocked.length;

  const upcoming = state.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const subjectList = getSubjects(profile.curriculum, profile.grade);
  const nextSubject = subjectList[Math.floor(Date.now() / 86400000) % Math.max(1, subjectList.length)];
  const nextTopic = nextSubject?.topics?.[0];

  const initials = (profile.name || "?")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <IntroTutorial />
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{opener}</p>
          <h1 className="mt-1 truncate text-2xl font-bold">Welcome back, {profile.name} 👋</h1>
          <p className="text-[11px] text-muted-foreground">Insightly · powered by Iris</p>
        </div>
        <Link
          to="/settings"
          aria-label="Open settings"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground shadow-glow ring-2 ring-background hover:opacity-90 transition-all"
        >
          {dbProfile?.avatar_url ? (
            <img src={dbProfile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-background bg-card text-foreground">
            <SettingsIcon className="h-2.5 w-2.5" />
          </span>
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

      {/* Bento stats — streak takes the spotlight, badges sit beside it */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Link to="/dashboard" className="col-span-2">
          <Card className="relative h-full overflow-hidden border-0 bg-gradient-ocean p-5 text-primary-foreground shadow-glow transition-all active:scale-[0.98]">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <p className="text-[11px] font-medium uppercase tracking-widest opacity-80">Daily Streak</p>
            <div className="mt-2">
              <StreakFlame count={streak} size="lg" label={false} className="text-white" />
            </div>
            <p className="mt-2 text-[11px] opacity-80">
              {streak > 0 ? "Keep the flame alive — study today" : "Start something today to ignite it"}
            </p>
          </Card>
        </Link>
        <Link to="/dashboard">
          <Card className="h-full overflow-hidden border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-card active:scale-[0.97]">
            <div className="flex items-center gap-1.5 text-primary">
              <Award className="h-4 w-4" />
              <p className="text-[10px] font-medium uppercase tracking-wide">Badges</p>
            </div>
            <p className="mt-2 font-display text-3xl font-bold">{badgeCount}</p>
            <p className="text-[10px] text-muted-foreground">/ {BADGES.length} unlocked</p>
          </Card>
        </Link>
      </div>

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
        {nextTopic ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {nextSubject.emoji} {nextSubject.subject}
            </p>
            <p className="mt-1 text-sm">
              Practice <span className="font-semibold">{nextTopic.name}</span> — Iris will generate
              fresh, exam-quality questions and mark your answers in any format.
            </p>
            <Link to="/revision">
              <Button className="mt-3 w-full bg-gradient-primary text-primary-foreground" size="sm">
                Start revising <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Set your curriculum in Settings to start revising.</p>
        )}
      </Card>
    </AppShell>
  );
}
