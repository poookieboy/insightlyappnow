import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useStore, uid } from "@/lib/store";
import { evaluateBadges, notifyBadges } from "@/lib/badges";
import { motivation } from "@/lib/motivation";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  component: () => (
    <RequireProfile>
      <Tasks />
    </RequireProfile>
  ),
});

function Tasks() {
  const { state, update } = useStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("12:00");

  const add = () => {
    if (!title.trim() || !date) {
      toast.error("Add a title and deadline");
      return;
    }
    const [h, m] = time.split(":").map(Number);
    const dl = new Date(date);
    dl.setHours(h, m, 0, 0);
    update((s) => ({
      ...s,
      tasks: [...s.tasks, { id: uid(), title: title.trim(), deadline: dl.toISOString(), completed: false }],
    }));
    setTitle("");
    setDate(undefined);
    toast.success("Task added");
  };

  const toggle = (id: string) => {
    update((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        return completed
          ? { ...t, completed, completedAt: new Date().toISOString(), onTime: Date.now() <= new Date(t.deadline).getTime() }
          : { ...t, completed: false, completedAt: undefined, onTime: undefined };
      });
      const { next, newly } = evaluateBadges(s.badges, { tasks, revisionDone: s.revisionDone, notes: s.notes, examResults: s.examResults, goals: s.goals, tutorConversations: s.tutorConversations });
      if (newly.length) setTimeout(() => notifyBadges(newly), 100);
      const justCompleted = tasks.find((t) => t.id === id)?.completed;
      if (justCompleted) setTimeout(() => toast.success(motivation.onComplete()), 100);
      return { ...s, tasks, badges: next };
    });
  };

  const remove = (id: string) => {
    update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  };

  const sorted = [...state.tasks].sort((a, b) => Number(a.completed) - Number(b.completed) || new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const completedCount = state.tasks.filter((t) => t.completed).length;
  const onTimeCount = state.tasks.filter((t) => t.completed && t.onTime).length;

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Tasks</h1>
      <p className="mb-5 text-sm text-muted-foreground">{completedCount} completed · {onTimeCount} on time</p>

      <Card className="mb-5 space-y-3 p-4">
        <div className="space-y-2">
          <Label>New task</Label>
          <Input placeholder="e.g. Finish Math homework" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "MMM d") : "Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Button onClick={add} className="w-full bg-gradient-primary text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Add task
        </Button>
      </Card>

      <div className="space-y-2">
        {sorted.length === 0 && <p className="text-center text-sm text-muted-foreground">No tasks yet ✨</p>}
        {sorted.map((t) => (
          <Card key={t.id} className={cn("flex items-center gap-3 p-3 animate-fade-in", t.completed && "opacity-60")}>
            <Checkbox checked={t.completed} onCheckedChange={() => toggle(t.id)} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", t.completed && "line-through")}>{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
