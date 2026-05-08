import { useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend, CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useStore, defaultStreakSettings } from "@/lib/store";
import { computeStreak } from "@/lib/streak";
import { TrendingUp, PieChart as PieIcon, BarChart3, Activity, Target } from "lucide-react";

const COLORS = ["#8b5cf6", "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

export function StudyAnalytics() {
  const { state } = useStore();
  const { tasks, revisionDone, examResults, tutorConversations, notes, badges } = state;

  // Pie: subjects studied (from tutor conversations)
  const subjectPie = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of tutorConversations) {
      const key = c.subject || "General";
      m.set(key, (m.get(key) ?? 0) + c.messages.length);
    }
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [tutorConversations]);

  // Bar: activity per day (last 7 days)
  const activityBar = useMemo(() => {
    const days: { day: string; tasks: number; revision: number; chats: number }[] = [];
    const now = startOfDay(new Date());
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const inDay = (iso?: string) => {
        if (!iso) return false;
        const t = new Date(iso).getTime();
        return t >= d.getTime() && t < next.getTime();
      };
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        tasks: tasks.filter((t) => inDay(t.completedAt)).length,
        revision: revisionDone.filter((r) => inDay(r.doneAt)).length,
        chats: tutorConversations.filter((c) => inDay(c.updatedAt)).length,
      });
    }
    return days;
  }, [tasks, revisionDone, tutorConversations]);

  // Line: exam scores over time
  const examLine = useMemo(() => {
    return [...examResults]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => {
        const total = r.subjects.reduce((s, x) => s + x.score, 0);
        const out = r.subjects.reduce((s, x) => s + x.outOf, 0);
        return {
          name: r.label.slice(0, 10),
          percent: out ? Math.round((total / out) * 100) : 0,
        };
      });
  }, [examResults]);

  // Radar: subject strength (avg % per subject across exams)
  const subjectRadar = useMemo(() => {
    const map = new Map<string, { score: number; out: number }>();
    for (const r of examResults) {
      for (const s of r.subjects) {
        const cur = map.get(s.subject) ?? { score: 0, out: 0 };
        map.set(s.subject, { score: cur.score + s.score, out: cur.out + s.outOf });
      }
    }
    return Array.from(map.entries())
      .map(([subject, v]) => ({ subject, percent: v.out ? Math.round((v.score / v.out) * 100) : 0 }))
      .slice(0, 6);
  }, [examResults]);

  const currentStreak = useMemo(
    () => computeStreak(tasks, revisionDone, state.streakSettings ?? defaultStreakSettings),
    [tasks, revisionDone, state.streakSettings],
  );

  const totalChats = tutorConversations.length;
  const totalRevised = revisionDone.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  const stats = [
    { label: "Streak", value: currentStreak, icon: Activity, color: "text-orange-500" },
    { label: "Chats", value: totalChats, icon: PieIcon, color: "text-violet-500" },
    { label: "Revised", value: totalRevised, icon: Target, color: "text-emerald-500" },
    { label: "Notes", value: notes.length, icon: BarChart3, color: "text-blue-500" },
    { label: "Tasks done", value: completedTasks, icon: TrendingUp, color: "text-pink-500" },
    { label: "Badges", value: badges.unlocked.length, icon: TrendingUp, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-4">
      <Card className="grid grid-cols-3 gap-2 p-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/40 p-2 text-center">
            <s.icon className={`mx-auto mb-1 h-4 w-4 ${s.color}`} />
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Last 7 days activity</h3>
        </div>
        {activityBar.some((d) => d.tasks + d.revision + d.chats > 0) ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activityBar}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revision" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="chats" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Complete tasks, revise, or chat with Nexus to see your weekly activity here.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Time spent per subject</h3>
        </div>
        {subjectPie.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={subjectPie} dataKey="value" nameKey="name" outerRadius={70} innerRadius={35}
                   paddingAngle={2}>
                {subjectPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Chat with Nexus about different subjects to see this chart.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Exam performance trend</h3>
        </div>
        {examLine.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={examLine}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="percent" stroke="#8b5cf6" strokeWidth={2}
                    dot={{ r: 4, fill: "#8b5cf6" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Add exam results to see your performance trend.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Subject strength</h3>
        </div>
        {subjectRadar.length >= 3 ? (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={subjectRadar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" fontSize={10} />
              <PolarRadiusAxis domain={[0, 100]} fontSize={9} />
              <Radar dataKey="percent" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Add exam results across at least 3 subjects to see your strengths radar.
          </p>
        )}
      </Card>
    </div>
  );
}
