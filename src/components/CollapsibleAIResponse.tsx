// Renders an AI response as organized collapsible sections instead of one long block.
// Splits markdown by "## Heading" or "**Heading**" chunks; if none found, shows a single expandable block.

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Sparkles, BookOpen, ListChecks, Lightbulb, ArrowRight } from "lucide-react";

interface Section {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  summary: Sparkles,
  overview: Sparkles,
  explanation: BookOpen,
  example: Lightbulb,
  examples: Lightbulb,
  "key points": ListChecks,
  "key point": ListChecks,
  takeaways: ListChecks,
  "next steps": ArrowRight,
  "what next": ArrowRight,
  recommended: ArrowRight,
};

function pickIcon(title: string) {
  const key = title.trim().toLowerCase();
  for (const k in ICON_MAP) if (key.includes(k)) return ICON_MAP[k];
  return BookOpen;
}

function splitSections(md: string): Section[] {
  if (!md?.trim()) return [];
  const lines = md.split("\n");
  const sections: Section[] = [];
  let current: { title: string; buf: string[] } | null = null;
  const push = () => {
    if (current && current.buf.join("\n").trim()) {
      sections.push({ title: current.title, body: current.buf.join("\n").trim(), icon: pickIcon(current.title) });
    }
  };
  for (const line of lines) {
    const h = line.match(/^\s*(#{1,4})\s+(.+?)\s*$/) || line.match(/^\s*\*\*(.+?)\*\*\s*:?\s*$/);
    if (h) {
      push();
      current = { title: (h[2] || h[1] || "").replace(/[:*]+$/g, "").trim(), buf: [] };
    } else {
      if (!current) current = { title: "Summary", buf: [] };
      current.buf.push(line);
    }
  }
  push();
  return sections;
}

export function CollapsibleAIResponse({ markdown }: { markdown: string }) {
  const sections = useMemo(() => splitSections(markdown), [markdown]);
  const [open, setOpen] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(sections.map((_, i) => [i, i < 2])),
  );

  if (sections.length <= 1) {
    return <div className="whitespace-pre-wrap text-sm leading-relaxed">{markdown}</div>;
  }

  return (
    <div className="space-y-2">
      {sections.map((s, i) => {
        const Icon = s.icon;
        const isOpen = !!open[i];
        return (
          <div key={i} className="overflow-hidden rounded-xl border border-border/60 bg-card/50">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-muted/50"
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Icon className="h-4 w-4 text-primary" />
              <span className="flex-1 truncate">{s.title}</span>
            </button>
            {isOpen && (
              <div className="border-t border-border/60 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap animate-fade-in">
                {s.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
