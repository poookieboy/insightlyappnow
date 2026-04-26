import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
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

function TestsList() {
  const { state, update } = useStore();

  const profile = state.profile;
  if (!profile) return null;

  const [curriculum, setCurriculum] = useState<Curriculum>(profile.curriculum);
  const [grade, setGrade] = useState<Grade>(profile.grade);

  const builtIn = useMemo(() => getPapers(curriculum, grade), [curriculum, grade]);
  const generated = state.generatedPapers ?? [];

  const papers = useMemo(() => [...generated, ...builtIn], [generated, builtIn]);

  const grouped = useMemo(() => {
    return papers.reduce<Record<string, Paper[]>>((acc, p) => {
      if (!p?.subject) return acc;
      (acc[p.subject] ||= []).push(p);
      return acc;
    }, {});
  }, [papers]);

  const removeGenerated = (id: string) => {
    update((s) => ({
      ...s,
      generatedPapers: (s.generatedPapers ?? []).filter((p) => p.id !== id),
    }));
    toast.success("Paper removed");
  };

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-4">Test Papers</h1>

      <GeneratePaperCard curriculum={curriculum} grade={grade} />

      {generated.length > 0 && (
        <div className="space-y-2 mb-6">
          {generated.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-4">
              <Link
                to="/tests/$paperId"
                params={{ paperId: p.id }}
                className="flex flex-1 items-center gap-3"
              >
                <span>{p.emoji}</span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.questions.length} questions
                  </p>
                </div>
              </Link>

              <button onClick={() => removeGenerated(p.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function GeneratePaperCard({
  curriculum,
  grade,
}: {
  curriculum: Curriculum;
  grade: Grade;
}) {
  const { update } = useStore();

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("Mathematics");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-paper", {
        body: { subject, curriculum, grade, difficulty, questionCount: 25 },
      });

      if (error) throw error;

      const paper = normaliseGeneratedPaper(data, {
        subject,
        curriculum,
        grade,
        difficulty,
      });

      update((s) => ({
        ...s,
        generatedPapers: [paper, ...(s.generatedPapers ?? [])],
      }));

      toast.success("Paper created");
      setOpen(false);
    } catch (e: any) {
      toast.error("Failed to generate paper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="p-4 mb-4 cursor-pointer">
          <p className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Paper
          </p>
        </Card>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Paper</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="English">English</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as Difficulty)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              "Generate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}