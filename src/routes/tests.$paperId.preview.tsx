import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ChevronLeft, Printer, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { getPaper } from "@/lib/papers";

export const Route = createFileRoute("/tests/$paperId/preview")({
  component: () => (
    <RequireProfile>
      <PaperPreview />
    </RequireProfile>
  ),
});

function PaperPreview() {
  const { paperId } = Route.useParams();
  const { state } = useStore();
  const profile = state.profile!;
  const paper = useMemo(
    () => getPaper(profile.curriculum, profile.grade, paperId, state.generatedPapers),
    [profile, paperId, state.generatedPapers],
  );

  if (!paper) {
    return (
      <AppShell>
        <p className="mb-4 text-sm text-muted-foreground">Paper not found.</p>
        <Link to="/tests"><Button variant="outline">Back to papers</Button></Link>
      </AppShell>
    );
  }

  const totalMarks = paper.questions.reduce((n, q) => n + q.marks, 0);

  return (
    <AppShell>
      <div className="mb-3 flex items-center justify-between print:hidden">
        <Link to="/tests" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> All papers
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Print / Save PDF
          </Button>
          <Link to="/tests/$paperId" params={{ paperId }}>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground">
              <Play className="mr-1 h-4 w-4" /> Start
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[816px] rounded-lg border bg-white p-8 text-black shadow-sm print:border-0 print:shadow-none print:p-0">
        <header className="mb-6 border-b border-black/20 pb-4 text-center">
          <p className="text-xs uppercase tracking-widest text-black/60">Insightly · Mock Paper</p>
          <h1 className="mt-1 text-2xl font-bold">{paper.emoji} {paper.title}</h1>
          <p className="mt-1 text-sm">
            {paper.subject} · {profile.curriculum} · {profile.grade} · {paper.difficulty}
          </p>
          <p className="mt-2 text-xs text-black/70">
            Duration: {paper.durationMinutes} minutes · {paper.questions.length} questions · {totalMarks} marks
          </p>
        </header>

        <section className="mb-6 rounded border border-black/10 bg-black/[0.03] p-3 text-xs leading-relaxed">
          <p className="font-semibold">Instructions</p>
          <ul className="ml-4 list-disc">
            <li>Answer ALL questions in the spaces provided.</li>
            <li>For multiple choice, circle the letter of the correct answer.</li>
            <li>Show working where required.</li>
            <li>Manage your time — aim for ~{Math.max(1, Math.round(paper.durationMinutes / paper.questions.length))} min per question.</li>
          </ul>
        </section>

        <ol className="space-y-5">
          {paper.questions.map((q, i) => (
            <li key={q.id} className="break-inside-avoid">
              <p className="text-sm font-medium leading-relaxed">
                <span className="font-semibold">{i + 1}.</span> {q.prompt}
                <span className="ml-2 text-xs text-black/60">({q.marks} mk{q.marks > 1 ? "s" : ""})</span>
              </p>
              {q.kind === "mcq" && q.options && (
                <ol className="ml-6 mt-2 space-y-1 text-sm" type="A">
                  {q.options.map((opt, j) => (
                    <li key={j}>
                      <span className="font-semibold">{String.fromCharCode(65 + j)}.</span> {opt}
                    </li>
                  ))}
                </ol>
              )}
              {q.kind === "short" && (
                <div className="ml-6 mt-2 space-y-2">
                  <div className="border-b border-dotted border-black/40" style={{ height: 18 }} />
                  <div className="border-b border-dotted border-black/40" style={{ height: 18 }} />
                  <div className="border-b border-dotted border-black/40" style={{ height: 18 }} />
                </div>
              )}
            </li>
          ))}
        </ol>

        <footer className="mt-8 border-t border-black/20 pt-3 text-center text-[10px] text-black/50">
          End of paper — Insightly
        </footer>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          nav, header, [data-app-shell-nav] { display: none !important; }
        }
      `}</style>
    </AppShell>
  );
}
