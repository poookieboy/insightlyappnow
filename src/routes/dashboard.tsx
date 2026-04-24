import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ListTodo, CalendarDays, StickyNote, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { BADGES } from "@/lib/badges";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <RequireProfile>
      <Dashboard />
    </RequireProfile>
  ),
});

function Dashboard() {
  const { state } = useStore();
  const pending = state.tasks.filter((t) => !t.completed).length;
  const noteCount = state.notes.length;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const nextClass = state.timetable
    .filter((e) => e.day === today)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  const cards = [
    { to: "/revision" as const, icon: "📚", title: "Revision", subtitle: "Practice questions", Icon: BookOpen },
    { to: "/tasks" as const, icon: "📝", title: "Tasks", subtitle: `${pending} pending`, Icon: ListTodo },
    { to: "/timetable" as const, icon: "📅", title: "Timetable", subtitle: nextClass ? `Next: ${nextClass.subject}` : "No classes today", Icon: CalendarDays },
    { to: "/notes" as const, icon: "🗒", title: "Notes", subtitle: `${noteCount} saved`, Icon: StickyNote },
  ];

  const unlocked = new Set(state.badges.unlocked);

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
      <p className="mb-5 text-sm text-muted-foreground">Your tools, all in one place.</p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {cards.map(({ to, icon, title, subtitle }) => (
          <Link key={to} to={to}>
            <Card className="h-full p-4 transition-all hover:shadow-glow active:scale-95">
              <div className="text-3xl">{icon}</div>
              <p className="mt-2 font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">My Badges</h2>
      <div className="grid grid-cols-3 gap-3">
        {BADGES.map((b) => {
          const has = unlocked.has(b.id);
          return (
            <Card
              key={b.id}
              className={cn(
                "flex flex-col items-center p-3 text-center transition-all",
                has ? "bg-gradient-primary text-primary-foreground shadow-glow animate-pop" : "opacity-50",
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
