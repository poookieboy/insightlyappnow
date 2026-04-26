import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/tests")({
  component: TestsList,
});

function TestsList() {
  const { state, update } = useStore();
  const papers = state.generatedPapers ?? [];

  const remove = (id: string) => {
    update((s) => ({
      ...s,
      generatedPapers: (s.generatedPapers ?? []).filter((p) => p.id !== id),
    }));
  };

  return (
    <div className="p-4">
      <h1>Test Papers</h1>

      {papers.map((p) => (
        <Card key={p.id} className="flex justify-between p-3">
          <Link to="/tests/$paperId" params={{ paperId: p.id }}>
            {p.title}
          </Link>

          <button onClick={() => remove(p.id)}>
            <Trash2 className="h-4 w-4" />
          </button>
        </Card>
      ))}
    </div>
  );
}