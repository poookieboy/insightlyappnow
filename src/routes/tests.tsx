import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, FileText, Clock, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore, type Curriculum, type Grade } from "@/lib/store";
import { getPapers, CURRICULA, GRADES, type Difficulty } from "@/lib/papers";

export const Route = createFileRoute("/tests")({
  component: () => (
    <RequireProfile>
      <TestsList />
    </RequireProfile>
  ),
});

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  hard: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

function TestsList() {
  const { state, update } = useStore();
  const profile = state.profile!;
  const [curriculum, setCurriculum] = useState<Curriculum>(profile.curriculum);
  const [grade, setGrade] = useState<Grade>(profile.grade);

  const papers = useMemo(() => getPapers(curriculum, grade), [curriculum, grade]);

  const grouped = papers.reduce<Record<string, typeof papers>>((acc, p) => {
    (acc[p.subject] ||= []).push(p);
    return acc;
  }, {});

  const applyToProfile = () => {
    update((s) =>
      s.profile ? { ...s, profile: { ...s.profile, curriculum, grade } } : s,
    );
  };

  const dirty = curriculum !== profile.curriculum || grade !== profile.grade;

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Test Papers</h1>
        <p className="text-sm text-muted-foreground">
          Full mock papers — auto-graded
        </p>
      </div>

      {/* Curriculum + grade selector */}
      <Card className="mb-5 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" /> Curriculum & grade
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={curriculum} onValueChange={(v) => setCurriculum(v as Curriculum)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRICULA.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {dirty && (
          <button
            onClick={applyToProfile}
            className="mt-2 w-full rounded-lg bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
          >
            Save as my default
          </button>
        )}
      </Card>

      {papers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No papers available for this selection yet.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([subject, subjectPapers]) => (
            <section key={subject}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{subjectPapers[0].emoji}</span>
                <h2 className="text-base font-semibold">{subject}</h2>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {subjectPapers.length} paper{subjectPapers.length > 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="space-y-2">
                {subjectPapers.map((p) => {
                  const totalMarks = p.questions.reduce((n, q) => n + q.marks, 0);
                  return (
                    <Link key={p.id} to="/tests/$paperId" params={{ paperId: p.id }} className="block">
                      <Card className="flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">{p.title}</p>
                          </div>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {p.durationMinutes} min ·{" "}
                            {p.questions.length} Qs · {totalMarks} marks
                          </p>
                          <span
                            className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${DIFFICULTY_COLOR[p.difficulty]}`}
                          >
                            {p.difficulty}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
