import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BookOpen, ListTodo, CalendarDays, StickyNote, Sparkles, FileText, Trophy, Calculator, TrendingUp, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { evaluateBadges, notifyBadges } from "@/lib/badges";

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
  const noteCount = state.notes.length;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const nextClass = state.timetable
    .filter((e) => e.day === today)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

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
    { to: "/quiz" as const, icon: "📝", title: "Subject Quiz", subtitle: "10 MCQ + 10 written", Icon: FileText },
    { to: "/external-quiz" as const, icon: "🎯", title: "Quiz Bank", subtitle: "From question bank", Icon: FileText },
    { to: "/revision" as const, icon: "📚", title: "Revision", subtitle: "By topic & subject", Icon: BookOpen },
    { to: "/tests" as const, icon: "📄", title: "Mock Papers", subtitle: "Coming soon", Icon: FileText, disabled: true },
    { to: "/tasks" as const, icon: "✅", title: "Tasks", subtitle: `${pending} pending`, Icon: ListTodo },
    { to: "/timetable" as const, icon: "📅", title: "Timetable", subtitle: nextClass ? `Next: ${nextClass.subject}` : "No classes today", Icon: CalendarDays },
    { to: "/notes" as const, icon: "🗒️", title: "Notes", subtitle: `${noteCount} saved`, Icon: StickyNote },
    { to: "/exams" as const, icon: "📊", title: "Exams & Goals", subtitle: "Track progress", Icon: Trophy },
    { to: "/calculator" as const, icon: "🧮", title: "Calculator", subtitle: "Scientific + formulas", Icon: Calculator },
    { to: "/workspace" as const, icon: "🧠", title: "Workspace", subtitle: "Focus mode", Icon: Sparkles },
  ];

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">All your study tools in one place ✨</p>
      </header>

      {/* Tools grid */}
      <h2 className="mb-3 text-lg font-semibold">Tools</h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {cards.map(({ to, icon, title, subtitle, disabled }) => {
          const inner = (
            <Card className={`group h-full p-4 transition-all ${disabled ? "opacity-60" : "hover:-translate-y-0.5 hover:shadow-glow active:scale-95"}`}>
              <div className="flex items-start justify-between">
                <div className="text-3xl transition-transform group-hover:scale-110">{icon}</div>
                {disabled && <Clock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="mt-2 font-semibold leading-tight">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </Card>
          );
          if (disabled) return <div key={to}>{inner}</div>;
          return <Link key={to} to={to}>{inner}</Link>;
        })}
      </div>
    </AppShell>
  );
}


