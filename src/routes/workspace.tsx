import { createFileRoute, Link } from "@tanstack/react-router";
import { StickyNote, Image as ImageIcon, Presentation } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/workspace")({
  component: () => (
    <RequireProfile>
      <Workspace />
    </RequireProfile>
  ),
});

function Workspace() {
  const items = [
    { to: "/notes" as const, icon: StickyNote, title: "Notes", subtitle: "Write & save your notes" },
    { to: "/notes" as const, icon: ImageIcon, title: "Diagrams", subtitle: "Upload & view images" },
    { to: "/notes" as const, icon: Presentation, title: "Slides", subtitle: "Multi-card study slides" },
  ];

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Workspace</h1>
      <p className="mb-5 text-sm text-muted-foreground">Your study area — notes, diagrams, slides.</p>

      <div className="space-y-3">
        {items.map(({ to, icon: Icon, title, subtitle }) => (
          <Link key={title} to={to}>
            <Card className="flex items-center gap-4 p-4 transition-all hover:shadow-glow active:scale-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
