import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/tests")({
  component: TestsPage,
});

function TestsPage() {
  const { state, update } = useStore();

  const [subject, setSubject] = useState("Mathematics");
  const [difficulty, setDifficulty] = useState("Easy");
  const [loading, setLoading] = useState(false);

  const papers = state.generatedPapers ?? [];

  const generatePaper = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        "https://tdiqgbkcoksqoigomour.supabase.co/functions/v1/ai-paper",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject,
            difficulty,
          }),
        }
      );

      const data = await res.json();

      const newPaper = {
        id: Date.now().toString(),
        title: `${subject} (${difficulty})`,
        content: data.paper || JSON.stringify(data),
      };

      update((s) => ({
        ...s,
        generatedPapers: [...(s.generatedPapers || []), newPaper],
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to generate paper");
    }

    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Generate Test Paper</h1>

      {/* SUBJECT */}
      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="border p-2 w-full"
      >
        <option>Mathematics</option>
        <option>English</option>
        <option>Kiswahili</option>
        <option>Biology</option>
        <option>Chemistry</option>
        <option>Physics</option>
        <option>History</option>
        <option>Geography</option>
        <option>CRE</option>
      </select>

      {/* DIFFICULTY */}
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        className="border p-2 w-full"
      >
        <option>Easy</option>
        <option>Medium</option>
        <option>Hard</option>
      </select>

      {/* GENERATE BUTTON */}
      <button
        onClick={generatePaper}
        className="bg-blue-500 text-white p-2 w-full"
      >
        {loading ? "Generating..." : "Generate Paper"}
      </button>

      {/* GENERATED PAPERS */}
      <h2 className="font-bold mt-4">Your Papers</h2>

      {papers.length === 0 && <p>No papers yet.</p>}

      {papers.map((p: any) => (
        <div key={p.id} className="border p-2">
          <h3 className="font-semibold">{p.title}</h3>
          <pre className="text-sm whitespace-pre-wrap">
            {p.content}
          </pre>
        </div>
      ))}
    </div>
  );
}