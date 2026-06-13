import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
} from "lucide-react";
import {
  addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  startOfMonth, startOfWeek,
} from "date-fns";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useStore, uid, type TimetableEntry, type Task } from "@/lib/store";
import { evaluateBadges, notifyBadges } from "@/lib/badges";
import { motivation } from "@/lib/motivation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timetable")({
  component: () => (
    <RequireProfile>
      <Timetable />
    </RequireProfile>
  ),
});

const DAYS: TimetableEntry["day"][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`); // 07:00 – 20:00

function Timetable() {
  const { state, update } = useStore();
  const [tab, setTab] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [openDay, setOpenDay] = useState<Date | null>(null);

  // --- DERIVED ---
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of state.tasks) {
      const k = format(new Date(t.deadline), "yyyy-MM-dd");
      const arr = map.get(k) ?? [];
      arr.push(t);
      map.set(k, arr);
    }
    return map;
  }, [state.tasks]);

  const monthGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) days.push(new Date(d));
    return days;
  }, [cursor]);

  // --- ACTIONS ---
  const removeTask = (id: string) =>
    update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

  const toggleTask = (id: string) => {
    update((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        return completed
          ? { ...t, completed, completedAt: new Date().toISOString(), onTime: Date.now() <= new Date(t.deadline).getTime() }
          : { ...t, completed: false, completedAt: undefined, onTime: undefined };
      });
      const { next, newly } = evaluateBadges(s.badges, { tasks, revisionDone: s.revisionDone });
      if (newly.length) setTimeout(() => notifyBadges(newly), 100);
      const justDone = tasks.find((t) => t.id === id)?.completed;
      if (justDone) setTimeout(() => toast.success(motivation.onComplete()), 100);
      return { ...s, tasks, badges: next };
    });
  };

  const addTask = (date: Date, title: string, time: string) => {
    const [h, m] = time.split(":").map(Number);
    const dl = new Date(date); dl.setHours(h, m, 0, 0);
    update((s) => ({
      ...s,
      tasks: [...s.tasks, { id: uid(), title: title.trim(), deadline: dl.toISOString(), completed: false }],
    }));
  };

  const addWeekly = (day: TimetableEntry["day"], time: string, subject: string) => {
    update((s) => ({
      ...s,
      timetable: [...s.timetable, { id: uid(), day, time, subject: subject.trim() }],
    }));
  };

  const removeWeekly = (id: string) =>
    update((s) => ({ ...s, timetable: s.timetable.filter((e) => e.id !== id) }));

  return (
    <AppShell>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timetable</h1>
          <p className="text-sm text-muted-foreground">Plan your study life.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "month" | "week")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="month"><CalendarDays className="mr-1 h-4 w-4" /> Month</TabsTrigger>
          <TabsTrigger value="week"><LayoutGrid className="mr-1 h-4 w-4" /> Week</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "month" ? (
        <MonthView
          cursor={cursor}
          setCursor={setCursor}
          monthGrid={monthGrid}
          tasksByDay={tasksByDay}
          onPickDay={setOpenDay}
        />
      ) : (
        <WeekView
          entries={state.timetable}
          onAdd={addWeekly}
          onRemove={removeWeekly}
        />
      )}

      <DayDialog
        date={openDay}
        onClose={() => setOpenDay(null)}
        tasks={openDay ? tasksByDay.get(format(openDay, "yyyy-MM-dd")) ?? [] : []}
        onAdd={addTask}
        onToggle={toggleTask}
        onRemove={removeTask}
      />
    </AppShell>
  );
}

function MonthView({
  cursor, setCursor, monthGrid, tasksByDay, onPickDay,
}: {
  cursor: Date; setCursor: (d: Date) => void;
  monthGrid: Date[]; tasksByDay: Map<string, Task[]>;
  onPickDay: (d: Date) => void;
}) {
  const today = new Date();
  return (
    <Card className="mt-4 p-3">
      <div className="mb-3 flex items-center justify-between">
        <Button size="icon" variant="ghost" onClick={() => setCursor(addMonths(cursor, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold">{format(cursor, "MMMM yyyy")}</p>
        <Button size="icon" variant="ghost" onClick={() => setCursor(addMonths(cursor, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {monthGrid.map((d) => {
          const inMonth = isSameMonth(d, cursor);
          const isToday = isSameDay(d, today);
          const items = tasksByDay.get(format(d, "yyyy-MM-dd")) ?? [];
          const completed = items.filter((t) => t.completed).length;
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPickDay(d)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-start rounded-lg border p-1 text-[11px] transition-all active:scale-95",
                inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
                isToday && "border-primary ring-1 ring-primary",
                items.length > 0 && "border-primary/30 bg-primary/5",
              )}
            >
              <span className={cn("font-semibold", isToday && "text-primary")}>{format(d, "d")}</span>
              {items.length > 0 && (
                <div className="mt-auto flex w-full flex-col items-center gap-0.5">
                  <span className="rounded-full bg-primary/20 px-1.5 text-[9px] font-bold leading-tight text-primary">
                    {completed}/{items.length}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">Tap a day to add or check off tasks.</p>
    </Card>
  );
}

function WeekView({
  entries, onAdd, onRemove,
}: {
  entries: TimetableEntry[];
  onAdd: (d: TimetableEntry["day"], time: string, subject: string) => void;
  onRemove: (id: string) => void;
}) {
  const [day, setDay] = useState<TimetableEntry["day"]>("Monday");
  const [time, setTime] = useState("08:00");
  const [subject, setSubject] = useState("");

  const cellAt = (d: TimetableEntry["day"], h: string) =>
    entries.find((e) => e.day === d && e.time.slice(0, 5) === h);

  const submit = () => {
    if (!subject.trim()) return toast.error("Add a subject");
    onAdd(day, time, subject); setSubject(""); toast.success("Added to timetable");
  };

  return (
    <>
      <Card className="mt-4 space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Day</Label>
            <Select value={day} onValueChange={(v) => setDay(v as TimetableEntry["day"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Subject</Label>
          <Input placeholder="e.g. Math" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={40} />
        </div>
        <Button onClick={submit} className="w-full bg-gradient-primary text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Add slot
        </Button>
      </Card>

      <Card className="mt-4 overflow-x-auto p-2">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[56px_repeat(7,minmax(72px,1fr))] gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <div />
            {DAYS.map((d) => <div key={d} className="text-center">{d.slice(0, 3)}</div>)}
          </div>
          {HOURS.map((h) => (
            <div key={h} className="grid grid-cols-[56px_repeat(7,minmax(72px,1fr))] gap-1 py-0.5">
              <div className="flex items-center justify-end pr-1 text-[10px] text-muted-foreground">{h}</div>
              {DAYS.map((d) => {
                const cell = cellAt(d, h);
                return (
                  <div
                    key={d + h}
                    className={cn(
                      "min-h-[34px] rounded-md border text-[10px]",
                      cell ? "border-primary/40 bg-gradient-primary p-1 text-primary-foreground" : "border-dashed bg-muted/30",
                    )}
                  >
                    {cell && (
                      <button
                        onClick={() => onRemove(cell.id)}
                        className="w-full truncate text-left font-medium"
                        title="Tap to remove"
                      >
                        {cell.subject}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">Tap a slot to remove it.</p>
    </>
  );
}

function DayDialog({
  date, onClose, tasks, onAdd, onToggle, onRemove,
}: {
  date: Date | null; onClose: () => void; tasks: Task[];
  onAdd: (d: Date, title: string, time: string) => void;
  onToggle: (id: string) => void; onRemove: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("12:00");

  if (!date) return null;
  const submit = () => {
    if (!title.trim()) return toast.error("Add a title");
    onAdd(date, title, time);
    setTitle("");
    toast.success("Task added");
  };

  return (
    <Dialog open={!!date} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{format(date, "EEEE, MMM d")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {tasks.length === 0 && <p className="text-xs text-muted-foreground">Nothing scheduled yet.</p>}
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border bg-card p-2">
              <button
                onClick={() => onToggle(t.id)}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                  t.completed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground",
                )}
              >
                {t.completed && "✓"}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", t.completed && "line-through opacity-60")}>{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{format(new Date(t.deadline), "HH:mm")}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onRemove(t.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
          <Label className="text-xs">Add task</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chemistry practice" maxLength={120} />
          <div className="flex gap-2">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1" />
            <Button onClick={submit} className="bg-gradient-primary text-primary-foreground">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
