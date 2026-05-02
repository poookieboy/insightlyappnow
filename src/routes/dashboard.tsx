import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  BookOpen, ListTodo, CalendarDays, StickyNote, Lock, Sparkles,
  FileText, Award, Flame, Trophy,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { BADGES, evaluateBadges, notifyBadges } from "@/lib/badges";
import { computeStreak } from "@/lib/streak";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <RequireProfile>
      <Dashboard />
    </RequireProfile>
  ),
});

function Dashboard() {
  const { state, update } = useStore();
  const pending = state.tasks.filter((t) => !t.completed).length;
  const completedCount = state.tasks.filter((t) => t.completed).length;
  const noteCount = state.notes.length;
  const paperCount = state.generatedPapers.length;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const nextClass = state.timetable
    .filter((e) => e.day === today)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  const streak = computeStreak(state.tasks, state.revisionDone, state.streakSettings);

  // Celebrate any newly-eligible badges when visiting the dashboard
  const evaluated = useRef(false);
  useEffect(() => {
    if (evaluated.current) return;
    evaluated.current = true;
    const { next, newly } = evaluateBadges(state.badges, {
      tasks: state.tasks,
      revisionDone: state.revisionDone,
    });
    if (newly.length) {
      update((s) => ({ ...s, badges: next }));
      notifyBadges(newly);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    { to: "/tutor" as const, icon: "🤖", title: "AI Tutor", subtitle: "Ask Nexus anything", Icon: Sparkles },
    { to: "/tests" as const, icon: "📄", title: "Mock Papers", subtitle: `${paperCount} generated`, Icon: FileText },
    { to: "/revision" as const, icon: "📚", title: "Revision", subtitle: "By subject", Icon: BookOpen },
    { to: "/tasks" as const, icon: "✅", title: "Tasks", subtitle: `${pending} pending`, Icon: ListTodo },
    { to: "/timetable" as const, icon: "📅", title: "Timetable", subtitle: nextClass ? `Next: ${nextClass.subject}` : "No classes today", Icon: CalendarDays },
    { to: "/notes" as const, icon: "🗒️", title: "Notes", subtitle: `${noteCount} saved`, Icon: StickyNote },
    { to: "/exams" as const, icon: "📊", title: "Exams & Goals", subtitle: "Track progress", Icon: Trophy },
    { to: "/workspace" as const, icon: "🧠", title: "Workspace", subtitle: "Focus mode", Icon: Sparkles },
  ];

  const unlocked = new Set(state.badges.unlocked);
  const unlockedCount = unlocked.size;

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">All your study tools in one place ✨</p>
      </header>

      {/* Stats row: streak + badges */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-pink-500 p-4 text-white shadow-glow">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            <p className="text-xs font-medium uppercase tracking-wide opacity-90">Streak</p>
          </div>
          <p className="mt-2 text-3xl font-bold">{streak}<span className="ml-1 text-base font-medium opacity-90">{streak === 1 ? "day" : "days"}</span></p>
          <p className="text-[11px] opacity-80">{streak > 0 ? "Keep it alive! 🔥" : "Do something today to start"}</p>
        </Card>
        <Card className="overflow-hidden border-0 bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            <p className="text-xs font-medium uppercase tracking-wide opacity-90">Badges</p>
          </div>
          <p className="mt-2 text-3xl font-bold">{unlockedCount}<span className="ml-1 text-base font-medium opacity-90">/ {BADGES.length}</span></p>
          <p className="text-[11px] opacity-80">{completedCount} task{completedCount === 1 ? "" : "s"} done</p>
        </Card>
      </div>

      {/* Tools grid */}
      <h2 className="mb-3 text-lg font-semibold">Tools</h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {cards.map(({ to, icon, title, subtitle }) => (
          <Link key={to} to={to}>
            <Card className="group h-full p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow active:scale-95">
              <div className="text-3xl transition-transform group-hover:scale-110">{icon}</div>
              <p className="mt-2 font-semibold leading-tight">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Badges */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Badges</h2>
        <span className="text-xs text-muted-foreground">{unlockedCount}/{BADGES.length} unlocked</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {BADGES.map((b) => {
          const has = unlocked.has(b.id);
          return (
            <Card
              key={b.id}
              title={b.description}
              className={cn(
                "flex flex-col items-center p-3 text-center transition-all",
                has
                  ? "bg-gradient-primary text-primary-foreground shadow-glow animate-pop"
                  : "opacity-60 hover:opacity-100",
              )}
            >
              <div className="text-2xl">{has ? b.emoji : <Lock className="h-5 w-5" />}</div>
              <p className="mt-1 text-[11px] font-semibold leading-tight">{b.name}</p>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
