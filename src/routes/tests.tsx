import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ChevronRight, FileText, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { getPapers } from "@/lib/papers";

export const Route = createFileRoute("/tests")({
  component: () => (
    <RequireProfile>
      <TestsList />
    </RequireProfile>
  ),
});

function TestsList() {
  const { state } = useStore();
  const profile = state.profile!;
  const papers = useMemo(
    () => getPapers(profile.curriculum, profile.grade),
    [profile],
  );

  // Group by subject
  const grouped = papers.reduce<Record<string, typeof papers>>((acc, p) => {
    (acc[p.subject] ||= []).push(p);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Test Papers</h1>
        <p className="text-sm text-muted-foreground">
          Full mock papers — {profile.curriculum} · {profile.grade}
        </p>
      </div>

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
                  <Link
                    key={p.id}
                    to="/tests/$paperId"
                    params={{ paperId: p.id }}
                  >
                    <Card className="flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-95">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.title}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {p.durationMinutes} min ·{" "}
                          {p.questions.length} Qs · {totalMarks} marks
                        </p>
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
    </AppShell>
  );
}
