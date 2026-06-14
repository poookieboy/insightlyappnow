import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ExternalLink, Sparkles } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import ezenuelStudios from "@/assets/ezenuel-studios.png.asset.json";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Insightly — by Ezen Uel Studios" },
      { name: "description", content: "Insightly is an AI study companion built by Ezen Uel Studios for curriculum-aligned learners." },
      { property: "og:title", content: "About Insightly — by Ezen Uel Studios" },
      { property: "og:description", content: "Insightly is an AI study companion built by Ezen Uel Studios for curriculum-aligned learners." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell>
      <div className="mb-3">
        <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Settings
        </Link>
      </div>

      <Card className="mb-5 overflow-hidden border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-glow">
        <img src={insightlyIcon} alt="Insightly" className="mx-auto mb-3 h-20 w-20 object-contain" />
        <h1 className="text-2xl font-bold tracking-tight">Insightly</h1>
        <p className="mt-1 text-sm opacity-90">Your AI-powered study companion.</p>
      </Card>

      <Card className="mb-4 p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Our mission
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Insightly helps students master their curriculum with AI tutoring,
          smart revision, adaptive mock exams, and habit-building streaks —
          all in one beautifully simple app.
        </p>
      </Card>

      <a
        href="https://ezenuelstudios.lovable.app"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 text-white shadow-xl transition-all hover:shadow-glow active:scale-[0.98]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black ring-1 ring-white/10">
              <img src={ezenuelStudios.url} alt="Ezen Uel Studios" className="h-14 w-14 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Crafted by</p>
              <p className="text-lg font-bold">Ezen Uel Studios</p>
              <p className="flex items-center gap-1 text-xs text-white/60">
                ezenuelstudios.lovable.app <ExternalLink className="h-3 w-3" />
              </p>
            </div>
          </div>
        </Card>
      </a>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Ezen Uel Studios. All rights reserved.
      </p>
    </AppShell>
  );
}
