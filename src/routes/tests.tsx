import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/tests")({
  component: TestsList,
});

function TestsList() {
  const { state, update } = useStore();

  // ✅ FIX: always fallback to empty array
  const papers = state.generatedPapers ?? [];

  // ✅ remove paper
  const remove = (id: string) => {
    update((s) => ({
      ...s,
      generatedPapers: (s.generatedPapers || []).filter(
        (p: any) => p.id !== id
      ),
    }));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Test Papers</h1>

      {/* ✅ If no papers */}
      {papers.length === 0 && (
        <p>No papers yet. Generate one from the dashboard.</p>
      )}

      {/* ✅ Show papers */}
      {papers.map((p: any) => (
        <Card
          key={p.id}
          className="flex justify-between items-center p-3 mb-2"
        >
          <Link to="/tests/$paperId" params={{ paperId: p.id }}>
            {p.title || "Untitled Paper"}
          </Link>

          <button onClick={() => remove(p.id)}>
            <Trash2 className="h-4 w-4" />
          </button>
        </Card>
      ))}
    </div>
  );
}