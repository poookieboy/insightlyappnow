import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { normaliseGeneratedPaper } from "@/lib/papers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/tests")({
  component: TestsList,
});

function TestsList() {
  const { state, update } = useStore();

  const generated = state.generatedPapers ?? [];

  const remove = (id: string) => {
    update((s) => ({
      ...s,
      generatedPapers: (s.generatedPapers ?? []).filter((p) => p.id !== id),
    }));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Test Papers</h1>

      <GeneratePaper />

      <div className="space-y-2 mt-4">
        {generated.map((p) => (
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
    </div>
  );
}

function GeneratePaper() {
  const { update } = useStore();
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-paper", {
        body: {
          subject: "Mathematics",
          difficulty: "medium",
          questionCount: 20,
        },
      });

      if (error) throw error;

      const paper = normaliseGeneratedPaper(data, {
        subject: "Mathematics",
        curriculum: "CBC",
        grade: "Grade 6",
        difficulty: "medium",
      });

      update((s) => ({
        ...s,
        generatedPapers: [paper, ...(s.generatedPapers ?? [])],
      }));

      toast.success("Paper created");
    } catch (e) {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generate}
      className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded"
    >
      <Sparkles className="h-4 w-4" />
      {loading ? "Generating..." : "Generate Paper"}
    </button>
  );
}