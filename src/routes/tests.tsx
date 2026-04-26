import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  FileText,
  Clock,
  GraduationCap,
  Sparkles,
  Loader2,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, type Curriculum, type Grade } from "@/lib/store";
import {
  getPapers,
  CURRICULA,
  GRADES,
  normaliseGeneratedPaper,
  type Difficulty,
  type Paper,
} from "@/lib/papers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const SUBJECT_SUGGESTIONS = [
  "Mathematics",
  "English",
  "Kiswahili",
  "Science",
  "Social Studies",
  "CRE",
  "Agriculture",
  "Home Science",
  "Pre-Technical Studies",
  "Biology",
  "Chemistry",
  "Physics",
  "Geography",
  "History",
  "Business Studies",
  "Computer Studies",
];

function TestsList() {
  const { state, update } = useStore();
  const profile = state.profile;

  // ❗ Prevent crash if profile not ready
  if (!profile) return null;

  const [curriculum, setCurriculum] = useState<Curriculum>(profile.curriculum);
  const [grade, setGrade] = useState<Grade>(profile.grade);

  const builtIn = useMemo(() => getPapers(curriculum, grade), [curriculum, grade]);

  // ✅ FIX: always safe array
  const generated = state.generatedPapers ?? [];

  const papers = useMemo(() => [...generated, ...builtIn], [generated, builtIn]);

  // ✅ FIX: safe grouping
  const grouped = useMemo(() => {
    return papers.reduce<Record<string, Paper[]>>((acc, p) => {
      if (!p?.subject) return acc;
      (acc[p.subject] ||= []).push(p);
      return acc;
    }, {});
  }, [papers]);

  const applyToProfile = () => {
    update((s) =>
      s.profile
        ? { ...s, profile: { ...s.profile, curriculum, grade } }
        : s
    );
  };

  const dirty =
    curriculum !== profile.curriculum || grade !== profile.grade;

  // ✅ FIX: safe delete
  const removeGenerated = (id: string) => {
    update((s) => ({
      ...s,
      generatedPapers: (s.generatedPapers ?? []).filter((p) => p.id !== id),
    }));
    toast.success("Paper removed");
  };

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Test Papers</h1>
        <p className="text-sm text-muted-foreground">
          Full mock papers — auto-graded
        </p>
      </div>

      {/* Curriculum */}
      <Card className="mb-4 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" /> Curriculum & grade
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={curriculum} onValueChange={(v) => setCurriculum(v as Curriculum)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRICULA.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
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

      <GeneratePaperCard curriculum={curriculum} grade={grade} />

      {/* ✅ GENERATED PAPERS */}
      {generated.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-2">
            AI-generated papers ({generated.length})
          </h2>

          <div className="space-y-2">
            {generated.map((p) => {
              const totalMarks = p.questions.reduce(
                (n, q) => n + (q.marks || 0),
                0
              );

              return (
                <Card key={p.id} className="flex items-center gap-3 p-4">
                  <Link
                    to="/tests/$paperId"
                    params={{ paperId: p.id }}
                    className="flex flex-1 items-center gap-3"
                  >
                    <div className="text-lg">{p.emoji}</div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.durationMinutes} min · {p.questions.length} Qs · {totalMarks} marks
                      </p>
                    </div>
                  </Link>

                  <button onClick={() => removeGenerated(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
}