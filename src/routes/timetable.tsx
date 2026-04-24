import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore, uid, type TimetableEntry } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/timetable")({
  component: () => (
    <RequireProfile>
      <Timetable />
    </RequireProfile>
  ),
});

const DAYS: TimetableEntry["day"][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function Timetable() {
  const { state, update } = useStore();
  const [day, setDay] = useState<TimetableEntry["day"]>("Monday");
  const [time, setTime] = useState("08:00");
  const [subject, setSubject] = useState("");

  const add = () => {
    if (!subject.trim()) return toast.error("Add a subject");
    update((s) => ({
      ...s,
      timetable: [...s.timetable, { id: uid(), day, time, subject: subject.trim() }],
    }));
    setSubject("");
    toast.success("Added to timetable");
  };

  const remove = (id: string) => update((s) => ({ ...s, timetable: s.timetable.filter((e) => e.id !== id) }));

  const grouped = DAYS.map((d) => ({
    day: d,
    items: state.timetable.filter((e) => e.day === d).sort((a, b) => a.time.localeCompare(b.time)),
  }));

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Timetable</h1>
      <p className="mb-5 text-sm text-muted-foreground">Plan your week.</p>

      <Card className="mb-5 space-y-3 p-4">
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
        <Button onClick={add} className="w-full bg-gradient-primary text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Add entry
        </Button>
      </Card>

      <div className="space-y-3">
        {grouped.filter((g) => g.items.length > 0).map((g) => (
          <div key={g.day}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.day}</p>
            <div className="space-y-2">
              {g.items.map((e) => (
                <Card key={e.id} className="flex items-center gap-3 p-3 animate-fade-in">
                  <span className="w-16 rounded-lg bg-gradient-primary px-2 py-1 text-center text-xs font-semibold text-primary-foreground">
                    {e.time}
                  </span>
                  <span className="flex-1 text-sm font-medium">{e.subject}</span>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {state.timetable.length === 0 && <p className="text-center text-sm text-muted-foreground">No classes added yet 📅</p>}
      </div>
    </AppShell>
  );
}
